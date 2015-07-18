# libvorbis.js

## What it is

This spits out a javascript file that can be used in the browser to convert PCM audio data to compressed ogg vorbis audio.

## Download

See [releases](https://github.com/Garciat/libvorbis.js/releases).

## Build

**Requirements**
- emscripten compiler
- TypeScript 1.5 compiler

**Instructions**
```bash
git submodule init
git submodule update
./build.sh
```

## Demos

[Microphone recorder](http://garciat.com/libvorbis.js/demos/microphone-recorder.html).

## API

```typescript
declare module Vorbis {
    interface VbrEncoderOptions {
        /**
         * The number of channels to encode.
         */
        channels: number;
        /**
         * he sample rate for this encoding session.
         */
        sampleRate: number;
        /**
         * A value between -0.1 and 1.0.
         */
        quality: number;
        moduleOptions: VorbisAsmJs.VbrAsmModuleOptions;
    }
    
    /**
     * A wrapper class for the native ASM.JS module for Vorbis VBR encoding.
     *
     * The heavy processing done by this class may cause browser applications
     * to hang. Instead, use the VbrEncoderClient class which uses Web Workers.
     */
    class VbrEncoder {
        private module;
        private handle;
        private chunks;
        private onData;
        /**
         * @params onData (optional) A listener for output data buffers.
         */
        constructor(options: VbrEncoderOptions, onData?: (buffer: ArrayBuffer) => any);
        /**
         * Performs a encoding step on the provided PCM channel data.
         *
         * @param channelData An array of PCM data buffers (one for each channel).
         * @param samples The number of samples in each buffer.
         */
        encode(channelData: Float32Array[], samples: number): void;
        /**
         * Finalizes the OGG Vorbis stream, producing an OGG Vorbis audio Blob.
         */
        finish(): Blob;
        private flush();
    }
    
    interface VbrEncoderClientOptions {
        workerUri: string;
        moduleUri: string;
        encoderUri: string;
        encoderOptions: VbrEncoderOptions;
    }
    
    /**
     * Asynchronous counterpart to {VbrEncoder}. Uses Web Workers for processing.
     */
    class VbrEncoderClient {
        private worker;
        private onData;
        private onFinished;
        private chunks;
        /**
         * @params onData (optional) A listener for output data buffers.
         */
        constructor(options: VbrEncoderClientOptions, onData?: (buffer: ArrayBuffer) => any);
        /**
         * Performs a encoding step on the provided PCM channel data.
         *
         * @param channelData An array of PCM data buffers (one for each channel).
         * @param samples The number of samples in each buffer.
         */
        encode(channelData: Float32Array[], samples: number): void;
        /**
         * Finalizes the OGG Vorbis stream, producing an OGG Vorbis audio Blob.
         *
         * @param onFinished A callback for the resulting audio Blob.
         */
        finish(onFinished: (audio: Blob) => any): void;
        private onMessage;
    }
}
```

## Credits

 - [Alex Barkan](http://hotcashew.com/2014/02/chrome-audio-api-and-ogg-vorbis/)
 - [Salehen Rahman](https://github.com/shovon/libvorbis.js)
 - [Devon Govett](https://github.com/devongovett/ogg.js)
 - [Salehen Shovon Rahman](https://github.com/shovon/libvorbis.js)
 - [Jose Sullivan](https://github.com/itsjoesullivan/libvorbis.js)
