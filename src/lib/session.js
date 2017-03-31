const _ = require('lodash');
const fs = require('fs');
const net = require('net');
const TelnetInput = require('telnet-stream').TelnetInput;
const TelnetOutput = require('telnet-stream').TelnetOutput;
const ansiHTML = require('./ansiParse');
const actions = require('../handlers/session/actions');

class Session {
  constructor(connection, context) {
    this.context = context;
    this.pub = context.socket('PUB');
    this.sub = context.socket('SUB');
    this.host = connection.host;
    this.port = connection.port;
    this.uuid = connection.uuid;
    this.data = '';
    this.buffer = '';
    this.conn = null;
    this.timestamp = Date.now();
    this.timeout = null;

    // Telnet handlers
    this.input = new TelnetInput();
    this.output = new TelnetOutput();

    // Bindings
    this.bindOutputProcessing();
    this.bindCommandHandler();
  }

  connect() {
    this.conn = net.createConnection(this.port, this.host, (err) => {
      if (err) {
        // Send error
        console.error('Error connecting to remote server', err);
        this.sendError(err);
      } else {
        // Bind IO
        this.conn.pipe(this.input);
        this.output.pipe(this.conn);
      }
    });

    this.conn.on('close', () => {
      console.log(`(${this.host}) lost connection...`);
      this.conn.unpipe(this.input);
      this.output.unpipe(this.conn);
    });
    this.conn.on('error', (err) => {
      console.log('Connection error', err);
    });
  }

  emit(data) {
    this.pub.connect(`session.${this.uuid}`, () => {
      this.pub.write(JSON.stringify(data))
    });
  }

  bindCommandHandler() {
    this.sub.on('data', (data) => {
      let command = '';
      try {
        command = JSON.parse(data).payload.command;
      } catch(err) {
        console.error('Command handler could not parse');
      }
      console.log('Received command', command);
      this.receiveCommand(command);
    });
    this.sub.connect(`session.command.${this.uuid}`);
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
      }, 10);
    });

    // Telnet events
    this.input.on('command', (command) => {
      // Received: IAC <command> - See RFC 854
      console.log(`(${this.host}) got command:`, command);
    });

    this.input.on('do', (option) => {
      // Received: IAC DO <option> - See RFC 854
      console.log(`(${this.host}) got do:`, option);
    });

    this.input.on('dont', (option) => {
      // Received: IAC DONT <option> - See RFC 854
      console.log(`(${this.host}) got dont:`, option);
    });

    this.input.on('sub', (option, buffer) => {
      // Received: IAC SB <option> <buffer> IAC SE - See RFC 855
      console.log(`(${this.host}) got sub:`, option, buffer);
    });

    this.input.on('will', (option) => {
      // Received: IAC WILL <option> - See RFC 854
      console.log(`(${this.host}) got will:`, option);
    });

    this.input.on('wont', (option) => {
      // Received: IAC WONT <option> - See RFC 854
      console.log(`(${this.host}) got wont:`, option);
    });

  }

  sendOutput(output) {
    const lines = ansiHTML.toLineObjects({str: output.toString()});
    this.emit(actions.sessionOutput({
        lines,
        uuid: this.uuid,
    }));
  }

  sendError(error) {
    this.emit(actions.sessionError({
      error,
      uuid: this.uuid,
    }));
  }

  receiveCommand(command) {
    this.output.write(command + '\n');
  }

}
module.exports = Session;
