const constants = require('./constants');
const utils = require('../../lib/utils');

module.exports = {

  [constants.AUTH_WS_UPDATE]: (context, redis, data) => {
    const { socketId } = data;
    const { uuid } = data.payload;
    const key = `socket.${socketId}.userId`;
    console.log(`Writing socket address to key ${key}`);
    redis.set(key, JSON.stringify(uuid)).then(() => {
      redis.pexpire(key, (600 * 1000));
      utils.reply(context, socketId, data.payload);
    }).catch((error) => {
      console.error('Could not create connection in cache', error);
    });
  }

};
