/// <reference path="OggVbrEncoder.ts" />
/// <reference path="OggVbrAsyncEncoderMessages.d.ts" />

module libvorbis {
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
            
            makeRawNativeModule()
            .then(OggVbrModule.fromRawNativeModule)
            .then(module => new OggVbrEncoder(module, command.encoderOptions))
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
}

new libvorbis.OggVbrAsyncEncoderWorker(<any> self).run();
