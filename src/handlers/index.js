const handlerGlobs = require('glob').sync(`${__dirname}/*/index.js`);
const handlers = getHandlers();

exports.handlers = handlers;

exports.handlerNames = handlerGlobs.map((fullName) => {
  return fullName.replace(`${__dirname}/`, '').replace('/index.js', '');
});

exports.bindHandler = (handlerName, context) => {
  const sub = context.socket('PULL');
  console.log(`Binding subscriber handler to: ${handlerName}`);
  sub.on('data', (data) => {
    console.log(`${handlerName} got data`);
    let payload = {};
    try {
      payload = Object.assign({}, JSON.parse(data));
    } catch(error) {
      console.error('Parsing error', error);
    }

    const handler = exports.handlers[handlerName];
    if (typeof handler === 'function') {
      handler(payload);
    } else {
      console.error(`Invalid handler for ${handlerName}`);
    }
  });

  sub.connect(handlerName);
};

function getHandlers() {
  const output = {};
  exports.handlerNames.forEach((key) => {
    const handler = require(`./${key}`);
    Object.keys(handler).forEach((handlerKey) => {
      if (typeof output[handlerKey] !== 'undefined') {
        console.error(`Key already defined: ${handlerKey}, must be unique`);
        process.exit(1);
      } else {
        output[handlerKey] = handler[handlerKey];
      }
    });
  });
}
