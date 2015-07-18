/// <reference path="OggVorbisVbrEncoder.ts" />

module LibVorbis {
    export interface WorkerMessage {
        kind: string;
    }
    
    export interface LoadedMessage extends WorkerMessage {
        
    }
    
    export interface DataMessage extends WorkerMessage {
        buffer: ArrayBuffer;
    }
    
    export interface FinishedMessage extends WorkerMessage {
        
    }
    
    export interface WorkerCommand {
        kind: string;
    }
    
    export interface InitCommand extends WorkerCommand {
        moduleUri: string;
        nativeEncoderUri: string;
        encoderUri: string;
        
        moduleOptions: Emscripten.EmscriptenModuleOptions;
        encoderOptions: OggVorbisVbrEncoderOptions;
    }
    
    export interface EncodeCommand extends WorkerCommand {
        buffers: ArrayBuffer[];
        samples: number;
    }
    
    export interface FinishCommand extends WorkerCommand {
        
    }
    
    export class OggVorbisVbrEncoderAsyncWorker {
        private encoder: OggVorbisVbrEncoder;
        
        constructor(private channel: Worker) {
            
        }
        
        run() {
            this.channel.addEventListener('message', this.handleChannelMessage);
        }
        
        private handleEncoderLoaded = (encoder: OggVorbisVbrEncoder): void => {
            this.encoder = encoder;
            
            var message: LoadedMessage = {
                kind: 'loaded'
            };
            
            this.channel.postMessage(message);
        }
        
        private handleEncoderData = (buffer: ArrayBuffer): void => {
            var message: DataMessage = {
                kind: 'data',
                buffer: buffer
            };
            
            this.channel.postMessage(message, [buffer]);
        }
        
        private onInitCommand(command: InitCommand): void {
            importScripts(command.moduleUri, command.nativeEncoderUri, command.encoderUri);
            
            command.encoderOptions.onData = this.handleEncoderData;
            
            OggVorbisVbrEncoder.create(command.moduleOptions, command.encoderOptions, this.handleEncoderLoaded);
        }
        
        private onEncodeCommand(command: EncodeCommand): void {
            var channelData = command.buffers.map(b => new Float32Array(b));
            
            this.encoder.encode(channelData, command.samples);
        }
        
        private onFinishCommand(command: FinishCommand): void {
            this.encoder.finish();
            
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
}

new LibVorbis.OggVorbisVbrEncoderAsyncWorker(<any> self).run();
