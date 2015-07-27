
    }

    libvorbis.makeRawNativeModule = function (options) {
        return new Promise(function (resolve, reject) {
            makeRawNativeModule(options, resolve);
        });
    };

})(libvorbis || (libvorbis = {}));