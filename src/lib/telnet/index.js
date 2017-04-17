const fs = require('fs');
const net = require('net');
const EventEmitter = require('events');
const TelnetInput = require('./telnet-stream').TelnetInput;
const TelnetOutput = require('./telnet-stream').TelnetOutput;
const AnsiParse = require('../parse');
const constants = require('./constants');
const handlers = require('./handlers');
const utils = require('../utils');
const session = require('../../handlers/session/constants');
const actions = require('./actions');
const sessionActions = require('../../handlers/session/actions');

class TelnetSession {
  constructor(connection, context) {
    this.emitter = new EventEmitter();
    this.context = context;
    this.host = connection.host;
    this.port = connection.port;
    this.uuid = connection.uuid;
    this.socketId = connection.socketId;
    this.keepAliveRunning = false;
    this.connected = false;
    this.subscribers = [];
    this.buffer = '';
    this.prompt = '';

    // Telnet handlers
    this.input = new TelnetInput();
    this.output = new TelnetOutput();
  }

  start() {
    this.conn = net.createConnection(this.port, this.host, (err) => {
      // Error feedback is handled as event
      if (!err) {
        // Bind handlers once connection issued
        this.bindOutputProcessing();
        this.bindCommandHandler();
        this.bindDisconnectHandler();

        // Set session state and emit the connected state back to the handler
        this.connected = true;
        this.emitter.emit('connected');

        // Set the connection pipes
        this.conn.pipe(this.input);
        this.output.pipe(this.conn);
      }
    });

    this.conn.on('close', () => {
      // Set the connected state to false
      this.connected = false;

      // Unpipe connections
      this.conn.unpipe(this.input);
      this.output.unpipe(this.conn);

      // Close internal binding subscribers
      this.subscribers.forEach((sub) => sub.close());

      // Emit closed back to the handlers
      setTimeout(() => this.emitter.emit('closed'), 100);
    });

    this.conn.on('error', (err) => this.emitter.emit('error', this.getConnectionError(err)));
    // Catch unexpected exits
    process.on('SIGTERM', () => {
      utils.reply(this.context, this.socketId, sessionActions.sessionDisconnected({ uuid: this.uuid }));
      console.log(`Exiting connection [${this.uuid}] gracefully...`);
    });

    return this.emitter;
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

  /**
   * Keep-alive sends TELNET_GA back to the server every 20 seconds to keep connections active
   */
  bindKeepAliveHandler() {
    const KEEP_ALIVE_INTERVAL = 20000;
    const interval = setInterval(() => {
      if (this.keepAliveRunning && this.connected) {
        this.output.writeDo(constants.TELNET_GA);
      } else {
        clearInterval(interval);
      }
    }, KEEP_ALIVE_INTERVAL);
  }

  /**
   * Receives messages to disconnect from the user
   */
  bindDisconnectHandler() {
    this.subscribers.push(utils.subscribe(this.context, `${session.SESSION_DISCONNECT}.${this.uuid}`, (uuid) => {
      if (this.uuid === uuid) {
        this.conn.destroy();
      }
    }));
  }

  /**
   * Receives commands from the user
   */
  bindCommandHandler() {
    this.subscribers.push(utils.subscribe(this.context, `${session.SESSION_COMMAND}.${this.uuid}`, (command) => {
      if (typeof command !== 'undefined') {
        this.output.write(`${command}\r\n`);
      }
    }));
  }

  /**
   * Process the output
   */
  bindOutputProcessing() {
    this.input.on('prompt', (prompt) => this.prompt = prompt.toString());
    this.input.on('data', (data) => {
      // First time we receive data, bind keep-alive
      if (!this.keepAliveRunning) {
        this.keepAliveRunning = true;
        this.bindKeepAliveHandler();
      }
      // Buffer any multi-block data incoming
      this.buffer += data;
      setTimeout(() => {
        if (this.buffer.length) this.emitter.emit('data', AnsiParse.parse(this.buffer));
        if (this.prompt.length) this.emitter.emit('prompt', AnsiParse.parse(this.prompt));
        this.buffer = '';
        this.prompt = '';
      }, 20);
    });

    // Telnet events
    this.input.on('command', handlers.commandHandler(this.output, this.context, this.socketId, this.uuid));
    this.input.on('do', handlers.doHandler(this.output, this.context, this.socketId, this.uuid));
    this.input.on('dont', handlers.dontHandler(this.output, this.context, this.socketId, this.uuid));
    this.input.on('sub', handlers.subHandler(this.output, this.context, this.socketId, this.uuid));
    this.input.on('will', handlers.willHandler(this.output, this.context, this.socketId, this.uuid));
    this.input.on('wont', handlers.wontHandler(this.output, this.context, this.socketId, this.uuid));
  }

}
module.exports = TelnetSession;
