import { htmlescape } from "../grammar";

const classTagRegExp = (content, className, tagName = 'span') => {
  let match = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/([\\\[\]\(\)\{\}\.\*\+\?\|\$\^])/g, '\\$1');
  return new RegExp(`<${tagName}[^>]*class\\s*=\\s*["']?[^"'>]*${className}[^>]*>${match}<\\/${tagName}>`);
};

const htmlRegExp = (html) => classTagRegExp(html, 'TMHTML');

const inlineLinkRegExp = (text, destination = '', title = '') => {
  // TMLink, TMLinkDestination, TMLinkTitle
  return new RegExp([
    classTagRegExp(text, 'TMLink').source,
    classTagRegExp(destination, 'TMLinkDestination').source,
    classTagRegExp(title, 'TMLinkTitle').source
  ].join('.*'));
}

test('correctly parses * emphasis', () => {
  expect(initTinyMDE('*em*').lineHTML(0)).toMatch(/<em[^>]*>em<\/em>/);
});

test('correctly parses ** strong emphasis', () => {
  expect(initTinyMDE('**strong**').lineHTML(0)).toMatch(/<strong[^>]*>strong<\/strong>/);
});

test('triple emphasis *** becomes <em><strong>', () => {
  expect(initTinyMDE('***text***').lineHTML(0)).toMatch(/<em[^>]*>.*<strong[^>]*>text<\/strong>.*<\/em>/);
});

test('correctly parses _ emphasis', () => {
  expect(initTinyMDE('_XXXA_').lineHTML(0)).toMatch(/<em[^>]*>XXXA<\/em>/);
});

test('correctly parses __ strong emphasis', () => {
  expect(initTinyMDE('__XXXA__').lineHTML(0)).toMatch(/<strong[^>]*>XXXA<\/strong>/);
});

test('triple emphasis ___ becomes <em><strong>', () => {
  expect(initTinyMDE('___XXXA___').lineHTML(0)).toMatch(/<em[^>]*>.*<strong[^>]*>XXXA<\/strong>.*<\/em>/);
});

test('correctly parses ***a* b**', () => {
  expect(initTinyMDE('***XXXA* XXXB**').lineHTML(0)).toMatch(/<strong[^>]*>.*<em[^>]*>XXXA<\/em>.*XXXB<\/strong>/);
});

test('correctly parses ***a** b*', () => {
  expect(initTinyMDE('***XXXA** XXXB*').lineHTML(0)).toMatch(/<em[^>]*>.*<strong[^>]*>XXXA<\/strong>.*XXXB<\/em>/);
});

test('correctly parses *a **b***', () => {
  expect(initTinyMDE('*XXXA **XXXB***').lineHTML(0)).toMatch(/<em[^>]*>.*XXXA.*<strong[^>]*>XXXB<\/strong>.*<\/em>/);
});

test('correctly parses **a *b***', () => {
  expect(initTinyMDE('**XXXA *XXXB***').lineHTML(0)).toMatch(/<strong[^>]*>.*XXXA.*<em[^>]*>XXXB<\/em>.*<\/strong>/);
});

test('asterisk in word can close emphasis: *a*b*', () => {
  expect(initTinyMDE('*XXXA*XXXB*').lineHTML(0)).toMatch(/<em[^>]*>.*XXXA.*<\/em>.*XXXB/);
});

test('underscore in word can NOT close emphasis: _a_b_', () => {
  expect(initTinyMDE('_XXXA_XXXB_').lineHTML(0)).toMatch(/<em[^>]*>.*XXXA_XXXB.*<\/em>/);
});

test('correctly parses opening asterisk without closing: ***a*', () => {
  expect(initTinyMDE('***XXXA*').lineHTML(0)).toMatch(/\*\*.*<em[^>]*>.*XXXA.*<\/em>/);
});

test('correctly parses closing asterisk without opening: *a***', () => {
  expect(initTinyMDE('*XXXA***').lineHTML(0)).toMatch(/<em[^>]*>.*XXXA.*<\/em>.*\*\*/);
});

test('correctly parses opening asterisk without closing: ___a_', () => {
  expect(initTinyMDE('___XXXA_').lineHTML(0)).toMatch(/__.*<em[^>]*>.*XXXA.*<\/em>/);
});

test('correctly parses closing asterisk without opening: _a___', () => {
  expect(initTinyMDE('_XXXA___').lineHTML(0)).toMatch(/<em[^>]*>.*XXXA.*<\/em>.*__/);
});

test('Underscore in between punctuation can open emphasis: foo-_(bar)_', () => {
  expect(initTinyMDE('foo-_(bar)_').lineHTML(0)).toMatch(/foo-.*<em[^>]*>.*\(bar\).*<\/em>.*/);
});

test('Underscore next to punctuation can enclose emphasis: _(bar)_', () => {
  expect(initTinyMDE('_(bar)_').lineHTML(0)).toMatch(/<em[^>]*>.*\(bar\).*<\/em>.*/);
});

test('Emphasis works multiple times on the same line', () => {
  expect(initTinyMDE('Several *emphasized* words *and also* some *phrases* here').lineHTML(0))
    .toMatch(/<em[^>]*>emphasized<\/em>.*<em[^>]*>and also<\/em>.*<em[^>]*>phrases<\/em>/);
})

test('Emphasis delimiters can be mixed and matched', () => {
  expect(initTinyMDE('__*Mixed* and matched__').lineHTML(0)).toMatch(/<strong[^>]*>.*<em[^>]*>Mixed<\/em>.*and matched<\/strong>/);
})

test('ASCII punctuation can be backslash-escaped', () => {
  //  !, ", #, $, %, &, ', (, ), *, +, ,, -, ., / (U+0021–2F), :, ;, <, =, >, ?, @ (U+003A–0040), [, \, ], ^, _, ` (U+005B–0060), {, |, }, or ~
  let punctuation =  ['!', '"', '#', '$', '%', '&', '\'', '(', ')', '*', '+', ',', '-', '.', '/', ':', ';', '<', '=', '>', '?', '@', '[', '\\', ']', '^', '_', '`', '{', '|', '}', '~'];
  for (let p of punctuation) {
    expect(initTinyMDE(`\\${p}`).lineHTML(0)).toMatch(classTagRegExp('\\', 'TMMark_TMEscape'));
  }
});

test('Non-ASCII-punctuation can NOT be backslash-escaped', () => {
  let nonPunctuation =  ['→', 'A', 'a', ' ', '3', 'φ', '«'];
  for (let p of nonPunctuation) {
    expect(initTinyMDE(`\\${p}`).lineHTML(0)).not.toMatch(classTagRegExp('\\', 'TMMark_TMEscape'));
  }
});

test('Single backtick code parsed correctly', () => {
  expect(initTinyMDE('Some `backtickcode` here').lineHTML(0)).toMatch(/Some.*<code[^>]*>backtickcode<\/code>.*here/);
});

test('Backtick escapes NOT processed in code', () => {
  expect(initTinyMDE('`\\!`').lineHTML(0)).toMatch(/<code[^>]*>\\!<\/code>/);
})

test('Backslash backtick ends code block: `code\\` ', () => {
  expect(initTinyMDE('`XXXA\\`').lineHTML(0)).toMatch(/<code[^>]*>XXXA\\<\/code>/);
});

test('Double backtick code can contain single backtick: ``a`b``', () => {
  expect(initTinyMDE('``XXXA`XXXB``').lineHTML(0)).toMatch(/<code[^>]*>XXXA`XXXB<\/code>/);
});

test('Escaped backtick doesn\'t start code span', () => {
  expect(initTinyMDE('\\`XXXA`').lineHTML(0)).not.toMatch(/<code[^>]*>/);
});

// TODO Make this test pass
// test('Single space is stripped from both sides of code block: `` `a` ``', () => {
//   expect(initTinyMDE('`` `XXXA` ``').lineHTML(0)).toMatch(/<code[^>]*>`XXXA`<\/code>/);
// });

test('Autolink binds more strongly than inline link: [this <https://]()>', () => {
  let result = initTinyMDE('[XXXA <XXXB://]()>').lineHTML(0);
  expect(result).not.toMatch(/<span[^>]*class\s*=\s*["']?[^"'>]*TMLink[^>]*>XXXA/);
  expect(result).toMatch(/<span[^>]*class\s*=\s*["']?[^"'>]*TMAutolink[^>]*>XXXB/);
});

test('HTML binds more strongly than inline link: [this <tag a="]()">', () => {
  let result = initTinyMDE('[XXXA <XXXB XXXC="]()">').lineHTML(0);
  expect(result).not.toMatch(/<span[^>]*class\s*=\s*["']?[^"'>]*TMLink[^>]*>XXXA/);
  expect(result).toMatch(classTagRegExp(`<XXXB XXXC="]()">`, 'TMHTML'));
});

test('Code span binds more strongly than inline link: [this `code]()>`', () => {
  let result = initTinyMDE('[XXXA `XXXB]()`').lineHTML(0);
  expect(result).not.toMatch(/<span[^>]*class\s*=\s*["']?[^"'>]*TMLink[^>]*>XXXA/);
  expect(result).toMatch(/<code[^>]*>XXXB\]\(\)<\/code>/);
});

test(`HTML open tag recognized: <a foo="bar" bam = 'baz <em>"</em>' _boolean zoop:33=zoop:33 />`, () => {
  let html = `<a foo="bar" bam = 'baz <em>"</em>' _boolean zoop:33=zoop:33 />`;
  let match = `<span[^>]*class\\s*=\\s*["']?[^"'>]*TMHTML[^>]*>${htmlescape(html)}<\\/span>`
  expect(initTinyMDE(html).lineHTML(0)).toMatch(htmlRegExp(html));
})

test(`Invalid HTML open tags NOT recognized: <__> <33> <a h*ref="hi"> <a href="hi'> <a href=hi'> < a> <a/ > <foo bar=baz bim!bop /> <a href='a'title=title>`, () => {
  let html = `<__> <33> <a h*ref="hi"> <a href="hi'> <a href=hi'> < a> <a/ > <foo bar=baz bim!bop /> <a href='a'title=title>`;
  expect(initTinyMDE(html).lineHTML(0)).not.toMatch('TMHTML');
})

test(`HTML close tag recognized: </html>`, () => {
  expect(initTinyMDE('</XXXA>').lineHTML(0)).toMatch(htmlRegExp('</XXXA>'));
});

test('HTML close tag can\'t have attributes: </tag a="b">', () => {
  expect(initTinyMDE('</tag a="b">').lineHTML(0)).not.toMatch('TMHTML');
});

test(`HTML comments recognized: <!--comment--> `, () => {
  expect(initTinyMDE('<!--XXXA-->').lineHTML(0)).toMatch(htmlRegExp('<!--XXXA-->'));
});

test('Invalid HTML comments NOT recognized: <!-- not -- valid -->, <!---->', () => {
  expect(initTinyMDE('<!-- not -- valid --> <!---->').lineHTML(0)).not.toMatch('TMHTML');
});

test('HTML processing instructions recognized: <? instruction ?>', () => {
  expect(initTinyMDE('<?XXXA?>').lineHTML(0)).toMatch(htmlRegExp('<?XXXA?>'));
});

test(`HTML declarations recognized:  <!DOCTYPE html>, <!DECLARE >, <!DO the OK@#( fwekof'230-2= πππ>`, () => {
  let tests = [`<!DOCTYPE html>`, `<!DECLARE >`, `<!DO the OK@#( fwekof'230-2= πππ>`];
  for (let test of tests) {
    expect(initTinyMDE(test).lineHTML(0)).toMatch(htmlRegExp(test));
  }
});

test(`Invalid HTML declaration NOT recognized: <!DOCTYPE>`, () => {
  expect(initTinyMDE('<!DOCTYPE>').lineHTML(0)).not.toMatch('TMHTML');
});

test(`HTML CDATA section recognized: <![CDATA[A]]B]]>`, () => {
  expect(initTinyMDE('<![CDATA[A]]B]]>').lineHTML(0)).toMatch(htmlRegExp('<![CDATA[A]]B]]>'));
});

test(`Email autolinks recognized: <abc@def.gh>`, () => {
  expect(initTinyMDE('<abc@def.gh>').lineHTML(0)).toMatch(classTagRegExp('abc@def.gh', 'TMAutolink'));
});

test(`URI autolinks recognized: <http://foo.bar.baz/test?q=hello&id=22&boolean>`, () => {
  let link = `http://foo.bar.baz/test?q=hello&id=22&boolean`;
  expect(initTinyMDE(`<${link}>`).lineHTML(0)).toMatch(classTagRegExp(link, 'TMAutolink'));
});

test(`Spaces not allowed in URI autolinks`, () => {
  expect(initTinyMDE('<http://foo.bar/baz bim>').lineHTML(0)).not.toMatch('TMAutolink');
});

test(`Simple inline link parsed correctly: [text](destination)`, () => {
  expect(initTinyMDE(`[XXXA](XXXB)`).lineHTML(0)).toMatch(inlineLinkRegExp('XXXA', 'XXXB'));
});

test(`Inline link destination can be in angle brackets: [text](<desti nation>)`, () => {
  expect(initTinyMDE(`[XXXA](<XXXB XXXC>)`).lineHTML(0)).toMatch(inlineLinkRegExp('XXXA', 'XXXB XXXC'));
});

test(`Inline link destination can't include spaces: [link](desti nation)`, () => {
  expect(initTinyMDE(`[XXXA](XXXB XXXC)`).lineHTML(0)).not.toMatch('TMLink');
})

test(`Inline link with unbalanced parenthesis in destination is invalid: [text]( ( )`, () => {
  expect(initTinyMDE(`[XXXA]( ( )`).lineHTML(0)).not.toMatch('TMLink');
});

test(`All link destination (none, <>) and title (", ', ()) delimiters work`, () => {
  const destDelim = [['', ''], ['<', '>']];
  const titleDelim = [['"', '"'], [`'`, `'`], [`(`, `)`]];
  for (let dd of destDelim) for (let td of titleDelim) {
    let link = `[XXXA](${dd[0]}XXXB${dd[1]} ${td[0]}XXXC${td[1]})`;
    expect(initTinyMDE(link).lineHTML(0)).toMatch(inlineLinkRegExp('XXXA', 'XXXB', 'XXXC'));
  }
});

// test(`Empty inline link works: []()`)

// [ref]: https://www.jefago.com
// [ref link]: </this has spaces> "and a title"
// [  link label  ]: "Only title, spaces in the label"
// [invalid] 
// [invalid][]
// [in-valid][invalid]
// There's <html><like><tags><over><here>
// A [ref link] in here.
// And another [ref link][].
// A valid [link to a ref][ref] here.
// An invalid [ref link][nope].
// An [inline link](/inline) here.
// Some [inline](<links>) [inline](<link link> "title title") [inline](<link link> (title title)) [inline](  <link link>   'title \\' title') ss
// [Inline](  /with invalid title text  ) here.
// [Inline]( </with (complex) dest>  (and title text) ) here.
// [Inline](<> "") link with empty delimiters
// [Inline]() link completely empty
// [Valid link](")))") here
// [Valid link](<)))>) here
// [Invalid](  ( ) here
// This one [is *a](link) over* here, but not an emphasis.
// Here [the [inner](one) is] the valid link.
// An ![image [can](have) a](link) inside it.


// H1
// ==
// Hello *there*.
// ~~~
// Code
// block
// ~~~


// > Quote and
//     Indented code block

//   * * * 
  
// - UL
// - UL (and an empty one below)
// - 

// 1) OL
// 2) OL