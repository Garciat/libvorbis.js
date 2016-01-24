declare function _encoder_create_vbr(channels: number
                                   , sampleRate: number
                                   , quality: number): number;

declare function _encoder_write_headers(handle: number): void;

declare function _encoder_get_data_len(handle: number): number;

declare function _encoder_get_data(handle: number): number;

declare function _encoder_clear_data(handle: number): void;

declare function _encoder_prepare_analysis_buffers(handle: number
                                                 , samples: number): void;

declare function _encoder_get_analysis_buffer(handle: number
                                            , channel: number): number;

declare function _encoder_encode(handle: number): void;

declare function _encoder_finish(handle: number): void;

declare function _encoder_destroy(handle: number): void;
