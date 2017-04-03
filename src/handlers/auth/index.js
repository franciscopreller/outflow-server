const constants = require('./constants');
const utils = require('../../lib/utils');

module.exports = {

  [constants.AUTH_WS_UPDATE]: (context, redis, data) => {
    const { socketId } = data;
    const { uuid } = data.payload;
    redis.set(`socket.${socketId}.userId`, JSON.stringify(uuid)).then(() => {
      utils.reply(context, socketId, data.payload);
    }).catch((error) => {
      console.error('Could not create connection in cache', error);
    });
  }

};
