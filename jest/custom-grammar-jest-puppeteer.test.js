const { PORT } = require("./util/config");

const setupPage = async (content, customInlineRulesData) => {
  const newPage = await browser.newPage();
  await newPage.goto(`http://localhost:${PORT}/blank.html`, { waitUntil: "load" });

  // Convert RegExp patterns to strings and recreate them in the browser context
  await newPage.evaluate(({ content, customInlineRulesData }) => {
    const customInlineRules = customInlineRulesData.map(rule => ({
      regexp: new RegExp(rule.regexpSource, rule.regexpFlags),
      replacement: rule.replacement
    }));
    
    new TinyMDE.Editor({
      element: 'tinymde',
      content: content,
      customInlineRules: customInlineRules,
    });
  }, { content, customInlineRulesData });

  return newPage;
};

describe('Custom Inline Grammar Integration Tests', () => {
  test('should parse custom highlight syntax', async () => {
    const page = await setupPage('Test ::highlight:: text', [
      {
        regexpSource: '^::([^:]+)::',
        regexpFlags: '',
        replacement: '<span class="custom-highlight">$1</span>'
      }
    ]);

    const highlightContent = await page.$eval('.custom-highlight', el => el.textContent);
    expect(highlightContent).toBe('highlight');
    await page.close();
  });

  test('should support multiple custom rules', async () => {
    const page = await setupPage('This is ::highlight:: and {{code}}.', [
      {
        regexpSource: '^::([^:]+)::',
        regexpFlags: '',
        replacement: '<span class="custom-highlight">$1</span>'
      },
      {
        regexpSource: '^\\{\\{([^}]+)\\}\\}',
        regexpFlags: '',
        replacement: '<code class="custom-code">$1</code>'
      }
    ]);

    const highlightContent = await page.$eval('.custom-highlight', el => el.textContent);
    const codeContent = await page.$eval('.custom-code', el => el.textContent);

    expect(highlightContent).toBe('highlight');
    expect(codeContent).toBe('code');
    await page.close();
  });

  test('should work alongside standard markdown formatting', async () => {
    const page = await setupPage('**Bold** and ::highlighted:: text work together!', [
      {
        regexpSource: '^::([^:]+)::',
        regexpFlags: '',
        replacement: '<span class="custom-highlight">$1</span>'
      }
    ]);

    const boldElement = await page.$('.TMStrong');
    const highlightElement = await page.$('.custom-highlight');
    const highlightContent = await page.$eval('.custom-highlight', el => el.textContent);

    expect(boldElement).toBeTruthy();
    expect(highlightElement).toBeTruthy();
    expect(highlightContent).toBe('highlighted');
    await page.close();
  });
});

