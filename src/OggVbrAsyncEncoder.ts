/// <reference path="OggVbrEncoderOptions.d.ts" />
/// <reference path="OggVbrAsyncEncoderMessages.d.ts" />

/// <reference path="../typings/es6-promise/es6-promise.d.ts" />

module libvorbis {
    export interface OggVbrAsyncEncoderOptions {
        workerURL: string;
        moduleURL: string;
        encoderOptions: OggVbrEncoderOptions;
    }
    
    export class OggVbrAsyncEncoder {
        /**
         * Call static method create() to instantiate this class!
         */
        constructor(private worker: Worker,
                    private onData: (data: ArrayBuffer) => void,
                    private onFinished: () => void) {
            
            this.worker.addEventListener('message', this.handleWorkerMessage);
        }
        
        static create(options: OggVbrAsyncEncoderOptions, onData: (data: ArrayBuffer) => void, onFinished: () => void) {
            return new Promise<OggVbrAsyncEncoder>((resolve, reject) => {
                var worker = new Worker(options.workerURL);
                
                var onWorkerMessage = (ev: MessageEvent) => {
                    worker.removeEventListener('message', onWorkerMessage);
                    
                    var message = <WorkerMessage> ev.data;
                    
                    switch (message.kind) {
                        case 'loaded':
                            var encoder = new OggVbrAsyncEncoder(worker, onData, onFinished);
                            resolve(encoder);
                            break;
                        default:
                            reject('unexpected message.');
                            break;
                    }
                };
                
                worker.addEventListener('message', onWorkerMessage);
                
                var command: InitCommand = {
                    kind: 'init',
                    moduleURL: options.moduleURL,
                    encoderOptions: options.encoderOptions
                };
                
                worker.postMessage(command);
            });
        }
        
        /**
         * Performs a encoding step on the provided PCM channel data.
         * 
         * @param channelData An array of PCM data buffers (one for each channel).
         */
        encode(channelData: Float32Array[]): void {
            var buffers = channelData.map(ch => ch.buffer);
            
            var command: EncodeCommand = {
                kind: 'encode',
                buffers: buffers
            };
            
            this.worker.postMessage(command);
        }
        
        /**
         * Performs a encoding step on the provided PCM channel data.
         * Warning: passed buffers will be transferred to the Worker, rendering
         * them unusable from this thread.
         * 
         * @param channelData An array of PCM data buffers (one for each channel).
         */
        encodeTransfer(channelData: Float32Array[]): void {
            var buffers = channelData.map(ch => ch.buffer);
            
            var command: EncodeCommand = {
                kind: 'encode',
                buffers: buffers
            };
            
            this.worker.postMessage(command, buffers);
        }
        
        /**
         * Finalizes the OGG Vorbis stream.
         */
        finish(): void {
            var command: FinishCommand = {
                kind: 'finish'
            };
            
            this.worker.postMessage(command);
        }
        
        private onWorkerData(message: DataMessage): void {
            this.onData(message.data);
        }
        
        private onWorkerFinished(message: FinishedMessage): void {
            this.worker.terminate();
            this.worker = null;
            this.onFinished();
        }
        
        private handleWorkerMessage = (event: MessageEvent): void => {
            var message = <WorkerMessage> event.data;
            
            switch (message.kind) {
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