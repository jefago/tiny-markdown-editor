const { PORT } = require('./config');


global.PATH = `http://localhost:${PORT}/blank.html`;

global.initTinyMDE = async (content) => {

  // document.body.innerHTML = '<div id="container"></div>';
  const newPage = await browser.newPage();
  await newPage.goto(global.PATH, { waitUntil: 'load'});
  content = content.replace(/(['"\\])/g, '\\$1').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
  await newPage.evaluate(`
    tinyMDE = new TinyMDE.Editor({element: 'tinymde', content: '${content}'});
  `); 
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


/**
 * Creates a selection
 * @param {Page} thePage 
 * @param {*} fromLine zero-based line number
 * @param {*} fromColumn zero-based column number. If greater than number of characters in the line, selection will end at end of line.
 * @param {*} toLine zero-based line number. If null, set to equal fromLine.
 * @param {*} toColumn zero-based column number. If null, set to equal toLine.
 */
global.select = async (thePage, fromLine, fromColumn, toLine = null, toColumn = null) => {

  // TODO Continue here

  await thePage.$eval('.TinyMDE', (el, fromLine, fromColumn, toLine, toColumn) => {
    const computeNodeAndOffset = (el, row, col) => {

      if (row < 0 || row >= el.childNodes.length || col < 0) return null;

      let parentNode = el.childNodes[row];
      let node = parentNode.firstChild;
      let childrenComplete = false;

      while (node != parentNode) {
        if (!childrenComplete && node.nodeType === Node.TEXT_NODE) {
          if (node.nodeValue.length >= col) {
            return({node: node, offset: col});
          } else {
            col -= node.nodeValue.length;
          }
        } 
        if (!childrenComplete && node.firstChild) {
          node = node.firstChild;
        } else if (node.nextSibling) {
          childrenComplete = false;
          node = node.nextSibling;
        } else {
          childrenComplete = true;
          node = node.parentNode;
        }
      }

      return null;
    }

    let range = document.createRange();

    const from = computeNodeAndOffset(el, fromLine, fromColumn);
    if (!from) return;

    let to;
    if (toLine === null && toColumn === null) to = from;
    else to = computeNodeAndOffset(el, toLine === null ? fromLine : toLine, toColumn === null ? fromColumn : toColumn);
    if (!to) return;

    range.setStart(from.node, from.offset);
    range.setEnd(to.node, to.offset);

    const windowSelection = window.getSelection();
    windowSelection.removeAllRanges();
    windowSelection.addRange(range);

  }, fromLine, fromColumn, toLine, toColumn);
}