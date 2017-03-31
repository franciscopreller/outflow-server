class AnsiParse {

  /**
   * The default ansi code
   */
  static get defaultAnsiCode() {
    return {
      types: [],
      fg: 'white',
      bg: 'black',
    };
  }

  /**
   * List of supported ansi codes
   */
  static get ansiCodes() {
    return {
      '0': {reset: true},
      '1': {type: 'bold'},
      '3': {type: 'italic'},
      '4': {type: 'underline'},
      '5': {type: 'blink'},
      '7': {type: 'invert'},
      '9': {type: 'strikethrough'},
      '30': {fg: 'grey'},
      '31': {fg: 'red'},
      '32': {fg: 'green'},
      '33': {fg: 'yellow'},
      '34': {fg: 'blue'},
      '35': {fg: 'magenta'},
      '36': {fg: 'cyan'},
      '37': {fg: 'white'},
      '40': {bg: 'black'},
      '41': {bg: 'red'},
      '42': {bg: 'green'},
      '43': {bg: 'yellow'},
      '44': {bg: 'blue'},
      '45': {bg: 'magenta'},
      '46': {bg: 'cyan'},
      '47': {bg: 'white'},
    };
  };

  /**
   * Parses an ansi string into separate line objects
   *
   * @param {*} str
   * @param {*} carryOver
   */
  static toLineObjects({str, carryOver = ''}) {
    let char;
    let lastCodesObj = this.defaultAnsiCode;
    let lineArrays = [];
    let lineStr = '';
    for (let i = 0; i < str.length; i++) {
      char = str[i];
      switch (char) {
        case '\n':
          let linesObj = this.toObject({ansiCodes: lastCodesObj, str: lineStr});
          lastCodesObj = linesObj[linesObj.length - 1].codes;
          lineArrays.push(linesObj);
          lineStr = '';
          break;
        default:
          lineStr += char;
          break;
      }
    }
    if (lineStr.length) {
      lineArrays.push(this.toObject({ansiCodes: lastCodesObj, str: lineStr}));
      //carryOver = lineStr;
    }
    return lineArrays;
  }

  /**
   * Parses a string into an array of objects which make up a single line,
   * each object has theior own ansi codes or params
   *
   * If ansiCodes are passed, then those will be merged with any new ansi codes found during parsing
   *
   * @param {*} ansiCodes
   * @param {*} str
   */
  static toObject({ansiCodes = this.defaultAnsiCode, str}) {
    let started;
    let output = [{
      codes: ansiCodes,
      text: '',
    }];
    for (let i = 0; i < str.length; i++) {
      let char = str[i];
      let index = (output.length - 1);
      switch (char) {
        case '\u001b':
          // Only on the first iteration should we skip this
          let codes = this.getCodes({str, index: i, ansiCodes});
          i = codes.index;
          if (codes) {
            if (started) {
              output.push({
                codes: codes.code,
                text: '',
              });
            } else {
              output[index].codes = codes.code;
              started = true;
            }
          }
          break;
        default:
          output[index].text += char;
          break;
      }
    }
    return output;
  }

  /**
   * It parses a string forward from a starting index and terminates when no more ansi codes
   * can be found in succession. If ansi codes are passed initially, they will be merged
   * with any new ansi codes found during the parsing.
   *
   * @param {*} str
   * @param {*} index
   * @param {*} ansiCodes
   */
  static getCodes({str, index, ansiCodes = this.defaultAnsiCode}) {
    let output, prevChar;
    let code = '', char = '';
    let codeBuffer = Object.assign({}, ansiCodes);
    for (let i = index; i < str.length; i++) {
      output = {index: i, code: codeBuffer};
      char = str[i];
      prevChar = str[i - 1] || null;
      switch (true) {
        case (char === '\u001b' && str[i + 1] && str[i + 1] === '['):
          i++; // Skip next character, it will be [ operator
          output.index = i;
          break;
        case (char === ';' || char === 'm'):
          let style = Object.assign({}, this.ansiCodes[code]);
          if (style) {
            if (style.reset) {
              codeBuffer = Object.assign({}, this.defaultAnsiCode);
            } else if (style.type) {
              codeBuffer.types.push(style.type);
            } else if (style.bg) {
              codeBuffer.bg = style.bg;
            } else if (style.fg) {
              codeBuffer.fg = style.fg;
            }
            code = '';
          }
          break;
        case (prevChar && /[0-9]/.test(char) && /[0-9;\[]/.test(prevChar)):
          code += char;
          break;
        default:
          // Returns back one index
          output.index = (i - 1);
          return output;

      }
    }
    return output;
  }
}
module.exports = AnsiParse;
