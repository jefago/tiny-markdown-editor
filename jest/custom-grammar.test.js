describe("Custom Inline Grammar", () => {
  test("should process custom grammar rules", async () => {
    const customGrammar = {
      highlight: {
        regexp: { source: "^==([^=]+)==", flags: "" },
        replacement:
          '<span class="TMMark">==</span><span class="TMHighlight">$1</span><span class="TMMark">==</span>',
      },
      superscript: {
        regexp: { source: "^\\^([^^]+)\\^", flags: "" },
        replacement:
          '<span class="TMMark">^</span><sup class="TMSuperscript">$1</sup><span class="TMMark">^</span>',
      },
    };
    const page = await browser.newPage();
    await page.goto(global.PATH, { waitUntil: "load" });
    await page.evaluate((customGrammar) => {
      for (const key in customGrammar) {
        customGrammar[key].regexp = new RegExp(
          customGrammar[key].regexp.source,
          customGrammar[key].regexp.flags
        );
      }
      window.tinyMDE = new window.TinyMDE.Editor({
        element: "tinymde",
        content: "==highlighted== and ^superscript^ text",
        customInlineGrammar: customGrammar,
      });
    }, customGrammar);
    const content = await page.$eval(
      "#tinymde > :first-child > :nth-child(1)",
      (el) => el.innerHTML
    );
    expect(content).toContain("TMHighlight");
    expect(content).toContain("TMSuperscript");
    expect(content).toContain("highlighted");
    expect(content).toContain("superscript");
    await page.close();
  });

  test("should merge custom grammar with default grammar", async () => {
    const customGrammar = {
      customRule: {
        regexp: { source: "^#([^#]+)#", flags: "" },
        replacement:
          '<span class="TMMark">#</span><span class="TMCustomTag">$1</span><span class="TMMark">#</span>',
      },
    };
    const page = await browser.newPage();
    await page.goto(global.PATH, { waitUntil: "load" });
    await page.evaluate((customGrammar) => {
      for (const key in customGrammar) {
        customGrammar[key].regexp = new RegExp(
          customGrammar[key].regexp.source,
          customGrammar[key].regexp.flags
        );
      }
      window.tinyMDE = new window.TinyMDE.Editor({
        element: "tinymde",
        content: "#custom# and **bold** text",
        customInlineGrammar: customGrammar,
      });
    }, customGrammar);
    const content = await page.$eval(
      "#tinymde > :first-child > :nth-child(1)",
      (el) => el.innerHTML
    );
    expect(content).toContain("TMCustomTag");
    expect(content).toContain("TMStrong");
    expect(content).toContain("custom");
    expect(content).toContain("bold");
    await page.close();
  });

  test("should override default grammar rules when custom rules have same name", async () => {
    const customGrammar = {
      code: {
        regexp: { source: "^`([^`]+)`", flags: "" },
        replacement:
          '<span class="TMMark">`</span><span class="TMCustomCode">$1</span><span class="TMMark">`</span>',
      },
    };
    const page = await browser.newPage();
    await page.goto(global.PATH, { waitUntil: "load" });
    await page.evaluate((customGrammar) => {
      for (const key in customGrammar) {
        customGrammar[key].regexp = new RegExp(
          customGrammar[key].regexp.source,
          customGrammar[key].regexp.flags
        );
      }
      window.tinyMDE = new window.TinyMDE.Editor({
        element: "tinymde",
        content: "`code` text",
        customInlineGrammar: customGrammar,
      });
    }, customGrammar);
    const content = await page.$eval(
      "#tinymde > :first-child > :nth-child(1)",
      (el) => el.innerHTML
    );
    expect(content).toContain("TMCustomCode");
    expect(content).not.toContain("TMCode");
    expect(content).toContain("code");
    await page.close();
  });

  test("should work without custom grammar (backward compatibility)", async () => {
    const page = await browser.newPage();
    await page.goto(global.PATH, { waitUntil: "load" });
    await page.evaluate(() => {
      window.tinyMDE = new window.TinyMDE.Editor({
        element: "tinymde",
        content: "**bold** and *italic* text",
      });
    });
    const content = await page.$eval(
      "#tinymde > :first-child > :nth-child(1)",
      (el) => el.innerHTML
    );
    expect(content).toContain("TMStrong");
    expect(content).toContain("TMEm");
    expect(content).toContain("bold");
    expect(content).toContain("italic");
    await page.close();
  });

  test("should process custom grammar rules in correct order", async () => {
    const customGrammar = {
      customText: {
        regexp: { source: "^([A-Z][a-z]+)", flags: "" },
        replacement: '<span class="TMCustomText">$1</span>',
      },
    };
    const page = await browser.newPage();
    await page.goto(global.PATH, { waitUntil: "load" });
    await page.evaluate((customGrammar) => {
      for (const key in customGrammar) {
        customGrammar[key].regexp = new RegExp(
          customGrammar[key].regexp.source,
          customGrammar[key].regexp.flags
        );
      }
      window.tinyMDE = new window.TinyMDE.Editor({
        element: "tinymde",
        content: "Hello world",
        customInlineGrammar: customGrammar,
      });
    }, customGrammar);
    const content = await page.$eval(
      "#tinymde > :first-child > :nth-child(1)",
      (el) => el.innerHTML
    );
    expect(content).toContain("TMCustomText");
    expect(content).toContain("Hello");
    await page.close();
  });
});
