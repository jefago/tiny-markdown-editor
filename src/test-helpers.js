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
    numLines: () => document.getElementById('container').firstChild.childNodes.length,
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