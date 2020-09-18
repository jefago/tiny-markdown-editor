const htmlRegExp = (html) => classTagRegExp(html, 'TMHTML');

const inlineLinkRegExp = (text, destination = '', title = '') => {
  return new RegExp([
    classTagRegExp(text, 'TMLink').source,
    classTagRegExp(destination, 'TMLinkDestination').source,
    classTagRegExp(title, 'TMLinkTitle').source
  ].join('.*'));
}

const inlineImageRegExp = (text, destination = '', title = '') => {
  return new RegExp([
    classTagRegExp(text, 'TMImage').source,
    classTagRegExp(destination, 'TMImageDestination').source,
    classTagRegExp(title, 'TMImageTitle').source
  ].join('.*'));
}

test('correctly parses * emphasis', async () =>  {
  const editor = await initTinyMDE('*em*');
  expect(await editor.lineHTML(0)).toMatch(/<em[^>]*>em<\/em>/);
  editor.destroy();
});

test('correctly parses ** strong emphasis', async () =>  {
  const editor = await initTinyMDE('**strong**');
  expect(await editor.lineHTML(0)).toMatch(/<strong[^>]*>strong<\/strong>/);
  editor.destroy();
});

test('triple emphasis *** becomes <em><strong>', async () =>  {
  const editor = await initTinyMDE('***text***');
  expect(await editor.lineHTML(0)).toMatch(/<em[^>]*>.*<strong[^>]*>text<\/strong>.*<\/em>/);
});

test('correctly parses _ emphasis', async () =>  {
  const editor = await initTinyMDE('_XXXA_');
  expect(await editor.lineHTML(0)).toMatch(/<em[^>]*>XXXA<\/em>/);
});

test('correctly parses __ strong emphasis', async () =>  {
  const editor = await initTinyMDE('__XXXA__');
  expect(await editor.lineHTML(0)).toMatch(/<strong[^>]*>XXXA<\/strong>/);
});

test('triple emphasis ___ becomes <em><strong>', async () =>  {
  const editor = await initTinyMDE('___XXXA___');
  expect(await editor.lineHTML(0)).toMatch(/<em[^>]*>.*<strong[^>]*>XXXA<\/strong>.*<\/em>/);
});

test('correctly parses ***a* b**', async () =>  {
  const editor = await initTinyMDE('***XXXA* XXXB**');
  expect(await editor.lineHTML(0)).toMatch(/<strong[^>]*>.*<em[^>]*>XXXA<\/em>.*XXXB<\/strong>/);
});

test('correctly parses ***a** b*', async () =>  {
  const editor = await initTinyMDE('***XXXA** XXXB*');
  expect(await editor.lineHTML(0)).toMatch(/<em[^>]*>.*<strong[^>]*>XXXA<\/strong>.*XXXB<\/em>/);
});

test('correctly parses *a **b***', async () =>  {
  const editor = await initTinyMDE('*XXXA **XXXB***');
  expect(await editor.lineHTML(0)).toMatch(/<em[^>]*>.*XXXA.*<strong[^>]*>XXXB<\/strong>.*<\/em>/);
});

test('correctly parses **a *b***', async () =>  {
  const editor = await initTinyMDE('**XXXA *XXXB***');
  expect(await editor.lineHTML(0)).toMatch(/<strong[^>]*>.*XXXA.*<em[^>]*>XXXB<\/em>.*<\/strong>/);
});

test('asterisk in word can close emphasis: *a*b*', async () =>  {
  const editor = await initTinyMDE('*XXXA*XXXB*');
  expect(await editor.lineHTML(0)).toMatch(/<em[^>]*>.*XXXA.*<\/em>.*XXXB/);
});

test('underscore in word can NOT close emphasis: _a_b_', async () =>  {
  const editor = await initTinyMDE('_XXXA_XXXB_');
  expect(await editor.lineHTML(0)).toMatch(/<em[^>]*>.*XXXA_XXXB.*<\/em>/);
});

test('correctly parses opening asterisk without closing: ***a*', async () =>  {
  const editor = await initTinyMDE('***XXXA*');
  expect(await editor.lineHTML(0)).toMatch(/\*\*.*<em[^>]*>.*XXXA.*<\/em>/);
});

test('correctly parses closing asterisk without opening: *a***', async () =>  {
  const editor = await initTinyMDE('*XXXA***');
  expect(await editor.lineHTML(0)).toMatch(/<em[^>]*>.*XXXA.*<\/em>.*\*\*/);
});

test('correctly parses opening asterisk without closing: ___a_', async () =>  {
  const editor = await initTinyMDE('___XXXA_');
  expect(await editor.lineHTML(0)).toMatch(/__.*<em[^>]*>.*XXXA.*<\/em>/);
});

test('correctly parses closing asterisk without opening: _a___', async () =>  {
  const editor = await initTinyMDE('_XXXA___');
  expect(await editor.lineHTML(0)).toMatch(/<em[^>]*>.*XXXA.*<\/em>.*__/);
});

test('Underscore in between punctuation can open emphasis: foo-_(bar)_', async () =>  {
  const editor = await initTinyMDE('foo-_(bar);
  expect(await editor_').lineHTML(0)).toMatch(/foo-.*<em[^>]*>.*\(bar\).*<\/em>.*/);
});

test('Underscore next to punctuation can enclose emphasis: _(bar)_', async () =>  {
  const editor = await initTinyMDE('_(bar);
  expect(await editor_').lineHTML(0)).toMatch(/<em[^>]*>.*\(bar\).*<\/em>.*/);
});

test('Emphasis works multiple times on the same line', async () =>  {
  const editor = await initTinyMDE('Several *emphasized* words *and also* some *phrases* here');
  expect(await editor.lineHTML(0))
    .toMatch(/<em[^>]*>emphasized<\/em>.*<em[^>]*>and also<\/em>.*<em[^>]*>phrases<\/em>/);
})

test('Emphasis delimiters can be mixed and matched', async () =>  {
  const editor = await initTinyMDE('__*Mixed* and matched__');
  expect(await editor.lineHTML(0)).toMatch(/<strong[^>]*>.*<em[^>]*>Mixed<\/em>.*and matched<\/strong>/);
})

// Strikethrough ----------------------------------------------------
test('correctly parses ~~ strikethrough', async () =>  {
  const editor = await initTinyMDE('~~strikethrough~~');
  expect(await editor.lineHTML(0)).toMatch(/<del[^>]*>strikethrough<\/del>/);
});

test('Strikethrough can be nested inside emphasis: *A ~~B~~ C*', async () =>  {
  const html = initTinyMDE('*XXXA ~~XXXB~~ XXXC*').lineHTML(0);
  expect(html).toMatch(classTagRegExp('XXXB', 'TMStrikethrough', 'del'));
  expect(html).toMatch(/<em[^>]*>/); // Ensure the emphasis is processed also
});

test('Strikethrough does not need to be left or right flanking: ~~ A ~~', async () =>  {
  const editor = await initTinyMDE('~~ XXXA ~~');
  expect(await editor.lineHTML(0)).toMatch(classTagRegExp(' XXXA ', 'TMStrikethrough', 'del'));
});

test('Emphasis and strikethrough bind left to right: *A ~~B* C~~', async () =>  {
  const tinyMDE = initTinyMDE('*XXXA ~~XXXB* XXXC~~\n~~XXXA *XXXB~~ XXXC*');
  expect(tinyMDE.lineHTML(0)).toMatch(/<em.*>/);
  expect(tinyMDE.lineHTML(0)).not.toMatch(/<del.*>/);
  expect(tinyMDE.lineHTML(1)).not.toMatch(/<em.*>/);
  expect(tinyMDE.lineHTML(1)).toMatch(/<del.*>/);
});


// Escape ----------------------------------------------------

test('ASCII punctuation can be backslash-escaped', async () =>  {
  let punctuation =  ['!', '"', '#', '$', '%', '&', '\'', '(', ')', '*', '+', ',', '-', '.', '/', ':', ';', '<', '=', '>', '?', '@', '[', '\\', ']', '^', '_', '`', '{', '|', '}', '~'];
  for (let p of punctuation) {
    const editor = await initTinyMDE(`\\${p}`);
  expect(await editor.lineHTML(0)).toMatch(classTagRegExp('\\', 'TMMark_TMEscape'));
  }
});

test('Non-ASCII-punctuation can NOT be backslash-escaped', async () =>  {
  let nonPunctuation =  ['→', 'A', 'a', ' ', '3', 'φ', '«'];
  for (let p of nonPunctuation) {
    const editor = await initTinyMDE(`\\${p}`);
  expect(await editor.lineHTML(0)).not.toMatch(classTagRegExp('\\', 'TMMark_TMEscape'));
  }
});

test('Single backtick code parsed correctly', async () =>  {
  const editor = await initTinyMDE('Some `backtickcode` here');
  expect(await editor.lineHTML(0)).toMatch(/Some.*<code[^>]*>backtickcode<\/code>.*here/);
});

test('Backtick escapes NOT processed in code', async () =>  {
  const editor = await initTinyMDE('`\\!`');
  expect(await editor.lineHTML(0)).toMatch(/<code[^>]*>\\!<\/code>/);
})

test('Backslash backtick ends code block: `code\\` ', async () =>  {
  const editor = await initTinyMDE('`XXXA\\`');
  expect(await editor.lineHTML(0)).toMatch(/<code[^>]*>XXXA\\<\/code>/);
});

test('Double backtick code can contain single backtick: ``a`b``', async () =>  {
  const editor = await initTinyMDE('``XXXA`XXXB``');
  expect(await editor.lineHTML(0)).toMatch(/<code[^>]*>XXXA`XXXB<\/code>/);
});

test('Escaped backtick doesn\'t start code span', async () =>  {
  const editor = await initTinyMDE('\\`XXXA`');
  expect(await editor.lineHTML(0)).not.toMatch(/<code[^>]*>/);
});

// TODO Make this test pass
// test('Single space is stripped from both sides of code block: `` `a` ``', async () =>  {
//   const editor = await initTinyMDE('`` `XXXA` ``');
  expect(await editor.lineHTML(0)).toMatch(/<code[^>]*>`XXXA`<\/code>/);
// });

test('Autolink binds more strongly than inline link: [this <https://]()>', async () =>  {
  let result = initTinyMDE('[XXXA <XXXB://]()>').lineHTML(0);
  expect(result).not.toMatch(/<span[^>]*class\s*=\s*["']?[^"'>]*TMLink[^>]*>XXXA/);
  expect(result).toMatch(/<span[^>]*class\s*=\s*["']?[^"'>]*TMAutolink[^>]*>XXXB/);
});

test('HTML binds more strongly than inline link: [this <tag a="]()">', async () =>  {
  let result = initTinyMDE('[XXXA <XXXB XXXC="]()">').lineHTML(0);
  expect(result).not.toMatch(/<span[^>]*class\s*=\s*["']?[^"'>]*TMLink[^>]*>XXXA/);
  expect(result).toMatch(classTagRegExp(`<XXXB XXXC="]()">`, 'TMHTML'));
});

test('Code span binds more strongly than inline link: [this `code]()>`', async () =>  {
  let result = initTinyMDE('[XXXA `XXXB]()`').lineHTML(0);
  expect(result).not.toMatch(/<span[^>]*class\s*=\s*["']?[^"'>]*TMLink[^>]*>XXXA/);
  expect(result).toMatch(/<code[^>]*>XXXB\]\(\)<\/code>/);
});

test(`HTML open tag recognized: <a foo="bar" bam = 'baz <em>"</em>' _boolean zoop:33=zoop:33 />`, async () =>  {
  let html = `<a foo="bar" bam = 'baz <em>"</em>' _boolean zoop:33=zoop:33 />`;
  const editor = await initTinyMDE(`XXXA ${html}`);
  expect(await editor.lineHTML(0)).toMatch(htmlRegExp(html));
})

test(`Invalid HTML open tags NOT recognized: <__> <33> <a h*ref="hi"> <a href="hi'> <a href=hi'> < a> <a/ > <foo bar=baz bim!bop /> <a href='a'title=title>`, async () =>  {
  let html = `XXXA <__> <33> <a h*ref="hi"> <a href="hi'> <a href=hi'> < a> <a/ > <foo bar=baz bim!bop /> <a href='a'title=title>`;
  const editor = await initTinyMDE(html);
  expect(await editor.lineHTML(0)).not.toMatch('TMHTML');
})

test(`HTML close tag recognized: </html>`, async () =>  {
  const editor = await initTinyMDE('XXXA </XXXA>');
  expect(await editor.lineHTML(0)).toMatch(htmlRegExp('</XXXA>'));
});

test('HTML close tag can\'t have attributes: </tag a="b">', async () =>  {
  const editor = await initTinyMDE('XXXA </tag a="b">');
  expect(await editor.lineHTML(0)).not.toMatch('TMHTML');
});

test(`HTML comments recognized: <!--comment--> `, async () =>  {
  const editor = await initTinyMDE('XXXA <!--XXXA-->');
  expect(await editor.lineHTML(0)).toMatch(htmlRegExp('<!--XXXA-->'));
});

test('Invalid HTML comments NOT recognized: <!-- not -- valid -->, <!---->', async () =>  {
  const editor = await initTinyMDE('XXXA <!-- not -- valid --> <!---->');
  expect(await editor.lineHTML(0)).not.toMatch('TMHTML');
});

test('HTML processing instructions recognized: <? instruction ?>', async () =>  {
  const editor = await initTinyMDE('XXXA <?XXXA?>');
  expect(await editor.lineHTML(0)).toMatch(htmlRegExp('<?XXXA?>'));
});

test(`HTML declarations recognized:  <!DOCTYPE html>, <!DECLARE >, <!DO the OK@#( fwekof'230-2= πππ>`, async () =>  {
  let tests = [`<!DOCTYPE html>`, `<!DECLARE >`, `<!DO the OK@#( fwekof'230-2= πππ>`];
  for (let test of tests) {
    const editor = await initTinyMDE(`XXXA ${test}`);
  expect(await editor.lineHTML(0)).toMatch(htmlRegExp(test));
  }
});

test(`Invalid HTML declaration NOT recognized: <!DOCTYPE>`, async () =>  {
  const editor = await initTinyMDE('XXXA <!DOCTYPE>');
  expect(await editor.lineHTML(0)).not.toMatch('TMHTML');
});

test(`HTML CDATA section recognized: <![CDATA[A]]B]]>`, async () =>  {
  const editor = await initTinyMDE('XXXA <![CDATA[A]]B]]>');
  expect(await editor.lineHTML(0)).toMatch(htmlRegExp('<![CDATA[A]]B]]>'));
});

test(`Email autolinks recognized: <abc@def.gh>`, async () =>  {
  const editor = await initTinyMDE('<abc@def.gh>');
  expect(await editor.lineHTML(0)).toMatch(classTagRegExp('abc@def.gh', 'TMAutolink'));
});

test(`URI autolinks recognized: <http://foo.bar.baz/test?q=hello&id=22&boolean>`, async () =>  {
  let link = `http://foo.bar.baz/test?q=hello&id=22&boolean`;
  const editor = await initTinyMDE(`<${link}>`);
  expect(await editor.lineHTML(0)).toMatch(classTagRegExp(link, 'TMAutolink'));
});

test(`Spaces not allowed in URI autolinks`, async () =>  {
  const editor = await initTinyMDE('<http://foo.bar/baz bim>');
  expect(await editor.lineHTML(0)).not.toMatch('TMAutolink');
});

test(`Simple inline link parsed correctly: [text](destination)`, async () =>  {
  const editor = await initTinyMDE(`[XXXA](XXXB);
  expect(await editor`).lineHTML(0)).toMatch(inlineLinkRegExp('XXXA', 'XXXB'));
});

test(`Inline link destination can be in angle brackets: [text](<desti nation>)`, async () =>  {
  const editor = await initTinyMDE(`[XXXA](<XXXB XXXC>);
  expect(await editor`).lineHTML(0)).toMatch(inlineLinkRegExp('XXXA', 'XXXB XXXC'));
});

test(`Inline link destination can't include spaces: [link](desti nation)`, async () =>  {
  const editor = await initTinyMDE(`[XXXA](XXXB XXXC);
  expect(await editor`).lineHTML(0)).not.toMatch('TMLink');
})

test(`Inline link with unbalanced parenthesis in destination is invalid: [text]( ( )`, async () =>  {
  const editor = await initTinyMDE(`[XXXA]( ( );
  expect(await editor`).lineHTML(0)).not.toMatch('TMLink');
});

test(`All link destination (none, <>) and title (", ', ()) delimiters work`, async () =>  {
  const destDelim = [['', ''], ['<', '>']];
  const titleDelim = [['"', '"'], [`'`, `'`], [`(`, `)`]];
  for (let dd of destDelim) for (let td of titleDelim) {
    let link = `[XXXA](${dd[0]}XXXB${dd[1]} ${td[0]}XXXC XXXD${td[1]})`;
    const editor = await initTinyMDE(link);
  expect(await editor.lineHTML(0)).toMatch(inlineLinkRegExp('XXXA', 'XXXB', 'XXXC XXXD'));
  }
});

test(`Empty inline link works: []()`, async () =>  {
  const editor = await initTinyMDE('[]();
  expect(await editor').lineHTML(0)).toMatch(inlineLinkRegExp('','',''));
})

test(`Formatting in link text works: [*em*](destination)`, async () =>  {
  const editor = await initTinyMDE('[*XXXA*](XXXB);
  expect(await editor').lineHTML(0)).toMatch(/<span[^>]*class\s*=\s*["']?[^"'>]*TMLink[^>]*>.*<em[^>]*>XXXA<\/em>/);
});

test(`Links and emphasis bind left-to-right: [*em](destination)*`, async () =>  {
  let output = initTinyMDE('[*XXXA](XXXB)*').lineHTML(0);
  expect(output).not.toMatch(/<em[^>]*>/);
  expect(output).toMatch(inlineLinkRegExp('*XXXA', 'XXXB'));
});

test(`Links can't be nested, inner link binds more strongly: [a [b](c) d](e)`, async () =>  {
  const editor = await initTinyMDE('[XXXA [XXXB](XXXC);
  expect(await editor XXXD](XXXE)').lineHTML(0)).toMatch(inlineLinkRegExp('XXXB', 'XXXC'));
})

test(`Link text can contain images: [a ![b](c) d](e)`, async () =>  {
  const result = initTinyMDE('[XXXA ![XXXB](XXXC) XXXD](XXXE)').lineHTML(0);
  expect(result).toMatch(inlineImageRegExp('XXXB', 'XXXC'));
  expect(result).toMatch(/<span[^>]*class\s*=\s*["']?[^>"']*TMLink[^>]*>XXXA.*<span[^>]*class\s*=\s*["']?[^>"']*TMImage[^>]*>XXXB/)
})


test(`Basic image works: ![](/url)`, async () =>  {
  const editor = await initTinyMDE('![](/XXXA);
  expect(await editor').lineHTML(0)).toMatch(inlineImageRegExp('','/XXXA'));
})

test(`All image destination (none, <>) and title (", ', ()) delimiters work`, async () =>  {
  const destDelim = [['', ''], ['<', '>']];
  const titleDelim = [['"', '"'], [`'`, `'`], [`(`, `)`]];
  for (let dd of destDelim) for (let td of titleDelim) {
    let link = `![XXXA XXXY](${dd[0]}XXXB${dd[1]} ${td[0]}XXXC XXXD${td[1]})`;
    const editor = await initTinyMDE(link);
  expect(await editor.lineHTML(0)).toMatch(inlineImageRegExp('XXXA XXXY', 'XXXB', 'XXXC XXXD'));
  }
});

test(`Formatting in image text works: ![*em*](destination)`, async () =>  {
  const editor = await initTinyMDE('![*XXXA*](XXXB);
  expect(await editor').lineHTML(0)).toMatch(/<span[^>]*class\s*=\s*["']?[^"'>]*TMImage[^>]*>.*<em[^>]*>XXXA<\/em>/);
});

test(`Image description can contain links: ![a [b](c) d](e)`, async () =>  {
  const text = '![XXXA [XXXB](XXXC) XXXD](XXXE)';
  const result = initTinyMDE(text).lineHTML(0);
  expect(result).toMatch(inlineLinkRegExp('XXXB', 'XXXC')); // Just check the link is there...
  expect(result).toMatch(/<span[^>]*class\s*=\s*["']?[^>"']*TMImage[^>]*>XXXA.*<span[^>]*class\s*=\s*["']?[^>"']*TMLink[^>]*>XXXB/)
});

test(`Image description can contain images: ![a ![b](c) d](e)`, async () =>  {
  const text = '![XXXA ![XXXB](XXXC) XXXD](XXXE)';
  const result = initTinyMDE(text).lineHTML(0);
  expect(result).toMatch(inlineImageRegExp('XXXB', 'XXXC')); // Just check the link is there...
  expect(result).toMatch(/<span[^>]*class\s*=\s*["']?[^>"']*TMImage[^>]*>XXXA.*<span[^>]*class\s*=\s*["']?[^>"']*TMImage[^>]*>XXXB/)
});

test(`Simple ref link works: [text][ref]`, async () =>  {
  const text = '[XXXB]: https://abc.de\n[XXXA][XXXB]';
  const editor = await initTinyMDE(text);
  expect(await editor.lineHTML(1)).toMatch(/<span[^>]*class\s*=\s*["']?[^"'>]*TMLink[^>]*>XXXA.*<span[^>]*class\s*=\s*["']?[^"'>]*TMLinkLabel_Valid[^>]*>XXXB/);
});

test(`Spaces in link label get ignored: [text][   ref   ]`, async () =>  {
  const text = '[   XXXB  ]: https://abc.de\n[XXXA][  XXXB   ]';
  const editor = await initTinyMDE(text);
  expect(await editor.lineHTML(1)).toMatch(/<span[^>]*class\s*=\s*["']?[^"'>]*TMLink[^>]*>XXXA.*<span[^>]*class\s*=\s*["']?[^"'>]*TMLinkLabel_Valid[^>]*>XXXB/);
});

test(`Collapsed ref link works: [ref][]`, async () =>  {
  const text = '[XXXA]: https://abc.de\n[XXXA][]';
  const editor = await initTinyMDE(text);
  expect(await editor.lineHTML(1)).toMatch(/<span[^>]*class\s*=\s*["']?[^"'>]*TMLinkLabel_Valid[^>]*>XXXA/);
});

test(`Shortcut ref link works: [ref]`, async () =>  {
  const text = '[XXXA]: https://abc.de\n[XXXA]';
  const editor = await initTinyMDE(text);
  expect(await editor.lineHTML(1)).toMatch(/<span[^>]*class\s*=\s*["']?[^"'>]*TMLinkLabel_Valid[^>]*>XXXA/);
});

test(`Valid and invalid link references correctly identified`, async () =>  {
  const editor = initTinyMDE('[XXXA]: https://abc.de\n[XXXA]\n[XXXB]');
  expect (editor.lineHTML(1)).toMatch(/<span[^>]*class\s*=\s*["']?[^"'>]*TMLinkLabel_Valid[^>]*>XXXA/);
  expect (editor.lineHTML(2)).toMatch(/<span[^>]*class\s*=\s*["']?[^"'>]*TMLinkLabel_Invalid[^>]*>XXXB/);
});

test(`Simple ref image works: ![text][ref]`, async () =>  {
  const text = '[XXXB]: https://abc.de\n![XXXA][XXXB]';
  const editor = await initTinyMDE(text);
  expect(await editor.lineHTML(1)).toMatch(/<span[^>]*class\s*=\s*["']?[^"'>]*TMImage[^>]*>XXXA.*<span[^>]*class\s*=\s*["']?[^"'>]*TMLinkLabel_Valid[^>]*>XXXB/);
});