var path    = require('path');
var mkdirp  = require('mkdirp');
var glob    = require('glob');
var through = require('through2');
var del     = require('del');
var Builder = require('systemjs-builder');
var merge   = require('merge-stream');

var gulp    = require('gulp');
var shell   = require('gulp-shell');
var tsc     = require('gulp-typescript');

var CONFIG = {
    cc: 'emcc',
    cc_flags: '-O3 -ffast-math -Inative/include',
    libogg: {
        flags: '-Ilibogg/src -Ilibogg/include',
        outDir: 'build/libogg',
        srcDir: 'libogg/src',
        src: 'bitwise.c framing.c'.split(' ')
    },
    libvorbis: {
        flags: '-Ilibogg/src -Ilibogg/include -Ilibvorbis/lib -Ilibvorbis/include',
        outDir: 'build/libvorbis',
        srcDir: 'libvorbis/lib',
        src: 'analysis.c bitrate.c block.c codebook.c envelope.c floor0.c floor1.c info.c lookup.c lpc.c lsp.c mapping0.c mdct.c psy.c registry.c res0.c sharedbook.c smallft.c synthesis.c vorbisenc.c window.c'.split(' ')
    },
    ogg_vbr: {
        flags: '-Ilibogg/src -Ilibogg/include -Ilibvorbis/lib -Ilibvorbis/include',
        outDir: 'build/native/ogg_vbr',
        srcDir: 'native/ogg_vbr',
        src: ['encoder.c']
    }
};

function compile(native) {
    var cmd = [CONFIG.cc, CONFIG.cc_flags, native.flags,
               '<%= file.path %>',
               '-o <%= outDir %>/<%= name(file) %>.bc' ];
    
    var shellConfig = {
        templateData: {
            outDir: native.outDir,
            name: function (file) {
                return path.parse(file.path).name;
            }
        }
    };
    
    mkdirp.sync(native.outDir);
    
    return gulp.src(native.src, { cwd: native.srcDir })
           .pipe(shell(cmd.join(' '), shellConfig));
}

gulp.task('clean', function () {
    del('build');
    del('dist');
});

gulp.task('libogg', function () {
    return compile(CONFIG.libogg);
});

gulp.task('libvorbis', function () {
    return compile(CONFIG.libvorbis);
});

gulp.task('ogg_vbr', function () {
    return compile(CONFIG.ogg_vbr)
});

gulp.task('native', ['libogg', 'libvorbis', 'ogg_vbr']);

gulp.task('libvorbis.asmjs', ['native'], function (done) {
    glob('build/**/*.bc', function (err, files) {
        var bcs = files.join(' ');
        
        var cmd = [CONFIG.cc, '-O1 -s ALLOW_MEMORY_GROWTH=0 -s ASM_JS=1',
                   '-s EXPORTED_FUNCTIONS=@exported_functions.json',
                   '--pre-js modules/libvorbis/src/asmjs/prefix.js',
                   '--post-js modules/libvorbis/src/asmjs/suffix.js',
                   bcs, '-o dist/js/libvorbis.asmjs.js'].join(' ');
        
        mkdirp.sync('dist/js');
        
        gulp.src('gulpfile.js') // we just need a file to run the command once
            .pipe(shell(cmd))
            .on('end', done);
    });
});

gulp.task('libvorbis.asmjs.min', ['native'], function (done) {
    glob('build/**/*.bc', function (err, files) {
        var bcs = files.join(' ');
        
        var cmd = [CONFIG.cc, '-O3 -s ALLOW_MEMORY_GROWTH=0 -s ASM_JS=1',
                   '-s EXPORTED_FUNCTIONS=@exported_functions.json',
                   '--pre-js modules/libvorbis/src/asmjs/prefix.js',
                   '--post-js modules/libvorbis/src/asmjs/suffix.js',
                   bcs, '-o dist/js/libvorbis.asmjs.min.js'].join(' ');
        
        mkdirp.sync('dist/js');
        
        gulp.src('gulpfile.js') // we just need a file to run the command once
            .pipe(shell(cmd))
            .on('end', done);
    });
});

gulp.task('libvorbis.js.cjs', function () {
    var proj = tsc.createProject('modules/libvorbis/tsconfig.json');
    
    var job = proj.src().pipe(tsc(proj));
    
    return merge(job.js.pipe(gulp.dest('dist/js/libvorbis')),
                 job.dts.pipe(gulp.dest('dist/js/libvorbis')));
});

gulp.task('libvorbis.js', ['libvorbis.js.cjs'], function () {
    return new Builder({
        paths: { '*': 'dist/js/*.js' },
        defaultJSExtensions: true
    })
    .build('libvorbis/libvorbis', 'dist/js/libvorbis.js');
});

gulp.task('all', ['libvorbis.js', 'libvorbis.asmjs', 'libvorbis.asmjs.min']);

gulp.task('default', ['all']);
