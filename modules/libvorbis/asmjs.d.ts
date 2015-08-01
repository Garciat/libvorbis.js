/// <reference path="typings/es6-promise/es6-promise.d.ts" />
/// <reference path="emscripten.d.ts" />

declare module 'libvorbis/asmjs' {
    export function makeRawNativeModule(
        options?: emscripten.EmscriptenModuleOptions
    ): Promise<emscripten.EmscriptenModule>;
}
