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
