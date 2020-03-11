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

test('Lines including only whitespace are considered blank', () => {
  const editor = initTinyMDE('\n   \n  \n');
  for (let line = 0; line < 3; line++) {
    expect(editor.lineType(line)).toMatch('TMBlankLine');
  }
});

test('Blank lines include a <br>', () => {
  const editor = initTinyMDE('\n   \n  \n');
  for (let line = 0; line < 3; line++) {
    expect(editor.lineHTML(line)).toMatch(/<br[^>]*>/);
  }
});

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

test('Basic setext H1 works: H1\\n==', () => {
  const editor = initTinyMDE('H1\n==');
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