declare module libvorbis {
    interface OggVbrEncoderOptions {
        channels: number;
        sampleRate: number;
        quality: number;
    }
}