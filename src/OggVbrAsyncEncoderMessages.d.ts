/// <reference path="OggVbrEncoderOptions.d.ts" />

declare module libvorbis {
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
}