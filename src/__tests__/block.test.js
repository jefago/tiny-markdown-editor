// ATX headings -----------------------------------------------------------------------------------

test('Correctly parses ATX headings: # H1', () => {
  let heading = ' XXXA';
  for (let level = 1; level <= 6; level++) {
    heading = `#${heading}`;
    expect(initTinyMDE(heading).lineType(0)).toMatch(`TMH${level}`);
  }
});

test('Inline content processed in ATX heading: # *em*', () => {
  const editor = initTinyMDE('# *XXXA*');
  expect(editor.lineHTML(0)).toMatch(/<em[^>]*>XXXA/);
  expect(editor.lineType(0)).toMatch('TMH1');
})

test('ATX headings can include any number of trailing #s: # H1 #####   ', () => {
  const editor = initTinyMDE('# H1 #####   ');
  expect(editor.lineType(0)).toMatch('TMH1');
  expect(editor.lineHTML(0)).toMatch(/<span[^>]* class\s*=\s*["']?[^"'>]*TMMark[^>]*>\s*#####/);
});

test('ATX headings\'  trailing #s must be preceded by space: # H1#####   ', () => {
  const editor = initTinyMDE('# H1#####   ');
  expect(editor.lineType(0)).toMatch('TMH1');
  expect(editor.lineHTML(0)).not.toMatch(/<span[^>]* class\s*=\s*["']?[^"'>]*TMMark[^>]*>\s*#####/);
});

// Blank lines  -----------------------------------------------------------------------------------

test('Lines including only whitespace are considered blank', () => {
  const editor = initTinyMDE('\n   \n  \n');
  for (let line = 0; line < 3; line++) {
    expect(editor.lineType(line)).toMatch('TMBlankLine');
  }
});

test('Blank lines include a <br>', () => {
  const editor = initTinyMDE('\n\n\n');
  for (let line = 0; line < 3; line++) {
    expect(editor.lineHTML(line)).toMatch(/<br[^>]*>/);
  }
});

// Thematic breaks (HR) -----------------------------------------------------------------------------------

test('Simple thematic breaks are recognized with all characters: ---, ***, ___', () => {
  const breaks = ['---', '***', '___'];
  for (let br of breaks) {
    expect(initTinyMDE(br).lineType(0)).toMatch('TMHR');
  }
});

test('Thematic breaks may include spaces: * * *', () => {
  expect(initTinyMDE('   * * *   ').lineType(0)).toMatch('TMHR');
});

test('Thematic breaks may include more than 3 symbols: *****', () => {
  expect(initTinyMDE('*****').lineType(0)).toMatch('TMHR');
});

test('Thematic breaks can\'t be mixed and matched: ***---', () => {
  expect(initTinyMDE('***---').lineType(0)).not.toMatch('TMHR');
});

test('Thematic break take precendence over UL: * * *, - - -', () => {
  const breaks = ['- - -', '* * *'];
  for (let br of breaks) {
    expect(initTinyMDE(br).lineType(0)).toMatch('TMHR');
  }
});

// Setext headings -----------------------------------------------------------------------------------

test('Basic setext H1 works: H1\\n==', () => {
  const editor = initTinyMDE('H1\n==');
  expect(editor.lineType(0)).toMatch('TMSetextH1');
  expect(editor.lineType(1)).toMatch('TMSetextH1Marker');
});

test('Setext marker can have up to 3 leading and any number of trailing spaces: H1\\n   ==       ', () => {
  const editor = initTinyMDE('H1\n   ==       ');
  expect(editor.lineType(0)).toMatch('TMSetextH1');
  expect(editor.lineType(1)).toMatch('TMSetextH1Marker');
});

test('Setext H1 can span multiple lines: H1\\nStill H1\\n==', () => {
  const editor = initTinyMDE('H1\nH1\n==');
  expect(editor.lineType(0)).toMatch('TMSetextH1');
  expect(editor.lineType(1)).toMatch('TMSetextH1');
  expect(editor.lineType(2)).toMatch('TMSetextH1Marker');
});

test('Setext H1 marker after blank line is invalid: \\n\\n==', () => {
  const editor = initTinyMDE('\n==');
  expect(editor.lineType(0)).toMatch('TMBlankLine');
  expect(editor.lineType(1)).toMatch('TMPara');
});

test('Setext H1 marker after the following blocks is invalid: code fence, ATX heading, block quote, thematic break, list item, or HTML block', () => {
  // TODO Add HTML block
  const previousBlocks = ['```\nXXXA\n```\n', '# XXXA\n', '> XXXA\n', '---\n', '- XXXA\n'];
  for (let block of previousBlocks) {
    let editor = initTinyMDE(`${block}===`);
    expect(editor.lineType(editor.numLines() - 1)).not.toMatch('TMSetextH1Marker');
  }
});

test('Blank lines break setext heading', () => {
  const editor = initTinyMDE('Not H1\n\nH1\nH1\n==');
  expect(editor.lineType(0)).toMatch('TMPara');
  expect(editor.lineType(1)).toMatch('TMBlankLine');
  expect(editor.lineType(2)).toMatch('TMSetextH1');
  expect(editor.lineType(3)).toMatch('TMSetextH1');
  expect(editor.lineType(4)).toMatch('TMSetextH1Marker');
});

test('Setext H2 works: H2\\nStill H2\\n--', () => {
  const editor = initTinyMDE('H2\nH2\n--');
  expect(editor.lineType(0)).toMatch('TMSetextH2');
  expect(editor.lineType(1)).toMatch('TMSetextH2');
  expect(editor.lineType(2)).toMatch('TMSetextH2Marker');
});

test('Setext H2 takes precedence over thematic break: H2\\n---', () => {
  const editor = initTinyMDE('H2\n---');
  expect(editor.lineType(0)).toMatch('TMSetextH2');
  expect(editor.lineType(1)).toMatch('TMSetextH2Marker');
});

test('Empty list item takes precedence over setext H2: Not H2\\n- ', () => {
  const editor = initTinyMDE('Not H2\n- ');
  expect(editor.lineType(0)).toMatch('TMPara');
  expect(editor.lineType(1)).toMatch('TMUL');
});

// Indented code  -----------------------------------------------------------------------------------

test('Indented code block parsed correctly:     code', () => {
  expect(initTinyMDE('    code').lineType(0)).toMatch('TMIndentedCode');
});

test('Indented code can\'t interrupt paragraph: Paragraph\\n    not code', () => {
  // Paragraphs contained in: TMPara, TMUL, TMOL, TMBlockquote
  const testCases = [
    'Para\n    Not code',
    '- UL\n    Not code',
    '1. OL\n    Not code',
    '> Blockquote\n    Not code'
  ];
  for (let testCase of testCases) {
    const editor = initTinyMDE(testCase);
    expect(editor.lineType(1)).not.toMatch('TMIndentedCode');
  }
});

test('Indented code can follow after non-paragraph: # Heading\\n    code', () => {
  const testCases = [
    '# Heading\n    Code',
    'Setext heading\n====\n    Code',
    // '<pre>HTML block</pre>\n    Code', // TODO
    '---\n    Code',
    '~~~\nFenced code\n~~~\n    Code',
    '[ref]: https://abc.de\n    Code',
  ];
  for (let testCase of testCases) {
    const editor = initTinyMDE(testCase);
    expect(editor.lineType(editor.numLines() - 1)).toMatch('TMIndentedCode');
  }
});

// Fenced code blocks  -----------------------------------------------------------------------------------
test('Basic fenced code block works: ```\\nThis is\\ncode\\n```', () => {
  const testCases = [
    '~~~\nFenced\nCode\n~~~',
    '```\nFenced\nCode\n```'
  ];
  for (let testCase of testCases) {
    const editor = initTinyMDE(testCase);
    expect(editor.lineType(0)).toMatch(/^TMCodeFence[A-Za-z]*Open$/);
    for (let i = 1; i < editor.numLines() - 1; i++) {
      expect(editor.lineType(i)).toMatch(/^TMFencedCode[A-Za-z]*$/);
    }
    expect(editor.lineType(editor.numLines()-1)).toMatch(/^TMCodeFence[A-Za-z]*Close$/);
  }
});

test('Opening fence can contain info string: ```js\\nthis.is();\\ncode = {};\\n```', () => {
  const testCases = [
    '~~~javascript\nFenced\nCode\n~~~',
    '```javascript\nFenced\nCode\n```',
    '~~~  javascript   \nFenced\nCode\n~~~',
    '```  javascript   \nFenced\nCode\n```'
  ];
  for (let testCase of testCases) {
    const editor = initTinyMDE(testCase);
    expect(editor.lineType(0)).toMatch(/^TMCodeFence[A-Za-z]*Open$/);
    for (let i = 1; i < editor.numLines() - 1; i++) {
      expect(editor.lineType(i)).toMatch(/^TMFencedCode[A-Za-z]*$/);
    }
    expect(editor.lineType(editor.numLines()-1)).toMatch(/^TMCodeFence[A-Za-z]*Close$/);
    expect(editor.lineHTML(0)).toMatch(classTagRegExp('javascript', 'TMInfoString'));
  }
});

test('Opening and closing fence must match: ```\\ncode\\n~~~\\nstill\\n```', () => {
  const testCases = [
    '```\ncode\n~~~\ncode\n```',
    '~~~\ncode\n```\ncode\n~~~',
  ];
  for (let testCase of testCases) {
    const editor = initTinyMDE(testCase);
    expect(editor.lineType(0)).toMatch(/^TMCodeFence[A-Za-z]*Open$/);
    for (let i = 1; i < editor.numLines() - 1; i++) {
      expect(editor.lineType(i)).toMatch(/^TMFencedCode[A-Za-z]*$/);
    }
    expect(editor.lineType(editor.numLines()-1)).toMatch(/^TMCodeFence[A-Za-z]*Close$/);
  }
});

test('Info string for backtick fenced code can\'t contain backtick: ```js`\\nThis is not code\\n```', () => {
  const editor = initTinyMDE('```javascript`\nThis is not code\n```');
  expect(editor.lineType(0)).toMatch('TMPara');
  expect(editor.lineType(1)).toMatch('TMPara');
});


// TODO this test should currently fail, but doesn't
test('Closing code fence can\'t contain info string: ```js\\nthis.is();\\ncode = {};\\n```', () => {
  const testCases = [
    '~~~\nFenced\~~~still\nhere\n~~~',
    '```\nFenced\```still\nhere\n```',
  ];
  for (let testCase of testCases) {
    const editor = initTinyMDE(testCase);
    expect(editor.lineType(0)).toMatch(/^TMCodeFence[A-Za-z]*Open$/);
    for (let i = 1; i < editor.numLines() - 1; i++) {
      expect(editor.lineType(i)).toMatch(/^TMFencedCode[A-Za-z]*$/);
    }
    expect(editor.lineType(editor.numLines()-1)).toMatch(/^TMCodeFence[A-Za-z]*Close$/);
  }
});

test('Empty fenced code includes a <br>: ~~~\\n\\n~~~', () => {
  const testCases = [
    '~~~\n\n~~~',
    '```\n\n```',
  ];
  for (let testCase of testCases) {
    expect(initTinyMDE(testCase).lineHTML(1)).toMatch(/<br[^>]*>/);
  }
});


// Link reference definition  -----------------------------------------------------------------------------------

test('Link reference definition cannot interrupt a paragraph: Paragraph\\n[ref]: (Not a ref definition)', () => {
  // Paragraphs contained in: TMPara, TMUL, TMOL, TMBlockquote
  const testCases = [
    'Para\n[ref]: https://abc.de',
    '- UL\n[ref]: https://abc.de',
    '1. OL\n[ref]: https://abc.de',
    '> Blockquote\n[ref]: https://abc.de'
  ];
  for (let testCase of testCases) {
    const editor = initTinyMDE(testCase);
    expect(editor.lineType(1)).not.toMatch('TMLinkReferenceDefinition');
  }
});

test('Link reference definition can follow after non-paragraph: # Heading\\n[ref]: (valid ref definition)', () => {
  const testCases = [
    '# Heading\n[ref]: https://abc.de',
    'Setext heading\n====\n[ref]: https://abc.de',
    // '<pre>HTML block</pre>\n[ref]: https://abc.de', // TODO
    '---\n[ref]: https://abc.de',
    '~~~\nFenced code\n~~~\n[ref]: https://abc.de',
    '    Link reference definition\n[ref]: https://abc.de',
  ];
  for (let testCase of testCases) {
    const editor = initTinyMDE(testCase);
    expect(editor.lineType(editor.numLines() - 1)).toMatch('TMLinkReferenceDefinition');
  }
});


// TODO Make this test pass
// test('Indented lines following list item continue that list item: 1. Text\\n   continued', () => {
//   const cases = [
//     '1. List item\n   Continued', 
//     '- List item\n  Continued', 
//     '   1.    List item\n         Continued', 
//     '   -    List item\n        Continued',
//     // '- List item\n  Continued\n\n  Still continued\n      Indented code in list item\n  > Blockquote in list item'
//   ];
//   for (let testCase of cases) {
//     let editor = initTinyMDE(testCase);
//     expect(editor.lineType(0)).toMatch(/^TM[OU]L$/);
//     for (let l = 1; l <= editor.numLines(); l++) {
//       expect(editor.lineType(l)).toMatch(/^TM[OU]L/);
//     }
//   }
// });



// Indentations from 0 to 3
// H1
// ==
// ~~~
// Code
// block
// ~~~
// [ref]: https://www.jefago.com
// [ref link]: </this has spaces> "and a title"
// [  link label  ]: "Only title, spaces in the label"


// > Quote and
//     Indented code block

//   * * * 
  
// - UL
// - UL (and an empty one below)
// - 

// 1) OL
// 2) OL