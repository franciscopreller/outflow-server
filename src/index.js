const PORT = process.env.PORT || 8080;
const RABBIT_URL = process.env.RABBIT_URL || 'amqp://rabbitoutflow:unsafepassword@rabbitmq';
const REDIS_URL = process.env.REDIS_URL = 'redis://:unsafepassword@redis:6379/0';
const Handlers = require('./handlers');
const Redis = require('ioredis');

const context = new require('rabbit.js').createContext(RABBIT_URL);
context.on('ready', () => {
  const server = require('net').createServer();
  server.listen(PORT, () => {
    console.log('%%% Telnet client running as process: %s on port: %s', process.pid, PORT);

    // Connect to redis instance
    const redis = new Redis(REDIS_URL);

    // Connect all handlers
    const subscribers = Handlers.handlerNames.map((handler) => Handlers.bindHandler(handler, context, redis));
    process.on('SIGTERM', () => process.exit(0));
    process.on('exit', () => {
      console.log('Exiting gracefully...');
      subscribers.forEach((sub) => sub.close());
      context.close();
    });
  });
});
