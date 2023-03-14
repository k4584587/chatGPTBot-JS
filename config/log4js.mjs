import log4js from 'log4js';

log4js.configure({
  appenders: {
    file: { type: 'file', filename: 'logs/app.log' },
    console: { type: 'console' },
  },
  categories: {
    default: { appenders: ['file', 'console'], level: 'debug' },
  },
});
export default log4js;
