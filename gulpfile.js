var babel = require('gulp-babel');
var gulp = require('gulp');
var babelify = require('babelify');
var glob = require('glob');
var execSync = require('child_process').execSync;

gulp.task('build', ['clean'], function() {
    gulp.src('src/**/*.js')
        .pipe(babel({ presets: ['es2015', 'stage-1'], plugins: ['transform-decorators-legacy'] }))
        .pipe(gulp.dest('lib/'));
});

gulp.task('clean', function() {
    execSync('rm -rf lib')
})

gulp.task('default', ['build']);
