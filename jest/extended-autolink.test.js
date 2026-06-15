// Tests for GFM extended (non-delimited) autolinks: bare URLs, www links, email addresses and
// mailto:/xmpp: links that are recognized without `<...>` delimiters.
// See https://github.github.com/gfm/#autolinks-extension-
//
// Extended autolinks are rendered exactly like the content of an angle-bracketed autolink: the
// matched text wrapped in a `TMAutolink` span (with no surrounding mark characters, since there
// are no delimiters). The rendered line's text content therefore equals the source line.

test("a bare http URL is recognized", async () => {
  const editor = await initTinyMDE("Visit http://foo.bar/baz here");
  expect(await editor.lineHTML(0)).toMatch(classTagRegExp("http://foo.bar/baz", "TMAutolink"));
  expect(await editor.lineText(0)).toEqual("Visit http://foo.bar/baz here");
  editor.destroy();
});

test("a bare https URL is recognized", async () => {
  const editor = await initTinyMDE("https://example.com/a?b=c&d=e");
  expect(await editor.lineHTML(0)).toMatch(
    classTagRegExp("https://example.com/a?b=c&d=e", "TMAutolink")
  );
  editor.destroy();
});

test("a bare ftp URL is recognized", async () => {
  const editor = await initTinyMDE("ftp://files.example.com/pub");
  expect(await editor.lineHTML(0)).toMatch(
    classTagRegExp("ftp://files.example.com/pub", "TMAutolink")
  );
  editor.destroy();
});

test("a www. link is recognized", async () => {
  const editor = await initTinyMDE("See www.example.com for more");
  expect(await editor.lineHTML(0)).toMatch(classTagRegExp("www.example.com", "TMAutolink"));
  editor.destroy();
});

test("a www. link with a path is recognized", async () => {
  const editor = await initTinyMDE("www.example.com/path/to/page");
  expect(await editor.lineHTML(0)).toMatch(
    classTagRegExp("www.example.com/path/to/page", "TMAutolink")
  );
  editor.destroy();
});

test("a bare email address is recognized", async () => {
  const editor = await initTinyMDE("Mail foo@example.com today");
  expect(await editor.lineHTML(0)).toMatch(classTagRegExp("foo@example.com", "TMAutolink"));
  editor.destroy();
});

test("a mailto: link is recognized", async () => {
  const editor = await initTinyMDE("mailto:foo@example.com");
  expect(await editor.lineHTML(0)).toMatch(classTagRegExp("mailto:foo@example.com", "TMAutolink"));
  editor.destroy();
});

test("an xmpp: link with a resource is recognized", async () => {
  const editor = await initTinyMDE("xmpp:foo@example.com/bar");
  expect(await editor.lineHTML(0)).toMatch(
    classTagRegExp("xmpp:foo@example.com/bar", "TMAutolink")
  );
  editor.destroy();
});

// Boundary rules --------------------------------------------------------------------------------

test("an autolink is recognized at the start of a line", async () => {
  const editor = await initTinyMDE("http://foo.bar/baz");
  expect(await editor.lineHTML(0)).toMatch(classTagRegExp("http://foo.bar/baz", "TMAutolink"));
  editor.destroy();
});

test("an autolink is recognized after an opening parenthesis", async () => {
  const editor = await initTinyMDE("(www.example.com)");
  expect(await editor.lineHTML(0)).toMatch(classTagRegExp("www.example.com", "TMAutolink"));
  editor.destroy();
});

test("a URL preceded by a non-boundary character is NOT an autolink", async () => {
  const editor = await initTinyMDE("xhttp://foo.bar/baz");
  expect(await editor.lineHTML(0)).not.toMatch("TMAutolink");
  editor.destroy();
});

// Trailing punctuation / parentheses ------------------------------------------------------------

test("trailing punctuation is excluded from the autolink", async () => {
  const editor = await initTinyMDE("Go to www.example.com.");
  expect(await editor.lineHTML(0)).toMatch(classTagRegExp("www.example.com", "TMAutolink"));
  // The trailing period must remain plain text on the line.
  expect(await editor.lineText(0)).toEqual("Go to www.example.com.");
  editor.destroy();
});

test("an unmatched trailing parenthesis is excluded", async () => {
  const editor = await initTinyMDE("(see www.example.com/foo)");
  expect(await editor.lineHTML(0)).toMatch(classTagRegExp("www.example.com/foo", "TMAutolink"));
  editor.destroy();
});

test("a balanced trailing parenthesis is kept inside the autolink", async () => {
  const editor = await initTinyMDE("www.example.com/foo(bar)");
  expect(await editor.lineHTML(0)).toMatch(classTagRegExp("www.example.com/foo(bar)", "TMAutolink"));
  editor.destroy();
});

// Negative cases --------------------------------------------------------------------------------

test("a domain without a dot is NOT an autolink", async () => {
  const editor = await initTinyMDE("http://localhost/foo");
  expect(await editor.lineHTML(0)).not.toMatch("TMAutolink");
  editor.destroy();
});

test("a space ends a bare URL autolink", async () => {
  const editor = await initTinyMDE("www.example.com/foo bar");
  expect(await editor.lineText(0)).toEqual("www.example.com/foo bar");
  expect(await editor.lineHTML(0)).toMatch(classTagRegExp("www.example.com/foo", "TMAutolink"));
  expect(await editor.lineHTML(0)).not.toMatch(classTagRegExp("www.example.com/foo bar", "TMAutolink"));
  editor.destroy();
});

test("extended autolinks do not interfere with inline links", async () => {
  const editor = await initTinyMDE("[text](http://foo.bar/baz)");
  // The link destination is rendered as a TMLinkDestination, not an autolink.
  expect(await editor.lineHTML(0)).toMatch(/TMLinkDestination/);
  expect(await editor.lineHTML(0)).not.toMatch("TMAutolink");
  editor.destroy();
});

// Multi-line interaction ------------------------------------------------------------------------

test("a bare URL on one line of a paragraph does not leak onto the next line", async () => {
  const editor = await initTinyMDE("See www.example.com\nnext line");
  expect(await editor.lineHTML(0)).toMatch(classTagRegExp("www.example.com", "TMAutolink"));
  expect(await editor.lineText(0)).toEqual("See www.example.com");
  expect(await editor.lineText(1)).toEqual("next line");
  expect(await editor.content()).toEqual("See www.example.com\nnext line");
  editor.destroy();
});
