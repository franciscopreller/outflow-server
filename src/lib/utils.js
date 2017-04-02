/**
 * Publish helper, uses PUSH context
 * @param context
 * @param queueName
 * @param payload
 */
function publish(context, queueName, payload) {
  const pub = context.socket('PUSH');
  pub.connect(queueName, () => {
    pub.write(JSON.stringify(payload), 'utf-8');
    pub.end();
  });
}

/**
 * Subscribe helper, uses PULL context
 * @param context
 * @param queueName
 * @param next
 */
function subscribe(context, queueName, next) {
  const sub = context.socket('PULL');
  sub.on('data', (data) => {
    let payload = data;
    try {
      payload = JSON.parse(data).uuid;
    } catch (e) {}
    if (typeof next === 'function') {
      next(payload);
    }
  });
  sub.connect(queueName);
}

exports.publish = publish;
exports.subscribe = subscribe;