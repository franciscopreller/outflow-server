/**
 * Replies back to the socket reply queue
 *
 * @param context
 * @param socketId
 * @param payload
 * @returns {*}
 */
function reply(context, socketId, payload) {
  publish(context, `ws.reply.${socketId}`, payload);
}

/**
 * Publish helper, uses PUSH context
 * @param context
 * @param queueName
 * @param payload
 */
function publish(context, queueName, payload) {
  const pub = context.socket('PUB');
  pub.connect(queueName, () => {
    pub.write(JSON.stringify(payload), 'utf8');
    pub.close();
  });
}

/**
 * Subscribe helper, uses PULL context
 * @param context
 * @param queueName
 * @param next
 */
function subscribe(context, queueName, next) {
  const sub = context.socket('SUB');
  sub.on('data', (data) => {
    let payload = data;
    try {
      payload = JSON.parse(data);
    } catch (e) {}
    if (typeof next === 'function') {
      next(payload);
    }
  });
  sub.connect(queueName);

  return sub;
}

exports.reply = reply;
exports.publish = publish;
exports.subscribe = subscribe;
