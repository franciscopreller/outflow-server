const constants = require('./constants');
const utils = require('../../lib/utils');
const sessionUtils = require('../session/utils');
const sessionConstants = require('../session/constants')

module.exports = {

  [constants.AUTH_WS_UPDATE]: (context, redis, data) => {
    const { socketId } = data;
    const { uuid } = data.payload;
    const key = `socket.${socketId}.userId`;
    redis.set(key, JSON.stringify(uuid)).then(() => {
      redis.pexpire(key, (600 * 1000));
      utils.reply(context, socketId, data.payload);
    }).catch((error) => {
      console.error('Could not create connection in cache', error);
    });
  },

  [constants.AUTH_CLEANUP]: (context, redis, data) => {
    // Remove sessions
    sessionUtils.getAllSessionKeys(redis, data.userId).then((keys) => {
      keys.forEach((key) => {
        const sessionId = key.substr(key.length - 36);
        utils.publish(context, `${sessionConstants.SESSION_DISCONNECT}.${sessionId}`, sessionId);
        sessionUtils.unsetSession(redis, data.userId, sessionId);
      })
    });

  }

};
