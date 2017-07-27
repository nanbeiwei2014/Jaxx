'use strict';

var gulp = require('gulp');
var zip = require('gulp-zip');
var rename = require('gulp-rename');

var files = ['img/*', 'images/**/*', 'css/*', 'js/**/*', 'js_ethereum/**/*','*.css', 'manifest-firefox.json', 'index.html', '*.js', '*.png'];
var xpiName = 'jaxx.xpi';

gulp.task('default', function () {
  gulp.src(files, {base: '.'})
    .pipe(rename(function (path) {
      path.basename = path.basename.replace('-firefox', '');
      return path;
    }))
    .pipe(zip(xpiName))
    .pipe(gulp.dest('.'));
});
module.exports = gulp;