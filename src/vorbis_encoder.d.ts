interface VorbisEncoderModule {
    onRuntimeInitialized: () => void;
    
    HEAPU8: Uint8Array;
    
    HEAPF32: Float32Array;
    
    _encoder_create_vbr(channels: number
                       , sampleRate: number
                       , quality: number): number;

    _encoder_write_headers(handle: number): void;

    _encoder_get_data_len(handle: number): number;

    _encoder_get_data(handle: number): number;

    _encoder_clear_data(handle: number): void;

    _encoder_prepare_analysis_buffers(handle: number
                                     , samples: number): void;

    _encoder_get_analysis_buffer(handle: number
                                , channel: number): number;

    _encoder_encode(handle: number): void;

    _encoder_finish(handle: number): void;

    _encoder_destroy(handle: number): void;
}

declare function makeVorbisEncoderModule(Module: any): VorbisEncoderModule;
