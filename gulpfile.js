/// ### REQUIRE DEPENDENCIES
var gulp = require('gulp'),
    sass = require('gulp-sass'),
    jade = require('gulp-jade'),
    browserify = require('browserify'),
    watchify = require('watchify'),
    babelify = require('babelify'),
    template = require('gulp-template'),
    assign = require('lodash.assign'),
    gutil = require('gulp-util'),
    fs = require('fs'),
    path = require('path'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    prefix = require('gulp-autoprefixer'),
    minifyCSS = require('gulp-minify-css'),
    browserSync = require('browser-sync').create();

/// ### OPTIONS
var sources = {
  'sass':{
    'in':'./src/sass/style.sass',
    'out':'./src/site/styles/',
    'opts':{
      'outputStyle': 'expanded'
    }
  },
  'jade':{
    'in':'./src/jade/**/!(_)*.jade',
    'out':'./src/site',
    'opts':{
      'locals': {},
      'pretty': '\t'
    }
  },
  'js':{
    'in':'./src/js/app.jsx',
    'out':'./src/site/js'
  },
  'img':{
    'in':'./src/img/**/*'
  },
  'build':{
    'css':'./build/styles',
    'js':'./build/js',
    'html':'./build',
    'img':'./build/img'
  }
};


/// ### BROWSER-SYNC
gulp.task('browsersync', function(){
    browserSync.init({
        server: './src/site',
        notify: false,
        open: false
    });

    gulp.watch('./src/sass/**/*.sass', ['sass']);
    gulp.watch('./src/jade/**/*.jade', ['jade']);
    gulp.watch('./src/site/js/*.js').on('change', browserSync.reload);
    gulp.watch(['./src/site/*.html','./src/jade/**/*.jade']).on('change', browserSync.reload);
});


/// ### SASS
gulp.task('sass', function(){
    gulp.src(sources.sass.in)
    .pipe(sass(sources.sass.opts)
    .on('error', sass.logError))
    .pipe(prefix({
        browsers: [
            '> 1%',
            'last 2 versions',
            'firefox >= 4',
            'safari 7',
            'safari 8',
            'IE 8',
            'IE 9',
            'IE 10',
            'IE 11'
            ],
        cascade: true
    }))
    .pipe(rename('style.css'))
    .pipe(gulp.dest(sources.sass.out))
    .pipe(minifyCSS())
    .pipe(concat('style.min.css'))
    .pipe(gulp.dest(sources.sass.out))
    .pipe(gulp.dest(sources.build.css))
    //.pipe(gulp.dest(sources.buildphp.css))
    .pipe(browserSync.stream());
});


/// ### JADE
gulp.task('jade', function(){
    gulp.src(sources.jade.in)
        .pipe(jade(sources.jade.opts))
        .pipe(gulp.dest(sources.jade.out))
    .pipe(gulp.dest(sources.build.html))
});


/// ### JAVASCRIPT
// Browserify options.
var jsOptions = {
    entries: ['./src/js/app.jsx'],
    extensions: ['.js','.jsx'],
    transform: [babelify.configure({
        presets: ["es2015","react"],
        plugins: ["transform-class-properties"]
    })],
    debug: true,
    insertGlobals: false
};

var opts = assign({}, watchify.args, jsOptions);

var b = watchify(browserify(opts));

// 'gulp scripts' task to build scripts
gulp.task('scripts', bundle);
b.on('update', bundle);
b.on('log', gutil.log);

// bundle() function for js bundling
function bundle(){
    return b.bundle()
        .on('error', gutil.log.bind(gutil, 'Browserify error.'))
        .pipe(source('scripts.js'))
        .pipe(buffer())
        .pipe(gulp.dest(sources.js.out))
        .pipe(uglify())
        .on('error', gutil.log)
        .pipe(rename('scripts.min.js'))
        .pipe(gulp.dest(sources.js.out))      
        .pipe(gulp.dest(sources.build.js))
        .pipe(browserSync.reload({stream:true, once: true}));
};


/// ### JS LINTING
gulp.task('jshint', function() {
    return gulp.src(sources.js.in)
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});


// ### NEW COMPONENT GENERATOR
gulp.task('generate', function(){
    var componentName = process.argv[4] || null;
    var checkPathJsx = './src/js/components/' + componentName + '.jsx';
    var checkPathSass = './src/sass/components/' + componentName + '.sass';
    
    function checkFileExists(filepath){
        try {
            return fs.statSync(filepath).isFile();
        }
        catch(err) {
            return false;
        }
    };

    var generateSass = process.argv.indexOf('--sass') > -1;

    var existsJsx = checkFileExists(checkPathJsx);
    var existsSass = checkFileExists(checkPathSass);

    if(componentName && !existsJsx && !existsSass && generateSass){
        return [gulp.src('./templates/new.component.jsx')
            .pipe(template({componentName:componentName}))
            .pipe(rename(componentName + '.jsx'))
            .pipe(gulp.dest('./src/js/components')),
            gulp.src('./templates/new.component.sass')
            .pipe(template({componentName:componentName}))
            .pipe(rename(componentName + '.sass'))
            .pipe(gulp.dest('./src/sass/components')),
            gutil.log(gutil.colors.green('GENERATED: ' + componentName + '.jsx and ' + componentName + '.sass'))];
    } else if(componentName && !existsJsx && !existsSass && !generateSass){
        return [gulp.src('./templates/new.component.jsx')
            .pipe(template({componentName:componentName}))
            .pipe(rename(componentName + '.jsx'))
            .pipe(gulp.dest('./src/js/components')),
            gutil.log(gutil.colors.green('GENERATED: ' + componentName + '.jsx'))];
    } else {
        gutil.log(gutil.colors.red('ERROR: Component exists.'));
        return false;
    }
});




/// ### BUILD
gulp.task('build', ['jshint', 'scripts', 'sass', 'jade']);


/// ### DEFAULT TASK
gulp.task('default', ['browsersync','sass','jade','scripts']);