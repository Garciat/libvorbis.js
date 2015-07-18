/// <reference path="OggVorbisVbrEncoder.ts" />
/// <reference path="OggVorbisVbrEncoderAsyncWorker.ts" />

module LibVorbis {
    export interface OggVorbisVbrEncoderAsyncOptions {
        libraryResolver(libraryName: string): string;
        
        encoderOptions: OggVorbisVbrEncoderOptions;
        moduleOptions: Emscripten.EmscriptenModuleOptions;
    }
    
    export class OggVorbisVbrEncoderAsync {
        private worker: Worker;
        private chunks: ArrayBuffer[];
        
        constructor(options: OggVorbisVbrEncoderAsyncOptions,
                    private onLoaded: (encoder: OggVorbisVbrEncoderAsync) => any,
                    private onData?: (buffer: ArrayBuffer, encoder: OggVorbisVbrEncoderAsync) => any,
                    private onFinished?: (audio: Blob, encoder: OggVorbisVbrEncoderAsync) => any) {
            
            this.worker = new Worker(options.libraryResolver('OggVorbisVbrEncoderAsyncWorker'));
            this.chunks = [];
            this.onData = onData || (() => {});
            this.onFinished = onFinished || (() => {});
            
            this.worker.addEventListener('message', this.handleWorkerMessage);
            
            var command: InitCommand = {
                kind: 'init',
                
                moduleUri: options.libraryResolver('LibVorbisNative'),
                nativeEncoderUri: options.libraryResolver('NativeOggVorbisVbrEncoder'),
                encoderUri: options.libraryResolver('OggVorbisVbrEncoder'),
                
                encoderOptions: options.encoderOptions,
                moduleOptions: options.moduleOptions
            };
            
            this.worker.postMessage(command);
        }
        
        /**
         * Performs a encoding step on the provided PCM channel data.
         * 
         * @param channelData An array of PCM data buffers (one for each channel).
         * @param samples The number of samples in each buffer.
         */
        encode(channelData: Float32Array[], samples: number): void {
            var buffers = channelData.map((b: any) => <ArrayBuffer> b.buffer);
            
            var command: EncodeCommand = {
                kind: 'encode',
                buffers: buffers,
                samples: samples
            };
            
            this.worker.postMessage(command, buffers);
        }
        
        /**
         * Finalizes the OGG Vorbis stream, producing an OGG Vorbis audio Blob.
         * 
         * @param onFinished A callback for the resulting audio Blob.
         */
        finish(onFinished?: (audio: Blob) => any): void {
            if (onFinished)
                this.onFinished = onFinished;
            
            var command: FinishCommand = {
                kind: 'finish'
            };
            
            this.worker.postMessage(command);
        }
        
        private onWorkerLoaded(message: LoadedMessage): void {
            this.onLoaded(this);
        }
        
        private onWorkerData(message: DataMessage): void {
            var dataMessage = <DataMessage> message;
            this.chunks.push(dataMessage.buffer);
            this.onData(dataMessage.buffer, this);
        }
        
        private onWorkerFinished(message: FinishedMessage): void {
            this.worker.terminate();
            this.worker = null;
            
            var audio = new Blob(this.chunks, { type: 'audio/ogg' });
            
            this.onFinished(audio, this);
        }
        
        private handleWorkerMessage = (event: MessageEvent): void => {
            var message = <WorkerMessage> event.data;
            
            switch (message.kind) {
                case 'loaded':
                    this.onWorkerLoaded(<LoadedMessage> message);
                    break;
                case 'data':
                    this.onWorkerData(<DataMessage> message);
                    break;
                case 'finished':
                    this.onWorkerFinished(<FinishedMessage> message);
                    break;
            }
        };
    }
}