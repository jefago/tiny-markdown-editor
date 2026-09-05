test('Editor.destroy() removes the element it created itself from the DOM', async () => {
  const newPage = await global.context.newPage();
  await newPage.goto(PATH, { waitUntil: 'load' });
  await global.waitForTinyMDE(newPage);

  const result = await newPage.evaluate(() => {
    const tinyMDE = new TinyMDE.Editor({ element: 'tinymde' });
    const existedBefore = !!document.querySelector('.TinyMDE');
    tinyMDE.destroy();
    return { existedBefore, existsAfter: !!document.querySelector('.TinyMDE') };
  });

  expect(result.existedBefore).toBe(true);
  expect(result.existsAfter).toBe(false);
  newPage.close();
});

test('Editor.destroy() detaches (but does not remove) a caller-provided editor element', async () => {
  const newPage = await global.context.newPage();
  await newPage.goto(PATH, { waitUntil: 'load' });
  await global.waitForTinyMDE(newPage);

  const result = await newPage.evaluate(() => {
    const editorEl = document.createElement('div');
    document.body.appendChild(editorEl);
    const tinyMDE = new TinyMDE.Editor({ element: 'tinymde', editor: editorEl });
    tinyMDE.destroy();
    return {
      stillInDom: document.body.contains(editorEl),
      hasEditorClass: editorEl.classList.contains('TinyMDE'),
      contentEditable: editorEl.getAttribute('contenteditable'),
    };
  });

  expect(result.stillInDom).toBe(true);
  expect(result.hasEditorClass).toBe(false);
  expect(result.contentEditable).toBeNull();
  newPage.close();
});

test('Editor.destroy() empties and restores a caller-provided editor element', async () => {
  const newPage = await global.context.newPage();
  await newPage.goto(PATH, { waitUntil: 'load' });
  await global.waitForTinyMDE(newPage);

  const result = await newPage.evaluate(() => {
    const editorEl = document.createElement('div');
    editorEl.setAttribute('style', 'color: red;');
    document.body.appendChild(editorEl);
    const tinyMDE = new TinyMDE.Editor({
      element: 'tinymde',
      editor: editorEl,
      content: 'hello **world**\nsecond line',
    });
    const childrenBefore = editorEl.childNodes.length;
    tinyMDE.destroy();
    return {
      childrenBefore,
      childrenAfter: editorEl.childNodes.length,
      style: editorEl.getAttribute('style'),
    };
  });

  expect(result.childrenBefore).toBe(2);
  expect(result.childrenAfter).toBe(0);
  expect(result.style).toEqual('color: red;');
  newPage.close();
});

test('Editor.destroy() removes the style attribute it created on a caller-provided element', async () => {
  const newPage = await global.context.newPage();
  await newPage.goto(PATH, { waitUntil: 'load' });
  await global.waitForTinyMDE(newPage);

  const style = await newPage.evaluate(() => {
    const editorEl = document.createElement('div');
    document.body.appendChild(editorEl);
    const tinyMDE = new TinyMDE.Editor({ element: 'tinymde', editor: editorEl });
    tinyMDE.destroy();
    // WebKit reports "" for an absent style attribute, other browsers null.
    return editorEl.getAttribute('style') || null;
  });

  expect(style).toBeNull();
  newPage.close();
});

test('Editor.destroy() restores the linked textarea visibility', async () => {
  const newPage = await global.context.newPage();
  await newPage.goto(PATH, { waitUntil: 'load' });
  await global.waitForTinyMDE(newPage);

  const result = await newPage.evaluate(() => {
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    const tinyMDE = new TinyMDE.Editor({ element: 'tinymde', textarea: textarea });
    const hiddenBefore = textarea.style.display === 'none';
    tinyMDE.destroy();
    return { hiddenBefore, hiddenAfter: textarea.style.display === 'none' };
  });

  expect(result.hiddenBefore).toBe(true);
  expect(result.hiddenAfter).toBe(false);
  newPage.close();
});

test('Editor.destroy() restores the display value the textarea had before', async () => {
  const newPage = await global.context.newPage();
  await newPage.goto(PATH, { waitUntil: 'load' });
  await global.waitForTinyMDE(newPage);

  const result = await newPage.evaluate(() => {
    const withDisplay = document.createElement('textarea');
    withDisplay.style.display = 'inline-block';
    document.body.appendChild(withDisplay);
    new TinyMDE.Editor({ element: 'tinymde', textarea: withDisplay }).destroy();

    const withoutDisplay = document.createElement('textarea');
    document.body.appendChild(withoutDisplay);
    new TinyMDE.Editor({ element: 'tinymde', textarea: withoutDisplay }).destroy();

    return {
      restored: withDisplay.style.display,
      untouched: withoutDisplay.getAttribute('style'),
    };
  });

  expect(result.restored).toEqual('inline-block');
  expect(result.untouched).toEqual('');
  newPage.close();
});

test('Editor.destroy() removes the document-level selectionchange listener', async () => {
  const newPage = await global.context.newPage();
  await newPage.goto(PATH, { waitUntil: 'load' });
  await global.waitForTinyMDE(newPage);

  const result = await newPage.evaluate(() => {
    let added = 0;
    let removed = 0;
    const originalAdd = document.addEventListener.bind(document);
    const originalRemove = document.removeEventListener.bind(document);
    document.addEventListener = (type, ...args) => {
      if (type === 'selectionchange') added++;
      return originalAdd(type, ...args);
    };
    document.removeEventListener = (type, ...args) => {
      if (type === 'selectionchange') removed++;
      return originalRemove(type, ...args);
    };

    const tinyMDE = new TinyMDE.Editor({ element: 'tinymde' });
    tinyMDE.destroy();

    document.addEventListener = originalAdd;
    document.removeEventListener = originalRemove;
    return { added, removed };
  });

  expect(result.added).toBeGreaterThan(0);
  expect(result.removed).toEqual(result.added);
  newPage.close();
});

test('Editor.destroy() is safe to call more than once', async () => {
  const newPage = await global.context.newPage();
  await newPage.goto(PATH, { waitUntil: 'load' });
  await global.waitForTinyMDE(newPage);

  const promise = newPage.evaluate(() => {
    const tinyMDE = new TinyMDE.Editor({ element: 'tinymde' });
    tinyMDE.destroy();
    tinyMDE.destroy();
  });

  await expect(promise).resolves.not.toThrow();
  newPage.close();
});

test('CommandBar.destroy() removes its element and detaches from the editor', async () => {
  const newPage = await global.context.newPage();
  await newPage.goto(PATH, { waitUntil: 'load' });
  await global.waitForTinyMDE(newPage);

  const result = await newPage.evaluate(() => {
    const tinyMDE = new TinyMDE.Editor({ element: 'tinymde' });
    const commandBar = new TinyMDE.CommandBar({ element: 'tinymde_commandbar', editor: tinyMDE });
    const existedBefore = !!document.querySelector('.TMCommandBar');
    const selectionListenersBefore = tinyMDE.listeners.selection.length;

    commandBar.destroy();

    return {
      existedBefore,
      existsAfter: !!document.querySelector('.TMCommandBar'),
      selectionListenersBefore,
      selectionListenersAfter: tinyMDE.listeners.selection.length,
    };
  });

  expect(result.existedBefore).toBe(true);
  expect(result.existsAfter).toBe(false);
  expect(result.selectionListenersBefore).toBe(1);
  expect(result.selectionListenersAfter).toBe(0);
  newPage.close();
});

test('CommandBar.setEditor() detaches from the editor it was linked to before', async () => {
  const newPage = await global.context.newPage();
  await newPage.goto(PATH, { waitUntil: 'load' });
  await global.waitForTinyMDE(newPage);

  const result = await newPage.evaluate(() => {
    const first = new TinyMDE.Editor({ element: 'tinymde' });
    const second = new TinyMDE.Editor({ element: 'tinymde' });
    const commandBar = new TinyMDE.CommandBar({
      element: 'tinymde_commandbar',
      editor: first,
    });

    commandBar.setEditor(second);

    const afterSwitch = {
      first: first.listeners.selection.length,
      second: second.listeners.selection.length,
    };

    commandBar.destroy();

    return {
      afterSwitch,
      afterDestroy: {
        first: first.listeners.selection.length,
        second: second.listeners.selection.length,
      },
    };
  });

  expect(result.afterSwitch).toEqual({ first: 0, second: 1 });
  expect(result.afterDestroy).toEqual({ first: 0, second: 0 });
  newPage.close();
});
