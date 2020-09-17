// import {Editor} from '..';

{/* <script>
      // Create editor element, initialized to a textarea
      tinyMDE = new TinyMDE.Editor({element: 'tinymde'});

      // Create a command bar for that editor
      cmdBar = new TinyMDE.CommandBar({
        element: 'tinymde_commandbar', 
        editor: tinyMDE,
      });

      // Add a custom selection event listener
      tinyMDE.addEventListener('selection', (e) => { 
        let st = `${e.focus ? e.focus.row : '–'} : ${e.focus ? e.focus.col : '–'}`;
        for (let command in e.commandState) {
          if (e.commandState[command]) st = command.concat(' ', st);
        }
        document.getElementById('status').innerHTML = st; 
      });
    </script> */}

global.initTinyMDE = async (content) => {

  // document.body.innerHTML = '<div id="container"></div>';
  await page.goto(PATH, { waitUntil: 'load'});
  let tinyMDE = await page.evaluate(`
    tinyMDE = new TinyMDE.Editor({element: 'tinymde', content: '${content.replace(/'"\\/g, '\\$1')}'});
  `); //new Editor({element: 'container', content: content});
  return {
    // editorInstance: () => tinyMDE,
    // editorElement: () => document.getElementById('container').firstChild,
    lineType: async (lineNum) => page.$eval(`#tinymde :first-child :nth-child(${lineNum + 1})`, el => el.className),
    lineHTML: async (lineNum) => page.$eval(`#tinymde :first-child :nth-child(${lineNum + 1})`, el => el.innerHTML),
    numLines: async () => page.$eval(`#tinymde :first-child`, el => el.childNodes.length),
    
    content: async () => page.evaluate(() => tinyMDE.getContent()),
  }
}

global.classTagRegExp = (content, className, tagName = 'span') => {
  let match = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/([\\\[\]\(\)\{\}\.\*\+\?\|\$\^])/g, '\\$1');
  return new RegExp(`<${tagName}[^>]*class\\s*=\\s*["']?[^"'>]*${className}[^>]*>${match}<\\/${tagName}>`);
};