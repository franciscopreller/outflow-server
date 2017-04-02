const constants = require('./constants');
const utils = require('../../lib/utils');

module.exports = {

  [constants.SESSION_CONNECT]: (context, redis, payload) => {
    const TelnetSession = require('../../lib/telnet');
    const Session = new TelnetSession(payload.connection, context);

    // Connection to session
    Session.start();
  },

  [constants.SESSION_DISCONNECT]: (context, redis, payload) => {
    utils.publish(context, `${constants.SESSION_DISCONNECT}.${payload.uuid}`, payload);
  },

};
