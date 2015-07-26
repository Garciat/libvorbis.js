# libvorbis.js

## What it is

This spits out a javascript file that can be used in the browser to convert PCM audio data to compressed ogg vorbis audio.

## Install

```
bower install libvorbis.js
```

## Download

See [releases](https://github.com/Garciat/libvorbis.js/releases).

## Build

**Requirements**
- emscripten compiler
- TypeScript 1.5+ compiler (`npm install -g typescript`)
- uglifyjs (`npm install -g uglifyjs`)

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
declare module libvorbis {
    interface OggVbrEncoderOptions {
        channels: number;
        sampleRate: number;
        quality: number;
    }
    
    class OggVbrEncoder {
        constructor(module: OggVbrModule, options: OggVbrEncoderOptions);
        
        static create(options: OggVbrEncoderOptions): Promise<OggVbrEncoder>;
        
        /**
         * Performs a encoding step on the provided PCM channel data.
         * It may or may not produce an output ArrayBuffer.
         *
         * @param channelData An array of PCM data buffers (one for each channel).
         */
        encode(channelData: Float32Array[]): ArrayBuffer;
        
        /**
         * Finalizes the OGG Vorbis stream.
         * It may or may not produce an output ArrayBuffer.
         */
        finish(): ArrayBuffer;
    }
    
    interface OggVbrAsyncEncoderOptions {
        workerURL: string;
        moduleURL: string;
        encoderOptions: OggVbrEncoderOptions;
    }
    
    class OggVbrAsyncEncoder {
        /**
         * Call static method create() to instantiate this class!
         */
        constructor(worker: Worker, onData: (data: ArrayBuffer) => void, onFinished: () => void);
        
        static create(options: OggVbrAsyncEncoderOptions,
                      onData: (data: ArrayBuffer) => void,
                      onFinished: () => void): Promise<OggVbrAsyncEncoder>;
        
        /**
         * Performs a encoding step on the provided PCM channel data.
         *
         * @param channelData An array of PCM data buffers (one for each channel).
         */
        encode(channelData: Float32Array[]): void;
        
        /**
         * Performs a encoding step on the provided PCM channel data.
         * Warning: passed buffers will be transferred to the Worker, rendering
         * them unusable from this thread.
         *
         * @param channelData An array of PCM data buffers (one for each channel).
         */
        encodeTransfer(channelData: Float32Array[]): void;
        
        /**
         * Finalizes the OGG Vorbis stream.
         */
        finish(): void;
    }
}
```

## Credits

 - [Alex Barkan](http://hotcashew.com/2014/02/chrome-audio-api-and-ogg-vorbis/)
 - [Devon Govett](https://github.com/devongovett/ogg.js)
 - [Salehen Shovon Rahman](https://github.com/shovon/libvorbis.js)
 - [Jose Sullivan](https://github.com/itsjoesullivan/libvorbis.js)
