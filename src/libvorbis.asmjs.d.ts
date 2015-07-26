/// <reference path="emscripten.d.ts" />

declare module libvorbis {
    function _makeRawNativeModule(
        options?: emscripten.EmscriptenModuleOptions,
        onLoaded?: (module: emscripten.EmscriptenModule) => any): void;
}