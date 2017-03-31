module.exports = {

  ['session.connect']: (context, payload) => {
    const TelnetConnector = require('../../lib/session');
    const { connection } = payload;
    const Session = new TelnetConnector(connection, context);
    console.log('Connection request, connecting to...', connection);

    // Connection to session
    Session.connect();
  }

};
