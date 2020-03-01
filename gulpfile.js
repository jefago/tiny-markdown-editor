const gulp = require('gulp');
// const Rollup = require('rollup');
const rollup = require('gulp-rollup');
const size = require('gulp-size');
const babel = require('rollup-plugin-babel');
const postcss = require('gulp-postcss');
const cssnano = require('cssnano');
const terser = require('gulp-terser');
const rename = require('gulp-rename');


const rollupConfig = {
  input: './src/TinyMDE.js',
  output : {
    format: 'umd',
    name: 'TinyMDE',
  },
  plugins: [babel()]
};

const jsMax = () => gulp.src('./src/*.js')
  .pipe(rollup(rollupConfig))
  .pipe(rename('tiny-mde.js'))
  .pipe(size({ showFiles: true }))
  .pipe(gulp.dest('./dist'));


const jsMin = () => gulp.src('./src/*.js')
  .pipe(rollup(rollupConfig))
  .pipe(terser())
  .pipe(rename('tiny-mde.min.js'))
  .pipe(size({ showFiles: true }))
  .pipe(gulp.dest('./dist'));

const js = gulp.series(jsMax, jsMin);
/*
  gulp.series(
    () => 
    () => gulp.src('./src/tiny-mde.js')
      .pipe(rollup(rollupConfig(true)))
      .pipe(rename('pell.min.js'))
      .pipe(size({ showFiles: true }))
      .pipe(size({ gzip: true, showFiles: true }))
      .pipe(gulp.dest('./dist'))
  );*/

const css = () =>
  gulp.src('./src/tiny-mde.css')
    // .pipe(postcss[cssnano()])
    .pipe(rename('tiny-mde.min.css'))
    .pipe(gulp.dest('./dist'));

const build = gulp.series(js, css);

const watch = () =>{
  gulp.watch('./src/*.js', js);
  gulp.watch('./src/*.css', css);
}

const dev = gulp.series(
  js, css, watch
);
  
  

exports.default = build;
exports.dev = dev;