const initTinyMDEWithCustomGrammar = async (content, customGrammar) => {
  const newPage = await browser.newPage();
  await newPage.goto(global.PATH, { waitUntil: "load" });
  
  // Escape content for JavaScript string
  content = content
    .replace(/(['"\\])/g, "\\$1")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");

  // Create the custom grammar object in the browser
  const grammarStr = JSON.stringify(customGrammar).replace(/\"regexp\":\s*\"([^\"]+)\"/g, (match, regexStr) => {
    return `"regexp": new RegExp("${regexStr.replace(/\\/g, '\\\\')}") `;
  });

  await newPage.evaluate(`
    const customGrammar = ${grammarStr};
    // Convert string regexes back to RegExp objects
    for (const rule in customGrammar) {
      if (typeof customGrammar[rule].regexp === 'string') {
        customGrammar[rule].regexp = new RegExp(customGrammar[rule].regexp);
      }
    }
    tinyMDE = new TinyMDE.Editor({
      element: 'tinymde', 
      content: '${content}', 
      customInlineGrammar: customGrammar
    });
  `);

  return {
    lineHTML: async (lineNum) =>
      newPage.$eval(
        `#tinymde > :first-child > :nth-child(${lineNum + 1})`,
        (el) => el.innerHTML
      ),
    hasClass: async (lineNum, className) =>
      newPage.$eval(
        `#tinymde > :first-child > :nth-child(${lineNum + 1})`,
        (el, className) => el.innerHTML.includes(`class="${className}"`),
        className
      ),
    destroy: async () => newPage.close(),
  };
};

describe("Custom inline grammar", () => {
  test("should support custom highlight syntax", async () => {
    const customGrammar = {
      highlight: {
        regexp: "^(==)([^=]+)(==)",
        replacement: '<span class="TMMark">$1</span><span class="TMHighlight">$2</span><span class="TMMark">$3</span>'
      }
    };

    const editor = await initTinyMDEWithCustomGrammar("This is ==highlighted text== in a sentence.", customGrammar);
    
    const lineHTML = await editor.lineHTML(0);
    expect(lineHTML).toMatch(/TMHighlight/);
    expect(lineHTML).toMatch(/highlighted text/);
    
    await editor.destroy();
  });

  test("should support custom mention syntax", async () => {
    const customGrammar = {
      mention: {
        regexp: "^(@[a-zA-Z0-9_]+)",
        replacement: '<span class="TMMention">$1</span>'
      }
    };

    const editor = await initTinyMDEWithCustomGrammar("Hello @username, how are you?", customGrammar);
    
    const lineHTML = await editor.lineHTML(0);
    expect(lineHTML).toMatch(/TMMention/);
    expect(lineHTML).toMatch(/@username/);
    
    await editor.destroy();
  });

  test("should work alongside existing markdown syntax", async () => {
    const customGrammar = {
      highlight: {
        regexp: "^(==)([^=]+)(==)",
        replacement: '<span class="TMMark">$1</span><span class="TMHighlight">$2</span><span class="TMMark">$3</span>'
      }
    };

    const editor = await initTinyMDEWithCustomGrammar("This is **bold** and ==highlighted== and *italic*.", customGrammar);
    
    const lineHTML = await editor.lineHTML(0);
    expect(lineHTML).toMatch(/TMStrong/); // Bold
    expect(lineHTML).toMatch(/TMHighlight/); // Custom highlight
    expect(lineHTML).toMatch(/TMEm/); // Italic
    
    await editor.destroy();
  });
});