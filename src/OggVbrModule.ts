/// <reference path="emscripten.d.ts" />

module libvorbis {
    export type OggVbrEncoderHandle = number;
    
    export interface OggVbrModule {
        rawModule: emscripten.EmscriptenModule;
        
        /**
         * Creates a new VBR Encoder state object.
         * 
         * @param channels The number of channels to encode.
         * @param sampleRate The sample rate for this encoding session.
         * @param quality A value between -0.1 and 1.0.
         */
        create(channels: number, sampleRate: number, quality: number): OggVbrEncoderHandle;
        
        /**
         * Writes initial OGG Vorbis headers, including metadata.
         * 
         * This MUST be called before analysis begins.
         * 
         * This call MAY fill an OGG frame; remember to flush the data buffer.
         * 
         * @param handle A pointer to a native Vorbis VBR Encoder state object.
         */
        writeHeaders(handle: OggVbrEncoderHandle): void;
        
        /**
         * A request to the Vorbis encoder to reserve enough space for analysis.
         * 
         * @param handle A pointer to a native Vorbis VBR Encoder state object.
         * @param samples The number of samples for this analysis step.
         */
        prepareAnalysisBuffers(handle: OggVbrEncoderHandle, samples: number): void;
        
        /**
         * Returns a native pointer to a buffer corresponding to the specified
         * channel to which PCM data must be written for analysis.
         * 
         * @param handle A pointer to a native Vorbis VBR Encoder state object.
         * @param channel The channel (0-indexed).
         */
        getAnalysisBuffer(handle: OggVbrEncoderHandle, channel: number): emscripten.RawPointer;
        
        /**
         * Performs analysis and encoding on the analysis buffers.
         * 
         * This call MAY fill an OGG frame; remember to flush the data buffer.
         * 
         * @param handle A pointer to a native Vorbis VBR Encoder state object.
         */
        encode(handle: OggVbrEncoderHandle): void;
        
        /**
         * Returns a native pointer to the output data buffer. 
         * 
         * @param handle A pointer to a native Vorbis VBR Encoder state object.
         */
        getData(handle: OggVbrEncoderHandle): emscripten.RawPointer;
        
        /**
         * Returns the amount of data in the buffer.
         * 
         * @param handle A pointer to a native Vorbis VBR Encoder state object.
         */
        getDataLength(handle: OggVbrEncoderHandle): number;
        
        /**
         * Resets the buffer so it can be reused by the encoder.
         * 
         * @param handle A pointer to a native Vorbis VBR Encoder state object.
         */
        clearData(handle: OggVbrEncoderHandle): void;
        
        /**
         * Performs finalizing of the OGG Vorbis stream.
         * 
         * This call MAY fill an OGG frame; remember to flush the data buffer.
         * 
         * @param handle A pointer to a native Vorbis VBR Encoder state object.
         */
        finish(handle: OggVbrEncoderHandle): void;
        
        /**
         * Frees the VBR Encoder state object.
         * 
         * @param handle A pointer to a native Vorbis VBR Encoder state object.
         */
        destroy(handle: OggVbrEncoderHandle): void;
    }
    
    export module OggVbrModule {
        export function fromRawNativeModule(module: emscripten.EmscriptenModule): OggVbrModule {
            return {
                rawModule: module,
                
                create: module.cwrap('encoder_create_vbr', 'number', ['number', 'number', 'number']),
                
                writeHeaders: module.cwrap('encoder_write_headers', null, ['number']),
                
                prepareAnalysisBuffers: module.cwrap('encoder_prepare_analysis_buffers', null, ['number', 'number']),
                
                getAnalysisBuffer: module.cwrap('encoder_get_analysis_buffer', 'number', ['number', 'number']),
                
                encode: module.cwrap('encoder_encode', null, ['number']),
                
                getData: module.cwrap('encoder_get_data', 'number', ['number']),
                
                getDataLength: module.cwrap('encoder_get_data_len', 'number', ['number']),
                
                clearData: module.cwrap('encoder_clear_data', null, ['number']),
                
                finish: module.cwrap('encoder_finish', null, ['number']),
                
                destroy: module.cwrap('encoder_destroy', null, ['number'])
            };
        }
    }
}