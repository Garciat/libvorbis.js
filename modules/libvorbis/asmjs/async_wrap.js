function _makeRawNativeModule(options, onLoaded) {
    
    var Module = options || {};
    onLoaded = onLoaded || (function(){});
    
    Module.onRuntimeInitialized = function () {
        onLoaded(Module);
    };
    
    // <%= '\n' %><%= contents %>
}

function makeRawNativeModule(options) {
    return new Promise(function (resolve, reject) {
        _makeRawNativeModule(options, resolve);
    });
};