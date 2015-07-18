declare module VorbisAsmJs {
    type VbrAsmHandle = number;
    type AsmPointer = number;
    
    interface VbrAsmModule {
        HEAP8: Uint8Array;
        
        HEAPF32: Float32Array;
        
        create(channels: number, sampleRate: number, quality: number): VbrAsmHandle;
        
        writeHeaders(handle: VbrAsmHandle): void;
        
        prepareAnalysisBuffers(handle: VbrAsmHandle, samples: number): void;
        
        getAnalysisBuffer(handle: VbrAsmHandle, channel: number): AsmPointer;
        
        encode(handle: VbrAsmHandle): void;
        
        getData(handle: VbrAsmHandle): AsmPointer;
        
        getDataLength(handle: VbrAsmHandle): number;
        
        clearData(handle: VbrAsmHandle): void;
        
        finish(handle: VbrAsmHandle): void;
        
        destroy(handle: VbrAsmHandle): void;
    }
    
    interface VbrAsmModuleOptions {
        memoryInitializerURL: string;
    }
    
    function makeVbrAsmModule(options?: VbrAsmModuleOptions): VbrAsmModule;
}