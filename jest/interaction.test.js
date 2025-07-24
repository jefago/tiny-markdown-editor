beforeEach(async () => {
  await page.goto(PATH, { waitUntil: "load" });
});

test("Bulleted list is continued when pressing enter", async () => {
  await page.evaluate(() => {
    document.tinyMDE = new TinyMDE.Editor({
      element: "tinymde",
      content: "- Line 1\n- Line 2",
    });
    document.getElementById("tinymde").firstChild.focus();
  });
  await select(page, 1, 8);
  await page.keyboard.press("Enter");
  expect(await page.evaluate(() => document.tinyMDE.getContent())).toEqual(
    "- Line 1\n- Line 2\n- "
  );
});

test("Numbered list is continued when pressing enter", async () => {
  await page.evaluate(() => {
    document.tinyMDE = new TinyMDE.Editor({
      element: "tinymde",
      content: "1) Line 1\n2) Line 2",
    });
    document.getElementById("tinymde").firstChild.focus();
  });
  await select(page, 1, 9);
  await page.keyboard.press("Enter");
  expect(await page.evaluate(() => document.tinyMDE.getContent())).toEqual(
    "1) Line 1\n2) Line 2\n3) "
  );
});

test("Pasting works without a focus", async () => {
  await page.evaluate(() => {
    document.tinyMDE = new TinyMDE.Editor({
      element: "tinymde",
      content: "This is\na test",
    });
    document.tinyMDE.paste(" for\npasting");
  });
  expect(await page.evaluate(() => document.tinyMDE.getContent())).toEqual(
    "This is\na test for\npasting"
  );
});

test("Undo and redo via API methods", async () => {
  await page.evaluate(() => {
    document.tinyMDE = new TinyMDE.Editor({
      element: "tinymde",
      content: "First line",
    });
    document.getElementById("tinymde").firstChild.focus();
  });
  // Add text
  await select(page, 0, 10);
  await page.keyboard.type("\nSecond line");
  expect(await page.evaluate(() => document.tinyMDE.getContent())).toEqual(
    "First line\nSecond line"
  );
  // Undo
  await page.evaluate(() => document.tinyMDE.undo());
  expect(await page.evaluate(() => document.tinyMDE.getContent())).toEqual(
    "First line\nSecond lin"
  );
  // Redo
  await page.evaluate(() => document.tinyMDE.redo());
  expect(await page.evaluate(() => document.tinyMDE.getContent())).toEqual(
    "First line\nSecond line"
  );
});

test("Undo and redo via keyboard shortcuts", async () => {
  await page.evaluate(() => {
    document.tinyMDE = new TinyMDE.Editor({
      element: "tinymde",
      content: "Alpha",
    });
    document.getElementById("tinymde").firstChild.focus();
  });
  // Add text
  await select(page, 0, 5);
  await page.keyboard.type("\nBeta");
  expect(await page.evaluate(() => document.tinyMDE.getContent())).toEqual(
    "Alpha\nBeta"
  );
  // Undo (Ctrl/Cmd+Z)
  await page.keyboard.down(process.platform === "darwin" ? "Meta" : "Control");
  await page.keyboard.press("z");
  await page.keyboard.up(process.platform === "darwin" ? "Meta" : "Control");
  expect(await page.evaluate(() => document.tinyMDE.getContent())).toEqual(
    "Alpha\nBet"
  );
  // Redo (Ctrl/Cmd+Shift+Z)
  await page.keyboard.down(process.platform === "darwin" ? "Meta" : "Control");
  await page.keyboard.down("Shift");
  await page.keyboard.press("z");
  await page.keyboard.up("Shift");
  await page.keyboard.up(process.platform === "darwin" ? "Meta" : "Control");
  expect(await page.evaluate(() => document.tinyMDE.getContent())).toEqual(
    "Alpha\nBeta"
  );
  // Undo again
  await page.keyboard.down(process.platform === "darwin" ? "Meta" : "Control");
  await page.keyboard.press("z");
  await page.keyboard.up(process.platform === "darwin" ? "Meta" : "Control");
  // Redo (Ctrl/Cmd+Y)
  await page.keyboard.down(process.platform === "darwin" ? "Meta" : "Control");
  await page.keyboard.press("y");
  await page.keyboard.up(process.platform === "darwin" ? "Meta" : "Control");
  expect(await page.evaluate(() => document.tinyMDE.getContent())).toEqual(
    "Alpha\nBeta"
  );
});

test("Bold command applies formatting and preserves selection", async () => {
  await page.evaluate(() => {
    document.tinyMDE = new TinyMDE.Editor({ element: "tinymde", content: "" });
    document.getElementById("tinymde").firstChild.focus();
  });
  // Type some text
  await page.keyboard.type("Hello world");
  // Select 'world'
  await select(page, 0, 6, 0, 11);
  // Apply bold command
  await page.evaluate(() => document.tinyMDE.setCommandState("bold", true));
  // Check that the content is bolded
  expect(await page.evaluate(() => document.tinyMDE.getContent())).toEqual(
    "Hello **world**"
  );
  // Check that the selection is still on the bolded text
  const selection = await page.evaluate(() => {
    const sel = window.getSelection();
    return {
      anchorOffset: sel.anchorOffset,
      focusOffset: sel.focusOffset,
      anchorNodeText: sel.anchorNode && sel.anchorNode.textContent,
      focusNodeText: sel.focusNode && sel.focusNode.textContent,
    };
  });
  // The selection should be on the bolded word
  expect(selection.anchorNodeText).toContain("world");
  expect(selection.focusNodeText).toContain("world");
  expect(selection.focusOffset).toBe(0);
  expect(selection.anchorOffset).toBe(5);
});

test("Bold command applies formatting and preserves selection when selecting backwards", async () => {
  await page.evaluate(() => {
    document.tinyMDE = new TinyMDE.Editor({ element: "tinymde", content: "" });
    document.getElementById("tinymde").firstChild.focus();
  });
  // Type some text
  await page.keyboard.type("Hello world");
  // Select 'world'
  await select(page, 0, 11, 0, 6);
  // Apply bold command
  await page.evaluate(() => document.tinyMDE.setCommandState("bold", true));
  // Check that the content is bolded
  expect(await page.evaluate(() => document.tinyMDE.getContent())).toEqual(
    "Hello **world**"
  );
  // Check that the selection is still on the bolded text
  const selection = await page.evaluate(() => {
    const sel = window.getSelection();
    return {
      anchorOffset: sel.anchorOffset,
      focusOffset: sel.focusOffset,
      anchorNodeText: sel.anchorNode && sel.anchorNode.textContent,
      focusNodeText: sel.focusNode && sel.focusNode.textContent,
    };
  });
  // The selection should be on the bolded word
  expect(selection.anchorNodeText).toContain("world");
  expect(selection.focusNodeText).toContain("world");
  expect(selection.focusOffset).toBe(0);
  expect(selection.anchorOffset).toBe(5);
});

test("Can undo bold command and preserve selection", async () => {
  await page.evaluate(() => {
    document.tinyMDE = new TinyMDE.Editor({ element: "tinymde", content: "" });
    document.getElementById("tinymde").firstChild.focus();
  });
  // Type some text
  await page.keyboard.type("Hello world");
  // Select 'world'
  await select(page, 0, 6, 0, 11);
  // Apply bold command
  await page.evaluate(() => document.tinyMDE.setCommandState("bold", true));
  // Check that the content is bolded
  expect(await page.evaluate(() => document.tinyMDE.getContent())).toEqual(
    "Hello **world**"
  );
  // Undo bold command
  await page.evaluate(() => document.tinyMDE.undo());
  // Check that the content is not bolded
  expect(await page.evaluate(() => document.tinyMDE.getContent())).toEqual(
    "Hello world"
  );
  // Check that the selection is still on the bolded text
  const selection = await page.evaluate(() => {
    const sel = window.getSelection();
    return {
      anchorOffset: sel.anchorOffset,
      focusOffset: sel.focusOffset,
      anchorNodeText: sel.anchorNode && sel.anchorNode.textContent,
      focusNodeText: sel.focusNode && sel.focusNode.textContent,
    };
  });
  // The selection should be on the bolded word
  expect(selection.anchorNodeText).toContain("Hello world");
  expect(selection.focusNodeText).toContain("Hello world");
  expect(selection.focusOffset).toBe(6);
  expect(selection.anchorOffset).toBe(11);
});

test("Deleting a blank line ends up with the selection in the right place", async () => {
  await page.evaluate(() => {
    document.tinyMDE = new TinyMDE.Editor({
      element: "tinymde",
      content: "Line 1\n\nLine 2\n\nLine 3",
    });
    document.getElementById("tinymde").firstChild.focus();
    document.tinyMDE.setSelection({row: 1, col: 0})
  });
  // Type some text
  await page.keyboard.press("Delete");
  await page.keyboard.up("Delete");
  expect(await page.evaluate(() => document.tinyMDE.getSelection())).toEqual(
    { row: 1, col: 0 }
  );
});
