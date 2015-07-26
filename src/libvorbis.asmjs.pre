var libvorbis;
(function (libvorbis) {
    
    function makeRawNativeModule(Module, onLoaded) {
        
        Module = Module || {};
        onLoaded = onLoaded || (function(){});
        
        Module.onRuntimeInitialized = function () {
            onLoaded(Module);
        };
