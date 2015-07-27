/// <reference path="../../globals.d.ts" />

import { OggVbrEncoder, OggVbrEncoderOptions } from './encoder';

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

export class OggVbrAsyncEncoderWorker {
    private encoder: OggVbrEncoder;
    
    constructor(private channel: Worker) {
        
    }
    
    run() {
        this.channel.addEventListener('message', this.handleChannelMessage);
    }
    
    private handleEncoderLoaded = (encoder: OggVbrEncoder): void => {
        this.encoder = encoder;
        
        var message: LoadedMessage = {
            kind: 'loaded'
        };
        
        this.channel.postMessage(message);
    }
    
    private handleEncoderData(buffer: ArrayBuffer): void {
        if (buffer === null) return;
        
        var message: DataMessage = {
            kind: 'data',
            data: buffer
        };
        
        this.channel.postMessage(message, [buffer]);
    }
    
    private onInitCommand(command: InitCommand): void {
        importScripts(command.moduleURL);
        
        OggVbrEncoder.create(command.encoderOptions)
        .then(this.handleEncoderLoaded);
    }
    
    private onEncodeCommand(command: EncodeCommand): void {
        var channelData = command.buffers.map(b => new Float32Array(b));
        
        var data = this.encoder.encode(channelData);
        this.handleEncoderData(data);
    }
    
    private onFinishCommand(command: FinishCommand): void {
        var data = this.encoder.finish();
        this.handleEncoderData(data);
        
        var message: FinishedMessage = {
            kind: 'finished'
        };
        
        this.channel.postMessage(message);
    }
    
    private handleChannelMessage = (ev: MessageEvent): void => {
        var command = <WorkerCommand> ev.data;
        
        switch (command.kind) {
            case 'init':
                this.onInitCommand(<InitCommand> command);
                break;
            case 'encode':
                this.onEncodeCommand(<EncodeCommand> command);
                break;
            case 'finish':
                this.onFinishCommand(<FinishCommand> command);
                break;
        }
    }
}

interface WorkerMessage {
    kind: string;
}

interface LoadedMessage extends WorkerMessage {
    
}

interface DataMessage extends WorkerMessage {
    data: ArrayBuffer;
}

interface FinishedMessage extends WorkerMessage {
    
}

interface WorkerCommand {
    kind: string;
}

interface InitCommand extends WorkerCommand {
    moduleURL: string;
    encoderOptions: OggVbrEncoderOptions;
}

interface EncodeCommand extends WorkerCommand {
    buffers: ArrayBuffer[];
}

interface FinishCommand extends WorkerCommand {
    
}
