/// <reference path="emscripten.d.ts" />
/// <reference path="libvorbis.asmjs.d.ts" />

/// <reference path="../typings/es6-promise/es6-promise.d.ts" />

module libvorbis {
    export function makeRawNativeModule(options?: emscripten.EmscriptenModuleOptions) {
        return new Promise<emscripten.EmscriptenModule>((resolve, reject) => {
            _makeRawNativeModule(options, resolve);
        });
    }
}
