import TinyMDE from '../TinyMDE';

test('sets up correctly when passed an ID', () => {
  document.body.innerHTML = '<div id="container"></div>';
  let tinyMDE = new TinyMDE({element: 'container'});
  expect(document.getElementById('container').firstChild.className).toBe('TinyMDE');
});

test('sets up correctly when passed an element', () => {
  document.body.innerHTML = '<div id="container"></div>';
  let tinyMDE = new TinyMDE({element: document.getElementById('container')});
  expect(document.getElementById('container').firstChild.className).toBe('TinyMDE');
});