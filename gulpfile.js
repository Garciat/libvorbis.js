var fs      = require('fs');
var path    = require('path');

var mkdirp  = require('mkdirp');
var glob    = require('glob');
var through = require('through2');
var del     = require('del');
var Builder = require('systemjs-builder');
var merge   = require('merge-stream');
var temp    = require('temp');

var gulp    = require('gulp');
var shell   = require('gulp-shell');
var tsc     = require('gulp-typescript');

var CONFIG = {
    cc: 'emcc',
    cc_flags: '-O3 -ffast-math -Inative/include'
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

gulp.task('amsjs_libogg', function () {
    return compile({
        flags: '-Inative/libogg/src -Inative/libogg/include',
        outDir: 'build/libogg',
        srcDir: 'native/libogg/src',
        src: ['bitwise.c', 'framing.c']
    });
});

gulp.task('amsjs_libvorbis', function () {
    return compile({
        flags: '-Inative/libogg/src -Inative/libogg/include -Inative/libvorbis/lib -Inative/libvorbis/include',
        outDir: 'build/libvorbis',
        srcDir: 'native/libvorbis/lib',
        src: ["analysis.c", "bitrate.c", "block.c", "codebook.c", "envelope.c",
              "floor0.c", "floor1.c", "info.c", "lookup.c", "lpc.c", "lsp.c",
              "mapping0.c", "mdct.c", "psy.c", "registry.c", "res0.c",
              "sharedbook.c", "smallft.c", "synthesis.c", "vorbisenc.c",
              "window.c"]
    });
});

gulp.task('amsjs_ogg_vbr', function () {
    return compile({
        flags: '-Inative/libogg/src -Inative/libogg/include -Inative/libvorbis/lib -Inative/libvorbis/include',
        outDir: 'build/native/ogg_vbr',
        srcDir: 'native/ogg_vbr',
        src: ['encoder.c']
    })
});

gulp.task('asmjs_modules', ['amsjs_libogg', 'amsjs_libvorbis', 'amsjs_ogg_vbr']);

function compileModule(flags, dest, done) {
    var exports = [
        "_encoder_create_vbr",
        "_encoder_write_headers",
        "_encoder_prepare_analysis_buffers",
        "_encoder_get_analysis_buffer",
        "_encoder_encode",
        "_encoder_get_data",
        "_encoder_get_data_len",
        "_encoder_clear_data",
        "_encoder_finish",
        "_encoder_destroy"
    ];
    
    var exports_json = temp.path({ suffix: '.json' });
    fs.writeFileSync(exports_json, JSON.stringify(exports));
    
    glob('build/**/*.bc', function (err, files) {
        var bcs = files.join(' ');
        
        var cmd = [CONFIG.cc, flags,
                   '-s ALLOW_MEMORY_GROWTH=0 -s ASM_JS=1',
                   '-s EXPORTED_FUNCTIONS=@' + exports_json,
                   '--pre-js modules/libvorbis/src/asmjs/prefix.js',
                   '--post-js modules/libvorbis/src/asmjs/suffix.js',
                   '--memory-init-file 0',
                   bcs, '-o', dest].join(' ');
        
        gulp.src('gulpfile.js') // we just need a file to run the command once
            .pipe(shell(cmd))
            .on('end', done);
    });
}

gulp.task('asmjs', ['asmjs_modules'], function (done) {
    mkdirp.sync('dist/cjs');
    
    compileModule('-O1', 'dist/cjs/libvorbis/asmjs.js', done);
});

gulp.task('asmjs.min', ['asmjs_modules'], function (done) {
    mkdirp.sync('dist/cjs');
    
    compileModule('-O3', 'dist/cjs/libvorbis/asmjs.min.js', done);
});

gulp.task('libvorbis.js.cjs', function () {
    var proj = tsc.createProject('modules/libvorbis/tsconfig.json');
    
    var job = proj.src().pipe(tsc(proj));
    
    return merge(job.js.pipe(gulp.dest('dist/cjs/libvorbis')),
                 job.dts.pipe(gulp.dest('dist/dts/libvorbis')));
});

gulp.task('libvorbis.js.sjs', ['libvorbis.js.cjs', 'asmjs'], function () {
    mkdirp.sync('dist/sjs');
    
    return new Builder({
        paths: { '*': 'dist/cjs/*.js' },
        defaultJSExtensions: true
    })
    .build('libvorbis/libvorbis', 'dist/sjs/libvorbis.js');
});

gulp.task('all', ['libvorbis.js.sjs']);

gulp.task('default', ['all']);
