import TinyMDE from './TinyMDE';

global.initTinyMDE = (content) => {
  document.body.innerHTML = '<div id="container"></div>';
  let tinyMDE = new TinyMDE({element: 'container', content: content});
  return {
    editorInstance: () => tinyMDE,
    editorElement: () => document.getElementById('container').firstChild,
    lineType: (lineNum) => document.getElementById('container').firstChild.childNodes[lineNum].className,
    lineHTML: (lineNum) => document.getElementById('container').firstChild.childNodes[lineNum].innerHTML,
    content: () => tinyMDE.getContent(),
  }
}