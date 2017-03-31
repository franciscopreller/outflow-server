const TelnetConnector = require('./lib/session');

module.exports.bindHandlers = (socket) => {
  socket.on('connection.open', (data) => {
    if (data.payload && data.payload.connection) {
      const connection = data.payload.connection;
      const Session = new TelnetConnector(connection, socket);
      console.log('Connection request, connecting to...', connection);

      // Connection to session
      Session.connect();
    } else {
      console.error('No data received for server connection...');
    }
  });
};
