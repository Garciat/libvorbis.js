// <reference path="Emscripten.d.ts" />

declare module LibVorbisNative {
    /**
     * Creates an instance of the libvorbis.js native module.
     * 
     * @param options Generic Emscripten module options.
     * @param onLoaded Callback that will receive the module insta.ce
     */
    function makeRawNativeModule(
        options: Emscripten.EmscriptenModuleOptions,
        onLoaded: (module: Emscripten.EmscriptenModule) => any): void;
}
