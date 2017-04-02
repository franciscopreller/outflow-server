const constants = require('./constants');

function sendWillHideEcho(uuid) {
  return {
    type: constants.SESSION_HIDE_PROMPT_REQUESTED,
    payload: {
      uuid,
    }
  };
}

function sendWontHideEcho(uuid) {
  return {
    type: constants.SESSION_SHOW_PROMPT_REQUESTED,
    payload: {
      uuid,
    }
  };
}

exports.sendWillHideEcho = sendWillHideEcho;
exports.sendWontHideEcho = sendWontHideEcho;