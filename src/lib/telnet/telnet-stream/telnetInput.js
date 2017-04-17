// Copyright 2013 Patrick Meade. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

const SUBNEG_BUFFER_SIZE = 8192;

// ----------------------------------------------------------------------
//       EOR                 239    End of record.
//       SE                  240    End of subnegotiation parameters.
//       NOP                 241    No operation.
//       Data Mark           242    The data stream portion of a Synch.
//                                  This should always be accompanied
//                                  by a TCP Urgent notification.
//       Break               243    NVT character BRK.
//       Interrupt Process   244    The function IP.
//       Abort output        245    The function AO.
//       Are You There       246    The function AYT.
//       Erase character     247    The function EC.
//       Erase Line          248    The function EL.
//       Go ahead            249    The GA signal.
//       SB                  250    Indicates that what follows is
//                                  subnegotiation of the indicated
//                                  option.
//       WILL (option code)  251    Indicates the desire to begin
//                                  performing, or confirmation that
//                                  you are now performing, the
//                                  indicated option.
//       WON'T (option code) 252    Indicates the refusal to perform,
//                                  or continue performing, the
//                                  indicated option.
//       DO (option code)    253    Indicates the request that the
//                                  other party perform, or
//                                  confirmation that you are expecting
//                                  the other party to perform, the
//                                  indicated option.
//       DON'T (option code) 254    Indicates the demand that the
//                                  other party stop performing,
//                                  or confirmation that you are no
//                                  longer expecting the other party
//                                  to perform, the indicated option.
//       IAC                 255    Data Byte 255.
// ----------------------------------------------------------------------

const TELNET_COMMAND = 'TELNET_COMMAND';
const TELNET_DATA = 'TELNET_DATA';
const TELNET_OPTION = 'TELNET_OPTION';
const TELNET_SUBNEG = 'TELNET_SUBNEG';
const TELNET_SUBNEG_COMMAND = 'TELNET_SUBNEG_COMMAND';
const TELNET_DO = 253;
const TELNET_DONT = 254;
const TELNET_IAC = 255;
const TELNET_SUB_BEGIN = 250;
const TELNET_SUB_END = 240;
const TELNET_WILL = 251;
const TELNET_WONT = 252;
const TELNET_GA = 249;
const TELNET_EOR = 239;
const Transform = require('stream').Transform;

class TelnetInput extends Transform {
  constructor(options) {
    super(options);
    this.dataHasPrompt = false;
    this.state = TELNET_DATA;
    this.subBuf = new Buffer(SUBNEG_BUFFER_SIZE);
  }

  _transform(chunk, encoding, done) {
    let i, j, ref;
    this.dataBuf = new Buffer(chunk.length);
    this.dataBufIndex = 0;
    for (i = j = 0, ref = chunk.length - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
      // We are better off handling the GA|EOR state here than outside of the telnetInput class
      if (this.state === TELNET_COMMAND && (chunk[i] === TELNET_GA || chunk[i] === TELNET_EOR)) {
        this.dataHasPrompt = true;
      }
      this.handle(chunk[i]);
    }
    if (this.dataBufIndex > 0 && !this.dataHasPrompt) {
      this.emit('data', this.dataBuf.slice(0, this.dataBufIndex));
    } else if (this.dataBufIndex > 0 && this.dataHasPrompt) {
      // Emit the data and the prompt in separate streams
      const buffer = this.dataBuf.slice(0, this.dataBufIndex);
      const lastIndex = buffer.lastIndexOf('\n') + 1;
      const data = buffer.slice(0, lastIndex);
      const prompt = buffer.slice(lastIndex);

      this.emit('data', data);
      this.emit('prompt', prompt);

      // Set the state of dataHasPromtp back to false
      this.dataHasPrompt = false;
    }
    return done();
  }

  handle(chunkData) {
    switch (this.state) {
      case TELNET_DATA:
        switch (chunkData) {
          case TELNET_IAC:
            return this.state = TELNET_COMMAND;
          default:
            this.dataBuf[this.dataBufIndex] = chunkData;
            return this.dataBufIndex++;
        }
        break;
      case TELNET_COMMAND:
        switch (chunkData) {
          case TELNET_IAC:
            this.state = TELNET_DATA;
            this.dataBuf[this.dataBufIndex] = TELNET_IAC;
            return this.dataBufIndex++;
          case TELNET_DO:
          case TELNET_DONT:
          case TELNET_WILL:
          case TELNET_WONT:
          case TELNET_SUB_BEGIN:
            this.state = TELNET_OPTION;
            return this.command = chunkData;
          default:
            this.state = TELNET_DATA;
            return this.emit('command', chunkData);
        }
        break;
      case TELNET_OPTION:
        switch (this.command) {
          case TELNET_DO:
            this.state = TELNET_DATA;
            return this.emit('do', chunkData);
          case TELNET_DONT:
            this.state = TELNET_DATA;
            return this.emit('dont', chunkData);
          case TELNET_WILL:
            this.state = TELNET_DATA;
            return this.emit('will', chunkData);
          case TELNET_WONT:
            this.state = TELNET_DATA;
            return this.emit('wont', chunkData);
          case TELNET_SUB_BEGIN:
            this.state = TELNET_SUBNEG;
            this.option = chunkData;
            return this.subBufIndex = 0;
        }
        break;
      case TELNET_SUBNEG:
        switch (chunkData) {
          case TELNET_IAC:
            return this.state = TELNET_SUBNEG_COMMAND;
          default:
            this.subBuf[this.subBufIndex] = chunkData;
            return this.subBufIndex++;
        }
        break;
      case TELNET_SUBNEG_COMMAND:
        switch (chunkData) {
          case TELNET_IAC:
            this.state = TELNET_SUBNEG;
            this.subBuf[this.subBufIndex] = TELNET_IAC;
            return this.subBufIndex++;
          case TELNET_SUB_END:
            this.state = TELNET_DATA;
            return this.emit('sub', this.option, this.subBuf.slice(0, this.subBufIndex));
          default:
            return this.state = TELNET_SUBNEG;
        }
    }
  };
}

exports.TelnetInput = TelnetInput;
