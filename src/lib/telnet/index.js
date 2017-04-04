const _ = require('lodash');
const fs = require('fs');
const net = require('net');
const EventEmitter = require('events');
const TelnetInput = require('telnet-stream').TelnetInput;
const TelnetOutput = require('telnet-stream').TelnetOutput;
const AnsiParse = require('../ansiParse');
const constants = require('./constants');
const handlers = require('./handlers');
const utils = require('../utils');
const session = require('../../handlers/session/constants');

class TelnetSession {
  constructor(connection, context) {
    this.emitter = new EventEmitter();
    this.context = context;
    this.host = connection.host;
    this.port = connection.port;
    this.uuid = connection.uuid;
    this.socketId = connection.socketId;
    this.data = '';
    this.buffer = '';
    this.timeout = null;
    this.subscribers = [];

    // Telnet handlers
    this.input = new TelnetInput();
    this.output = new TelnetOutput();

    // Bindings
    this.bindOutputProcessing();
    this.bindCommandHandler();
    this.bindDisconnectHandler();
  }

  start() {
    this.conn = net.createConnection(this.port, this.host, (err) => {
      // Error feedback is handled as event
      if (!err) {
        this.emitter.emit('connected');

        // Set the connection pipes
        this.conn.pipe(this.input);
        this.output.pipe(this.conn);
      }
    });

    this.conn.on('close', () => {
      this.conn.unpipe(this.input);
      this.output.unpipe(this.conn);
      this.subscribers.forEach((sub) => sub.close());

      // Emit disconnected
      setTimeout(() => this.emitter.emit('closed'), 100);
    });

    this.conn.on('error', (err) => {
      this.emitter.emit('error', this.getConnectionError(err));
    });

    return Promise.resolve(this.emitter);
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

  bindDisconnectHandler() {
    this.subscribers.push(utils.subscribe(this.context, `${session.SESSION_DISCONNECT}.${this.uuid}`, (uuid) => {
      if (this.uuid === uuid) {
        this.conn.destroy();
      }
    }));
  }

  bindCommandHandler() {
    this.subscribers.push(utils.subscribe(this.context, `${session.SESSION_COMMAND}.${this.uuid}`, (command) => {
      if (typeof command !== 'undefined') {
        this.receiveCommand(command);
      }
    }));
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
    this.input.on('command', handlers.commandHandler(this.context, this.socketId, this.uuid));
    this.input.on('do', handlers.doHandler(this.context, this.socketId, this.uuid));
    this.input.on('dont', handlers.dontHandler(this.context, this.socketId, this.uuid));
    this.input.on('sub', handlers.subHandler(this.context, this.socketId, this.uuid));
    this.input.on('will', handlers.willHandler(this.context, this.socketId, this.uuid));
    this.input.on('wont', handlers.wontHandler(this.context, this.socketId, this.uuid));
  }

  sendOutput(output) {
    this.emitter.emit('data', AnsiParse.parse(output));
  }

  receiveCommand(command) {
    this.output.write(command + '\n');
  }

}
module.exports = TelnetSession;
