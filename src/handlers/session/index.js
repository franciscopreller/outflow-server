const constants = require('./constants');

module.exports = {
  [constants.SESSION_CONNECT]: (context, payload) => {
    const TelnetSession = require('../../lib/telnet');
    const Session = new TelnetSession(payload.connection, context);

    // Connection to session
    Session.start();
  },
  [constants.SESSION_DISCONNECT]: (context, payload) => {
    const pub = context.socket('PUSH');
    const queueName = `${constants.SESSION_DISCONNECT}.${payload.uuid}`;
    pub.connect(queueName, () => {
      pub.write(JSON.stringify(payload), 'utf-8');
    });
  },
};
