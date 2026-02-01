
test('sets up correctly when passed an ID', async () => {
  const newPage = await global.context.newPage();
  await newPage.goto(PATH, { waitUntil: 'load'});

  await newPage.evaluate(() => {
    const tinyMDE = new TinyMDE.Editor({element: 'tinymde'});
  })
  expect(await newPage.$eval('#tinymde > :first-child', el => el.className)).toBe('TinyMDE');
  newPage.close();
});

test('sets up correctly when passed an element', async () => {
  const newPage = await global.context.newPage();
  await newPage.goto(PATH, { waitUntil: 'load'});

  await newPage.evaluate(() => {
    const tinyMDE = new TinyMDE.Editor({element: document.getElementById('tinymde')});
  })
  expect(await newPage.$eval('#tinymde > :first-child', el => el.className)).toBe('TinyMDE');
  newPage.close();
});

test('sets up correctly when passed a textarea ID as element', async () => {
  const newPage = await global.context.newPage();
  await newPage.goto(PATH, { waitUntil: 'load'});
  await newPage.$eval('#tinymde', el => el.innerHTML = '<textarea id="txt"></textarea>');
  await newPage.evaluate(() => {
    const tinyMDE = new TinyMDE.Editor({element: document.getElementById('txt')});
  })
  expect(await newPage.$eval('#tinymde > :last-child', el => el.className)).toBe('TinyMDE');
  expect(await newPage.$eval('#tinymde > :first-child', el => el.tagName)).toBe('TEXTAREA');
  expect(await newPage.$eval('#txt', el => el.style.display)).toBe('none');
  newPage.close();
});

test('sets up correctly when passed an element AND a textarea', async () => {
  const newPage = await global.context.newPage();
  await newPage.goto(PATH, { waitUntil: 'load'});
  await newPage.$eval('#tinymde', el => el.innerHTML = '<textarea id="txt"></textarea>');

  await newPage.evaluate(() => {
    const tinyMDE = new TinyMDE.Editor({element: 'tinymde', textarea: 'txt'});
  })
  expect(await newPage.$eval('#tinymde > :last-child', el => el.className)).toBe('TinyMDE');
  expect(await newPage.$eval('#txt', el => el.style.display)).toBe('none');

  newPage.close();
});


test('Content can be passed to constructor', async () => {
  const newPage = await global.context.newPage();
  await newPage.goto(PATH, { waitUntil: 'load'});

  const content = '# XXXA\nXXXB *XXXC*';

  const tinymdeContent = await newPage.evaluate((content) => {
    const tinyMDE = new TinyMDE.Editor({element: 'tinymde', content: content});
    return tinyMDE.getContent();
  }, content);

  expect(tinymdeContent).toEqual(content);
  newPage.close();
});

test('Content can be passed from textarea', async () => {
  const newPage = await global.context.newPage();
  await newPage.goto(PATH, { waitUntil: 'load'});

  const content = '# XXXA';

  const tinymdeContent = await newPage.evaluate((content) => {
    const textarea = document.createElement('textarea');
    textarea.value = content;
    document.body.appendChild(textarea);
    const tinyMDE = new TinyMDE.Editor({element: 'tinymde', textarea: textarea});
    return tinyMDE.getContent();
  }, content);

   expect(tinymdeContent).toEqual(content);
   newPage.close();
});

test('Content passed in constructor has precedence over textarea content', async () => {
  const newPage = await global.context.newPage();
  await newPage.goto(PATH, { waitUntil: 'load'});

  const textareaContent = '# XXXA';
  const constructorContent = '# XXXB';

  const tinymdeContent = await newPage.evaluate((args) => {
    const { textareaContent, constructorContent } = args;
    const textarea = document.createElement('textarea');
    textarea.value = textareaContent;
    document.body.appendChild(textarea);
    const tinyMDE = new TinyMDE.Editor({element: 'tinymde', textarea: textarea, content: constructorContent});
    return tinyMDE.getContent();
  }, { textareaContent, constructorContent })

  expect(tinymdeContent).toEqual(constructorContent);
  newPage.close();
});


test('Content can be set using setContent()', async () => {
  const newPage = await global.context.newPage();
  await newPage.goto(PATH, { waitUntil: 'load'});

  const content = '# XXXA\nXXXB *XXXC*';

  const tinymdeContent = await newPage.evaluate((content) => {
    const tinyMDE = new TinyMDE.Editor({element: 'tinymde'});
    tinyMDE.setContent(content);  
    return tinyMDE.getContent();
  }, content);

  expect(tinymdeContent).toEqual(content);

  newPage.close();
});

test('Linked textarea updated on setContent()', async () => {
  const newPage = await global.context.newPage();
  await newPage.goto(PATH, { waitUntil: 'load'});

  const content = '# XXXA\nXXXB *XXXC*';

  const {tinymdeContent, textareaContent} = await newPage.evaluate((content) => {
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    const tinyMDE = new TinyMDE.Editor({element: 'tinymde', textarea: textarea});
    tinyMDE.setContent(content);

    return {
      tinymdeContent: tinyMDE.getContent(),
      textareaContent: textarea.value
    }
  }, content);

  expect(tinymdeContent).toEqual(content);
  expect(textareaContent).toEqual(content);

  newPage.close();
})

test('Change event listeners called on setContent()', async () => {
  const newPage = await global.context.newPage();
  await newPage.goto(PATH, { waitUntil: 'load'});

  const content = '# XXXA\nXXXB *XXXC*';

  const promise = newPage.evaluate((content) => {
    return new Promise((resolve, reject) => {
      const tinyMDE = new TinyMDE.Editor({element: 'tinymde'});
      // If handler is called, resolve the promise
      tinyMDE.addEventListener('change', () => resolve());
      tinyMDE.setContent(content);
      // If handler hasn't been called, reject the promise
      reject();
    });
  }, content);

  return expect(promise).resolves.not.toThrow();
});

test('Placeholder is not shown for Empty content', async () => {
  const newPage = await global.context.newPage();
  await newPage.goto(PATH, { waitUntil: 'load' });

  const content = '';

  const tinymdeContent = await newPage.evaluate((content) => {
    const tinyMDE = new TinyMDE.Editor({
      element: 'tinymde',
      content: '',
    });
    return tinyMDE.getContent();
  }, content);

  expect(tinymdeContent).toEqual(content);
  newPage.close();
});

test('Placeholder from props is set on editor element', async () => {
  const newPage = await global.context.newPage();
  await newPage.goto(PATH, { waitUntil: 'load' });

  const result = await newPage.evaluate(() => {
    const tinyMDE = new TinyMDE.Editor({
      element: 'tinymde',
      content: '',
      placeholder: 'Type here...',
    });
    const editorEl = document.querySelector('.TinyMDE');
    return {
      dataPlaceholder: editorEl.getAttribute('data-placeholder'),
      hasEmptyClass: editorEl.classList.contains('TinyMDE_empty'),
    };
  });

  expect(result.dataPlaceholder).toEqual('Type here...');
  expect(result.hasEmptyClass).toBe(true);
  newPage.close();
});

test('Placeholder from textarea is picked up', async () => {
  const newPage = await global.context.newPage();
  await newPage.goto(PATH, { waitUntil: 'load' });

  const result = await newPage.evaluate(() => {
    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Write something...';
    document.body.appendChild(textarea);
    const tinyMDE = new TinyMDE.Editor({ element: 'tinymde', textarea: textarea });
    const editorEl = document.querySelector('.TinyMDE');
    return {
      dataPlaceholder: editorEl.getAttribute('data-placeholder'),
      hasEmptyClass: editorEl.classList.contains('TinyMDE_empty'),
    };
  });

  expect(result.dataPlaceholder).toEqual('Write something...');
  expect(result.hasEmptyClass).toBe(true);
  newPage.close();
});

test('Placeholder prop takes precedence over textarea placeholder', async () => {
  const newPage = await global.context.newPage();
  await newPage.goto(PATH, { waitUntil: 'load' });

  const result = await newPage.evaluate(() => {
    const textarea = document.createElement('textarea');
    textarea.placeholder = 'From textarea';
    document.body.appendChild(textarea);
    const tinyMDE = new TinyMDE.Editor({
      element: 'tinymde',
      textarea: textarea,
      placeholder: 'From props',
    });
    const editorEl = document.querySelector('.TinyMDE');
    return editorEl.getAttribute('data-placeholder');
  });

  expect(result).toEqual('From props');
  newPage.close();
});

test('Placeholder hidden when content exists', async () => {
  const newPage = await global.context.newPage();
  await newPage.goto(PATH, { waitUntil: 'load' });

  const hasEmptyClass = await newPage.evaluate(() => {
    const tinyMDE = new TinyMDE.Editor({
      element: 'tinymde',
      content: '# Hello',
      placeholder: 'Type here...',
    });
    const editorEl = document.querySelector('.TinyMDE');
    return editorEl.classList.contains('TinyMDE_empty');
  });

  expect(hasEmptyClass).toBe(false);
  newPage.close();
});

test('Placeholder reappears when content is cleared', async () => {
  const newPage = await global.context.newPage();
  await newPage.goto(PATH, { waitUntil: 'load' });

  const result = await newPage.evaluate(() => {
    const tinyMDE = new TinyMDE.Editor({
      element: 'tinymde',
      content: '# Hello',
      placeholder: 'Type here...',
    });
    const editorEl = document.querySelector('.TinyMDE');
    const beforeClear = editorEl.classList.contains('TinyMDE_empty');
    tinyMDE.setContent('');
    const afterClear = editorEl.classList.contains('TinyMDE_empty');
    return { beforeClear, afterClear };
  });

  expect(result.beforeClear).toBe(false);
  expect(result.afterClear).toBe(true);
  newPage.close();
});

test('No placeholder attribute when placeholder not specified', async () => {
  const newPage = await global.context.newPage();
  await newPage.goto(PATH, { waitUntil: 'load' });

  const result = await newPage.evaluate(() => {
    const tinyMDE = new TinyMDE.Editor({
      element: 'tinymde',
      content: '',
    });
    const editorEl = document.querySelector('.TinyMDE');
    return {
      dataPlaceholder: editorEl.getAttribute('data-placeholder'),
      hasEmptyClass: editorEl.classList.contains('TinyMDE_empty'),
    };
  });

  expect(result.dataPlaceholder).toBeNull();
  expect(result.hasEmptyClass).toBe(false);
  newPage.close();
});