const { SlashCommandBuilder } = require("@discordjs/builders");
const log4js = require('../../../config/log4js.js');
const logger = log4js.getLogger();
const {config} = require("dotenv");
const {ChatGPTClient} = require("@waylaidwanderer/chatgpt-api");
config();

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



module.exports = {
  data: new SlashCommandBuilder()
    .setName("gpt")
    .setDescription("사용법: /gpt 내용")
    .addStringOption(option =>
      option.setName('content')
      .setDescription('GPT에게 전달할 내용')
      .setRequired(true)),
    run: async (client, interaction) => {
        const content = interaction.options.getString('content');
        logger.info("msg -> " + content)
        interaction.reply(content)
    }
};
