const AnsiParser = require('ansi-parser');
const FOREGROUND_TYPE = 'FOREGROUND_TYPE';
const BACKGROUND_TYPE = 'BACKGROUND_TYPE';
const ATTRIBUTE_TYPE = 'ATTRIBUTE_TYPE';
const RESET_TYPE = 'RESET';

class AnsiParse {

  static valueIsForegroundCode(code) {
    return AnsiParse.ansiCodes[code].type === FOREGROUND_TYPE;
  }

  static valueIsBackgroundCode(code) {
    return AnsiParse.ansiCodes[code].type === BACKGROUND_TYPE;
  }

  static valueIsAttributeCode(code) {
    return AnsiParse.ansiCodes[code].type === ATTRIBUTE_TYPE;
  }

  /**
   * List of supported ansi codes
   */
  static get ansiCodes() {
    return Object.assign({}, {
      '0': {type: RESET_TYPE},
      '1': {type: ATTRIBUTE_TYPE, value: 'at-bold'},
      '3': {type: ATTRIBUTE_TYPE, value: 'at-italic'},
      '4': {type: ATTRIBUTE_TYPE, value: 'at-underline'},
      '5': {type: ATTRIBUTE_TYPE, value: 'at-blink'},
      '7': {type: ATTRIBUTE_TYPE, value: 'at-invert'},
      '9': {type: ATTRIBUTE_TYPE, value: 'at-strikethrough'},
      '30': {type: FOREGROUND_TYPE, value: 'fg-gray'},
      '31': {type: FOREGROUND_TYPE, value: 'fg-red'},
      '32': {type: FOREGROUND_TYPE, value: 'fg-green'},
      '33': {type: FOREGROUND_TYPE, value: 'fg-yellow'},
      '34': {type: FOREGROUND_TYPE, value: 'fg-blue'},
      '35': {type: FOREGROUND_TYPE, value: 'fg-magenta'},
      '36': {type: FOREGROUND_TYPE, value: 'fg-cyan'},
      '37': {type: FOREGROUND_TYPE, value: 'fg-white'},
      '40': {type: BACKGROUND_TYPE, value: 'bg-black'},
      '41': {type: BACKGROUND_TYPE, value: 'bg-red'},
      '42': {type: BACKGROUND_TYPE, value: 'bg-green'},
      '43': {type: BACKGROUND_TYPE, value: 'bg-yellow'},
      '44': {type: BACKGROUND_TYPE, value: 'bg-blue'},
      '45': {type: BACKGROUND_TYPE, value: 'bg-magenta'},
      '46': {type: BACKGROUND_TYPE, value: 'bg-cyan'},
      '47': {type: BACKGROUND_TYPE, value: 'bg-white'},
    });
  };

  /**
   * Handles ANSI parsing with AnsiParser module, but optimises the payload for minimal data
   * @param data
   * @returns {Array}
   */
  static parse(data) {
    let buffer = '';
    let parsed = [];

    const getCodesForChar = (o) => {
      const codesArr = o.style.replace(/\u001b|\[/g, '').replace(/m/g, ';').split(';').slice(0, -1);
      const codes = codesArr.slice(codesArr.lastIndexOf('0') + 1).filter((c, i, s) => i === s.indexOf(c));
      return {char: o.content, codes};
    };

    AnsiParser.parse(data)
      .map((o, index, self) => {
        const obj = getCodesForChar(o);
        buffer += obj.char;

        const codeStr = obj.codes.join(',');
        const nextStr = self[index + 1] ? getCodesForChar(self[index + 1]).codes.join(',') : null;
        if (nextStr === codeStr && !(index === self.length - 1)) {
          return false;
        }
        // Clean the left over codes
        let gotForeground = false;
        let gotBackground = false;
        obj.codes.reverse();
        const codes = obj.codes.filter((code) => {
          switch (true) {
            case (!gotBackground && AnsiParse.valueIsBackgroundCode(code)):
              gotBackground = true;
              return true;
            case (!gotForeground && AnsiParse.valueIsForegroundCode(code)):
              gotForeground = true;
              return true;
            case (AnsiParse.valueIsAttributeCode(code)):
              return true;
            default:
              return false;
          }
        });

        // Add output to parser
        let output = { text: buffer };
        if (codes.join(',') !== '40,37' && codes.length !== 0) {
          output.classes = codes.map(c => AnsiParse.ansiCodes[c].value);
        }
        parsed = [ ...parsed, output ];
        buffer = '';
      });

    return parsed;
  }
}
module.exports = AnsiParse;
