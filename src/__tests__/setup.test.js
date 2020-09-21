
test('sets up correctly when passed an ID', async () => {
  const newPage = await browser.newPage();
  await newPage.goto(PATH, { waitUntil: 'load'});

  await newPage.evaluate(() => {
    const tinyMDE = new TinyMDE.Editor({element: 'tinymde'});
  })
  expect(await newPage.$eval('#tinymde > :first-child', el => el.className)).toBe('TinyMDE');
  newPage.close();
});

test('sets up correctly when passed an element', async () => {
  const newPage = await browser.newPage();
  await newPage.goto(PATH, { waitUntil: 'load'});

  await newPage.evaluate(() => {
    const tinyMDE = new TinyMDE.Editor({element: document.getElementById('tinymde')});
  })
  expect(await newPage.$eval('#tinymde > :first-child', el => el.className)).toBe('TinyMDE');
  newPage.close();
});

test('sets up correctly when passed a textarea ID as element', async () => {
  const newPage = await browser.newPage();
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
  const newPage = await browser.newPage();
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
  const newPage = await browser.newPage();
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
  const newPage = await browser.newPage();
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
  const newPage = await browser.newPage();
  await newPage.goto(PATH, { waitUntil: 'load'});

  const textareaContent = '# XXXA';
  const constructorContent = '# XXXB';

  const tinymdeContent = await newPage.evaluate((textareaContent, constructorContent) => {
    const textarea = document.createElement('textarea');
    textarea.value = textareaContent;
    document.body.appendChild(textarea);
    const tinyMDE = new TinyMDE.Editor({element: 'tinymde', textarea: textarea, content: constructorContent});
    return tinyMDE.getContent();
  }, textareaContent, constructorContent)

  expect(tinymdeContent).toEqual(constructorContent);
  newPage.close();
});


test('Content can be set using setContent()', async () => {
  const newPage = await browser.newPage();
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
  const newPage = await browser.newPage();
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
  const newPage = await browser.newPage();
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