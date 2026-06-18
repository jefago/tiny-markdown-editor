// Tests for the task-list toolbar command: editor.toggleTaskList(), the isTaskListItem() predicate
// that drives the button's active state, and the presence of the button in the default toolbar.

beforeEach(async () => {
  await page.goto(PATH, { waitUntil: "load" });
});

const initEditor = async (content) => {
  await page.evaluate((content) => {
    document.tinyMDE = new TinyMDE.Editor({ element: "tinymde", content });
    document.getElementById("tinymde").firstChild.focus();
  }, content);
};

const toggle = () => page.evaluate(() => document.tinyMDE.toggleTaskList());
const content = () => page.evaluate(() => document.tinyMDE.getContent());

test("toggleTaskList turns a plain paragraph into an unchecked task item", async () => {
  await initEditor("Buy milk");
  await select(page, 0, 0);
  await toggle();
  expect(await content()).toEqual("- [ ] Buy milk");
});

test("toggleTaskList on a bulleted list item adds a checkbox and keeps the bullet", async () => {
  await initEditor("- Buy milk");
  await select(page, 0, 2);
  await toggle();
  expect(await content()).toEqual("- [ ] Buy milk");
});

test("toggleTaskList on an ordered list item keeps the number", async () => {
  await initEditor("1. Buy milk");
  await select(page, 0, 3);
  await toggle();
  expect(await content()).toEqual("1. [ ] Buy milk");
});

test("toggleTaskList removes the checkbox when the line is already a task item", async () => {
  await initEditor("- [ ] Buy milk");
  await select(page, 0, 6);
  await toggle();
  expect(await content()).toEqual("- Buy milk");
});

test("toggleTaskList preserves a checked checkbox's text when toggling off", async () => {
  await initEditor("- [x] Buy milk");
  await select(page, 0, 6);
  await toggle();
  expect(await content()).toEqual("- Buy milk");
});

test("toggleTaskList sets checkboxes across a multi-line selection", async () => {
  await initEditor("First\nSecond");
  await select(page, 0, 0, 1, 6);
  await toggle();
  expect(await content()).toEqual("- [ ] First\n- [ ] Second");
});

test("toggleTaskList removes checkboxes across a selection when all lines are tasks", async () => {
  await initEditor("- [ ] First\n- [x] Second");
  await select(page, 0, 0, 1, 12);
  await toggle();
  expect(await content()).toEqual("- First\n- Second");
});

test("toggleTaskList sets checkboxes when only some selected lines are already tasks", async () => {
  await initEditor("- [ ] First\n- Second");
  await select(page, 0, 0, 1, 8);
  await toggle();
  // Not every line was a task, so the toggle sets (rather than clears): the second line gains one.
  expect(await content()).toEqual("- [ ] First\n- [ ] Second");
});

test("isTaskListItem reports task lines but not plain list items", async () => {
  await initEditor("- [ ] a task\n- a plain item\njust a paragraph");
  expect(await page.evaluate(() => document.tinyMDE.isTaskListItem(0))).toBe(true);
  expect(await page.evaluate(() => document.tinyMDE.isTaskListItem(1))).toBe(false);
  expect(await page.evaluate(() => document.tinyMDE.isTaskListItem(2))).toBe(false);
});

test("the default toolbar includes a Task list button", async () => {
  await page.evaluate(() => {
    const editor = new TinyMDE.Editor({ element: "tinymde" });
    new TinyMDE.CommandBar({ element: "tinymde_commandbar", editor });
  });
  const titles = await page.$$eval(".TMCommandBar > .TMCommandButton", (els) =>
    els.map((el) => el.title)
  );
  // The title carries an optional hotkey suffix, e.g. "Task list (Alt+⇧+T)".
  expect(titles.some((t) => /^Task list\b/.test(t))).toBe(true);
});
