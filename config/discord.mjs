import Discord from 'discord.js';
import log4js from "./log4js.mjs";
const logger = log4js.getLogger();
import dotenv from 'dotenv';
dotenv.config();

class DiscordBot {
  constructor() {
    this.client = new Discord.Client({
      intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
      ],
    });

    this.client.login(process.env.DISCORD_BOT_TOKEN).then(r => {
      logger.info(`Logged in as ${this.client.user.tag}!`);
    });
  }
}
export default new DiscordBot();
