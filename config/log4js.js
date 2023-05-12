const log4js = require('log4js');

log4js.configure({
  appenders: {
    file: { type: 'file', filename: 'logs/app.log' },
    console: { type: 'console' },
  },
  categories: {
    default: { appenders: ['file', 'console'], level: 'debug' },
  },
});

module.exports = log4js;
