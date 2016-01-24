/// <reference path="../typings/webrtc/MediaStream.d.ts" />
/// <reference path="../typings/webaudioapi/waa.d.ts" />
/// <reference path="../typings/es6-promise/es6-promise.d.ts" />

/// <reference path="vorbis_encoder.d.ts" />

enum RecordingState {
    "inactive",
    "recording",
    "paused"
}

class BlobEvent {
    private _type: string;
    private _target: any;
    private _data: Blob;
    
    constructor(type: string, target: any, data: Blob) {
        this._type = type;
        this._target = target;
        this._data = data;
    }
    
    get type(): string {
        return this._type;
    }
    
    get target(): any {
        return this._target;
    }
    
    get data(): Blob {
        return this._data;
    }
}

interface BlobEventListener {
    (ev: BlobEvent): void;
}

class VorbisWorkerScript {
    private static _url: string;
    
    static getScriptURL(): string {
        if (!VorbisWorkerScript._url) {
            VorbisWorkerScript._url = VorbisWorkerScript.makeScriptURL();
        }
        return VorbisWorkerScript._url;
    }
    
    private static makeScriptURL(): string {
        const func = VorbisWorkerScript.script.toString();
        
        const source = `var Module; (${func})(self, Module || (Module = {}));`;
        
        const blob = new Blob([source], { type: 'application/javascript' });
        
        const url = URL.createObjectURL(blob);
        
        return url;
    }
    
    // NOTE `self` should be type `WorkerGlobalScope`
    // see https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope
    private static script(self: Worker, Module: any) {
        // TODO
        Module.onRuntimeInitialized = function () {
            self.postMessage({ type: 'load' });
        };
        
        let handle: number;
        
        function flush() {
            const dataLength = _encoder_get_data_len(handle);
            
            if (dataLength === 0)
                return;
            
            const dataPointer = _encoder_get_data(handle);
            
            const chunk = Module.HEAPU8.subarray(dataPointer, dataPointer + dataLength);
            
            const data = new Uint8Array(chunk); // copy
            
            const buffer = data.buffer;
            
            _encoder_clear_data(handle);
            
            self.postMessage({ type: 'data', buffer: buffer }, [buffer]);
        }
        
        self.addEventListener('message', (ev) => {
            const data = ev.data;
            
            switch (data.type) {
            case 'init':
                importScripts(data.encoderURL);
                break;
                
            case 'start':
                handle = _encoder_create_vbr(data.channels, data.sampleRate, data.quality);
                
                _encoder_write_headers(handle);
                
                flush();
                break;
                
            case 'data':
                _encoder_prepare_analysis_buffers(handle, data.samples);
                
                for (let ch = 0; ch < data.channels; ++ch) {
                    const bufferPtr = _encoder_get_analysis_buffer(handle, ch);
                    
                    const array = new Float32Array(data.buffers[ch]);
                    
                    Module.HEAPF32.set(array, bufferPtr >> 2);
                }
                
                _encoder_encode(handle);
                
                flush();
                break;
                
            case 'finish':
                _encoder_finish(handle);
                
                flush();
                
                _encoder_destroy(handle);
                
                self.postMessage({ type: 'finish' });
                break;
            }
        });
    }
}

interface Deferred {
    promise: Promise<{}>;
    resolve: any;
    reject:  any;
}

function defer(): Deferred {
    var result: Deferred = {
        promise: null,
        resolve: null,
        reject:  null
    };
    
    result.promise = new Promise((resolve, reject) => {
        result.resolve = resolve;
        result.reject = reject;
    });
    
    return result;
}

function noop() { }

class VorbisEncoder {
    // ---
    
    private _encoder: Worker;
    
    // ---
    
    private _ondata: BlobEventListener;
    
    private _onfinish: EventListener;
    
    // ---
    
    constructor() {
        this._encoder = new Worker(VorbisWorkerScript.getScriptURL());
        
        // ---
        
        this._ondata = noop;
        
        this._onfinish = noop;
        
        // ---
        
        this._encoder.onmessage = this.handleEncoderMessage.bind(this);
        
        // ---
        
        const dirname = location.pathname.split('/').slice(0, -1).join('/');
        
        const encoderURL = location.protocol + "//" + location.host + dirname + "/vorbis_encoder.js";
        
        this._encoder.postMessage({
            type: 'init',
            encoderURL: encoderURL
        });
    }
    
    get ondata(): BlobEventListener {
        return this._ondata;
    }
    
    set ondata(value: BlobEventListener) {
        this._ondata = value || noop;
    }
    
    get onfinish(): EventListener {
        return this._onfinish;
    }
    
    set onfinish(value: EventListener) {
        this._onfinish = value || noop;
    }
    
    init(channels: number, sampleRate: number, quality: number) {
        this._encoder.postMessage({
            type: 'start',
            sampleRate: sampleRate,
            channels: channels,
            quality: quality
        });
    }
    
    encode(buffers: ArrayBuffer[], samples: number, channels: number) {
        this._encoder.postMessage({
            type: 'data',
            samples: samples,
            channels: channels,
            buffers: buffers
        }, buffers);
    }
    
    finish() {
        this._encoder.postMessage({ type: 'finish' });
    }
    
    private handleEncoderMessage(ev: MessageEvent) {
        const data = ev.data;
        
        switch (data.type) {
        case 'load':
            // TODO
            break;
            
        case 'data':
            this._ondata(new BlobEvent('data', this, new Blob([data.buffer])))
            break;
            
        case 'finish':
            this._onfinish(new Event('finish'));
            break;
        }
    }
}

interface VorbisMediaRecorderOptions {
    // TODO
}

class VorbisMediaRecorder {
    // ---
    
    private _state: RecordingState;
    
    private _stream: MediaStream;
    
    // ---
    
    private _encoder: VorbisEncoder;
    
    private _chunks: Blob[];
    
    // ---
    
    private _ctx: AudioContext;
    
    private _sourceNode: MediaStreamAudioSourceNode;
    
    private _procNode: ScriptProcessorNode;
    
    // ---
    
    private _onstart: EventListener;
    
    private _ondataavailable: BlobEventListener;
    
    private _onstop: EventListener;
    
    // ---
    
    constructor(stream: MediaStream, options?: VorbisMediaRecorderOptions) {
        this._state = RecordingState.inactive;
        this._stream = stream;
        
        this._encoder = new VorbisEncoder();
        this._chunks = [];
        
        this._ctx = new AudioContext();
        this._sourceNode = this._ctx.createMediaStreamSource(stream);
        this._procNode = this._ctx.createScriptProcessor(4096);
        
        this._onstart = noop;
        this._ondataavailable = noop;
        this._onstop = noop;
        
        // ---
        
        this._encoder.ondata = this.handleEncoderData.bind(this);
        
        this._encoder.onfinish = this.handleEncoderFinish.bind(this);
        
        this._procNode.onaudioprocess = this.handleAudioProcess.bind(this);
    }
    
    get stream(): MediaStream {
        return this._stream;
    }
    
    get mimeType() {
        return 'audio/ogg';
    }
    
    get state() {
        return RecordingState[this._state];
    }
    
    get onstart(): EventListener {
        return this._onstart;
    }
    
    set onstart(value: EventListener) {
        this._onstart = value || noop;
    }
    
    get ondataavailable(): BlobEventListener {
        return this._ondataavailable;
    }
    
    set ondataavailable(value: BlobEventListener) {
        this._ondataavailable = value || noop;
    }
    
    get onstop(): EventListener {
        return this._onstop;
    }
    
    set onstop(value: EventListener) {
        this._onstop = value || noop;
    }
    
    start(timeslice?: number) {
        if (timeslice !== undefined) {
            throw new Error('not implemented');
        }
        
        if (this._state !== RecordingState.inactive) {
            throw new Error('invalid state');
        }
        
        setTimeout(() => {
            
            this._state = RecordingState.recording;
            this._chunks = [];
            
            this._sourceNode.connect(this._procNode);
            this._procNode.connect(this._ctx.destination);
            
            const channels = this._sourceNode.channelCount;
            const sampleRate = this._ctx.sampleRate;
            
            this._encoder.init(channels, sampleRate, 0.4);
            
            this.onStart();
            
        });
    }
    
    stop() {
        if (this._state === RecordingState.inactive) {
            throw new Error('invalid state');
        }
        
        setTimeout(() => {
            this._state = RecordingState.inactive;
            
            this._sourceNode.disconnect(this._procNode);
            this._procNode.disconnect(this._ctx.destination);
            
            this._encoder.finish();
        });
    }
    
    private onStart() {
        this._onstart(new Event('start'));
    }
    
    private onDataAvailable(data: Blob) {
        this._ondataavailable(new BlobEvent('dataavailable', this, data));
    }
    
    private onStop() {
        this._onstop(new Event('stop'));
    }
    
    private handleEncoderData(ev: BlobEvent) {
        this._chunks.push(ev.data);
    }
    
    private handleEncoderFinish() {
        const blob = new Blob(this._chunks, { type: this.mimeType });
        
        this.onDataAvailable(blob);
        
        this.onStop();
    }
    
    private handleAudioProcess(ev: AudioProcessingEvent) {
        const buffers: ArrayBuffer[] = [];
        
        const samples = ev.inputBuffer.length;
        
        const channels = ev.inputBuffer.numberOfChannels;
        
        for (let ch = 0; ch < channels; ++ch) {
            // make a copy
            const array = ev.inputBuffer.getChannelData(ch).slice();
            
            buffers.push(array.buffer);
        }
        
        this._encoder.encode(buffers, samples, channels);
    }
}
