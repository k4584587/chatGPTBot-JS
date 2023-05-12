const dotenv= require ('dotenv');
dotenv.config();

module.exports = {
  prefix: "!",
  token: process.env.DISCORD_BOT_TOKEN,
}
