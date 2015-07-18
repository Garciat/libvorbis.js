/// <reference path="Emscripten.d.ts" />
/// <reference path="LibVorbisNative.d.ts" />
/// <reference path="NativeOggVorbisVbrEncoder.ts" />

module LibVorbis {
    export interface OggVorbisVbrEncoderOptions {
        channels: number;
        sampleRate: number;
        quality: number;
        
        onData: (buffer: ArrayBuffer) => any;
    }
    
    export class OggVorbisVbrEncoder {
        private handle: VbrEncoderStateHandle;
        private chunks: ArrayBuffer[];
        private onData: (buffer: ArrayBuffer) => any;
        
        constructor(private module: NativeOggVorbisVbrEncoder, options: OggVorbisVbrEncoderOptions) {
            this.handle = this.module.create(options.channels, options.sampleRate, options.quality);
            this.chunks = [];
            this.onData = options.onData || (() => {});
            
            this.module.writeHeaders(this.handle);
        }
        
        /**
         * Instantiates a new native module and returns the encoder once
         * the native module is done loading.
         */
        static create(moduleOptions: Emscripten.EmscriptenModuleOptions,
                      encoderOptions: OggVorbisVbrEncoderOptions,
                      callback: (encoder: OggVorbisVbrEncoder) => any): void {
            
            LibVorbisNative.makeRawNativeModule(moduleOptions, (rawModule) => {
                var module = LibVorbis.NativeOggVorbisVbrEncoder.fromRawNativeModule(rawModule);
                
                var encoder = new OggVorbisVbrEncoder(module, encoderOptions);
                
                callback(encoder);
            });
            
        }
        
        /**
         * Performs a encoding step on the provided PCM channel data.
         * 
         * @param channelData An array of PCM data buffers (one for each channel).
         * @param samples The number of samples in each buffer.
         */
        encode(channelData: Float32Array[], samples: number): void {
            this.module.prepareAnalysisBuffers(this.handle, samples);
            
            for (var ch = 0; ch < channelData.length; ++ch) {
                var data = channelData[ch];
                var bufferPtr = this.module.getAnalysisBuffer(this.handle, ch);
                
                this.module.rawModule.HEAPF32.set(data, bufferPtr >> 2);
            }
            
            this.module.encode(this.handle);
            
            this.flush();
        }
        
        /**
         * Finalizes the OGG Vorbis stream, producing an OGG Vorbis audio Blob.
         */
        finish(): Blob {
            this.module.finish(this.handle);
            this.flush();
            
            this.module.destroy(this.handle);
            this.module = null;
            
            return new Blob(this.chunks, { type: 'audio/ogg' });
        }
        
        private flush(): void {
            var dataPointer = this.module.getData(this.handle);
            var dataLength = this.module.getDataLength(this.handle);
            
            if (dataLength === 0) return;
            
            var chunk = this.module.rawModule.HEAPU8.subarray(dataPointer, dataPointer + dataLength);
            var data = new Uint8Array(chunk); // copy
            var buffer = data.buffer;
            
            this.module.clearData(this.handle);
            
            this.chunks.push(buffer);
            this.onData(buffer);
        }
    }
}
