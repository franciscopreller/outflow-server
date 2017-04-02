const PORT = process.env.PORT || 8080;
const RABBIT_URL = process.env.RABBIT_URL || 'amqp://rabbitoutflow:unsafepassword@rabbitmq';
const Handlers = require('./handlers');

const context = new require('rabbit.js').createContext(RABBIT_URL);
context.on('ready', () => {
  const server = require('net').createServer();
  server.listen(PORT, () => {
    console.log('%%% Telnet client running as process: %s on port: %s', process.pid, PORT);

    // Connect all handlers
    Handlers.handlerNames.forEach((handler) => Handlers.bindHandler(handler, context));
  });
});
