/// <reference path="VbrEncoderClient.worker.ts" />

module Vorbis {
    export interface VbrEncoderClientOptions {
        workerUri: string;
        moduleUri: string;
        encoderUri: string;
        
        encoderOptions: VbrEncoderOptions;
    }
    
    /**
     * Asynchronous counterpart to {VbrEncoder}. Uses Web Workers for processing.
     */
    export class VbrEncoderClient {
        private worker: Worker;
        private onData: (buffer: ArrayBuffer) => any;
        private onFinished: () => any;
        private chunks: ArrayBuffer[];
        
        /**
         * @params onData (optional) A listener for output data buffers.
         */
        constructor(options: VbrEncoderClientOptions, onData?: (buffer: ArrayBuffer) => any) {
            this.worker = new Worker(options.workerUri);
            this.onData = onData || (() => {});
            this.chunks = [];
            
            this.worker.addEventListener('message', this.onMessage);
            
            this.worker.postMessage(<InitCommand> {
                kind: 'init',
                
                moduleUri: options.moduleUri,
                encoderUri: options.encoderUri,
                
                encoderOptions: options.encoderOptions
            });
        }
        
        /**
         * Performs a encoding step on the provided PCM channel data.
         * 
         * @param channelData An array of PCM data buffers (one for each channel).
         * @param samples The number of samples in each buffer.
         */
        encode(channelData: Float32Array[], samples: number): void {
            var buffers = channelData.map((b: any) => <ArrayBuffer> b.buffer);
            
            this.worker.postMessage(<EncodeCommand> {
                kind: 'encode',
                buffers: buffers,
                samples: samples
            }, buffers);
        }
        
        /**
         * Finalizes the OGG Vorbis stream, producing an OGG Vorbis audio Blob.
         * 
         * @param onFinished A callback for the resulting audio Blob.
         */
        finish(onFinished: (audio: Blob) => any): void {
            this.worker.postMessage(<WorkerCommand> {
                kind: 'finish'
            });
            
            this.onFinished = (): void => {
                this.worker.terminate();
                this.worker = null;
                
                var audio = new Blob(this.chunks, { type: 'audio/ogg' });
                
                onFinished(audio);
            };
        }
        
        private onMessage = (event: MessageEvent): void => {
            var message = <WorkerMessage> event.data;
            
            switch (message.kind) {
                case 'data':
                    var dataMessage = <DataMessage> message;
                    this.chunks.push(dataMessage.buffer);
                    this.onData(dataMessage.buffer);
                    break;
                case 'finish':
                    this.onFinished();
                    break;
            }
        };
    }
}