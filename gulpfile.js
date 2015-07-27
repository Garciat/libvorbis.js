var Builder = require('systemjs-builder');

new Builder({
    paths: { '*': 'dist/js/*.js' },
    defaultJSExtensions: true
})
.build('libvorbis/libvorbis', 'dist/libvorbis.js')
.then(function () {
    console.log('done')
})
.catch(function (err) {
    console.log(err);
});