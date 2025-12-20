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

test('Clicking command bar fires change event', async () => {
  await page.evaluate(() => {
    window.listenerCalled = false;
    const listener = () => {
      window.listenerCalled = true;
    }
    document.tinyMDE = new TinyMDE.Editor({element: 'tinymde', content: 'XXXA'});
    document.tinyMDE.addEventListener('change', listener);
    document.commandBar = new TinyMDE.CommandBar({element: 'tinymde_commandbar', editor: document.tinyMDE, commands: ['h1']}); 
    document.getElementById('tinymde').firstChild.focus();
  });
  await page.mouse.click(12, 12)

  expect(await page.evaluate(() => { return  window.listenerCalled; })).toBe(true);
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

test('Minimal custom command works', async () => {
  await page.evaluate(() => {
    document.tinyMDE = new TinyMDE.Editor({element: 'tinymde', content: 'This\nis\na\ntest'});
    document.commandBar = new TinyMDE.CommandBar({element: 'tinymde_commandbar', editor: document.tinyMDE, commands: [{name: 'X', innerHTML: 'X', action: editor => editor.setContent('XXXA')}]}); 
    document.getElementById('tinymde').firstChild.focus();
  });
  await page.mouse.click(12, 12)
  expect(await page.evaluate(() => document.tinyMDE.getContent())).toEqual('XXXA');

});

test('Custom command title defaults to name', async () => {
  await page.evaluate(() => {
    document.tinyMDE = new TinyMDE.Editor({element: 'tinymde', content: 'This\nis\na\ntest'});
    document.commandBar = new TinyMDE.CommandBar({element: 'tinymde_commandbar', editor: document.tinyMDE, commands: [{name: 'X', innerHTML: 'X', action: editor => editor.setContent('XXXA')}]});
    document.getElementById('tinymde').firstChild.focus();
  });
  expect(await page.$eval('#tinymde_commandbar', (el) => el.firstChild.firstChild.title)).toEqual('X');

});

test('Clicking h1 button after losing focus applies to line with cursor', async () => {
  await page.evaluate(() => {
    document.tinyMDE = new TinyMDE.Editor({element: 'tinymde', content: ''});
    document.commandBar = new TinyMDE.CommandBar({element: 'tinymde_commandbar', editor: document.tinyMDE, commands: ['h1']});
    newEl = document.createElement('div');
    newEl.style.height = '2000px';
    newEl.id = 'spacer';
    document.body.appendChild(newEl); // Make page taller to allow clicking outside editor
  });

  // Focus the editor and type "Line 1\nLine 2"
  await page.click('.TinyMDE');
  await page.keyboard.type('Line 1');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Line 2');


  // Click outside to lose focus
  await page.click('#spacer');

  // Click the h1 button
  await page.click('.TMCommandButton');

  // Should apply h1 to Line 2 (where cursor was)
  expect(await page.evaluate(() => document.tinyMDE.getContent())).toEqual('Line 1\n# Line 2');
});

test('Keyboard shortcuts only apply to focused editor with multiple editors', async () => {
  await page.evaluate(() => {
    // Create first editor and command bar
    const editor1Container = document.createElement('div');
    editor1Container.id = 'editor1';
    document.body.appendChild(editor1Container);

    const commandBar1Container = document.createElement('div');
    commandBar1Container.id = 'commandbar1';
    document.body.appendChild(commandBar1Container);

    document.editor1 = new TinyMDE.Editor({element: 'editor1', content: 'Editor 1 content'});
    document.commandBar1 = new TinyMDE.CommandBar({element: 'commandbar1', editor: document.editor1, commands: [{name: 'bold', hotkey: 'Ctrl-B'}]});

    // Create second editor and command bar
    const editor2Container = document.createElement('div');
    editor2Container.id = 'editor2';
    document.body.appendChild(editor2Container);

    const commandBar2Container = document.createElement('div');
    commandBar2Container.id = 'commandbar2';
    document.body.appendChild(commandBar2Container);

    document.editor2 = new TinyMDE.Editor({element: 'editor2', content: 'Editor 2 content'});
    document.commandBar2 = new TinyMDE.CommandBar({element: 'commandbar2', editor: document.editor2, commands: [{name: 'bold', hotkey: 'Ctrl-B'}]});
  });

  // Focus first editor and select text
  await page.click('#editor1 .TinyMDE');
  await page.evaluate(() => {
    document.editor1.setSelection({row: 0, col: 0}, {row: 0, col: 6}); // Select "Editor"
  });

  // Apply bold with keyboard shortcut
  await page.keyboard.down('ControlLeft');
  await page.keyboard.press('KeyB');
  await page.keyboard.up('ControlLeft');

  // Verify first editor was updated, second was not
  expect(await page.evaluate(() => document.editor1.getContent())).toEqual('**Editor** 1 content');
  expect(await page.evaluate(() => document.editor2.getContent())).toEqual('Editor 2 content');

  // Now focus second editor and select text
  await page.click('#editor2 .TinyMDE');
  await page.evaluate(() => {
    document.editor2.setSelection({row: 0, col: 0}, {row: 0, col: 6}); // Select "Editor"
  });

  // Apply bold with keyboard shortcut
  await page.keyboard.down('ControlLeft');
  await page.keyboard.press('KeyB');
  await page.keyboard.up('ControlLeft');

  // Verify second editor was updated, first remains unchanged
  expect(await page.evaluate(() => document.editor1.getContent())).toEqual('**Editor** 1 content');
  expect(await page.evaluate(() => document.editor2.getContent())).toEqual('**Editor** 2 content');
});