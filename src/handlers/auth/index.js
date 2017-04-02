const constants = require('./constants');
const utils = require('../../lib/utils');

module.exports = {

  [constants.AUTH_WS_UPDATE]: (context, redis, payload) => {
    const { uuid, socketId } = payload;
    redis.set(`socket.${socketId}.userId`, JSON.stringify(uuid)).then(() => {
      utils.publish(context, `${constants.AUTH_LISTENER}.${payload.uuid}`, payload);
    }).catch((error) => {
      console.error('Could not create connection in cache', error);
    });
  }

};
