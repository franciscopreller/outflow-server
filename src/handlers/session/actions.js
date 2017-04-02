const constants = require('./constants');

exports.sessionOutput = ({ lines, uuid }) => ({
  type: constants.SESSION_OUTPUT,
  payload: {
    lines,
    uuid,
  },
});

exports.sessionError = ({ error, uuid }) => ({
  type: constants.SESSION_ERROR,
  payload: {
    error,
    uuid,
  }
});

exports.sessionConnected = ({ uuid }) => ({
  type: constants.SESSION_CONNECTED,
  payload: {
    uuid,
  }
});

exports.sessionDisconnected = ({ uuid }) => ({
  type: constants.SESSION_DISCONNECTED,
  payload: {
    uuid,
  }
});
