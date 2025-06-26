test('correctly parses custom grammar', async () =>  {
  const newPage = await browser.newPage();
  await newPage.goto(global.PATH, { waitUntil: "load" });
  await newPage.evaluate(() => {
    window.tinyMDE = new TinyMDE.Editor({
      element: 'tinymde',
      content: '$custom$',
      inlineGrammar: {
        custom: {
          regexp: /^\$([^$]*)\$/,
          replacement: '<code class="TMCustom">$1</code>'
        }
      }
    });
  });

  const editor = {
    lineHTML: async (lineNum) =>
      newPage.$eval(
        `#tinymde > :first-child > :nth-child(${lineNum + 1})`,
        (el) => el.innerHTML
      ),
    destroy: async () => newPage.close(),
  };

  expect(await editor.lineHTML(0)).toMatch(/<code[^>]*class="TMCustom"[^>]*>custom<\/code>/);
  await editor.destroy();
});