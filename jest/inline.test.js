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
  editor.destroy();
});

test('correctly parses _ emphasis', async () =>  {
  const editor = await initTinyMDE('_XXXA_');
  expect(await editor.lineHTML(0)).toMatch(/<em[^>]*>XXXA<\/em>/);
  editor.destroy();
});

test('correctly parses __ strong emphasis', async () =>  {
  const editor = await initTinyMDE('__XXXA__');
  expect(await editor.lineHTML(0)).toMatch(/<strong[^>]*>XXXA<\/strong>/);
  editor.destroy();
});

test('triple emphasis ___ becomes <em><strong>', async () =>  {
  const editor = await initTinyMDE('___XXXA___');
  expect(await editor.lineHTML(0)).toMatch(/<em[^>]*>.*<strong[^>]*>XXXA<\/strong>.*<\/em>/);
  editor.destroy();
});

test('correctly parses ***a* b**', async () =>  {
  const editor = await initTinyMDE('***XXXA* XXXB**');
  expect(await editor.lineHTML(0)).toMatch(/<strong[^>]*>.*<em[^>]*>XXXA<\/em>.*XXXB<\/strong>/);
  editor.destroy();
});

test('correctly parses ***a** b*', async () =>  {
  const editor = await initTinyMDE('***XXXA** XXXB*');
  expect(await editor.lineHTML(0)).toMatch(/<em[^>]*>.*<strong[^>]*>XXXA<\/strong>.*XXXB<\/em>/);
  editor.destroy();
});

test('correctly parses *a **b***', async () =>  {
  const editor = await initTinyMDE('*XXXA **XXXB***');
  expect(await editor.lineHTML(0)).toMatch(/<em[^>]*>.*XXXA.*<strong[^>]*>XXXB<\/strong>.*<\/em>/);
  editor.destroy();
});

test('correctly parses **a *b***', async () =>  {
  const editor = await initTinyMDE('**XXXA *XXXB***');
  expect(await editor.lineHTML(0)).toMatch(/<strong[^>]*>.*XXXA.*<em[^>]*>XXXB<\/em>.*<\/strong>/);
  editor.destroy();
});

test('asterisk in word can close emphasis: *a*b*', async () =>  {
  const editor = await initTinyMDE('*XXXA*XXXB*');
  expect(await editor.lineHTML(0)).toMatch(/<em[^>]*>.*XXXA.*<\/em>.*XXXB/);
  editor.destroy();
});

test('underscore in word can NOT close emphasis: _a_b_', async () =>  {
  const editor = await initTinyMDE('_XXXA_XXXB_');
  expect(await editor.lineHTML(0)).toMatch(/<em[^>]*>.*XXXA_XXXB.*<\/em>/);
  editor.destroy();
});

test('correctly parses opening asterisk without closing: ***a*', async () =>  {
  const editor = await initTinyMDE('***XXXA*');
  expect(await editor.lineHTML(0)).toMatch(/\*\*.*<em[^>]*>.*XXXA.*<\/em>/);
  editor.destroy();
});

test('correctly parses closing asterisk without opening: *a***', async () =>  {
  const editor = await initTinyMDE('*XXXA***');
  expect(await editor.lineHTML(0)).toMatch(/<em[^>]*>.*XXXA.*<\/em>.*\*\*/);
  editor.destroy();
});

test('correctly parses opening asterisk without closing: ___a_', async () =>  {
  const editor = await initTinyMDE('___XXXA_');
  expect(await editor.lineHTML(0)).toMatch(/__.*<em[^>]*>.*XXXA.*<\/em>/);
  editor.destroy();
});

test('correctly parses closing asterisk without opening: _a___', async () =>  {
  const editor = await initTinyMDE('_XXXA___');
  expect(await editor.lineHTML(0)).toMatch(/<em[^>]*>.*XXXA.*<\/em>.*__/);
  editor.destroy();
});

test('Underscore in between punctuation can open emphasis: foo-_(bar)_', async () =>  {
  const editor = await initTinyMDE('foo-_(bar)_');
  expect(await editor.lineHTML(0)).toMatch(/foo-.*<em[^>]*>.*\(bar\).*<\/em>.*/);
  editor.destroy();
});

test('Underscore next to punctuation can enclose emphasis: _(bar)_', async () =>  {
  const editor = await initTinyMDE('_(bar)_');
  expect(await editor.lineHTML(0)).toMatch(/<em[^>]*>.*\(bar\).*<\/em>.*/);
  editor.destroy();
});

test('Emphasis works multiple times on the same line', async () =>  {
  const editor = await initTinyMDE('Several *emphasized* words *and also* some *phrases* here');
  expect(await editor.lineHTML(0))
    .toMatch(/<em[^>]*>emphasized<\/em>.*<em[^>]*>and also<\/em>.*<em[^>]*>phrases<\/em>/);
  editor.destroy();
})

test('Emphasis delimiters can be mixed and matched', async () =>  {
  const editor = await initTinyMDE('__*Mixed* and matched__');
  expect(await editor.lineHTML(0)).toMatch(/<strong[^>]*>.*<em[^>]*>Mixed<\/em>.*and matched<\/strong>/);
  editor.destroy();
})

// Strikethrough ----------------------------------------------------
test('correctly parses ~~ strikethrough', async () =>  {
  const editor = await initTinyMDE('~~strikethrough~~');
  expect(await editor.lineHTML(0)).toMatch(/<del[^>]*>strikethrough<\/del>/);
  editor.destroy();
});

test('Strikethrough can be nested inside emphasis: *A ~~B~~ C*', async () =>  {
  const editor = await initTinyMDE('*XXXA ~~XXXB~~ XXXC*');
  const html = await editor.lineHTML(0);
  expect(html).toMatch(classTagRegExp('XXXB', 'TMStrikethrough', 'del'));
  expect(html).toMatch(/<em[^>]*>/); // Ensure the emphasis is processed also
  editor.destroy();
});

test('Strikethrough does not need to be left or right flanking: ~~ A ~~', async () =>  {
  const editor = await initTinyMDE('~~ XXXA ~~');
  expect(await editor.lineHTML(0)).toMatch(classTagRegExp(' XXXA ', 'TMStrikethrough', 'del'));
  editor.destroy();
});

test('Emphasis and strikethrough bind left to right: *A ~~B* C~~', async () =>  {
  const editor = await initTinyMDE('*XXXA ~~XXXB* XXXC~~\n~~XXXA *XXXB~~ XXXC*');
  expect(await editor.lineHTML(0)).toMatch(/<em.*>/);
  expect(await editor.lineHTML(0)).not.toMatch(/<del.*>/);
  expect(await editor.lineHTML(1)).not.toMatch(/<em.*>/);
  expect(await editor.lineHTML(1)).toMatch(/<del.*>/);
  editor.destroy();
});


// Escape ----------------------------------------------------

test('ASCII punctuation can be backslash-escaped', async () =>  {
  let punctuation =  ['!', '"', '#', '$', '%', '&', '\'', '(', ')', '*', '+', ',', '-', '.', '/', ':', ';', '<', '=', '>', '?', '@', '[', '\\', ']', '^', '_', '`', '{', '|', '}', '~'];
  const editor = await initTinyMDE(punctuation.map(string => `\\${string}`).join('\n'));
  for (let l = 0; l < punctuation.length; l++) {
    expect(await editor.lineHTML(l)).toMatch(classTagRegExp('\\', 'TMMark_TMEscape'));  
  }
  editor.destroy();
});

test('Non-ASCII-punctuation can NOT be backslash-escaped', async () =>  {
  let nonPunctuation =  ['→', 'A', 'a', ' ', '3', 'φ', '«'];
  for (let p of nonPunctuation) {
    const editor = await initTinyMDE(`\\${p}`);
    expect(await editor.lineHTML(0)).not.toMatch(classTagRegExp('\\', 'TMMark_TMEscape'));
    editor.destroy();
  }
});

test('Single backtick code parsed correctly', async () =>  {
  const editor = await initTinyMDE('Some `backtickcode` here');
  expect(await editor.lineHTML(0)).toMatch(/Some.*<code[^>]*>backtickcode<\/code>.*here/);
  editor.destroy();
});

test('Backtick escapes NOT processed in code', async () =>  {
  const editor = await initTinyMDE('`\\!`');
  expect(await editor.lineHTML(0)).toMatch(/<code[^>]*>\\!<\/code>/);
  editor.destroy();
})

test('Backslash backtick ends code block: `code\\`', async () =>  {
  const editor = await initTinyMDE('`XXXA\\`');
  expect(await editor.lineHTML(0)).toMatch(/<code[^>]*>XXXA\\<\/code>/);
  editor.destroy();
});

test('Double backtick code can contain single backtick: ``a`b``', async () =>  {
  const editor = await initTinyMDE('``XXXA`XXXB``');
  expect(await editor.lineHTML(0)).toMatch(/<code[^>]*>XXXA`XXXB<\/code>/);
  editor.destroy();
});

test('Escaped backtick doesn\'t start code span', async () =>  {
  const editor = await initTinyMDE('\\`XXXA`');
  expect(await editor.lineHTML(0)).not.toMatch(/<code[^>]*>/);
  editor.destroy();
});

// TODO Make this test pass
// test('Single space is stripped from both sides of code block: `` `a` ``', async () =>  {
//   const editor = await initTinyMDE('`` `XXXA` ``');
  // expect(await editor.lineHTML(0)).toMatch(/<code[^>]*>`XXXA`<\/code>/);
// });

test('Autolink binds more strongly than inline link: [this <https://]()>', async () =>  {
  const editor = await initTinyMDE('[XXXA <XXXB://]()>');
  const result = await editor.lineHTML(0);
  expect(result).not.toMatch(/<span[^>]*class\s*=\s*["']?[^"'>]*TMLink[^>]*>XXXA/);
  expect(result).toMatch(/<span[^>]*class\s*=\s*["']?[^"'>]*TMAutolink[^>]*>XXXB/);
  editor.destroy();
});

test('HTML binds more strongly than inline link: [this <tag a="]()">', async () =>  {
  const editor = await initTinyMDE('[XXXA <XXXB XXXC="]()">');
  const result = await editor.lineHTML(0);
  expect(result).not.toMatch(/<span[^>]*class\s*=\s*["']?[^"'>]*TMLink[^>]*>XXXA/);
  expect(result).toMatch(classTagRegExp(`<XXXB XXXC="]()">`, 'TMHTML'));
  editor.destroy(); 
});

test('Code span binds more strongly than inline link: [this `code]()>`', async () =>  {
  const editor = await initTinyMDE('[XXXA `XXXB]()`');
  const result = await editor.lineHTML(0);
  expect(result).not.toMatch(/<span[^>]*class\s*=\s*["']?[^"'>]*TMLink[^>]*>XXXA/);
  expect(result).toMatch(/<code[^>]*>XXXB\]\(\)<\/code>/);
  editor.destroy();
});

test(`HTML open tag recognized: <a foo="bar" bam = 'baz <em>"</em>' _boolean zoop:33=zoop:33 />`, async () =>  {
  const html = `<a foo="bar" bam = 'baz <em>"</em>' _boolean zoop:33=zoop:33 />`;
  const editor = await initTinyMDE(`XXXA ${html}`);
  expect(await editor.lineHTML(0)).toMatch(htmlRegExp(html));
  editor.destroy();
})

test(`Invalid HTML open tags NOT recognized: <__> <33> <a h*ref="hi"> <a href="hi'> <a href=hi'> < a> <a/ > <foo bar=baz bim!bop /> <a href='a'title=title>`, async () =>  {
  let html = `XXXA <__> <33> <a h*ref="hi"> <a href="hi'> <a href=hi'> < a> <a/ > <foo bar=baz bim!bop /> <a href='a'title=title>`;
  const editor = await initTinyMDE(html);
  expect(await editor.lineHTML(0)).not.toMatch('TMHTML');
  editor.destroy();
})

test(`HTML close tag recognized: </html>`, async () =>  {
  const editor = await initTinyMDE('XXXA </XXXA>');
  expect(await editor.lineHTML(0)).toMatch(htmlRegExp('</XXXA>'));
  editor.destroy();
});

test('HTML close tag can\'t have attributes: </tag a="b">', async () =>  {
  const editor = await initTinyMDE('XXXA </tag a="b">');
  expect(await editor.lineHTML(0)).not.toMatch('TMHTML');
  editor.destroy();
});

test(`HTML comments recognized: <!--comment-->`, async () =>  {
  const editor = await initTinyMDE('XXXA <!--XXXA-->');
  expect(await editor.lineHTML(0)).toMatch(htmlRegExp('<!--XXXA-->'));
  editor.destroy();
});

test('Invalid HTML comments NOT recognized: <!-- not -- valid -->, <!---->', async () =>  {
  const editor = await initTinyMDE('XXXA <!-- not -- valid --> <!---->');
  expect(await editor.lineHTML(0)).not.toMatch('TMHTML');
  editor.destroy();
});

test('HTML processing instructions recognized: <? instruction ?>', async () =>  {
  const editor = await initTinyMDE('XXXA <?XXXA?>');
  expect(await editor.lineHTML(0)).toMatch(htmlRegExp('<?XXXA?>'));
  editor.destroy();
});

test(`HTML declarations recognized:  <!DOCTYPE html>, <!DECLARE >, <!DO the OK@#( fwekof'230-2= πππ>`, async () =>  {
  let tests = [`<!DOCTYPE html>`, `<!DECLARE >`, `<!DO the OK@#( fwekof'230-2= πππ>`];
  for (let test of tests) {
    const editor = await initTinyMDE(`XXXA ${test}`);
    expect(await editor.lineHTML(0)).toMatch(htmlRegExp(test));
    editor.destroy();
  }
});

test(`Invalid HTML declaration NOT recognized: <!DOCTYPE>`, async () =>  {
  const editor = await initTinyMDE('XXXA <!DOCTYPE>');
  expect(await editor.lineHTML(0)).not.toMatch('TMHTML');
  editor.destroy();
});

test(`HTML CDATA section recognized: <![CDATA[A]]B]]>`, async () =>  {
  const editor = await initTinyMDE('XXXA <![CDATA[A]]B]]>');
  expect(await editor.lineHTML(0)).toMatch(htmlRegExp('<![CDATA[A]]B]]>'));
  editor.destroy();
});

test(`Email autolinks recognized: <abc@def.gh>`, async () =>  {
  const editor = await initTinyMDE('<abc@def.gh>');
  expect(await editor.lineHTML(0)).toMatch(classTagRegExp('abc@def.gh', 'TMAutolink'));
  editor.destroy();
});

test(`URI autolinks recognized: <http://foo.bar.baz/test?q=hello&id=22&boolean>`, async () =>  {
  let link = `http://foo.bar.baz/test?q=hello&id=22&boolean`;
  const editor = await initTinyMDE(`<${link}>`);
  expect(await editor.lineHTML(0)).toMatch(classTagRegExp(link, 'TMAutolink'));
  editor.destroy();
});

test(`Spaces not allowed in URI autolinks`, async () =>  {
  const editor = await initTinyMDE('<http://foo.bar/baz bim>');
  expect(await editor.lineHTML(0)).not.toMatch('TMAutolink');
  editor.destroy();
});

test(`Simple inline link parsed correctly: [text](destination)`, async () =>  {
  const editor = await initTinyMDE(`[XXXA](XXXB)`);
  expect(await editor.lineHTML(0)).toMatch(inlineLinkRegExp('XXXA', 'XXXB'));
  editor.destroy();
});

test(`Inline link destination can be in angle brackets: [text](<desti nation>)`, async () =>  {
  const editor = await initTinyMDE(`[XXXA](<XXXB XXXC>)`);
  expect(await editor.lineHTML(0)).toMatch(inlineLinkRegExp('XXXA', 'XXXB XXXC'));
  editor.destroy();
});

test(`Inline link destination can't include spaces: [link](desti nation)`, async () =>  {
  const editor = await initTinyMDE(`[XXXA](XXXB XXXC)`);
  expect(await editor.lineHTML(0)).not.toMatch('TMLink');
  editor.destroy();
})

test(`Inline link with unbalanced parenthesis in destination is invalid: [text]( ( )`, async () =>  {
  const editor = await initTinyMDE(`[XXXA]( ( )`);
  expect(await editor.lineHTML(0)).not.toMatch('TMLink');
  editor.destroy();
});

test(`All link destination (none, <>) and title (", ', ()) delimiters work`, async () =>  {
  const destDelim = [['', ''], ['<', '>']];
  const titleDelim = [['"', '"'], [`'`, `'`], [`(`, `)`]];
  for (let dd of destDelim) for (let td of titleDelim) {
    let link = `[XXXA](${dd[0]}XXXB${dd[1]} ${td[0]}XXXC XXXD${td[1]})`;
    const editor = await initTinyMDE(link);
    expect(await editor.lineHTML(0)).toMatch(inlineLinkRegExp('XXXA', 'XXXB', 'XXXC XXXD'));
    editor.destroy();
  }
});

test(`Empty inline link works: []()`, async () =>  {
  const editor = await initTinyMDE('[]()');
  expect(await editor.lineHTML(0)).toMatch(inlineLinkRegExp('','',''));
  editor.destroy();
})

test(`Formatting in link text works: [*em*](destination)`, async () =>  {
  const editor = await initTinyMDE('[*XXXA*](XXXB)');
  expect(await editor.lineHTML(0)).toMatch(/<span[^>]*class\s*=\s*["']?[^"'>]*TMLink[^>]*>.*<em[^>]*>XXXA<\/em>/);
  editor.destroy();
});

test(`Links and emphasis bind left-to-right: [*em](destination)*`, async () =>  {
  const editor = await initTinyMDE('[*XXXA](XXXB)*');
  const output = await editor.lineHTML(0);
  expect(output).not.toMatch(/<em[^>]*>/);
  expect(output).toMatch(inlineLinkRegExp('*XXXA', 'XXXB'));
  editor.destroy();
});

test(`Links can't be nested, inner link binds more strongly: [a [b](c) d](e)`, async () =>  {
  const editor = await initTinyMDE('[XXXA [XXXB](XXXC) XXXD](XXXE)');
  expect(await editor.lineHTML(0)).toMatch(inlineLinkRegExp('XXXB', 'XXXC'));
  editor.destroy();
})

test(`Link text can contain images: [a ![b](c) d](e)`, async () =>  {
  const editor = await initTinyMDE('[XXXA ![XXXB](XXXC) XXXD](XXXE)');
  const result = await editor.lineHTML(0);
  expect(result).toMatch(inlineImageRegExp('XXXB', 'XXXC'));
  expect(result).toMatch(/<span[^>]*class\s*=\s*["']?[^>"']*TMLink[^>]*>XXXA.*<span[^>]*class\s*=\s*["']?[^>"']*TMImage[^>]*>XXXB/)
  editor.destroy();
})


test(`Basic image works: ![](/url)`, async () =>  {
  const editor = await initTinyMDE('![](/XXXA)');
  expect(await editor.lineHTML(0)).toMatch(inlineImageRegExp('','/XXXA'));
  editor.destroy();
})

test(`All image destination (none, <>) and title (", ', ()) delimiters work`, async () =>  {
  const destDelim = [['', ''], ['<', '>']];
  const titleDelim = [['"', '"'], [`'`, `'`], [`(`, `)`]];
  for (let dd of destDelim) for (let td of titleDelim) {
    const link = `![XXXA XXXY](${dd[0]}XXXB${dd[1]} ${td[0]}XXXC XXXD${td[1]})`;
    const editor = await initTinyMDE(link);
    expect(await editor.lineHTML(0)).toMatch(inlineImageRegExp('XXXA XXXY', 'XXXB', 'XXXC XXXD'));
    editor.destroy();
  }
});

test(`Formatting in image text works: ![*em*](destination)`, async () =>  {
  const editor = await initTinyMDE('![*XXXA*](XXXB)');
  expect(await editor.lineHTML(0)).toMatch(/<span[^>]*class\s*=\s*["']?[^"'>]*TMImage[^>]*>.*<em[^>]*>XXXA<\/em>/);
  editor.destroy();
});

test(`Image description can contain links: ![a [b](c) d](e)`, async () =>  {
  const text = '![XXXA [XXXB](XXXC) XXXD](XXXE)';
  const editor = await initTinyMDE(text);
  const result = await editor.lineHTML(0);
  expect(result).toMatch(inlineLinkRegExp('XXXB', 'XXXC')); // Just check the link is there...
  expect(result).toMatch(/<span[^>]*class\s*=\s*["']?[^>"']*TMImage[^>]*>XXXA.*<span[^>]*class\s*=\s*["']?[^>"']*TMLink[^>]*>XXXB/)
  editor.destroy();
});

test(`Image description can contain images: ![a ![b](c) d](e)`, async () =>  {
  const text = '![XXXA ![XXXB](XXXC) XXXD](XXXE)';
  const editor = await initTinyMDE(text);
  const result = await editor.lineHTML(0);
  expect(result).toMatch(inlineImageRegExp('XXXB', 'XXXC')); // Just check the link is there...
  expect(result).toMatch(/<span[^>]*class\s*=\s*["']?[^>"']*TMImage[^>]*>XXXA.*<span[^>]*class\s*=\s*["']?[^>"']*TMImage[^>]*>XXXB/)
  editor.destroy();
});

test(`Simple ref link works: [text][ref]`, async () =>  {
  const text = '[XXXB]: https://abc.de\n[XXXA][XXXB]';
  const editor = await initTinyMDE(text);
  expect(await editor.lineHTML(1)).toMatch(/<span[^>]*class\s*=\s*["']?[^"'>]*TMLink[^>]*>XXXA.*<span[^>]*class\s*=\s*["']?[^"'>]*TMLinkLabel_Valid[^>]*>XXXB/);
  editor.destroy();
});

test(`Spaces in link label get ignored: [text][   ref   ]`, async () =>  {
  const text = '[   XXXB  ]: https://abc.de\n[XXXA][  XXXB   ]';
  const editor = await initTinyMDE(text);
  expect(await editor.lineHTML(1)).toMatch(/<span[^>]*class\s*=\s*["']?[^"'>]*TMLink[^>]*>XXXA.*<span[^>]*class\s*=\s*["']?[^"'>]*TMLinkLabel_Valid[^>]*>XXXB/);
  editor.destroy();
});

test(`Collapsed ref link works: [ref][]`, async () =>  {
  const text = '[XXXA]: https://abc.de\n[XXXA][]';
  const editor = await initTinyMDE(text);
  expect(await editor.lineHTML(1)).toMatch(/<span[^>]*class\s*=\s*["']?[^"'>]*TMLinkLabel_Valid[^>]*>XXXA/);
  editor.destroy();
});

test(`Shortcut ref link works: [ref]`, async () =>  {
  const text = '[XXXA]: https://abc.de\n[XXXA]';
  const editor = await initTinyMDE(text);
  expect(await editor.lineHTML(1)).toMatch(/<span[^>]*class\s*=\s*["']?[^"'>]*TMLinkLabel_Valid[^>]*>XXXA/);
  editor.destroy();
});

test(`Valid and invalid link references correctly identified`, async () =>  {
  const editor = await initTinyMDE('[XXXA]: https://abc.de\n[XXXA]\n[XXXB]');
  expect (await editor.lineHTML(1)).toMatch(/<span[^>]*class\s*=\s*["']?[^"'>]*TMLinkLabel_Valid[^>]*>XXXA/);
  expect (await editor.lineHTML(2)).toMatch(/<span[^>]*class\s*=\s*["']?[^"'>]*TMLinkLabel_Invalid[^>]*>XXXB/);
  editor.destroy();
});

test(`Simple ref image works: ![text][ref]`, async () =>  {
  const text = '[XXXB]: https://abc.de\n![XXXA][XXXB]';
  const editor = await initTinyMDE(text);
  expect(await editor.lineHTML(1)).toMatch(/<span[^>]*class\s*=\s*["']?[^"'>]*TMImage[^>]*>XXXA.*<span[^>]*class\s*=\s*["']?[^"'>]*TMLinkLabel_Valid[^>]*>XXXB/);
  editor.destroy();
});