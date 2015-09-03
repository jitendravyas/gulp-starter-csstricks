var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var sourcemaps = require('gulp-sourcemaps');
var browserSync = require('browser-sync');
var useref = require('gulp-useref');
var uglify = require('gulp-uglify');
var gulpIf = require('gulp-if');
var minifyCSS = require('gulp-minify-css');
var imagemin = require('gulp-imagemin');
var cache = require('gulp-cache');
var del = require('del');
var runSequence = require('run-sequence');
var nunjucksRender = require('gulp-nunjucks-render');
var data = require('gulp-data');
var fs = require('fs`');
var jsHint = require(gulp-jshint);
var jscs = require('gulp-jscs');

// Basic Gulp task syntax
// gulp.task('hello', function() {
//   console.log('Hello Zell!');
// })

// Development Tasks
// -----------------

// Start browserSync server
gulp.task('browserSync', function() {
  browserSync({
    server: {
      baseDir: 'app'
    }
  })
})

gulp.task('sass', function() {
  return gulp.src('app/scss/**/*.scss') // Gets all files ending with .scss in app/scss and children dirs
    .pipe(sass()) // Passes it through a gulp-sass
    .pipe(gulp.dest('app/css')) // Outputs it in the css folder
    .pipe(browserSync.reload({ // Reloading with Browser Sync
      stream: true
    }));
})

gulp.task('watch-js', ['lint:js'], browserSync.reload);

// Watchers
gulp.task('watch', ['browserSync', 'sass'], function (){
  gulp.watch('app/scss/**/*.scss', ['sass']);
  gulp.watch('app/js/**/*.js', ['watch:js']);
  gulp.watch('app/js/**/*.js', browserSync.reload);
  gulp.watch([
    'app/templates/**/*'
    'app/pages/**/*.+(html|nunjucks)'
    'app/data.json'
    ], ['nunjucks'] // runs Nunjucks task
  );

})

// Optimization Tasks
// ------------------

// Optimizing CSS and JavaScript
gulp.task('useref', function() {
  var assets = useref.assets();

  return gulp.src('app/*.html')
    .pipe(assets)
    // Minifies only if it's a CSS file
    .pipe(gulpIf('*.css', minifyCSS()))
    // Uglifies only if it's a Javascript file
    .pipe(gulpIf('*.js', uglify()))
    .pipe(assets.restore())
    .pipe(useref())
    .pipe(gulp.dest('dist'))
});

// Optimizing Images
gulp.task('images', function() {
  return gulp.src('app/images/**/*.+(png|jpg|jpeg|gif|svg)')
  // Caching images that ran through imagemin
  .pipe(cache(imagemin({
      interlaced: true,
    })))
  .pipe(gulp.dest('dist/images'))
});

// Compiling Nunjucks files to HTML
gulp.task('nunjucks', function() {
  nunjucksRender.nunjucks.configure(['app/templates/'], {watch: false});
  return gulp.src('app/pages/**/*.+(html|nunjucks)')
    .pipe(customPlumber('Error Running Nunjucks'))
    .pipe(data(function() {
      return JSON.parse(fs.readFileSync('./app/data.json'))
    }))
    .pipe(nunjucksRender())
    .pipe(rename(function(path) {
      path.extname = ".html"
    }))
    .pipe(gulp.dest('app'))
    .pipe(browserSync.reload({
      stream: true
    }))
});

// Copying fonts
gulp.task('fonts', function() {
  return gulp.src('app/fonts/**/*')
  .pipe(gulp.dest('dist/fonts'))
})

gulp.task('lint:js', function() {
  return gulp.src('app/js/**/*.js')
  .pipe(customPlumber('JSHint Error'))
  .pipe(jshint())
  .pipe(jshint.reporter('jshint-stylish'))
  .pipe(jshint.reporter('fail', {
    ignoreWarning: true,
    ignoreInfo: true
  }))
    .pipe(jscs({
    fix: true,
    configPath: '.jscsrc'
  }))
  .pipe(gulp.dest('app/js'))
});

// Cleaning
gulp.task('clean', function(callback) {
  del('dist');
  return cache.clearAll(callback);
})

gulp.task('clean:dist', function(callback) {
  del(['dist/**/*', '!dist/images', '!dist/images/**/*'], callback)
});



// Build Sequences
// ---------------

// Consolidated dev phase task
gulp.task('default', function(callback) {
  runSequence(
    'clean:dev',
    ['sprites', 'lint.js']
    ['sass', 'nunjucks'],
    ['browserSync', 'watch'],
    callback
  )
});

gulp.task('build', function(callback) {
  runSequence('clean:dist',
    ['sass', 'useref', 'images', 'fonts'],
    callback
  )
})
