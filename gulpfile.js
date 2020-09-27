const gulp = require('gulp');

const size = require('gulp-size');
const rename = require('gulp-rename');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');

const rollupStream = require('@rollup/stream');
const { babel: rollupBabel } = require('@rollup/plugin-babel');
const commonjs = require('@rollup/plugin-commonjs');
const { eslint } = require("rollup-plugin-eslint");
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const terser = require('gulp-terser');

const gulpBabel = require('gulp-babel');
 

const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const postcss_import = require('postcss-import');
const cssnano = require('cssnano');

const jestCLI = require('jest-cli');

const del = require('del');
const fs = require('fs');
const path = require('path');

const util = require('util');

const readfile = util.promisify(fs.readFile);
const writefile = util.promisify(fs.writeFile);

let cache;

const rollupConfig = (inputFile, sourcemaps = false) => { return {
  input: inputFile,
  output: {
    format: 'umd',
    name: 'TinyMDE',
    sourcemap: sourcemaps
  },
  plugins: [
    eslint({throwOnError: true}), 
    rollupBabel({babelHelpers: 'bundled'}), 
    nodeResolve(), 
    commonjs()
  ]
}};

const clean = () => del(['./dist']);

const jest = () => jestCLI.run([]); 

const jsMax = () => 
  rollupStream({...rollupConfig('./src/index.js', true), cache})
    .on('bundle', (bundle) => { cache = bundle })
    .pipe(source('tiny-mde.js'))
    .pipe(buffer())
    .pipe(size({ showFiles: true }))
    .pipe(gulp.dest('./dist'))
    .pipe(rename('tiny-mde.min.js'))
    .pipe(terser())
    .pipe(size({ showFiles: true }))
    .pipe(gulp.dest('./dist'))
    ;


const jsTiny = () => 
  rollupStream(rollupConfig('./src/tiny.js'))
    .pipe(source('tiny-mde.tiny.js'))
    .pipe(buffer())
    .pipe(terser())
    .pipe(gulp.dest('./dist'))
    .pipe(size({ showFiles: true }));

const js = gulp.series(jsMax, jsTiny);

const transpile = () => 
  gulp.src(('./src/*.js'))
    .pipe(gulpBabel())
    .pipe(gulp.dest('./lib'));

const html = () => 
  gulp.src('./src/html/*.html')
    .pipe(gulp.dest('./dist'));

const css = () =>
  gulp.src('./src/css/index.css')
    .pipe(postcss([ postcss_import(), autoprefixer()]))
    .pipe(rename('tiny-mde.css'))
    .pipe(gulp.dest('./dist'))
    .pipe(postcss([cssnano()]))
    .pipe(rename('tiny-mde.min.css'))
    .pipe(gulp.dest('./dist'));

const watch = () => {
  gulp.watch('./src/**/*.svg', svg);
  gulp.watch('./src/**/*.js', jsMax);
  gulp.watch('./src/**/*.css', css);
  gulp.watch('./src/**/*.html', html);
}

const svg = () => {
  const dirEntries = fs.readdirSync(path.join('.', 'src', 'svg'), {withFileTypes: true});
  let promises = [];
  for (entry of dirEntries) {
    if (entry.isFile() && entry.name.match(/\.svg$/i)) {
      let fn = entry.name;
      promises.push(
        readfile(path.join('.', 'src', 'svg', fn), {encoding: 'utf8'})
        .then((buffer) => {
          // console.log(entry.name + ': ' + buffer.toString().replace(/([`\$\\])/g, '\\$1'));
          return `${fn.replace(/^(.*)\.svg$/i, '$1')}: \`${buffer.toString().replace(/([`\$\\])/g, '\\$1')}\``;
        })
      );
    }
  }
  return Promise.all(promises)
    .then((values) => writefile(path.join('.', 'src', 'svg', 'svg.js'), `const svg = \{\n  ${values.join(',\n  ')}\n\};\n\nexport default svg;`, {encoding: 'utf8'}));
}

const build = gulp.series(clean, svg, js, css, html);

const dev = gulp.series(clean, svg, jsMax, css, html, watch);

const test = gulp.series(build, jest);

exports.default = build;
exports.dev = dev;
exports.test = test;
exports.svg = svg;
exports.transpile = transpile;