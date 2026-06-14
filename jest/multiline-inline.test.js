// Tests for inline styles (bold, italic, strikethrough, ...) that span more than one source line
// within a single paragraph (GitHub issue #166). Consecutive paragraph lines form a single
// CommonMark paragraph joined by soft line breaks, so emphasis opened on one line can be closed
// on a later line. Each line is still rendered into its own block element, so any element that
// straddles a line break is closed at the end of one line and re-opened at the start of the next.

test("strong emphasis spanning two lines is detected on both lines", async () => {
  const editor = await initTinyMDE("**dolore\nmagna**");
  // Opening line: the run starts here and is left open at the line break.
  expect(await editor.lineHTML(0)).toMatch(/<strong[^>]*>dolore<\/strong>/);
  // Closing line: the run is re-opened at the start and closed here.
  expect(await editor.lineHTML(1)).toMatch(/<strong[^>]*>magna<\/strong>/);
  editor.destroy();
});

test("emphasis spanning two lines is detected on both lines", async () => {
  const editor = await initTinyMDE("*dolore\nmagna*");
  expect(await editor.lineHTML(0)).toMatch(/<em[^>]*>dolore<\/em>/);
  expect(await editor.lineHTML(1)).toMatch(/<em[^>]*>magna<\/em>/);
  editor.destroy();
});

test("strikethrough spanning two lines is detected on both lines", async () => {
  const editor = await initTinyMDE("~~dolore\nmagna~~");
  expect(await editor.lineHTML(0)).toMatch(/<del[^>]*>dolore<\/del>/);
  expect(await editor.lineHTML(1)).toMatch(/<del[^>]*>magna<\/del>/);
  editor.destroy();
});

test("the example from issue #166 is rendered correctly", async () => {
  const editor = await initTinyMDE(
    "Lorem **ipsum** dolor sit amet, consectetur adipiscing elit,\n" +
      "sed do eiusmod tempor incididunt ut labore et **dolore\n" +
      "magna** aliqua."
  );
  // "ipsum" is bold and fully contained on the first line.
  expect(await editor.lineHTML(0)).toMatch(/<strong[^>]*>ipsum<\/strong>/);
  // "dolore magna" is bold across the second and third lines.
  expect(await editor.lineHTML(1)).toMatch(/<strong[^>]*>dolore<\/strong>/);
  expect(await editor.lineHTML(2)).toMatch(/<strong[^>]*>magna<\/strong>/);
  editor.destroy();
});

test("emphasis spanning three lines is detected on every line", async () => {
  const editor = await initTinyMDE("*aaa\nbbb\nccc*");
  expect(await editor.lineHTML(0)).toMatch(/<em[^>]*>aaa<\/em>/);
  expect(await editor.lineHTML(1)).toMatch(/<em[^>]*>bbb<\/em>/);
  expect(await editor.lineHTML(2)).toMatch(/<em[^>]*>ccc<\/em>/);
  editor.destroy();
});

test("each rendered line's text content still equals the source line", async () => {
  const editor = await initTinyMDE("a **bold\ntext** b");
  // The marks stay on the line they were typed on, so the text content is unchanged.
  expect(await editor.lineText(0)).toEqual("a **bold");
  expect(await editor.lineText(1)).toEqual("text** b");
  editor.destroy();
});

test("emphasis does not span across a blank line (paragraph boundary)", async () => {
  const editor = await initTinyMDE("**dolore\n\nmagna**");
  // Each paragraph is parsed on its own; neither delimiter has a partner, so no <strong>.
  expect(await editor.lineHTML(0)).not.toMatch(/<strong/);
  expect(await editor.lineHTML(2)).not.toMatch(/<strong/);
  editor.destroy();
});

test("emphasis does not span across a heading", async () => {
  const editor = await initTinyMDE("**dolore\n# Heading\nmagna**");
  expect(await editor.lineHTML(0)).not.toMatch(/<strong/);
  expect(await editor.lineHTML(2)).not.toMatch(/<strong/);
  editor.destroy();
});

test("nested emphasis spanning a line break is rebalanced on both lines", async () => {
  const editor = await initTinyMDE("**_aaa\nbbb_**");
  expect(await editor.lineHTML(0)).toMatch(/<strong[^>]*>.*<em[^>]*>aaa<\/em>.*<\/strong>/);
  expect(await editor.lineHTML(1)).toMatch(/<strong[^>]*>.*<em[^>]*>bbb<\/em>.*<\/strong>/);
  editor.destroy();
});

test("an unclosed delimiter across lines stays literal on both lines", async () => {
  const editor = await initTinyMDE("**dolore\nmagna");
  expect(await editor.lineHTML(0)).not.toMatch(/<strong/);
  expect(await editor.lineHTML(1)).not.toMatch(/<strong/);
  expect(await editor.lineText(0)).toEqual("**dolore");
  expect(await editor.lineText(1)).toEqual("magna");
  editor.destroy();
});

test("a single-line paragraph still renders emphasis as before", async () => {
  const editor = await initTinyMDE("just *one* line");
  expect(await editor.lineHTML(0)).toMatch(/<em[^>]*>one<\/em>/);
  editor.destroy();
});
