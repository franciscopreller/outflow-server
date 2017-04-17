const PORT = process.env.PORT || 8080;
const RABBIT_URL = process.env.RABBIT_URL || 'amqp://rabbitoutflow:unsafepassword@rabbitmq';
const REDIS_URL = process.env.REDIS_URL = 'redis://:unsafepassword@redis:6379/0';
const Handlers = require('./handlers');
const Redis = require('ioredis');

const context = new require('rabbit.js').createContext(RABBIT_URL);
context.on('ready', () => {
  const server = require('net').createServer();
  server.listen(PORT, () => {
    console.log(`${'%%%'} Telnet client running as process: ${process.pid} on port: ${PORT}`);

    // Connect to redis instance
    const redis = new Redis(REDIS_URL);

    // Connect all handlers
    const subscribers = Handlers.handlerNames.map((handler) => Handlers.bindHandler(handler, context, redis));
    process.on('SIGTERM', () => {
      subscribers.forEach((sub) => {
        try {
          sub.close()
        } catch(e) {}
      });
      setTimeout(() => {
        console.log('Exiting gracefully...');
        context.close();
        process.exit(0);
      }, 100);
    });
  });
});
