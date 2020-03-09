import TinyMDE from './TinyMDE';

function init(content) {
  document.body.innerHTML = '<div id="container"></div>';
  let tinyMDE = new TinyMDE({element: 'container', content: content});
  return {
    editorInstance: () => tinyMDE,
    editorElement: () => document.getElementById('container').firstChild,
    lineType: (lineNum) => document.getElementById('container').firstChild.childNodes[lineNum].className,
    lineHTML: (lineNum) => document.getElementById('container').firstChild.childNodes[lineNum].innerHTML,
    content: () => tinyMDE.getContent(),
  }
}


test('sets up correctly when passed an ID', () => {
  document.body.innerHTML = '<div id="container"></div>';
  let tinyMDE = new TinyMDE({element: 'container'});
  expect(document.getElementById('container').firstChild.className).toBe('TinyMDE');
});

test('sets up correctly when passed an element', () => {
  document.body.innerHTML = '<div id="container"></div>';
  let tinyMDE = new TinyMDE({element: document.getElementById('container')});
  expect(document.getElementById('container').firstChild.className).toBe('TinyMDE');
});

test('correctly parses * emphasis', () => {
  expect(init('*em*').lineHTML(0)).toMatch(/<em[^>]*>em<\/em>/);
});

test('correctly parses ** strong emphasis', () => {
  expect(init('**strong**').lineHTML(0)).toMatch(/<strong[^>]*>strong<\/strong>/);
});

test('triple emphasis *** becomes <em><strong>', () => {
  expect(init('***text***').lineHTML(0)).toMatch(/<em[^>]*>.*<strong[^>]*>text<\/strong>.*<\/em>/);
});

test('correctly parses _ emphasis', () => {
  expect(init('_XXXA_').lineHTML(0)).toMatch(/<em[^>]*>XXXA<\/em>/);
});

test('correctly parses __ strong emphasis', () => {
  expect(init('__XXXA__').lineHTML(0)).toMatch(/<strong[^>]*>XXXA<\/strong>/);
});

test('triple emphasis ___ becomes <em><strong>', () => {
  expect(init('___XXXA___').lineHTML(0)).toMatch(/<em[^>]*>.*<strong[^>]*>XXXA<\/strong>.*<\/em>/);
});

test('correctly parses ***a* b**', () => {
  expect(init('***XXXA* XXXB**').lineHTML(0)).toMatch(/<strong[^>]*>.*<em[^>]*>XXXA<\/em>.*XXXB<\/strong>/);
});

test('correctly parses ***a** b*', () => {
  expect(init('***XXXA** XXXB*').lineHTML(0)).toMatch(/<em[^>]*>.*<strong[^>]*>XXXA<\/strong>.*XXXB<\/em>/);
});

test('correctly parses *a **b***', () => {
  expect(init('*XXXA **XXXB***').lineHTML(0)).toMatch(/<em[^>]*>.*XXXA.*<strong[^>]*>XXXB<\/strong>.*<\/em>/);
});

test('correctly parses **a *b***', () => {
  expect(init('**XXXA *XXXB***').lineHTML(0)).toMatch(/<strong[^>]*>.*XXXA.*<em[^>]*>XXXB<\/em>.*<\/strong>/);
});

test('asterisk in word can close emphasis: *a*b*', () => {
  expect(init('*XXXA*XXXB*').lineHTML(0)).toMatch(/<em[^>]*>.*XXXA.*<\/em>.*XXXB/);
});

test('underscore in word can NOT close emphasis: _a_b_', () => {
  expect(init('_XXXA_XXXB_').lineHTML(0)).toMatch(/<em[^>]*>.*XXXA_XXXB.*<\/em>/);
});

test('correctly parses opening asterisk without closing: ***a*', () => {
  expect(init('***XXXA*').lineHTML(0)).toMatch(/\*\*.*<em[^>]*>.*XXXA.*<\/em>/);
});

test('correctly parses closing asterisk without opening: *a***', () => {
  expect(init('*XXXA***').lineHTML(0)).toMatch(/<em[^>]*>.*XXXA.*<\/em>.*\*\*/);
});

test('correctly parses opening asterisk without closing: ___a_', () => {
  expect(init('___XXXA_').lineHTML(0)).toMatch(/__.*<em[^>]*>.*XXXA.*<\/em>/);
});

test('correctly parses closing asterisk without opening: _a___', () => {
  expect(init('_XXXA___').lineHTML(0)).toMatch(/<em[^>]*>.*XXXA.*<\/em>.*__/);
});

test('Underscore in between punctuation can open emphasis: foo-_(bar)_', () => {
  expect(init('foo-_(bar)_').lineHTML(0)).toMatch(/foo-.*<em[^>]*>.*\(bar\).*<\/em>.*/);
});

test('Underscore next to punctuation can enclose emphasis: _(bar)_', () => {
  expect(init('_(bar)_').lineHTML(0)).toMatch(/<em[^>]*>.*\(bar\).*<\/em>.*/);
});

test('Emphasis works multiple times on the same line', () => {
  expect(init('Several *emphasized* words *and also* some *phrases* here').lineHTML(0))
    .toMatch(/<em[^>]*>emphasized<\/em>.*<em[^>]*>and also<\/em>.*<em[^>]*>phrases<\/em>/);
})

test('Emphasis delimiters can be mixed and matched', () => {
  expect(init('__*Mixed* and matched__').lineHTML(0)).toMatch(/<strong[^>]*>.*<em[^>]*>Mixed<\/em>.*and matched<\/strong>/);
})

// Some <html> </tags> right here
// <html a="b" >
// More <html    a="b c"    d  =  'e f'  h = i j /> here
// Comment <!-- here --> and <!-- not -- a --> comment and neither here <!---->
// Test <a foo="bar" bam = 'baz <em>"</em>' _boolean zoop:33=zoop:33 /> case
// Illegal HTML <__> <33> <a h*ref="hi"> <a href="hi'> <a href=hi'> < a> <a/ > <foo bar=baz bim!bop /> <a href='a'title=title>
// Processing instructions <?here?> and <? h e r e ?> and <?a?> here and <??> here and <? here ? here > here ?> yup
// Declarations <!DOCTYPE html> and <!DECLARE > and <!DO the OK@#( fwekof'230-2= πππ> here but <!NOT> here
// A <![CDATA[section right ] freak > ing ]] here]]> but not anymore
// Autolink, not inline link: [this <https://]()>
// HTML, not inline link: [this <html a="]()">
// More \`complex\`  line with *one **style** within* another.
// Code \`ends here\\\` not here\`
// More \`\`difficult \`code\`\` spans \\\`not code\` \\"
// Code \`\` \`that starts \`\` with a backtick
// This is [not \`a ](link) right\` here.

// [ref]: https://www.jefago.com
// [ref link]: </this has spaces> "and a title"
// [  link label  ]: "Only title, spaces in the label"


// Autolinks
// ---------
// <mail@jefago.com> <https://www.jefago.com/> <a+b:>


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