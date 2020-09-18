global.initTinyMDE = async (content) => {

  // document.body.innerHTML = '<div id="container"></div>';
  const newPage = await browser.newPage();
  await newPage.goto(PATH, { waitUntil: 'load'});
  content = content.replace(/(['"\\])/g, '\\$1').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
  let tinyMDE = await newPage.evaluate(`
    tinyMDE = new TinyMDE.Editor({element: 'tinymde', content: '${content}'});
  `); //new Editor({element: 'container', content: content});
  return {
    // editorInstance: () => tinyMDE,
    // editorElement: () => document.getElementById('container').firstChild,
    lineType: async (lineNum) => newPage.$eval(`#tinymde > :first-child > :nth-child(${lineNum + 1})`, el => el.className),
    lineHTML: async (lineNum) => newPage.$eval(`#tinymde > :first-child > :nth-child(${lineNum + 1})`, el => el.innerHTML),
    numLines: async () => newPage.$eval(`#tinymde > :first-child`, el => el.childNodes.length),
    
    content: async () => newPage.evaluate(() => tinyMDE.getContent()),
    destroy: async () => newPage.close() 
  }
}

global.classTagRegExp = (content, className, tagName = 'span') => {
  let match = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/([\\[\](){}.*+?|$^])/g, '\\$1');
  return new RegExp(`<${tagName}[^>]*class\\s*=\\s*["']?[^"'>]*${className}[^>]*>${match}<\\/${tagName}>`);
};