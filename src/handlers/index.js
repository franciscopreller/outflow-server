const handlerGlobs = require('glob').sync(`${__dirname}/*/index.js`);

/**
 * Gets all handler namespaces
 */
const handlerNamespaces = handlerGlobs.map((fullName) => fullName.replace(`${__dirname}/`, '').replace('/index.js', ''));

/**
 * Gets all handlers names in sub-directories
 */
const handlerNames = getHandlerNames();

/**
 * Gets all handlers, flattened
 */
const handlers = getHandlers();

/**
 * Binds a handler by name, it uses PULL for sub context
 *
 * @param handlerName
 * @param context
 * @param redis
 */
function bindHandler(handlerName, context, redis) {
  const sub = context.socket('PULL');
  sub.on('data', (data) => {
    let payload = {};
    try {
      payload = Object.assign({}, JSON.parse(data));
    } catch(error) {
      console.error('Parsing error', error);
    }

    const handler = handlers[handlerName];
    if (typeof handler === 'function') {
      handler(context, redis, payload);
    } else {
      console.error(`Invalid handler for ${handlerName}`);
    }
  });

  console.log(`${'%%%'} Adding queue: ${handlerName}`);
  sub.connect(handlerName);

  return sub;
}

/**
 * Get all the handlers from sub-directories recursively, a duplicate key across directories will cause a fatal error
 */
function getHandlers() {
  const output = {};
  handlerNamespaces.forEach((key) => {
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

  return output;
}

/**
 * Gets all handler names
 * @returns {Array}
 */
function getHandlerNames() {
  const handlerNames = [];
  handlerNamespaces.forEach((namespace) => {
    Object.keys(require(`./${namespace}`)).forEach((key) => {
      handlerNames.push(key);
    });
  });

  return handlerNames;
}

exports.handlers = handlers;
exports.handlerNames = handlerNames;
exports.bindHandler = bindHandler;
