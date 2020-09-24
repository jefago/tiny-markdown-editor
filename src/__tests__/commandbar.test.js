beforeEach(async () => {
  await page.goto(PATH, { waitUntil: 'load'});
});

test('Basic command bar setup works', async () => {
  await page.evaluate(() => {
    const tinyMDE = new TinyMDE.Editor({element: 'tinymde'});
    const commandBar = new TinyMDE.CommandBar({element: 'tinymde_commandbar', editor: tinyMDE}); 
  });
  expect(await page.$eval('#tinymde_commandbar > :first-child', el => el.className)).toEqual('TMCommandBar');
});

test('Customized command bar setup works: selecting commands', async () => {
  const commands = ['bold', 'italic', '|', 'strikethrough'];
  await page.evaluate((commands) => {
    const tinyMDE = new TinyMDE.Editor({element: 'tinymde'});
    const commandBar = new TinyMDE.CommandBar({element: 'tinymde_commandbar', editor: tinyMDE, commands: commands})
  }, commands);
  expect(await page.$eval('.TMCommandBar > :nth-child(1)', el => el.title)).toMatch(/Bold/);
  expect(await page.$eval('.TMCommandBar > :nth-child(2)', el => el.title)).toMatch(/Italic/);
  expect(await page.$eval('.TMCommandBar > :nth-child(3)', el => el.className)).toMatch(/TMCommandDivider/);
  expect(await page.$eval('.TMCommandBar > :nth-child(4)', el => el.title)).toMatch(/Strikethrough/);
});

test('Customized command bar setup works: referencing commands', async () => {
  const commands = [{name: 'bold', innerHTML: 'X'}, 'italic', '|', 'strikethrough'];
  await page.evaluate((commands) => {
    const tinyMDE = new TinyMDE.Editor({element: 'tinymde'});
    const commandBar = new TinyMDE.CommandBar({element: 'tinymde_commandbar', editor: tinyMDE, commands: commands})
  }, commands);
  expect(await page.$eval('.TMCommandBar > :nth-child(1)', el => el.title)).toMatch(/Bold/);
  expect(await page.$eval('.TMCommandBar > :nth-child(1)', el => el.innerHTML)).toEqual(commands[0].innerHTML);
});

test('Command bar buttons can be clicked', async () => {
  await page.evaluate(() => {
    document.tinyMDE = new TinyMDE.Editor({element: 'tinymde', content: 'XXXA'});
    document.commandBar = new TinyMDE.CommandBar({element: 'tinymde_commandbar', editor: document.tinyMDE, commands: ['h1']}); 
    document.getElementById('tinymde').firstChild.focus();
  });
  await page.mouse.click(12, 12)

  expect(await page.evaluate(() => document.tinyMDE.getContent())).toEqual('# XXXA');
});

test('Keyboard shortcuts work', async () => {
  await page.evaluate(() => {
    document.tinyMDE = new TinyMDE.Editor({element: 'tinymde', content: 'This is a test'});
    document.commandBar = new TinyMDE.CommandBar({element: 'tinymde_commandbar', editor: document.tinyMDE, commands: [{name: 'bold', hotkey: 'Ctrl-B'}]}); // Manually setting ctrl-B as shortcut so this works on all platforms
    document.getElementById('tinymde').firstChild.focus();
  });
  await select(page, 0, 5, 0, 7); // Select "is"
  await page.keyboard.down('ControlLeft');
  await page.keyboard.press('KeyB');
  await page.keyboard.up('ControlLeft');
  expect(await page.evaluate(() => document.tinyMDE.getContent())).toEqual('This **is** a test');

});
