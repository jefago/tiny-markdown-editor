beforeEach(async () => {
  await page.goto(PATH, { waitUntil: 'load'});
});

test('Bulleted list is continued when pressing enter', async () => {
  await page.evaluate(() => {
    document.tinyMDE = new TinyMDE.Editor({element: 'tinymde', content: '- Line 1\n- Line 2'});
    document.getElementById('tinymde').firstChild.focus();
  });
  await select(page, 1, 8);
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => document.tinyMDE.getContent())).toEqual('- Line 1\n- Line 2\n- ');
});

test('Numbered list is continued when pressing enter', async () => {
  await page.evaluate(() => {
    document.tinyMDE = new TinyMDE.Editor({element: 'tinymde', content: '1) Line 1\n2) Line 2'});
    document.getElementById('tinymde').firstChild.focus();
  });
  await select(page, 1, 9);
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => document.tinyMDE.getContent())).toEqual('1) Line 1\n2) Line 2\n3) ');
});

test('Pasting works without a focus', async () => {
  await page.evaluate(() => {
    document.tinyMDE = new TinyMDE.Editor({element: 'tinymde', content: 'This is\na test'});
    document.tinyMDE.paste(' for\npasting');
  });
  expect(await page.evaluate(() => document.tinyMDE.getContent())).toEqual('This is\na test for\npasting');
})