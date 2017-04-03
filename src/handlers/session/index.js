const constants = require('./constants');
const utils = require('../../lib/utils');
const actions = require('./actions');

module.exports = {

  [constants.SESSION_CONNECT]: (context, redis, data) => {
    const { socketId, payload } = data;
    const { host, port, uuid } = payload;
    const TelnetSession = require('../../lib/telnet');
    const session = new TelnetSession({ host, port, uuid, socketId }, context);

    // Connection to session
    console.log(`Initiating new session connection to ${host}:${port}`);
    session.start().then((telnet) => {
      telnet.on('connected', () => utils.reply(context, socketId, actions.sessionConnected({ uuid })));
      telnet.on('closed', () => utils.reply(context, socketId, actions.sessionDisconnected({ uuid })));
      telnet.on('error', (error) => utils.reply(context, socketId, actions.sessionError({ uuid, error })));
      telnet.on('data', (lines) => utils.reply(context, socketId, actions.sessionOutput({ lines, uuid })));
    });
  },

  [constants.SESSION_DISCONNECT]: (context, redis, data) => {
    utils.publish(context, `${constants.SESSION_DISCONNECT}.${data.payload.uuid}`, data.payload.uuid);
  },

  [constants.SESSION_COMMAND]: (context, redis, data) => {
    // @TODO: Convert command here and send new command to actual session
    utils.publish(context, `${constants.SESSION_COMMAND}.${data.payload.uuid}`, data.payload.command);
  },

};
