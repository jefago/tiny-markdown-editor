// Regression tests for #182: when the content is taller than a fixed-height
// editor container, the editor's background color stopped at the fold and the
// container showed through below it.

// blank.html gives us #tinymde as a 300px tall scroll container, which is the
// setup from the issue.
const CONTAINER_HEIGHT = 300;

// Distinctive color for the container, so anything showing through underneath
// the editor is unmistakable.
const CONTAINER_BG = 'rgb(255, 0, 0)';

// The editor's own background, from .TinyMDE in editor.css.
const EDITOR_BG = [255, 255, 255];

beforeEach(async () => {
  await page.goto(PATH, { waitUntil: 'load' });
  await global.waitForTinyMDE(page);
});

const setupOverflowingEditor = async () => {
  await page.evaluate((bg) => {
    const container = document.getElementById('tinymde');
    container.style.backgroundColor = bg;
    const content = Array.from({ length: 40 }, (_, i) => `Line ${i + 1}`).join('\n');
    document.tinyMDE = new TinyMDE.Editor({ element: 'tinymde', content: content });
  }, CONTAINER_BG);
};

/**
 * Screenshots the page and reads back a single pixel as [r, g, b], by decoding
 * the PNG in the browser we already have open rather than pulling in an image
 * library. The default Playwright context has a device scale factor of 1, so
 * screenshot pixels and CSS pixels line up.
 */
const pixelAt = async (x, y) => {
  const b64 = (await page.screenshot()).toString('base64');
  return page.evaluate(async (args) => {
    const img = new Image();
    img.src = `data:image/png;base64,${args.b64}`;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(args.x, args.y, 1, 1).data;
    return [data[0], data[1], data[2]];
  }, { b64: b64, x: x, y: y });
};

test('Editor element grows to cover content taller than its container', async () => {
  await setupOverflowingEditor();

  const measured = await page.evaluate(() => {
    const container = document.getElementById('tinymde');
    const editor = container.querySelector('.TinyMDE');
    return {
      editorHeight: editor.getBoundingClientRect().height,
      scrollHeight: container.scrollHeight,
    };
  });

  // Sanity check that the content really does overflow the container.
  expect(measured.scrollHeight).toBeGreaterThan(CONTAINER_HEIGHT);
  // The background is painted by the editor element's box, so that box has to
  // be at least as tall as the scrollable content.
  expect(measured.editorHeight).toBeGreaterThanOrEqual(measured.scrollHeight);
});

test('Editor background is painted below the fold when scrolled to the bottom', async () => {
  await setupOverflowingEditor();

  await page.evaluate(() => {
    const container = document.getElementById('tinymde');
    container.scrollTop = container.scrollHeight;
  });

  // Sample near the bottom of the visible container, at 80% of the editor's
  // width so we land to the right of the (short, left-aligned) line text.
  const point = await page.evaluate(() => {
    const containerRect = document.getElementById('tinymde').getBoundingClientRect();
    const editorRect = document.querySelector('.TinyMDE').getBoundingClientRect();
    return {
      x: Math.round(editorRect.left + editorRect.width * 0.8),
      y: Math.round(containerRect.bottom - 8),
    };
  });

  expect(await pixelAt(point.x, point.y)).toEqual(EDITOR_BG);
});
