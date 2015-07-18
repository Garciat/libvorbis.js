/// <reference path="VbrAsmModule.d.ts" />

module Vorbis {
    export interface VbrEncoderOptions {
        channels: number;
        sampleRate: number;
        quality: number;
        
        moduleOptions: VorbisAsmJs.VbrAsmModuleOptions;
    }
    
    export class VbrEncoder {
        private module: VorbisAsmJs.VbrAsmModule;
        private handle: VorbisAsmJs.VbrAsmHandle;
        private chunks: ArrayBuffer[];
        private onData: (buffer: ArrayBuffer) => any;
        
        constructor(options: VbrEncoderOptions, onData?: (buffer: ArrayBuffer) => any) {
            this.module = VorbisAsmJs.makeVbrAsmModule(options.moduleOptions);
            this.handle = this.module.create(options.channels, options.sampleRate, options.quality);
            this.chunks = [];
            this.onData = onData || (() => {});
            
            this.module.writeHeaders(this.handle);
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
        
        finish(): Blob {
            this.module.finish(this.handle);
            this.flush();
            
            this.module.destroy(this.handle);
            this.module = null;
            
            return new Blob(this.chunks, { type: 'audio/ogg' });
        }
    }
}
