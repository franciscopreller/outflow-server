module.exports = {

  ['session.connect']: (context, payload) => {
    const TelnetConnector = require('../../lib/session');
    const { connection } = payload;
    const Session = new TelnetConnector(connection, context);

    // Connection to session
    Session.start();
  }

};
