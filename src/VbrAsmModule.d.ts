declare module VorbisAsmJs {
    type VbrStateHandle = number;
    type AsmPointer = number;
    
    interface VbrAsmModule {
        HEAP8: Uint8Array;
        
        HEAPF32: Float32Array;
        
        create(channels: number, sampleRate: number, quality: number): VbrStateHandle;
        
        writeHeaders(handle: VbrStateHandle): void;
        
        prepareAnalysisBuffers(handle: VbrStateHandle, samples: number): void;
        
        getAnalysisBuffer(handle: VbrStateHandle, channel: number): AsmPointer;
        
        encode(handle: VbrStateHandle): void;
        
        getData(handle: VbrStateHandle): AsmPointer;
        
        getDataLength(handle: VbrStateHandle): number;
        
        clearData(handle: VbrStateHandle): void;
        
        finish(handle: VbrStateHandle): void;
        
        destroy(handle: VbrStateHandle): void;
    }
    
    interface VbrAsmModuleOptions {
        memoryInitializerURL: string;
    }
    
    function makeVbrAsmModule(options?: VbrAsmModuleOptions): VbrAsmModule;
}