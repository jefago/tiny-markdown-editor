const gulp = require('gulp');
const rollup = require('gulp-rollup');
const size = require('gulp-size');
const babel = require('rollup-plugin-babel');
const postcss = require('gulp-postcss');
const cssnano = require('cssnano');
const terser = require('gulp-terser');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');
const jestCLI = require('jest-cli');
const del = require('del');

const rollupConfig = (inputFile) => { return {
  input: inputFile,
  output : {
    format: 'umd',
    name: 'TinyMDE',
  },
  plugins: [babel()]
}};

const clean = () => del(['./dist']);

const test = () => jestCLI.run([]); 

const jsMax = () => 
  gulp.src('./src/*.js')
    .pipe(sourcemaps.init())
    .pipe(rollup(rollupConfig('./src/index.js')))
    .pipe(sourcemaps.write())
    .pipe(rename('tiny-mde.js'))
    .pipe(size({ showFiles: true }))
    .pipe(gulp.dest('./dist'));

const jsMin = () => 
  gulp.src('./src/*.js')
    .pipe(rollup(rollupConfig('./src/index.js')))
    .pipe(terser())
    .pipe(rename('tiny-mde.min.js'))
    .pipe(size({ showFiles: true }))
    .pipe(gulp.dest('./dist'));

const jsTiny = () => 
  gulp.src('./src/*.js')
    .pipe(rollup(rollupConfig('./src/tiny.js')))
    .pipe(terser())
    .pipe(rename('tiny-mde.tiny.js'))
    .pipe(size({ showFiles: true }))
    .pipe(gulp.dest('./dist'));

const js = gulp.series(jsMax, jsMin, jsTiny);

const html = () => 
  gulp.src('./src/demo.html')
    .pipe(gulp.dest('./dist'));

const css = () =>
  gulp.src('./src/tiny-mde.css')
    // .pipe(postcss[cssnano()])
    .pipe(rename('tiny-mde.min.css'))
    .pipe(gulp.dest('./dist'));

const watch = () => {
  gulp.watch('./src/*.js', jsMax);
  gulp.watch('./src/*.css', css);
  gulp.watch('./src/*.html', html);
}

const build = gulp.series(clean, test, js, css, html);

const dev = gulp.series(clean, jsMax, css, html, watch);

exports.default = build;
exports.dev = dev;
exports.test = test;