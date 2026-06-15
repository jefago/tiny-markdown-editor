// Tests for GFM task list items: list items whose content begins with a checkbox marker `[ ]`,
// `[x]` or `[X]` followed by whitespace. See https://github.github.com/gfm/#task-list-items-
//
// Only the inner character (space / x / X) is rendered as a checkbox (a `TMCheckbox` span); the
// brackets and separator stay as ordinary `TMMark` text. The line type stays TMUL/TMOL and the
// rendered line's text content still equals the source, so the markdown round-trips and the cursor
// navigates the marker normally. Clicking the checkbox toggles it.

// Recognition --------------------------------------------------------------------------------

test("unchecked task items are recognized in unordered lists", async () => {
  const testCases = ["- [ ] item", "* [ ] item", "+ [ ] item", "   - [ ] item"];
  for (let testCase of testCases) {
    const editor = await initTinyMDE(testCase);
    expect(await editor.lineType(0)).toMatch("TMUL");
    expect(await editor.lineHTML(0)).toMatch(/class\s*=\s*["'][^"']*TMCheckbox_unchecked/);
    editor.destroy();
  }
});

test("checked task items are recognized (x and X)", async () => {
  for (let testCase of ["- [x] item", "- [X] item"]) {
    const editor = await initTinyMDE(testCase);
    expect(await editor.lineType(0)).toMatch("TMUL");
    expect(await editor.lineHTML(0)).toMatch(/class\s*=\s*["'][^"']*TMCheckbox_checked/);
    editor.destroy();
  }
});

test("task items are recognized in ordered lists", async () => {
  for (let testCase of ["1. [ ] item", "1) [x] item"]) {
    const editor = await initTinyMDE(testCase);
    expect(await editor.lineType(0)).toMatch("TMOL");
    expect(await editor.lineHTML(0)).toMatch(/TMCheckbox/);
    editor.destroy();
  }
});

test("the brackets remain present as TMMark text", async () => {
  const editor = await initTinyMDE("- [ ] item");
  expect(await editor.lineHTML(0)).toMatch(classTagRegExp("[", "TMMark_TMTask"));
  expect(await editor.lineHTML(0)).toMatch(classTagRegExp("]", "TMMark_TMTask"));
  editor.destroy();
});

test("inline formatting inside a task item is parsed", async () => {
  const editor = await initTinyMDE("- [ ] buy *milk*");
  expect(await editor.lineHTML(0)).toMatch(classTagRegExp("milk", "TMEm", "em"));
  editor.destroy();
});

test("an empty task item (no content) is recognized", async () => {
  const editor = await initTinyMDE("- [ ]");
  expect(await editor.lineType(0)).toMatch("TMUL");
  expect(await editor.lineHTML(0)).toMatch(/TMCheckbox_unchecked/);
  expect(await editor.content()).toEqual("- [ ]");
  editor.destroy();
});

// Text content / round-trip invariant ---------------------------------------------------------

test("rendered text content equals the source line", async () => {
  for (let src of ["- [ ] item", "- [x] item", "1. [X] do it"]) {
    const editor = await initTinyMDE(src);
    expect(await editor.lineText(0)).toEqual(src);
    expect(await editor.content()).toEqual(src);
    editor.destroy();
  }
});

// Negative cases -----------------------------------------------------------------------------

test("a marker without a following separator is NOT a task item", async () => {
  const editor = await initTinyMDE("- [x]done");
  expect(await editor.lineType(0)).toMatch("TMUL");
  expect(await editor.lineHTML(0)).not.toMatch("TMCheckbox");
  editor.destroy();
});

test("a marker not at the start of the content is NOT a task item", async () => {
  const editor = await initTinyMDE("- foo [ ] bar");
  expect(await editor.lineHTML(0)).not.toMatch("TMCheckbox");
  editor.destroy();
});

test("a link at the start of a list item is NOT treated as a checkbox", async () => {
  const editor = await initTinyMDE("- [text](http://example.com)");
  expect(await editor.lineHTML(0)).not.toMatch("TMCheckbox");
  expect(await editor.lineHTML(0)).toMatch(/TMLinkDestination/);
  editor.destroy();
});

// Multi-line continuation --------------------------------------------------------------------

test("inline styles span a task item and its lazy continuation line", async () => {
  const editor = await initTinyMDE("- [ ] a *b\nc* d");
  expect(await editor.lineHTML(0)).toMatch(/<em[^>]*>b<\/em>/);
  expect(await editor.lineHTML(1)).toMatch(/<em[^>]*>c<\/em>/);
  // Only the leader line carries the checkbox.
  expect(await editor.lineHTML(0)).toMatch(/TMCheckbox/);
  expect(await editor.lineHTML(1)).not.toMatch("TMCheckbox");
  expect(await editor.content()).toEqual("- [ ] a *b\nc* d");
  editor.destroy();
});

// Click to toggle ----------------------------------------------------------------------------

test("clicking an unchecked checkbox checks it", async () => {
  const editor = await initTinyMDE("- [ ] item");
  await editor.clickCheckbox(0);
  expect(await editor.content()).toEqual("- [x] item");
  expect(await editor.lineHTML(0)).toMatch(/TMCheckbox_checked/);
  editor.destroy();
});

test("clicking a checked checkbox unchecks it", async () => {
  const editor = await initTinyMDE("- [x] item");
  await editor.clickCheckbox(0);
  expect(await editor.content()).toEqual("- [ ] item");
  expect(await editor.lineHTML(0)).toMatch(/TMCheckbox_unchecked/);
  editor.destroy();
});

test("toggling a checkbox is undoable", async () => {
  const editor = await initTinyMDE("- [ ] item");
  await editor.clickCheckbox(0);
  expect(await editor.content()).toEqual("- [x] item");
  await editor.undo();
  expect(await editor.content()).toEqual("- [ ] item");
  editor.destroy();
});

test("toggling preserves the rest of the line", async () => {
  const editor = await initTinyMDE("- [ ] a [link](http://x.com) b");
  await editor.clickCheckbox(0);
  expect(await editor.content()).toEqual("- [x] a [link](http://x.com) b");
  editor.destroy();
});
