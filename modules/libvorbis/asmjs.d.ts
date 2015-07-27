/// <reference path="emscripten.d.ts" />

declare module libvorbis {
    function makeRawNativeModule(
        options?: emscripten.EmscriptenModuleOptions): Promise<emscripten.EmscriptenModule>;
}
