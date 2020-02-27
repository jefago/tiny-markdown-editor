const gulp = require('gulp');
// const Rollup = require('rollup');
const rollup = require('gulp-rollup');
const size = require('gulp-size');
const babel = require('rollup-plugin-babel');
const postcss = require('gulp-postcss');
const cssnano = require('cssnano');
const terser = require('terser');
const rename = require('gulp-rename');


const rollupConfig = minimize => ({
  // rollup: Rollup,
  input: './src/tiny-mde.js',
  // moduleName: 'pell',
  output : {
    format: 'umd',
    name: 'TinyMDE',
  },
  // exports: 'named',
  plugins: [babel({ exclude: 'node_modules/**' })].concat(
    minimize
      ? [
        // uglify({
        //   compress: { warnings: false },
        //   mangle: true,
        //   sourceMap: false
        // })
        terser()
      ]
      : []
  )
})

const js = () => gulp.src('./src/tiny-mde.js')
.pipe(rollup(rollupConfig(false)))
.pipe(size({ showFiles: true }))
.pipe(gulp.dest('./dist'));
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


exports.default = build;