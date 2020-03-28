import {Editor} from '../';

beforeEach(() => {
  document.body.innerHTML = '<div id="container"></div>';
});

test('sets up correctly when passed an ID', () => {
  let tinyMDE = new Editor({element: 'container'});
  expect(document.getElementById('container').firstChild.className).toBe('TinyMDE');
});

test('sets up correctly when passed an element', () => {
  let tinyMDE = new Editor({element: document.getElementById('container')});
  expect(document.getElementById('container').firstChild.className).toBe('TinyMDE');
});

test('sets up correctly when passed a textarea ID as element', () => {
  document.getElementById('container').innerHTML = '<textarea id="txt"></textarea>';
  let tinyMDE = new Editor({element: document.getElementById('txt')});
  expect(document.getElementById('container').lastChild.className).toBe('TinyMDE');
  expect(document.getElementById('container').firstChild.tagName).toBe('TEXTAREA');
  expect(document.getElementById('txt').style.display).toBe('none');
});

test('sets up correctly when passed an element AND a textarea', () => {
  document.getElementById('container').innerHTML = '<textarea id="txt"></textarea>';
  let tinyMDE = new Editor({element: 'container', textarea: 'txt'});
  expect(document.getElementById('container').lastChild.className).toBe('TinyMDE');
  expect(document.getElementById('txt').style.display).toBe('none');
});


test('Content can be passed to constructor', () => {
  const content = '# XXXA\nXXXB *XXXC*';
  const tinyMDE = new Editor({element: 'container', content: content});
  expect(tinyMDE.getContent()).toEqual(content);
});

test('Content can be passed from textarea', () => {
  let textarea = document.createElement('textarea');
  textarea.value = '# XXXA';
  document.body.appendChild(textarea);
  let tinyMDE = new Editor({element: 'container', textarea: textarea});
  expect(tinyMDE.getContent()).toEqual('# XXXA');
});

test('Content passed in constructor has precedence over textarea content', () => {
  let textarea = document.createElement('textarea');
  textarea.value = '# XXXA';
  document.body.appendChild(textarea);
  let tinyMDE = new Editor({element: 'container', textarea: textarea, content: '# XXXB'});
  expect(tinyMDE.getContent()).toEqual('# XXXB');
});


test('Content can be set using setContent()', () => {
  const content = '# XXXA\nXXXB *XXXC*';
  const tinyMDE = new Editor({element: 'container'});
  tinyMDE.setContent(content);
  expect(tinyMDE.getContent()).toEqual(content);
});

test('Linked textarea updated on setContent()', () => {
  let textarea = document.createElement('textarea');
  document.body.appendChild(textarea);
  const content = '# XXXA\nXXXB *XXXC*';
  const tinyMDE = new Editor({element: 'container', textarea: textarea});
  tinyMDE.setContent(content);
  expect(tinyMDE.getContent()).toEqual(content);
  expect(textarea.value).toEqual(content);
})

test('Change event listeners called on setContent()', () => {
  const content = '# XXXA\nXXXB *XXXC*';
  const tinyMDE = new Editor({element: 'container'});
  const handler = jest.fn();
  tinyMDE.addEventListener('change', handler);
  tinyMDE.setContent(content);
  expect(handler).toHaveBeenCalled();
});