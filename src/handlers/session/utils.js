function getSession(redis, userId, uuid) {
  return redis
    .get(`session.${userId}.${uuid}`)
    .then(JSON.parse)
    .catch((err) => {
      console.error('Could not remove user session', err);
    });
}

function setSession(redis, userId, { uuid, host, port }) {
  return redis
    .set(`session.${userId}.${uuid}`, JSON.stringify({ uuid, host, port }))
    .catch((err) => {
      console.error('Could not save user session', err);
    });
}

function unsetSession(redis, userId, uuid) {
  return redis
    .del(`session.${userId}.${uuid}`)
    .catch((err) => {
      console.error('Could not remove user session', err);
    });
}

function getAllSessionKeys(redis, userId) {
  return redis.keys(`session.${userId}.*`)
    .catch((error) => {
      console.log('Could not get session keys for user', error);
    });
}

exports.getSession = getSession;
exports.getAllSessionKeys = getAllSessionKeys;
exports.setSession = setSession;
exports.unsetSession = unsetSession;
