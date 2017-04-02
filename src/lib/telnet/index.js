const _ = require('lodash');
const fs = require('fs');
const net = require('net');
const TelnetInput = require('telnet-stream').TelnetInput;
const TelnetOutput = require('telnet-stream').TelnetOutput;
const ansiHTML = require('../ansiParse');
const constants = require('./constants');
const handlers = require('./handlers');
const utils = require('../utils');

// This being here makes me think there's a problem, should be moved to the session handler namespace
const actions = require('../../handlers/session/actions');

class TelnetSession {
  constructor(connection, context) {
    this.context = context;
    this.pub = context.socket('PUSH');
    this.host = connection.host;
    this.port = connection.port;
    this.uuid = connection.uuid;
    this.data = '';
    this.buffer = '';
    this.timeout = null;

    // Telnet handlers
    this.input = new TelnetInput();
    this.output = new TelnetOutput();

    // Bindings
    this.bindOutputProcessing();
    this.bindCommandHandler();
    this.bindDisconnectHandler();
    this.emit = this.emit.bind(this);
  }

  start() {
    this.conn = net.createConnection(this.port, this.host, (err) => {
      // Error feedback is handled as event
      if (!err) {
        // Emit connected back to client
        this.emit(actions.sessionConnected({ uuid: this.uuid }));

        // Set the connection pipes
        this.conn.pipe(this.input);
        this.output.pipe(this.conn);
      } else {
        // Deal with any immediate errors
        this.emit(actions.sessionError({ uuid: this.uuid, error: this.getConnectionError(err) }));
      }
    });

    this.conn.on('close', () => {
      this.conn.unpipe(this.input);
      this.output.unpipe(this.conn);

      // Emit disconnected
      setTimeout(() => {
        this.emit(actions.sessionDisconnected({ uuid: this.uuid }));
      }, 100);
    });

    this.conn.on('error', (err) => {
      this.emit(actions.sessionError({ uuid: this.uuid, error: this.getConnectionError(err) }));
    });
  }

  getConnectionError(err) {
    let error = 'There was an error from the remote telnet client';
    switch (err.code) {
      case 'ENOTFOUND':
        error = `Could not connect to ${this.host}:${this.port}. Host not found.`;
        break;
      case 'ECONNREFUSED':
        error = `Could not connect to ${this.host}:${this.port}. Connection refused.`;
        break;
      case 'ECONNRESET':
        error = `The server at ${this.host}:${this.port} closed the connection.`;
        break;
      default:
        console.error('Unknown telnet connection error', err);
        break;
    }

    return error;
  }

  emit(data) {
    this.pub.connect(`session.${this.uuid}`, () => {
      this.pub.write(JSON.stringify(data))
    });
  }

  bindDisconnectHandler() {
    utils.subscribe(this.context, `session.disconnect.${this.uuid}`, (payload) => {
      if (this.uuid === payload.uuid) {
        console.log(`Disconnecting from ${payload.uuid}`);
        this.conn.destroy();
      }
    });
  }

  bindCommandHandler() {
    utils.subscribe(this.context, `session.command.${this.uuid}`, (payload) => {
      if (payload.command) {
        this.receiveCommand(payload.command);
      }
    });
  }

  bindOutputProcessing() {
    this.input.on('data', (data) => {
      this.buffer += data;

      // There appears to be no sure-fire way to tell when data packets are done streaming
      // currently, so this is a bit of a hack to ensure it's done receiving, by using a
      // 10 millisecond delay before sending it back to the client, if more data comes in
      // before that delay, then keep buffering and add another 10 millisecond delay
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        this.sendOutput(this.buffer);
        this.buffer = '';
      }, 20);
    });

    // Telnet events
    this.input.on('command', handlers.commandHandler(this.context, this.uuid));
    this.input.on('do', handlers.doHandler(this.context, this.uuid));
    this.input.on('dont', handlers.dontHandler(this.context, this.uuid));
    this.input.on('sub', handlers.subHandler(this.context, this.uuid));
    this.input.on('will', handlers.willHandler(this.context, this.uuid));
    this.input.on('wont', handlers.wontHandler(this.context, this.uuid));
  }

  sendOutput(output) {
    const lines = ansiHTML.toLineObjects({str: output.toString()});
    this.emit(actions.sessionOutput({
        lines,
        uuid: this.uuid,
    }));
  }

  receiveCommand(command) {
    this.output.write(command + '\n');
  }

}
module.exports = TelnetSession;
