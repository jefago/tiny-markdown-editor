const fs = require('fs');
const path = require('path');

// Inline `style="..."` attributes and `<style>` blocks in the icon SVGs trigger
// Content-Security-Policy violations when the icons are injected into the DOM.
// The `svg` task in gulpfile.mjs strips these out when generating svg.ts; this
// test guards against them sneaking back in (e.g. via a freshly exported
// Inkscape SVG that wasn't run through the build).

const svgDir = path.join(__dirname, '..', 'src', 'svg');

test('generated svg.ts contains no inline style attributes or <style> blocks', () => {
  const generated = fs.readFileSync(path.join(svgDir, 'svg.ts'), 'utf8');

  expect(generated).not.toMatch(/\sstyle\s*=/i);
  expect(generated).not.toMatch(/<style[\s>]/i);
});
