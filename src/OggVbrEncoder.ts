/// <reference path="emscripten.d.ts" />
/// <reference path="NativeModule.ts" />
/// <reference path="OggVbrModule.ts" />
/// <reference path="OggVbrEncoderOptions.d.ts" />

module libvorbis {
    export class OggVbrEncoder {
        private handle: OggVbrEncoderHandle;
        
        constructor(private module: OggVbrModule, options: OggVbrEncoderOptions) {
            this.handle = this.module.create(options.channels, options.sampleRate, options.quality);
            this.module.writeHeaders(this.handle);
        }
        
        static create(options: OggVbrEncoderOptions) {
            return makeRawNativeModule()
                    .then(OggVbrModule.fromRawNativeModule)
                    .then(module => new OggVbrEncoder(module, options));
        }
        
        /**
         * Performs a encoding step on the provided PCM channel data.
         * It may or may not produce an output ArrayBuffer.
         * 
         * @param channelData An array of PCM data buffers (one for each channel).
         */
        encode(channelData: Float32Array[]): ArrayBuffer {
            var samples = channelData[0].length;
            
            this.module.prepareAnalysisBuffers(this.handle, samples);
            
            for (var ch = 0; ch < channelData.length; ++ch) {
                var data = channelData[ch];
                var bufferPtr = this.module.getAnalysisBuffer(this.handle, ch);
                
                this.module.rawModule.HEAPF32.set(data, bufferPtr >> 2);
            }
            
            this.module.encode(this.handle);
            
            return this.flush();
        }
        
        /**
         * Finalizes the OGG Vorbis stream.
         * It may or may not produce an output ArrayBuffer.
         */
        finish(): ArrayBuffer {
            this.module.finish(this.handle);
            var buffer = this.flush();
            
            this.module.destroy(this.handle);
            this.module = null;
            
            return buffer;
        }
        
        private flush(): ArrayBuffer {
            var dataLength = this.module.getDataLength(this.handle);
            
            if (dataLength === 0) return null;
            
            var dataPointer = this.module.getData(this.handle);
            
            var chunk = this.module.rawModule.HEAPU8.subarray(dataPointer, dataPointer + dataLength);
            var data = new Uint8Array(chunk); // copy
            var buffer = data.buffer;
            
            this.module.clearData(this.handle);
            
            return buffer;
        }
    }
}
