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
