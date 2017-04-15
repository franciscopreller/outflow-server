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

const TELNET_DO = 253;
const TELNET_DONT = 254;
const TELNET_IAC = 255;
const TELNET_SUB_BEGIN = 250;
const TELNET_SUB_END = 240;
const TELNET_WILL = 251;
const TELNET_WONT = 252;
const Transform = require('stream').Transform;

const duplicateIAC = function(buffer) {
  let data;
  let bufferIndex = 0;
  let xlateIndex = 0;
  let xlateBuf = new Buffer(buffer.length * 2);
  while (bufferIndex < buffer.length) {
    data = buffer[bufferIndex];
    bufferIndex++;
    xlateBuf.writeUInt8(data, xlateIndex);
    xlateIndex++;
    if (data === TELNET_IAC) {
      xlateBuf.writeUInt8(data, xlateIndex);
      xlateIndex++;
    }
  }
  return xlateBuf.slice(0, xlateIndex);
};

class TelnetOutput extends Transform {
  constructor(options) {
    super(options);
  }

  _transform(chunk, encoding, done) {
    this.push(duplicateIAC(chunk));
    return done();
  }

  _writeOption(command, option) {
    const cmdBuf = new Buffer(3);
    cmdBuf[0] = TELNET_IAC;
    cmdBuf[1] = command;
    cmdBuf[2] = option;
    return this.push(cmdBuf);
  }

  writeCommand(command) {
    const cmdBuf = new Buffer(2);
    cmdBuf[0] = TELNET_IAC;
    cmdBuf[1] = command;
    return this.push(cmdBuf);
  }

  writeDo(option) {
    return this._writeOption(TELNET_DO, option);
  }

  writeDont(option) {
    return this._writeOption(TELNET_DONT, option);
  }

  writeSub(option, buffer) {
    let i, j, ref;
    const negBuf = duplicateIAC(buffer);
    const subBuf = new Buffer(negBuf.length + 5);
    subBuf[0] = TELNET_IAC;
    subBuf[1] = TELNET_SUB_BEGIN;
    subBuf[2] = option;
    for (i = j = 0, ref = negBuf.length - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
      subBuf[i + 3] = negBuf[i];
    }
    subBuf[negBuf.length + 3] = TELNET_IAC;
    subBuf[negBuf.length + 4] = TELNET_SUB_END;
    return this.push(subBuf);
  }

  writeWill(option) {
    return this._writeOption(TELNET_WILL, option);
  }

  writeWont(option) {
    return this._writeOption(TELNET_WONT, option);
  }
}

exports.TelnetOutput = TelnetOutput;
