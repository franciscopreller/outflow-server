const actions = require('./actions');
const constants = require('./constants');
const utils = require('../utils');

function getTelnetOption(option) {
  return Object.keys(constants).find(key => constants[key] === parseInt(option)) || option;
}

function commandHandler(telnetOutput, context, socketId, uuid) {
  return (option) => {
    switch (option) {
      case constants.TELNET_EOR:
      case constants.TELNET_GA:
        utils.publish(context, `${constants.SESSION_DO_GO_AHEAD}.${uuid}`, uuid);
        // utils.reply(context, socketId, actions.sendWillGoAhead(uuid));
        break;
      default:
        break;
    }
    console.log(`[${uuid}] COMMAND: ${getTelnetOption(option)}`);
  };
}

/**
 * Handlers for when the server sends a DO request option.
 * DO negotiations expect either a WILL or WONT response.
 *
 * @param telnetOutput
 * @param context
 * @param socketId
 * @param uuid
 * @returns {function(*=)}
 */
function doHandler(telnetOutput, context, socketId, uuid) {
  return (option) => {
    switch (option) {
      case constants.TELNET_NAWS:
        // @TODO: Implement NAWS
        telnetOutput.writeWont(constants.TELNET_NAWS);
        break;
      default:
        break;
    }
    console.log(`[${uuid}] DO: ${getTelnetOption(option)}`);
  };
}

/**
 * Handlers for when the server sends a DONT request option.
 * DONT negotiations expect either a WILL or WONT response.
 *
 * @param telnetOutput
 * @param context
 * @param socketId
 * @param uuid
 * @returns {function(*=)}
 */
function dontHandler(telnetOutput, context, socketId, uuid) {
  return (option) => {
    switch (option) {
      // @TODO: Add handlers
      default:
        break;
    }
    console.log(`[${uuid}] DON'T: ${getTelnetOption(option)}`);
  };
}

function subHandler(telnetOutput, context, socketId, uuid) {
  return (option, buffer) => {
    switch (option) {
      // @TODO: Add handlers
      default:
        break;
    }
    console.log(`[${uuid}] DON'T: ${getTelnetOption(option)}`, buffer);
  };
}

/**
 * Handler for when the server sends a WILL request option.
 * WILL negotiations expect either a DO or DONT response.
 *
 * @param telnetOutput
 * @param context
 * @param socketId
 * @param uuid
 * @returns {function(*=)}
 */
function willHandler(telnetOutput, context, socketId, uuid) {
  return (option) => {
    switch (option) {
      case constants.TELNET_ECHO:
        telnetOutput.writeDo(constants.TELNET_ECHO);
        utils.reply(context, socketId, actions.sendWillHideEcho(uuid));
        break;
      case constants.TELNET_END_OF_RECORD:
        telnetOutput.writeDo(constants.TELNET_END_OF_RECORD);
        break;
    }
    console.log(`[${uuid}] WILL: ${getTelnetOption(option)}`);
  };
}

/**
 * Handler for when the server sends a WONT request option.
 * WONT negotiations expect either a DO or DONT response.
 *
 * @param telnetOutput
 * @param context
 * @param socketId
 * @param uuid
 * @returns {function(*=)}
 */
function wontHandler(telnetOutput, context, socketId, uuid) {
  return (option) => {
    switch (option) {
      case constants.TELNET_ECHO:
        telnetOutput.writeDont(constants.TELNET_ECHO);
        utils.reply(context, socketId, actions.sendWontHideEcho(uuid));
        break;
    }
    console.log(`[${uuid}] WONT: ${getTelnetOption(option)}`);
  };
}

exports.commandHandler = commandHandler;
exports.doHandler = doHandler;
exports.dontHandler = dontHandler;
exports.subHandler = subHandler;
exports.willHandler = willHandler;
exports.wontHandler = wontHandler;
