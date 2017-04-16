const actions = require('./actions');
const constants = require('./constants');
const utils = require('../utils');
const debug = require('../debug');
const pkg = require('../../../package.json');

function getTelnetOption(option) {
  return Object.keys(constants).find(key => constants[key] === parseInt(option)) || option;
}

function commandHandler(telnetOutput, context, socketId, uuid) {
  return (option) => {
    switch (option) {
      case constants.TELNET_EOR:
      case constants.TELNET_GA:
        utils.publish(context, `${constants.SESSION_DO_GO_AHEAD}.${uuid}`, uuid);
        break;
      default:
        break;
    }
    debug(`[${uuid}] COMMAND: ${getTelnetOption(option)}`);
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
      case constants.TELNET_TERMTYPE:
        telnetOutput.writeWill(constants.TELNET_TERMTYPE);
        break;
      case constants.TELNET_NAWS:
        telnetOutput.writeWill(constants.TELNET_NAWS);
        // See example of window size setting
        // const nawsBuffer = new Buffer(4);
        // nawsBuffer.writeInt16BE(60, 0);
        // nawsBuffer.writeInt16BE(50, 2);
        // telnetOutput.writeSub(constants.TELNET_NAWS, nawsBuffer);
        break;
      default:
        break;
    }
    debug(`[${uuid}] DO: ${getTelnetOption(option)}`);
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
    debug(`[${uuid}] DON'T: ${getTelnetOption(option)}`);
  };
}

function subHandler(telnetOutput, context, socketId, uuid) {
  let i, j, ref;
  return (option, buffer) => {
    switch (option) {
      case constants.TELNET_TERMTYPE:
        const termTypeBuf = Buffer.from(`Outflow v${pkg.version}`);
        const subBuf = new Buffer(buffer.length + termTypeBuf.length);
        subBuf[0] = buffer;
        for (i = j = 0, ref = termTypeBuf.length - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
          subBuf[i + 3] = termTypeBuf[i];
        }
        telnetOutput.writeSub(constants.TELNET_TERMTYPE, subBuf);
        break;
      default:
        break;
    }
    debug(`[${uuid}] SUB: ${getTelnetOption(option)}`, buffer.toString());
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
    debug(`[${uuid}] WILL: ${getTelnetOption(option)}`);
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
    debug(`[${uuid}] WON'T: ${getTelnetOption(option)}`);
  };
}

exports.commandHandler = commandHandler;
exports.doHandler = doHandler;
exports.dontHandler = dontHandler;
exports.subHandler = subHandler;
exports.willHandler = willHandler;
exports.wontHandler = wontHandler;
