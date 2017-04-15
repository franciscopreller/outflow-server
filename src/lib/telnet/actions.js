const constants = require('./constants');

/**
 * Request that the client hide the command line prompt, this should be interpreted as A) the
 * command prompt being switched to a password type field (do not show the typed content) and
 * also B) the command should not be output to the session (note that a new line should still
 * be send to the server and the client window).
 *
 * @param uuid
 * @returns {{type: string, payload: {uuid: *}}}
 */
function sendWillHideEcho(uuid) {
  return {
    type: constants.SESSION_HIDE_PROMPT_REQUESTED,
    payload: {
      uuid,
    }
  };
}

/**
 * Request that the client show the command line prompt, this should signal that the client
 * should revert back to normal command prompt behaviour.
 *
 * @param uuid
 * @returns {{type: string, payload: {uuid: *}}}
 */
function sendWontHideEcho(uuid) {
  return {
    type: constants.SESSION_SHOW_PROMPT_REQUESTED,
    payload: {
      uuid,
    }
  };
}

/**
 * Request that the client process a GO_AHEAD option, this ought to signal that the last line of the
 * send block (EOR) is a prompt, and should be moved down for further output incoming from the server,
 * once a command is sent from the client, the command prompt should no longer be replaced.
 *
 * @param uuid
 * @returns {{type: string, payload: {uuid: *}}}
 */
function sendWillGoAhead(uuid) {
  return {
    type: constants.SESSION_DO_GO_AHEAD,
    payload: {
      uuid,
    }
  };
}

exports.sendWillHideEcho = sendWillHideEcho;
exports.sendWontHideEcho = sendWontHideEcho;
exports.sendWillGoAhead = sendWillGoAhead;
