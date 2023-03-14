import {ChatGPTAPI} from 'chatgpt';
import discord from './config/discord.mjs'
import fetch from 'node-fetch';
import log4js from './config/log4js.mjs';

const logger = log4js.getLogger();
import {oraPromise} from 'ora'

import {
    selectHistory,
    updateHistoryFlg,
    insertLog,
    insertHistory,
    selectQueue,
    insertQueue,
    updateQueue
} from './mapper/chat.mjs';

const api = new ChatGPTAPI({
    apiKey: process.env.OPENAI_API_KEY,
    fetch: fetch,
});


discord.client.on('messageCreate', async (msg) => {


    if (msg.content.startsWith('!msg ')) {

        const userMention = msg.author.toString();
        const typingMsg = await msg.channel.send(`${userMention} ChatGPT 가 내용을 작성하는중 입니다.`);

        //우선 작동중인큐가 있는지 확인합니다.
        let countQue = selectQueue.length;
        logger.info("진행중인 큐 : " + countQue);

        if (countQue >= 1) {

            //큐가 하나라도 동작중이면 작동중이라는 문구를 디스코드에 알려줍니다.
            await msg.channel.send(`${userMention} 님 다른곳 에서 api 가 실행중 입니다. 잠시후 재시도 해주세요.`);
            logger.info(`${userMention} 님 다른곳 에서 api 가 실행중 입니다. 잠시후 재시도 해주세요.`);

        } else {

            //작동중인 큐가 없을때 api 를 호출합니다. 이때 세션값이 있는지 확인합니다.
            let parentMessageId = null;
            // 세션 기본값은 null 입니다.

            const param = {
                discordId: msg.author.id,
                chatMsg: msg.content.slice(5),
                discordName: msg.author.username,
            };
            let history = await selectHistory(param);
            //호출한 디스코드 아이디로 chatgpt 봇 호출한적이 있는지 db에서 select 해봅니다.

            if (history.length >= 1) { //세션이 존재한지 확인

                //세션이 존재하면 이 세션으로 이어서 대화시작
                logger.info(`${userMention} 님 세션이 존재함 이 세션으로 이어서 대화합니다.`);

                //db에서 세션값을 가져옵니다.
                parentMessageId = history[0].PARENT_MESSAGE_ID;

                //chatbot 호출전에 로그 남기는 함수를 실행합니다.
                await insertLog(param);

                const param2 = {
                    discordId: msg.author.id,
                    chatMsg: msg.content.slice(5),
                    parentMessageId: parentMessageId
                };

                //중복호출을 막기위해 큐히스토리에 저장합니다.
                await insertQueue(param2);
                //chatbot api 호출합니다.
                let res = await handleSendMessageSession(msg, parentMessageId);

                //호출한 사람에게 답장을 합니다.
                await msg.reply(`${userMention}` + res.text);
                logger.info(`User ${msg.author.username} requested message: ${msg.content.slice(5)} => ${res.text}`);

                //호출이 끝나면 작성중입니다. 메시지를 삭제합니다.
                typingMsg.delete();

                //api 호출이 끝나면 큐상태를 완료로 만들어줍니다.
                await updateQueue(param2);

            } else {

                logger.info(`${userMention} 님 세션이 없음 새로운 세션을 생성합니다.`);

                const param = {
                    discordId: msg.author.id,
                    chatMsg: msg.content.slice(5),
                    discordName: msg.author.username,
                    conversationId: null,
                    parentMessageId: null
                };

                //chatbot 호출전에 로그 남기는 함수를 실행합니다.
                await insertLog(param);

                //중복호출을 막기위해 큐히스토리에 저장합니다.
                await insertQueue(param)

                //chatbot api 호출합니다.
                const res = await handleSendMessage(msg);
                typingMsg.delete(); //api 호출이 끝나면 작성중입니다. 내용을 삭제합니다.

                //호출한 사람에게 답장을 합니다.
                await msg.reply(res.text);
                logger.info(`User ${msg.author.username} requested message: ${msg.content.slice(5)} => ${res.text}`);

                const param2 = {
                    discordId: msg.author.id,
                    parentMessageId: res.id,
                };

                //세션을 저장합니다.
                await insertHistory(param2);

                //api 실행이 끝나면 큐상태를 완료상태로 변경해줍니다.
                await updateQueue(param2);

            }

        }

    } else if (msg.content.startsWith('!delete')) {

        const param = {discordId: msg.author.id};
        const userMention = msg.author.toString();

        await updateHistoryFlg(param);
        await msg.channel.send(`${userMention} 님 세션이 성공적으로 삭제되었습니다.`);
        logger.info(`${userMention} 님 세션이 성공적으로 삭제되었습니다.`);

    }
});


async function handleSendMessage(msg) {

    return oraPromise(
        api.sendMessage(msg.content, {
            onProgress: (partialResponse) => partialResponse.text,
        }),
        {
            text: msg.content,
        }
    )
}

async function handleSendMessageSession(msg, parentMessageId) {
    console.log("parentMessageId : " + parentMessageId);


    return oraPromise(
        api.sendMessage(msg.content, {
            parentMessageId: parentMessageId,
            onProgress: (partialResponse) => partialResponse.text,
        }),
        {
            text: msg.content,
        }
    )
}
