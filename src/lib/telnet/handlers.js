const actions = require('./actions');
const constants = require('./constants');

function getTelnetOption(option) {
  return Object.keys(constants).find(key => constants[key] === parseInt(option)) || option;
}

function emit(context, uuid, action) {
  const pub = context.socket('PUSH');
  pub.connect(`session.${uuid}`, () => {
    pub.write(JSON.stringify(action));
    pub.end();
  });
}

function commandHandler(context, uuid) {
  return (option) => {
    switch (option) {
      // @TODO: Add handlers
      default:
        break;
    }
    console.log(`COMMAND: ${getTelnetOption(option)}`);
  };
}

function doHandler(context, uuid) {
  return (option) => {
    switch (option) {
      // @TODO: Add handlers
      default:
        break;
    }
    console.log(`DO: ${getTelnetOption(option)}`);
  };
}

function dontHandler(context, uuid) {
  return (option) => {
    switch (option) {
      // @TODO: Add handlers
      default:
        break;
    }
    console.log(`DON'T: ${getTelnetOption(option)}`);
  };
}

function subHandler(context, uuid) {
  return (option, buffer) => {
    switch (option) {
      // @TODO: Add handlers
      default:
        break;
    }
    console.log(`DON'T: ${getTelnetOption(option)}`, buffer);
  };
}

function willHandler(context, uuid) {
  return (option) => {
    switch (option) {
      case constants.TELNET_HIDE_ECHO:
        emit(context, uuid, actions.sendWillHideEcho(uuid));
        break;
    }
    console.log(`WILL: ${getTelnetOption(option)}`);
  };
}

function wontHandler(context, uuid) {
  return (option) => {
    switch (option) {
      case constants.TELNET_HIDE_ECHO:
        emit(context, uuid, actions.sendWontHideEcho(uuid));
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
