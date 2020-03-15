import TinyMDE from '../TinyMDE';

beforeEach(() => {
  document.body.innerHTML = '<div id="container"></div>';
});

test('sets up correctly when passed an ID', () => {
  let tinyMDE = new TinyMDE({element: 'container'});
  expect(document.getElementById('container').firstChild.className).toBe('TinyMDE');
});

test('sets up correctly when passed an element', () => {
  let tinyMDE = new TinyMDE({element: document.getElementById('container')});
  expect(document.getElementById('container').firstChild.className).toBe('TinyMDE');
});

test('Content can be passed to constructor', () => {
  const content = '# XXXA\nXXXB *XXXC*';
  const tinyMDE = new TinyMDE({element: 'container', content: content});
  expect(tinyMDE.getContent()).toEqual(content);
});

test('Content can be set using setContent()', () => {
  const content = '# XXXA\nXXXB *XXXC*';
  const tinyMDE = new TinyMDE({element: 'container'});
  tinyMDE.setContent(content);
  expect(tinyMDE.getContent()).toEqual(content);
});