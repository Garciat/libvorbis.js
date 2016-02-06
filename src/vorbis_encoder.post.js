    return Module;
}

// node.js Environment
var module;
if (module && module.exports) {
    makeVorbisEncoderModule({}, module);
}

// Web Worker Environment
if (!module && this.document === undefined) {
    VorbisWorkerScript.main(this);
}
