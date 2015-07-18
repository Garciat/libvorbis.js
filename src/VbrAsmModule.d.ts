declare module VorbisAsmJs {
    /**
     * A pointer to a native Vorbis VBR Encoder state object.
     */
    type VbrStateHandle = number;
    
    /**
     * A generic native pointer.
     */
    type AsmPointer = number;
    
    /**
     * Native ASM.JS module for Vorbis VBR encoding.
     */
    interface VbrAsmModule {
        /**
         * The native heap viewed as a Uint8Array.
         */
        HEAP8: Uint8Array;
        
        /**
         * The native heap viewed as a Float32Array
         */
        HEAPF32: Float32Array;
        
        /**
         * Creates a new VBR Encoder state object.
         * 
         * @param channels The number of channels to encode.
         * @param sampleRate The sample rate for this encoding session.
         * @param quality A value between -0.1 and 1.0.
         */
        create(channels: number, sampleRate: number, quality: number): VbrStateHandle;
        
        /**
         * Writes initial OGG Vorbis headers, including metadata.
         * 
         * This MUST be called before analysis begins.
         * 
         * This call MAY fill an OGG frame; remember to flush the data buffer.
         * 
         * @param handle A pointer to a native Vorbis VBR Encoder state object.
         */
        writeHeaders(handle: VbrStateHandle): void;
        
        /**
         * A request to the Vorbis encoder to reserve enough space for analysis.
         * 
         * @param handle A pointer to a native Vorbis VBR Encoder state object.
         * @param samples The number of samples for this analysis step.
         */
        prepareAnalysisBuffers(handle: VbrStateHandle, samples: number): void;
        
        /**
         * Returns a native pointer to a buffer corresponding to the specified
         * channel to which PCM data must be written for analysis.
         * 
         * @param handle A pointer to a native Vorbis VBR Encoder state object.
         * @param channel The channel (0-indexed).
         */
        getAnalysisBuffer(handle: VbrStateHandle, channel: number): AsmPointer;
        
        /**
         * Performs analysis and encoding on the analysis buffers.
         * 
         * This call MAY fill an OGG frame; remember to flush the data buffer.
         * 
         * @param handle A pointer to a native Vorbis VBR Encoder state object.
         */
        encode(handle: VbrStateHandle): void;
        
        /**
         * Returns a native pointer to the output data buffer. 
         * 
         * @param handle A pointer to a native Vorbis VBR Encoder state object.
         */
        getData(handle: VbrStateHandle): AsmPointer;
        
        /**
         * Returns the amount of data in the buffer.
         * 
         * @param handle A pointer to a native Vorbis VBR Encoder state object.
         */
        getDataLength(handle: VbrStateHandle): number;
        
        /**
         * Resets the buffer so it can be reused by the encoder.
         * 
         * @param handle A pointer to a native Vorbis VBR Encoder state object.
         */
        clearData(handle: VbrStateHandle): void;
        
        /**
         * Performs finalizing of the OGG Vorbis stream.
         * 
         * This call MAY fill an OGG frame; remember to flush the data buffer.
         * 
         * @param handle A pointer to a native Vorbis VBR Encoder state object.
         */
        finish(handle: VbrStateHandle): void;
        
        /**
         * Frees the VBR Encoder state object.
         * 
         * @param handle A pointer to a native Vorbis VBR Encoder state object.
         */
        destroy(handle: VbrStateHandle): void;
    }
    
    interface VbrAsmModuleOptions {
        /**
         * URL to the native memory initializer file.
         * 
         * This is only needed when using the minified version of the module.
         */
        memoryInitializerURL: string;
    }
    
    /**
     * Creates an instance of the native Vorbis VBR module.
     */
    function makeVbrAsmModule(options?: VbrAsmModuleOptions): VbrAsmModule;
}