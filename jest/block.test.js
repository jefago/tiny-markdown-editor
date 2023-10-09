// ATX headings -----------------------------------------------------------------------------------

test('Correctly parses ATX headings: # H1', async () => {
  let heading = ' XXXA';
  for (let level = 1; level <= 6; level++) {
    heading = `#${heading}`;
    const editor = await initTinyMDE(heading);
    expect(await editor.lineType(0)).toMatch(`TMH${level}`);
    editor.destroy();
  }
});

test('Inline content processed in ATX heading: # *em*', async () => {
  const editor = await initTinyMDE('# *XXXA*');
  expect(await editor.lineHTML(0)).toMatch(/<em[^>]*>XXXA/);
  expect(await editor.lineType(0)).toMatch('TMH1');
  editor.destroy();
})

test('ATX headings can include any number of trailing #s: # H1 #####', async () => {
  const editor = await initTinyMDE('# H1 #####   ');
  expect(await editor.lineType(0)).toMatch('TMH1');
  expect(await editor.lineHTML(0)).toMatch(/<span[^>]* class\s*=\s*["']?[^"'>]*TMMark[^>]*>\s*#####/);
  editor.destroy();
});

test('ATX headings\'  trailing #s must be preceded by space: # H1#####', async () => {
  const editor = await initTinyMDE('# H1#####   ');
  expect(await editor.lineType(0)).toMatch('TMH1');
  expect(await editor.lineHTML(0)).not.toMatch(/<span[^>]* class\s*=\s*["']?[^"'>]*TMMark[^>]*>\s*#####/);
  editor.destroy();
});

// // Blank lines  -----------------------------------------------------------------------------------

test('Lines including only whitespace are considered blank', async () => {
  const editor = await initTinyMDE('\n   \n  \n');
  for (let line = 0; line < 3; line++) {
    expect(await editor.lineType(line)).toMatch('TMBlankLine');
  }
  editor.destroy();
});

test('Blank lines include a <br>', async () => {
  const editor = await initTinyMDE('\n\n\n');
  for (let line = 0; line < 3; line++) {
    expect(await editor.lineHTML(line)).toMatch(/<br[^>]*>/);
  }
  editor.destroy();
});

// // Thematic breaks (HR) -----------------------------------------------------------------------------------

test('Simple thematic breaks are recognized with all characters: ---, ***, ___', async () => {
  const breaks = ['---', '***', '___'];
  for (let br of breaks) {
    const editor = await initTinyMDE(br);
    expect(await editor.lineType(0)).toMatch('TMHR');
    editor.destroy();
  }
});

test('Thematic breaks may include spaces: * * *', async () => {
  const editor = await initTinyMDE('   * * *   ');
  expect(await editor.lineType(0)).toMatch('TMHR');
  editor.destroy();
});

test('Thematic breaks may include more than 3 symbols: *****', async () => {
  const editor = await initTinyMDE('*****');
  expect(await editor.lineType(0)).toMatch('TMHR');
  editor.destroy();
});

test('Thematic breaks can\'t be mixed and matched: ***---', async () => {
  const editor = await initTinyMDE('***---');
  expect(await editor.lineType(0)).not.toMatch('TMHR');
  editor.destroy();
});

test('Thematic break take precendence over UL: * * *, - - -', async () => {
  const breaks = ['- - -', '* * *'];
  for (let br of breaks) {
    const editor = await initTinyMDE(br);
    expect(await editor.lineType(0)).toMatch('TMHR');
    editor.destroy();
  }
});

// // Setext headings -----------------------------------------------------------------------------------

test('Basic setext H1 works: H1\\n==', async () => {
  const editor = await initTinyMDE('H1\n==');
  expect(await editor.lineType(0)).toMatch('TMSetextH1');
  expect(await editor.lineType(1)).toMatch('TMSetextH1Marker');
  editor.destroy();
});

test('Setext marker can have up to 3 leading and any number of trailing spaces: H1\\n   ==', async () => {
  const editor = await initTinyMDE('H1\n   ==       ');
  expect(await editor.lineType(0)).toMatch('TMSetextH1');
  expect(await editor.lineType(1)).toMatch('TMSetextH1Marker');
  editor.destroy();
});

test('Setext H1 can span multiple lines: H1\\nStill H1\\n==', async () => {
  const editor = await initTinyMDE('H1\nH1\n==');
  expect(await editor.lineType(0)).toMatch('TMSetextH1');
  expect(await editor.lineType(1)).toMatch('TMSetextH1');
  expect(await editor.lineType(2)).toMatch('TMSetextH1Marker');
  editor.destroy();
});

test('Setext H1 marker after blank line is invalid: \\n\\n==', async () => {
  const editor = await initTinyMDE('\n==');
  expect(await editor.lineType(0)).toMatch('TMBlankLine');
  expect(await editor.lineType(1)).toMatch('TMPara');
  editor.destroy();
});

test('Setext H1 marker after the following blocks is invalid: code fence, ATX heading, block quote, thematic break, list item, or HTML block', async () => {
  const previousBlocks = ['```\nXXXA\n```\n', '# XXXA\n', '> XXXA\n', '---\n', '- XXXA\n', '<!-- Comment -->'];
  for (let block of previousBlocks) {
    const editor = await initTinyMDE(`${block}===`);
    expect(await editor.lineType(await editor.numLines() - 1)).not.toMatch('TMSetextH1Marker');
    editor.destroy();
  }
});

test('Blank lines break setext heading', async () => {
  const editor = await initTinyMDE('Not H1\n\nH1\nH1\n==');
  expect(await editor.lineType(0)).toMatch('TMPara');
  expect(await editor.lineType(1)).toMatch('TMBlankLine');
  expect(await editor.lineType(2)).toMatch('TMSetextH1');
  expect(await editor.lineType(3)).toMatch('TMSetextH1');
  expect(await editor.lineType(4)).toMatch('TMSetextH1Marker');
  editor.destroy();
});

test('Setext H2 works: H2\\nStill H2\\n--', async () => {
  const editor = await initTinyMDE('H2\nH2\n--');
  expect(await editor.lineType(0)).toMatch('TMSetextH2');
  expect(await editor.lineType(1)).toMatch('TMSetextH2');
  expect(await editor.lineType(2)).toMatch('TMSetextH2Marker');
  editor.destroy();
});

test('Setext H2 takes precedence over thematic break: H2\\n---', async () => {
  const editor = await initTinyMDE('H2\n---');
  expect(await editor.lineType(0)).toMatch('TMSetextH2');
  expect(await editor.lineType(1)).toMatch('TMSetextH2Marker');
  editor.destroy();
});

test('Empty list item takes precedence over setext H2: Not H2\\n-', async () => {
  const editor = await initTinyMDE('Not H2\n- ');
  expect(await editor.lineType(0)).toMatch('TMPara');
  expect(await editor.lineType(1)).toMatch('TMUL');
  editor.destroy();
});

// // Indented code  -----------------------------------------------------------------------------------

test('Indented code block parsed correctly:     code', async () => {
  const editor = await initTinyMDE('    code');
  expect(await editor.lineType(0)).toMatch('TMIndentedCode');
  editor.destroy();
});

test('Indented code can\'t interrupt paragraph: Paragraph\\n    not code', async () => {
  // Paragraphs contained in: TMPara, TMUL, TMOL, TMBlockquote
  const testCases = [
    'Para\n    Not code',
    '- UL\n    Not code',
    '1. OL\n    Not code',
    '> Blockquote\n    Not code'
  ];
  for (let testCase of testCases) {
    const editor = await initTinyMDE(testCase);
    expect(await editor.lineType(1)).not.toMatch('TMIndentedCode');
    editor.destroy();
  }
});

test('Indented code can follow after non-paragraph: # Heading\\n    code', async () => {
  const testCases = [
    '# Heading\n    Code',
    'Setext heading\n====\n    Code',
    '<pre>HTML block</pre>\n    Code', 
    '---\n    Code',
    '~~~\nFenced code\n~~~\n    Code',
    '[ref]: https://abc.de\n    Code',
  ];
  for (let testCase of testCases) {
    const editor = await initTinyMDE(testCase);
    expect(await editor.lineType((await editor.numLines()) - 1)).toMatch('TMIndentedCode');
    editor.destroy();
  }
});

// Fenced code blocks  -----------------------------------------------------------------------------------
test('Basic fenced code block works: ```\\nThis is\\ncode\\n```', async () => {
  const testCases = [
    '~~~\nFenced\nCode\n~~~',
    '```\nFenced\nCode\n```'
  ];
  for (let testCase of testCases) {
    const editor = await initTinyMDE(testCase);
    expect(await editor.lineType(0)).toMatch(/^TMCodeFence[A-Za-z]*Open$/);
    for (let i = 1; i < editor.numLines() - 1; i++) {
      expect(await editor.lineType(i)).toMatch(/^TMFencedCode[A-Za-z]*$/);
    }
    expect(await editor.lineType(await editor.numLines()-1)).toMatch(/^TMCodeFence[A-Za-z]*Close$/);
    editor.destroy();
  }
});

test('Opening fence can contain info string: ```js\\nthis.is();\\ncode = {};\\n```', async () => {
  const testCases = [
    '~~~javascript\nFenced\nCode\n~~~',
    '```javascript\nFenced\nCode\n```',
    '~~~  javascript   \nFenced\nCode\n~~~',
    '```  javascript   \nFenced\nCode\n```'
  ];
  for (let testCase of testCases) {
    const editor = await initTinyMDE(testCase);
    expect(await editor.lineType(0)).toMatch(/^TMCodeFence[A-Za-z]*Open$/);
    for (let i = 1; i < editor.numLines() - 1; i++) {
      expect(await editor.lineType(i)).toMatch(/^TMFencedCode[A-Za-z]*$/);
    }
    expect(await editor.lineType(await editor.numLines()-1)).toMatch(/^TMCodeFence[A-Za-z]*Close$/);
    expect(await editor.lineHTML(0)).toMatch(classTagRegExp('javascript', 'TMInfoString'));
    editor.destroy();
  }
});

test('Opening and closing fence must match: ```\\ncode\\n~~~\\nstill\\n```', async () => {
  const testCases = [
    '```\ncode\n~~~\ncode\n```',
    '~~~\ncode\n```\ncode\n~~~',
  ];
  for (let testCase of testCases) {
    const editor = await initTinyMDE(testCase);
    expect(await editor.lineType(0)).toMatch(/^TMCodeFence[A-Za-z]*Open$/);
    for (let i = 1; i < editor.numLines() - 1; i++) {
      expect(await editor.lineType(i)).toMatch(/^TMFencedCode[A-Za-z]*$/);
    }
    expect(await editor.lineType(await editor.numLines()-1)).toMatch(/^TMCodeFence[A-Za-z]*Close$/);
    editor.destroy();
  }
});

test('Info string for backtick fenced code can\'t contain backtick: ```js`\\nThis is not code\\n```', async () => {
  const editor = await initTinyMDE('```javascript`\nThis is not code\n```');
  expect(await editor.lineType(0)).toMatch('TMPara');
  expect(await editor.lineType(1)).toMatch('TMPara');
  editor.destroy();
});


test('Closing code fence can\'t contain info string: ```\\ncode\\n```not closing\\ncode\\n```', async () => {
  const testCases = [
    '~~~\nFenced\n~~~still\nhere\n~~~',
    '```\nFenced\n```still\nhere\n```',
  ];
  for (let testCase of testCases) {
    const editor = await initTinyMDE(testCase);
    expect(await editor.lineType(0)).toMatch(/^TMCodeFence[A-Za-z]*Open$/);
    for (let i = 1; i < editor.numLines() - 1; i++) {
      expect(await editor.lineType(i)).toMatch(/^TMFencedCode[A-Za-z]*$/);
    }
    expect(await editor.lineType(await editor.numLines()-1)).toMatch(/^TMCodeFence[A-Za-z]*Close$/);
    editor.destroy();
  }
});

test('Closing code fence has to be same length or longer than opening: `````\\ncode\\n```\\nstill code\\n`````', async () => {
  const testCases = [
    '~~~~~\nFenced\n~~~\nhere\n~~~~~',
    '`````\nFenced\n```\nhere\n`````',
  ];
  for (let testCase of testCases) {
    const editor = await initTinyMDE(testCase);
    expect(await editor.lineType(0)).toMatch(/^TMCodeFence[A-Za-z]*Open$/);
    for (let i = 1; i < editor.numLines() - 1; i++) {
      expect(await editor.lineType(i)).toMatch(/^TMFencedCode[A-Za-z]*$/);
    }
    expect(await editor.lineType(await editor.numLines()-1)).toMatch(/^TMCodeFence[A-Za-z]*Close$/);
    editor.destroy();
  }
});

test('Empty fenced code includes a <br>: ~~~\\n\\n~~~', async () => {
  const testCases = [
    '~~~\n\n~~~',
    '```\n\n```',
  ];
  for (let testCase of testCases) {
    const editor = await initTinyMDE(testCase);
    expect(await editor.lineHTML(1)).toMatch(/<br[^>]*>/);
    editor.destroy();
  }
});


// // Link reference definition  -----------------------------------------------------------------------------------

test('Link reference definition cannot interrupt a paragraph: Paragraph\\n[ref]: (Not a ref definition)', async () => {
  // Paragraphs contained in: TMPara, TMUL, TMOL, TMBlockquote
  const testCases = [
    'Para\n[ref]: https://abc.de',
    '- UL\n[ref]: https://abc.de',
    '1. OL\n[ref]: https://abc.de',
    '> Blockquote\n[ref]: https://abc.de'
  ];
  for (let testCase of testCases) {
    const editor = await initTinyMDE(testCase);
    expect(await editor.lineType(1)).not.toMatch('TMLinkReferenceDefinition');
    editor.destroy();
  }
});

test('Link reference definition can follow after non-paragraph: # Heading\\n[ref]: (valid ref definition)', async () => {
  const testCases = [
    '# Heading\n[ref]: https://abc.de',
    'Setext heading\n====\n[ref]: https://abc.de',
    '<pre>HTML block</pre>\n[ref]: https://abc.de', 
    '---\n[ref]: https://abc.de',
    '~~~\nFenced code\n~~~\n[ref]: https://abc.de',
    '    Link reference definition\n[ref]: https://abc.de',
  ];
  for (let testCase of testCases) {
    const editor = await initTinyMDE(testCase);
    expect(await editor.lineType(await editor.numLines() - 1)).toMatch('TMLinkReferenceDefinition');
    editor.destroy();
  }
});

test('Empty link reference definitions work', async () => {
  const testCases = [
    '[ref]:',
    '[ref]:""',
    '[ref]:\'\'',
    '[ref]:()',
    '[ref]:<>',
    '[ref]:<>""',
    '[ref]:<>\'\'',
    '[ref]:<>()',
  ];
  for (let testCase of testCases) {
    const editor = await initTinyMDE(testCase);
    expect(await editor.lineType(0)).toMatch('TMLinkReferenceDefinition');
    editor.destroy();
  }
});

test('Escaping works in link destination and title of reference definition', async () => {
  const testCases = [
    ['[ref]: <\\>>', '<\\>>', ''],
    ['[ref]: XXXA "\\""', 'XXXA', '"\\""'],
    ['[ref]: XXXA \'\\\'\'', 'XXXA', `'\\''`],
    ['[ref]: XXXA (\\))', 'XXXA', '(\\))'],
  ];
  for (let testCase of testCases) {
    const editor = await initTinyMDE(testCase[0]);
    expect(await editor.lineType(0)).toMatch('TMLinkReferenceDefinition');
    expect(await editor.lineHTML(0)).toMatch(classTagRegExp(testCase[1], 'TMLinkDestination'));
    expect(await editor.lineHTML(0)).toMatch(classTagRegExp(testCase[2], 'TMLinkTitle'));
    editor.destroy();
  }
});

test('Invalid link reference definitions not recognized as such', async () => {
  const testCases = [
    '[ref]: A B', // Link destinations with whitespace need to be enclosed in <>
    '[ref]: <A B \\>', // Closing angle bracket is escaped
    '[ref] : XXXA', // No whitespace allowed after link label
    '[ref]: XXXA (XXXA\\)', // Closing parenthesis is escaped
    '[ref]: XXXA "XXXA\\"', // Closing quote is escaped
    '[ref]: XXXA \'XXXA\\\'', // Closing quote is escaped
    '[ref]: XXXA>', // Destination may not include < or >
    '[ref]: XXXA "XXXB\'', // Delimiters of title have to be matched
  ];
  for (let testCase of testCases) {
    const editor = await initTinyMDE(testCase);
    expect(await editor.lineType(0)).not.toMatch('TMLinkReferenceDefinition');
    editor.destroy();
  }
})

// HTML Block --------------------------------------------------------------------

test('HTML block: script, pre, style recognized (case 1): <script>', async () => {
  const testCases = [
    '   <script>\nXXXA\n\n\nXXXB </script>\nXXXC', 
    '<SCRIPT type="text/javascript">XXXA</SCRiPT> XXXD\nXXXC', 
    '   <pre>\nXXXA\n\n\nXXXB </pre>\nXXXC', 
    '<PRE class="abc">XXXA</pRe> XXXB\nXXXC', 
    '   <style>\nXXXA\n\n\nXXXB </style>\nXXXC', 
    '<STYLE type="text/css">XXXA</STyLE>XXXB\nXXXC', 
  ];
  for (let testCase of testCases) {
    const editor = await initTinyMDE(testCase);
    for (let l = 0; l < editor.numLines() - 1; l++) {
      expect(await editor.lineType(l)).toMatch('TMHTMLBlock');
    }
    expect(await editor.lineType(await editor.numLines() - 1)).not.toMatch('TMHTMLBlock');
    editor.destroy();
  }
});

test('HTML block: comment (case 2): <!-- -->', async () => {
  const testCases = [
    '<!-- Comment -->\nXXXC', 
    '   <!-- \n Comment \n\n\n-->\nXXXC', 
    '   <!-- \n Comment \n--\n->\nXXXX-->YYYY\nXXXC', 

  ];
  for (let testCase of testCases) {
    const editor = await initTinyMDE(testCase);
    for (let l = 0; l < editor.numLines() - 1; l++) {
      expect(await editor.lineType(l)).toMatch('TMHTMLBlock');
    }
    expect(await editor.lineType(await editor.numLines() - 1)).not.toMatch('TMHTMLBlock');
    editor.destroy();
  }
});

test('HTML block: processing instruction (case 3): <!-- -->', async () => {
  const testCases = [
    '<? Processing instruction ?>\nXXXC', 
    '   <? \n Processing instruction \n\n\n?>\nXXXC', 
    '   <? \n Processing instruction \n?\n>\nXXXX?>YYYY\nXXXC', 
  ];
  for (let testCase of testCases) {
    const editor = await initTinyMDE(testCase);
    for (let l = 0; l < editor.numLines() - 1; l++) {
      expect(await editor.lineType(l)).toMatch('TMHTMLBlock');
    }
    expect(await editor.lineType(await editor.numLines() - 1)).not.toMatch('TMHTMLBlock');
    editor.destroy();
  }
});

test('HTML block: document type (case 4): <!DOCTYPE html>', async () => {
  const testCases = [
    '<!DOCTYPE html>\nXXXC', 
    '   <!X \n Document type \n\n\n>\nXXXC', 
    '   <!X \n Document type \n\n\nXXXX>YYYY\nXXXC', 

  ];
  for (let testCase of testCases) {
    const editor = await initTinyMDE(testCase);
    for (let l = 0; l < editor.numLines() - 1; l++) {
      expect(await editor.lineType(l)).toMatch('TMHTMLBlock');
    }
    expect(await editor.lineType(await editor.numLines() - 1)).not.toMatch('TMHTMLBlock');
    editor.destroy();
  }
});

test('HTML block: CDATA (case 5): <![CDATA[ ]]>', async () => {
  const testCases = [
    '<![CDATA[ XXXA ]]>\nXXXC', 
    '   <![CDATA[\nXXXA\n\n\nXXXB]]>XXXC\nXXXD', 
  ];
  for (let testCase of testCases) {
    const editor = await initTinyMDE(testCase);
    for (let l = 0; l < editor.numLines() - 1; l++) {
      expect(await editor.lineType(l)).toMatch('TMHTMLBlock');
    }
    expect(await editor.lineType(await editor.numLines() - 1)).not.toMatch('TMHTMLBlock');
    editor.destroy();
  }
});

test('HTML block: Specific HTML tag (case 6): <p> </p>', async () => {
  const testCases = [
    '<p class="abc">\nXXXA\nXXXB\n', 
    '   </HTML>XXXZ\nXXXA\nXXXB\n', 
    '<br/>\n',
    '<mAiN\nXXXA\nXXXB\n'
  ];
  for (let testCase of testCases) {
    const editor = await initTinyMDE(testCase);
    for (let l = 0; l < editor.numLines() - 1; l++) {
      expect(await editor.lineType(l)).toMatch('TMHTMLBlock');
    }
    expect(await editor.lineType(await editor.numLines() - 1)).not.toMatch('TMHTMLBlock');
    editor.destroy();
  }
});

test('HTML block: Generic tag (case 7): <ab-33>', async () => {
  const testCases = [
    '<ab-33 class="abc">\nXXXA\nXXXB\n', 
    '   </W00T >\nXXXZ\nXXXA\nXXXB\n', 
  ];
  for (let testCase of testCases) {
    const editor = await initTinyMDE(testCase);
    for (let l = 0; l < editor.numLines() - 1; l++) {
      expect(await editor.lineType(l)).toMatch('TMHTMLBlock');
    }
    expect(await editor.lineType(await editor.numLines() - 1)).not.toMatch('TMHTMLBlock');
    editor.destroy();
  }
});

test('HTML block: Cases 1-6 can interrupt a paragraph', async () => {
  const testCases = [
    'XXXA\n<script>',
    'XXXA\n<!--',
    'XXXA\n<?',
    'XXXA\n<!DOCTYPE',
    'XXXA\n<![CDATA[',
    'XXXA\n<p>'
  ];
  for (let testCase of testCases) {
    const editor = await initTinyMDE(testCase);
    expect(await editor.lineType(1)).toMatch('TMHTMLBlock');
    editor.destroy();
  }
});

test('HTML block: Case 7 can\'t interrupt a paragraph', async () => {
  const testCases = [
    'XXXA\n<bla>',
    '> XXXA\n<bla>',
    '- XXXA\n<bla>',
    '1. XXXA\n<bla>',
  ];
  for (let testCase of testCases) {
    const editor = await initTinyMDE(testCase);
    expect(await editor.lineType(1)).not.toMatch('TMHTMLBlock');
    editor.destroy();
  }
});

test('HTML block: Invalid cases not recognized', async () => {
  const testCases = [
    '<bla', // Incomplete open tag
    '<bla><p>', // Open tag not alone on its line
    '    <p>', // Too much indentation
    '</bla a="b">', // Invalid closing tag
  ];
  for (let testCase of testCases) {
    const editor = await initTinyMDE(testCase);
    expect(await editor.lineType(0)).not.toMatch('TMHTMLBlock');
    editor.destroy();
  }
});

// // List items -----------------------------------------------
test('Simple unordered list items recognized: - item', async () => {
  const testCases = [
    '- XXXA',
    '   -    XXXA',
    '* XXXA',
    '   *    XXXA',
    '+ XXXA',
    '   +    XXXA',
  ];
  for (let testCase of testCases) {
    const editor = await initTinyMDE(testCase);
    expect(await editor.lineType(0)).toMatch('TMUL');
    editor.destroy();
  }
});



test('Empty unordered list items recognized: -', async () => {
  const testCases = [
    '- ',
    '   -    ',
    '* ',
    '   *    ',
    '+ ',
    '   +    ',
  ];
  for (let testCase of testCases) {
    const editor = await initTinyMDE(testCase);
    expect(await editor.lineType(0)).toMatch('TMUL');
    editor.destroy();
  }
});

test('Simple ordered list items recognized: 1. item', async () => {
  const testCases = [
    '1. XXXA',
    '   123456789.    XXXA',
    '0. XXXA',
    '1) XXXA',
    '   123456789)    XXXA',
    '0) XXXA',
  ];
  for (let testCase of testCases) {
    const editor = await initTinyMDE(testCase);
    expect(await editor.lineType(0)).toMatch('TMOL');
    editor.destroy();
  }
});

test('Empty ordered list items recognized: 1.', async () => {
  const testCases = [
    '1. ',
    '   123456789.    ',
    '0. ',
    '1) ',
    '   123456789)    ',
    '0) ',
  ];
  for (let testCase of testCases) {
    const editor = await initTinyMDE(testCase);
    expect(await editor.lineType(0)).toMatch('TMOL');
    editor.destroy();
  }
});

test('Line item content parsed as Markdown: - *em*', async () => {
  const testCases = [
    '- *XXXA*',
    '* *XXXA*',
    '+ *XXXA*',
    '1) *XXXA*',
    '1. *XXXA*',
  ];
  for (let testCase of testCases) {
    const editor = await initTinyMDE(testCase);
    expect(await editor.lineType(0)).toMatch(/TM[OU]L/);
    expect(await editor.lineHTML(0)).toMatch(classTagRegExp('XXXA', 'TMEm', 'em'));
    editor.destroy();
  }
});

// TODO Make this test pass
// test('Sublists recognized: - ', async () => {
//   const testCases = [
//     '- A\n- B\n  - C\n    - D\n    - E',
//     '1. A\n2. B\n   1) C\n      1. d'
//   ];
//   for (let testCase of testCases) {
//     const editor = await initTinyMDE(testCase);
//     for (let l = 0; l < editor.numLines(); l++) {
//       expect(await editor.lineType(l)).toMatch(/TM[OU]L/);
//     }
//   }
// });

// TODO Make this test pass
// test('Indented lines following list item continue that list item: 1. Text\\n   continued', async () => {
//   const cases = [
//     '1. List item\n   Continued', 
//     '- List item\n  Continued', 
//     '   1.    List item\n         Continued', 
//     '   -    List item\n        Continued',
//     // '- List item\n  Continued\n\n  Still continued\n      Indented code in list item\n  > Blockquote in list item'
//   ];
//   for (let testCase of cases) {
//     let editor = await initTinyMDE(testCase);
//     expect(await editor.lineType(0)).toMatch(/^TM[OU]L$/);
//     for (let l = 1; l <= editor.numLines(); l++) {
//       expect(await editor.lineType(l)).toMatch(/^TM[OU]L/);
//     }
//   }
// });

// Blockquote -----------------------------------------------------------------------

test("Basic blockquote works: > Quote", async () => {
  const editor = await initTinyMDE('> Quote');
  expect(await editor.lineType(0)).toMatch('TMBlockquote');
  editor.destroy();
})

test('Space after > can be omitted: >Quote', async () => {
  const editor = await initTinyMDE('>Quote');
  expect(await editor.lineType(0)).toMatch('TMBlockquote');
  editor.destroy();
})

test('Blockquote content parsed as markdown: > *em*', async () => {
  const editor = await initTinyMDE('> *XXXA*');
  expect(await editor.lineType(0)).toMatch('TMBlockquote');
  expect(await editor.lineHTML(0)).toMatch(classTagRegExp('XXXA', 'TMEm', 'em'));
  editor.destroy();
});

// Miscellaneous

test("Content with dollar signs is parsed correctly", async() => {
  const editor = await initTinyMDE('$1');
  expect(await editor.lineHTML(0)).toMatch(/\$1/);
  editor.destroy();
});

