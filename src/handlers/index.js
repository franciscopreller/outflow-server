exports.bindHandler = (handlerName, context, handler) => {
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

    if (typeof handler === 'function') {
      handler({ handlerName, payload });
    } else {
      console.error(`Invalid handler for ${handlerName}`);
    }
  });

  sub.connect(handlerName);
};
