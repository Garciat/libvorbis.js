/// <reference path="VbrAsmModule.d.ts" />

module Vorbis {
    export interface VbrEncoderOptions {
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
    export class VbrEncoder {
        private module: VorbisAsmJs.VbrAsmModule;
        private handle: VorbisAsmJs.VbrStateHandle;
        private chunks: ArrayBuffer[];
        private onData: (buffer: ArrayBuffer) => any;
        
        /**
         * @params onData (optional) A listener for output data buffers.
         */
        constructor(options: VbrEncoderOptions, onData?: (buffer: ArrayBuffer) => any) {
            this.module = VorbisAsmJs.makeVbrAsmModule(options.moduleOptions);
            this.handle = this.module.create(options.channels, options.sampleRate, options.quality);
            this.chunks = [];
            this.onData = onData || (() => {});
            
            this.module.writeHeaders(this.handle);
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
                
                this.module.HEAPF32.set(data, bufferPtr >> 2);
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
            
            var chunk = this.module.HEAP8.subarray(dataPointer, dataPointer + dataLength);
            var data = new Uint8Array(chunk); // copy
            var buffer = data.buffer;
            
            this.module.clearData(this.handle);
            
            this.chunks.push(buffer);
            this.onData(buffer);
        }
    }
}
