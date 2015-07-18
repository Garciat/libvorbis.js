// <reference path="Emscripten.d.ts" />

declare module LibVorbisNative {
    function makeRawNativeModule(
        options: Emscripten.EmscriptenModuleOptions,
        onLoaded: (module: Emscripten.EmscriptenModule) => any): void;
}
