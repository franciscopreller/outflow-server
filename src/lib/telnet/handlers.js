const actions = require('./actions');
const constants = require('./constants');
const utils = require('../utils');

function getTelnetOption(option) {
  return Object.keys(constants).find(key => constants[key] === parseInt(option)) || option;
}

function commandHandler(context, socketId, uuid) {
  return (option) => {
    switch (option) {
      // @TODO: Add handlers
      default:
        break;
    }
    console.log(`COMMAND: ${getTelnetOption(option)}`);
  };
}

function doHandler(context, socketId, uuid) {
  return (option) => {
    switch (option) {
      // @TODO: Add handlers
      default:
        break;
    }
    console.log(`DO: ${getTelnetOption(option)}`);
  };
}

function dontHandler(context, socketId, uuid) {
  return (option) => {
    switch (option) {
      // @TODO: Add handlers
      default:
        break;
    }
    console.log(`DON'T: ${getTelnetOption(option)}`);
  };
}

function subHandler(context, socketId, uuid) {
  return (option, buffer) => {
    switch (option) {
      // @TODO: Add handlers
      default:
        break;
    }
    console.log(`DON'T: ${getTelnetOption(option)}`, buffer);
  };
}

function willHandler(context, socketId, uuid) {
  return (option) => {
    switch (option) {
      case constants.TELNET_HIDE_ECHO:
        utils.reply(context, socketId, actions.sendWillHideEcho(uuid));
        break;
    }
    console.log(`WILL: ${getTelnetOption(option)}`);
  };
}

function wontHandler(context, socketId, uuid) {
  return (option) => {
    switch (option) {
      case constants.TELNET_HIDE_ECHO:
        utils.reply(context, socketId, actions.sendWontHideEcho(uuid));
        break;
    }
    console.log(`WONT: ${getTelnetOption(option)}`);
  };
}

exports.commandHandler = commandHandler;
exports.doHandler = doHandler;
exports.dontHandler = dontHandler;
exports.subHandler = subHandler;
exports.willHandler = willHandler;
exports.wontHandler = wontHandler;
