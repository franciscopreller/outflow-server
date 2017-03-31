const PORT = process.env.PORT || 8080;
const RABBIT_URL = process.env.RABBIT_URL || 'amqp://rabbitoutflow:unsafepassword@rabbitmq';
const SERVER_NUM = process.env.SERVER_NUM || '0';
const Handlers = require('./handlers');

const context = new require('rabbit.js').createContext(RABBIT_URL);
context.on('ready', () => {
  const server = require('net').createServer();
  server.listen(PORT, () => {
    console.log('%%% Telnet client running as process: %s on port: %s', process.pid, PORT);
    Handlers.bindHandler('session.connect', context, (data) => {
      console.log(data);
    });
  });
});

context.on('error', (error) => {
  console.log('Connection error', error);
  process.exit(0);
});