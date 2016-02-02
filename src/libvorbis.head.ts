/// <reference path="../typings/webrtc/MediaStream.d.ts" />
/// <reference path="../typings/webaudioapi/waa.d.ts" />
/// <reference path="../typings/es6-promise/es6-promise.d.ts" />

/// <reference path="MediaRecorder.d.ts" />
/// <reference path="vorbis_encoder.d.ts" />

class VorbisWorkerScript {
    static createWorker() {
        return new Worker(VorbisWorkerScript.getCurrentScriptURL());
    }
    
    // NOTE `self` should be type `WorkerGlobalScope`
    // see https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope
    public static main(self: Worker) {
        const Module = makeVorbisEncoderModule({
            onRuntimeInitialized() {
                self.postMessage({ type: 'load' });
            }
        });
        
        let handle: number;
        
        function flush() {
            const dataLength = Module._encoder_get_data_len(handle);
            
            if (dataLength === 0)
                return;
            
            const dataPointer = Module._encoder_get_data(handle);
            
            const chunk = Module.HEAPU8.subarray(dataPointer, dataPointer + dataLength);
            
            const data = new Uint8Array(chunk); // copy
            
            const buffer = data.buffer;
            
            Module._encoder_clear_data(handle);
            
            self.postMessage({ type: 'data', buffer: buffer }, [buffer]);
        }
        
        self.addEventListener('message', (ev) => {
            const data = ev.data;
            
            switch (data.type) {
            case 'start':
                handle = Module._encoder_create_vbr(data.channels, data.sampleRate, data.quality);
                
                Module._encoder_write_headers(handle);
                
                flush();
                break;
                
            case 'data':
                Module._encoder_prepare_analysis_buffers(handle, data.samples);
                
                for (let ch = 0; ch < data.channels; ++ch) {
                    const bufferPtr = Module._encoder_get_analysis_buffer(handle, ch);
                    
                    const array = new Float32Array(data.buffers[ch]);
                    
                    Module.HEAPF32.set(array, bufferPtr >> 2);
                }
                
                Module._encoder_encode(handle);
                
                flush();
                break;
                
            case 'finish':
                Module._encoder_finish(handle);
                
                flush();
                
                Module._encoder_destroy(handle);
                
                self.postMessage({ type: 'finish' });
                break;
            }
        });
    }
    
    private static getCurrentScriptURL = (function () {
        if (!this.document) {
            return null;
        }
        
        const script = <HTMLScriptElement>(<any> document).currentScript;
        const scriptSrc = script.getAttribute('src');
        
        const absoluteRegex = /^(blob\:|http\:|https\:)/;
        
        let url: string;
        
        if (absoluteRegex.test(scriptSrc)) {
            url = scriptSrc;
        } else {
            const dirname = location.pathname.split('/').slice(0, -1).join('/');
            
            url = `${location.protocol}//${location.host}`;
            
            if (scriptSrc[0] === '/') {
                url += scriptSrc;
            } else {
                url += dirname + '/' + scriptSrc;
            }	
        }
        
        return () => url;
    })();
}

function noop() { }

interface DataCallback {
    (data: ArrayBuffer): void;
}

class VorbisEncoder {
    // ---
    
    private _worker: Worker;
    
    // ---
    
    private _ondata: DataCallback;
    
    private _onfinish: EventListener;
    
    // ---
    
    constructor() {
        this._worker = VorbisWorkerScript.createWorker();
        
        // ---
        
        this._ondata = noop;
        
        this._onfinish = noop;
        
        // ---
        
        this._worker.onmessage = this.handleEncoderMessage.bind(this);
    }
    
    get ondata(): DataCallback {
        return this._ondata;
    }
    
    set ondata(value: DataCallback) {
        this._ondata = value || noop;
    }
    
    get onfinish(): EventListener {
        return this._onfinish;
    }
    
    set onfinish(value: EventListener) {
        this._onfinish = value || noop;
    }
    
    init(channels: number, sampleRate: number, quality: number) {
        this._worker.postMessage({
            type: 'start',
            sampleRate: sampleRate,
            channels: channels,
            quality: quality
        });
    }
    
    encode(buffers: ArrayBuffer[], samples: number, channels: number) {
        this._worker.postMessage({
            type: 'data',
            samples: samples,
            channels: channels,
            buffers: buffers
        }, buffers);
    }
    
    finish() {
        this._worker.postMessage({ type: 'finish' });
    }
    
    private handleEncoderMessage(ev: MessageEvent) {
        const data = ev.data;
        
        switch (data.type) {
        case 'load':
            // TODO
            break;
            
        case 'data':
            this._ondata(data.buffer);
            break;
            
        case 'finish':
            this._onfinish(new Event('finish'));
            break;
        }
    }
}

enum RecordingState {
    "inactive",
    "recording",
    "paused"
}

interface VorbisMediaRecorderOptions {
    // TODO
}

function makeBlobEvent(type: string, blob: Blob): BlobEvent {
    return new BlobEvent(type, { data: blob, blob: blob });
}

class VorbisMediaRecorder {
    // ---
    
    private _state: RecordingState;
    
    private _stream: MediaStream;
    
    // ---
    
    private _encoder: VorbisEncoder;
    
    private _chunks: ArrayBuffer[];
    
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
        this._ondataavailable(makeBlobEvent('dataavailable', data));
    }
    
    private onStop() {
        this._onstop(new Event('stop'));
    }
    
    private handleEncoderData(data: ArrayBuffer) {
        this._chunks.push(data);
    }
    
    private handleEncoderFinish() {
        const blob = new Blob(this._chunks, { type: this.mimeType });
        
        this.onDataAvailable(blob);
        
        this.onStop();
    }
    
    private handleAudioProcess(ev: AudioProcessingEvent) {
        const buffers: ArrayBuffer[] = [];
        
        const audioBuffer = ev.inputBuffer;
        
        const samples = audioBuffer.length;
        
        const channels = audioBuffer.numberOfChannels;
        
        for (let ch = 0; ch < channels; ++ch) {
            // make a copy
            const array = audioBuffer.getChannelData(ch).slice();
            
            buffers.push(array.buffer);
        }
        
        this._encoder.encode(buffers, samples, channels);
    }
}
