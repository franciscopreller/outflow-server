const constants = require('./constants');
const mqUtils = require('../../lib/utils');
const actions = require('./actions');
const utils = require('./utils');

module.exports = {

  [constants.SESSION_CONNECT]: (context, redis, data) => {
    const { socketId, payload, userId } = data;
    const { host, port, uuid } = payload;
    const TelnetSession = require('../../lib/telnet');
    const session = new TelnetSession({ host, port, uuid, socketId }, context);

    // Connection to session
    console.log(`[${userId}] Initiating new session connection to ${host}:${port}`);
    session.start().then((telnet) => {
      telnet.on('connected', () => {
        console.log(`[${userId}] Connected to ${host}:${port}`);
        utils.setSession(redis, userId, { uuid, host, port });
        mqUtils.reply(context, socketId, actions.sessionConnected({ uuid }));
      });
      telnet.on('closed', () => {
        console.log(`[${userId}] Disconnected from ${host}:${port}`);
        utils.unsetSession(redis, userId, uuid);
        mqUtils.reply(context, socketId, actions.sessionDisconnected({ uuid }));
      });
      telnet.on('error', (error) => mqUtils.reply(context, socketId, actions.sessionError({ uuid, error })));
      telnet.on('data', (segments) => mqUtils.reply(context, socketId, actions.sessionOutput({ segments, uuid })));
    });
  },

  [constants.SESSION_DISCONNECT]: (context, redis, data) => {
    mqUtils.publish(context, `${constants.SESSION_DISCONNECT}.${data.payload.uuid}`, data.payload.uuid);
  },

  [constants.SESSION_COMMAND]: (context, redis, data) => {
    mqUtils.publish(context, `${constants.SESSION_COMMAND}.${data.payload.uuid}`, data.payload.command);
  },

};
