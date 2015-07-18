/// <reference path="VbrEncoder.ts" />

interface WorkerMessage {
    kind: string;
}

interface DataMessage extends WorkerMessage {
    buffer: ArrayBuffer;
}

interface WorkerCommand {
    kind: string;
}

interface InitCommand extends WorkerCommand {
    moduleUri: string;
    encoderUri: string;
    
    encoderOptions: Vorbis.VbrEncoderOptions;
}

interface EncodeCommand extends WorkerCommand {
    buffers: ArrayBuffer[];
    samples: number;
}

var encoder: Vorbis.VbrEncoder;

function sendBuffer(buffer: ArrayBuffer): void {
    var message = <DataMessage> {
        kind: 'data',
        buffer: buffer
    };
    
    self.postMessage(message, <any>[buffer]);
}

function init(options: InitCommand) {
    importScripts(options.moduleUri, options.encoderUri);
    
    encoder = new Vorbis.VbrEncoder(options.encoderOptions, sendBuffer);
}

function encode(opts: EncodeCommand) {
    var channelData = opts.buffers.map(b => new Float32Array(b));
    
    encoder.encode(channelData, opts.samples);
}

function finish() {
    encoder.finish();
    
    self.postMessage(<WorkerMessage> {
        kind: 'finish'
    }, undefined);
}

self.addEventListener('message', function (ev) {
    var message = <WorkerCommand> ev.data;
    
    switch (message.kind) {
        case 'init':
            init(<InitCommand> message);
            break;
        case 'encode':
            encode(<EncodeCommand> message);
            break;
        case 'finish':
            finish();
            break;
    }
});
