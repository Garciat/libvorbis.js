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
module LibVorbis {
    interface OggVorbisVbrEncoderOptions {
        channels: number;
        sampleRate: number;
        quality: number;
        onData: (buffer: ArrayBuffer) => any;
    }
    
    class OggVorbisVbrEncoder {
        /**
         * Instantiates a new native module and returns the encoder once
         * the native module is done loading.
         */
        static create(moduleOptions: Emscripten.EmscriptenModuleOptions,
                      encoderOptions: OggVorbisVbrEncoderOptions,
                      callback: (encoder: OggVorbisVbrEncoder) => any): void;
        
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
    }
    
    interface OggVorbisVbrEncoderAsyncOptions {
        libraryResolver(libraryName: string): string;
        encoderOptions: OggVorbisVbrEncoderOptions;
        moduleOptions: Emscripten.EmscriptenModuleOptions;
    }
    
    class OggVorbisVbrEncoderAsync {
        constructor(options: OggVorbisVbrEncoderAsyncOptions,
                    onLoaded: (encoder: OggVorbisVbrEncoderAsync) => any,
                    onData?: (buffer: ArrayBuffer, encoder: OggVorbisVbrEncoderAsync) => any,
                    onFinished?: (audio: Blob, encoder: OggVorbisVbrEncoderAsync) => any);
        
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
        finish(onFinished?: (audio: Blob) => any): void;
    }
}
```

## Credits

 - [Alex Barkan](http://hotcashew.com/2014/02/chrome-audio-api-and-ogg-vorbis/)
 - [Devon Govett](https://github.com/devongovett/ogg.js)
 - [Salehen Shovon Rahman](https://github.com/shovon/libvorbis.js)
 - [Jose Sullivan](https://github.com/itsjoesullivan/libvorbis.js)
