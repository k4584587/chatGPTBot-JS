import discord from './config/discord.mjs'
import log4js from './config/log4js.mjs';
import {ChatGPTClient} from '@waylaidwanderer/chatgpt-api';
import * as schedule from 'node-schedule';

import {
    insertLog,
    selectQueue,
    insertQueue,
    updateQueue,
    insertConversationHistory,
    insertParentHistory,
    selectConversationHistory,
    autoParentHistoryFlg,
    autoConversationHistoryFlg,
    selectParentHistory, updateConversationHistoryFlg, updateParentHistory
} from './mapper/chat.mjs';

const logger = log4js.getLogger();

const clientOptions = {
    // (Optional) Support for a reverse proxy for the completions endpoint (private API server).
    // Warning: This will expose your `openaiApiKey` to a third party. Consider the risks before using this.
    // reverseProxyUrl: 'https://chatgpt.hato.ai/completions',
    // (Optional) Parameters as described in https://platform.openai.com/docs/api-reference/completions
    modelOptions: {
        // You can override the model name and any other parameters here, like so:
        model: 'gpt-3.5-turbo',
        // I'm overriding the temperature to 0 here for demonstration purposes, but you shouldn't need to override this
        // for normal usage.
        temperature: 0,
        // Set max_tokens here to override the default max_tokens of 1000 for the completion.
        // max_tokens: 1000,
    },
    // (Optional) Davinci models have a max context length of 4097 tokens, but you may need to change this for other models.
    // maxContextTokens: 4097,
    // (Optional) You might want to lower this to save money if using a paid model like `text-davinci-003`.
    // Earlier messages will be dropped until the prompt is within the limit.
    // maxPromptTokens: 3097,
    // (Optional)   "You are ChatGPT...".
    // promptPrefix: 'You are Bob, a cowboy in Western times...',
    // (Optional) Set a custom name for the user
    // userLabel: 'User',
    // (Optional) Set a custom name for ChatGPT
    chatGptLabel: '니드온',
    // (Optional) Set to true to enable `console.debug()` logging
    debug: false,
};
const api = new ChatGPTClient(process.env.OPENAI_API_KEY, clientOptions);


discord.client.on('messageCreate', async (msg) => {

    //@봇 멘션으로 작동할수있게 처리
    if (msg.mentions.has(discord.client.user.id) && !msg.author.bot) {
        const content = msg.content.replace(new RegExp(`<@!?${discord.client.user.id}>`), '').trim();
        await callAPI(msg, content);
    }


    if (msg.content.startsWith('!delete')) {
        const param = {discordId: msg.author.id};
        const userMention = msg.author.toString();

        await updateConversationHistoryFlg(param);
        await updateParentHistory(param);

        await msg.channel.send(`${userMention} 님 세션이 성공적으로 삭제되었습니다.`);
        logger.info(`${userMention} 님 세션이 성공적으로 삭제되었습니다.`);
    }

});

async function callAPI(msg, chat) {

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
        let conversationId = null;
        let parentMessageId = null;
        // 세션 기본값은 null 입니다.

        const param = {
            discordId: msg.author.id,
            chatMsg: `<@${msg.author.id}> ${chat}`,
            discordName: msg.author.username,
        };
        let conversationHistory = await selectConversationHistory(param);
        let parentHistory = await selectParentHistory(param);
        //호출한 디스코드 아이디로 chatgpt 봇 호출한적이 있는지 db에서 select 해봅니다.


        try {

            if (conversationHistory.length >= 1) { //세션이 존재한지 확인

                //세션이 존재하면 이 세션으로 이어서 대화시작
                logger.info(`${userMention} 님 세션이 존재함 이 세션으로 이어서 대화합니다.`);

                //db에서 세션값을 가져옵니다.
                conversationId = conversationHistory[0].CONVERSATION_ID;
                parentMessageId = parentHistory[0].PARENT_MESSAGE_ID;

                //chatbot 호출전에 로그 남기는 함수를 실행합니다.
                await insertLog(param);

                const param2 = {
                    discordId: msg.author.id,
                    chatMsg: `<@${msg.author.id}> ${chat}`,
                    conversationId: conversationId,
                    parentMessageId: parentMessageId
                };


                //중복호출을 막기위해 큐히스토리에 저장합니다.
                await insertQueue(param2);
                //chatbot api 호출합니다.
                let res = await handleSendMessageSession(`<@${msg.author.id}> ${chat}`, conversationId, parentMessageId);

                console.log("parentMessageId: " + res.messageId);
                const param3 = {
                    discordId: msg.author.id,
                    parentMessageId: res.messageId
                };

                await insertParentHistory(param3);

                //호출한 사람에게 답장을 합니다.
                await msg.reply(`${userMention}` + " " + res.response);
                //logger.info(`User ${msg.author.username} requested message: ${chat} => ${res.response}`);

                //호출이 끝나면 작성중입니다. 메시지를 삭제합니다.
                typingMsg.delete();

                //api 호출이 끝나면 큐상태를 완료로 만들어줍니다.
                await updateQueue(param2);

            } else {

                logger.info(`${userMention} 님 세션이 없음 새로운 세션을 생성합니다.`);

                const param = {
                    discordId: msg.author.id,
                    chatMsg: `<@${msg.author.id}> ${chat}`,
                    discordName: msg.author.username,
                    conversationId: null,
                    parentMessageId: null
                };

                //chatbot 호출전에 로그 남기는 함수를 실행합니다.
                await insertLog(param);

                //중복호출을 막기위해 큐히스토리에 저장합니다.
                await insertQueue(param)


                //chatbot api 호출합니다.
                const res = await handleSendMessage(`<@${msg.author.id}> ${chat}`);
                typingMsg.delete(); //api 호출이 끝나면 작성중입니다. 내용을 삭제합니다.

                //호출한 사람에게 답장을 합니다.
                await msg.reply(`${userMention}` + " " + res.response);
                //logger.info(`User ${msg.author.username} requested message: ${chat} => ${res.response}`);

                const param2 = {
                    discordId: msg.author.id,
                    conversationId: res.conversationId,
                    parentMessageId: res.messageId,
                };

                //세션을 저장합니다.
                await insertConversationHistory(param2);

                await insertParentHistory(param2);

                //세션을 저장합니다.
                //await insertHistory(param2);

                //api 실행이 끝나면 큐상태를 완료상태로 변경해줍니다.
                await updateQueue(param2)

            }

        } catch (err) {

            if (err.response && err.response.status === 400 && err.response.data && err.response.data.error && err.response.data.error.includes("maximum tokens")) {
                logger.info(`User ${msg.author.username} requested message: ${chat} => Message exceeds the maximum number of tokens allowed by the API.`);
                await msg.reply(`${userMention} 입력하신 메시지가 API에서 허용하는 최대 토큰 수를 초과하였습니다. 더 짧은 메시지로 다시 시도해주세요. \n Your message exceeds the maximum number of tokens allowed by the API. Please try again with a shorter message.`);
            } else {
                logger.error(err);
                await msg.reply(`${userMention} 입력하신 메시지가 API에서 허용하는 최대 토큰 수를 초과하였습니다. 더 짧은 메시지로 다시 시도해주세요. \n Your message exceeds the maximum number of tokens allowed by the API. Please try again with a shorter message.`);
            }

        }


    }
}

async function handleSendMessage(msg) {

    return await api.sendMessage(msg, {
        onProgress: token => process.stdout.write(token)
    });
}

async function handleSendMessageSession(msg, conversationId, parentMessageId) {

    return await api.sendMessage(msg, {
        conversationId: conversationId,
        parentMessageId: parentMessageId,
        onProgress: token => process.stdout.write(token)
    });

}

//30분에 세션 기록 자동 삭제
schedule.scheduleJob('0 */30 * * * *', async function () {
    try {
        logger.info("세션을 삭제 합니다...");
        await autoConversationHistoryFlg();
        await autoParentHistoryFlg();
    } catch (error) {
        console.error(error);
    }

});
