const AnsiParse = require('../../src/lib/parse');

const output = `[0;37;40m> [31mWide Hallway[0;37;40m

   This wide hallway is illuminated simply by torch sconces filled with 
dark red coals. No glowing lichen has been used to brighten the passage.
It travels east and west, connecting guild rooms of varying purpose.
[1m[37m     Obvious exits are south, east, west, and north.
[0;37;40m
[0;37;40m> `;
const output2 = '[1m[37m';
const output3 = `[1m[32m****IMPORTANT****  READ THE ANNOUNCEMENT BOARD EVERY LOGIN and the REGISTERED,
****IMPORTANT****  USERS BOARD (if you are a citizen) AS OFTEN AS POSSIBLE.
[0;37;40m[1m[31m@[30m=={[1m[33m===- [36mJehndalen awakens seeking his next mark...[0;37;40m
[0;37;40m[36mLavishly Appointed Lounge[0;37;40m`;

describe('Parse ANSI', () => {
  // it('should return correct ansiCodes', () => {
  //   const ansiCodes = AnsiParse.getCodes({str: output2, index: 0});
  //   expect(ansiCodes).to.have.all.keys('code', 'index');
  //   expect(ansiCodes.code).to.have.all.keys('types', 'bg', 'fg');
  //   expect(ansiCodes.index).to.equal(8);
  //   expect(ansiCodes.code.types).to.include('bold');
  // });
  // it('should transform output into an array of 7 lines', () => {
  //   const lines = AnsiParse.toLineObjects({str: output});
  //   expect(lines).to.have.length.of(7);
  // });
  // it('should transform output into an array of 4 lines', () => {
  //   const lines = AnsiParse.toLineObjects({str: output3});
  //   expect(lines).to.have.length.of(4);
  // });

  it('it should ansi-parser', () => {
    let parsed = AnsiParse.parse(output);

    console.log(parsed);
  });
});
