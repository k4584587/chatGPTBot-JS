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
        model: 'gpt-4',
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

    if (msg.content.includes('@everyone')) return;

    // @봇 멘션으로 작동할 수 있게 처리
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

    // 아래 두 줄을 함수의 시작 부분으로 이동시킵니다.
    msg.channel.sendTyping();
    const typingMsg = await msg.channel.send(`${userMention} ChatGPT 가 내용을 작성하는중 입니다.`);

    let countQue = selectQueue.length;
    logger.info("진행중인 큐 : " + countQue);

    if (countQue >= 1) {
        await informAPICallInProgress(msg);
    } else {
        await processMessage(msg, chat, typingMsg);
    }
}


async function informAPICallInProgress(msg) {
    const userMention = msg.author.toString();
    await msg.channel.send(`${userMention} 님 다른곳 에서 api 가 실행중 입니다. 잠시후 재시도 해주세요.`);
    logger.info(`${userMention} 님 다른곳 에서 api 가 실행중 입니다. 잠시후 재시도 해주세요.`);
}

async function processMessage(msg, chat, typingMsg) {
    const userMention = msg.author.toString();
    const param = {
        discordId: msg.author.id,
        chatMsg: `${chat}`,
        discordName: msg.author.username,
    };

    let conversationHistory = await selectConversationHistory(param);
    let parentHistory = await selectParentHistory(param);
    let conversationId = conversationHistory.length >= 1 ? conversationHistory[0].CONVERSATION_ID : null;
    let parentMessageId = parentHistory.length >= 1 ? parentHistory[0].PARENT_MESSAGE_ID : null;

    const keepTyping = setInterval(() => {
        msg.channel.sendTyping();
    }, 9000);  // 9초마다 "typing..." 상태를 유지합니다.

    try {
        await insertLog(param);

        const messageParams = {
            discordId: msg.author.id,
            chatMsg: `${chat}`,
            conversationId: conversationId,
            parentMessageId: parentMessageId
        };

        await insertQueue(messageParams);

        let res = await handleSendMessage(chat, conversationId, parentMessageId);
        clearInterval(keepTyping);  // API 호출이 완료되면 "typing..." 상태를 중지합니다.

        await msg.reply(`${userMention} ${res.response}`);
        try {
            await typingMsg.delete();
        } catch (err) {
            if (err.code === 10008) {
                console.log("메시지가 이미 삭제되었거나 찾을 수 없습니다.");
            } else if (err.httpStatus === 403) {
                console.log("봇에게 메시지 삭제 권한이 없습니다.");
            } else {
                console.error(err);
            }
        }

        const insertParams = {
            discordId: msg.author.id,
            conversationId: res.conversationId,
            parentMessageId: res.messageId,
        };
        await insertConversationHistory(insertParams);
        await insertParentHistory(insertParams);
        await updateQueue(insertParams);
    } catch (err) {
        clearInterval(keepTyping);  // 에러 발생 시에도 "typing..." 상태를 중지합니다.
        handleAPIError(err, msg);
    }
}


async function handleSendMessage(msg, conversationId = null, parentMessageId = null) {
    const options = {
        onProgress: token => process.stdout.write(token)
    };
    if (conversationId && parentMessageId) {
        options.conversationId = conversationId;
        options.parentMessageId = parentMessageId;
    }

    return await api.sendMessage(msg, options);
}

async function handleAPIError(err, msg) {
    const userMention = msg.author.toString();
    if (err.response && err.response.status === 400 && err.response.data && err.response.data.error && err.response.data.error.includes("maximum tokens")) {
        logger.info(`User ${msg.author.username} requested message: ${chat} => Message exceeds the maximum number of tokens allowed by the API.`);
        await msg.reply(`${userMention} 입력하신 메시지가 API에서 허용하는 최대 토큰 수를 초과하였습니다. 더 짧은 메시지로 다시 시도해주세요.`);
    } else {
        logger.error(err);
        await msg.reply(`${userMention} 문제가 발생했습니다. 나중에 다시 시도해주세요.`);
    }
}
