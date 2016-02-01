    return Module;
}

// node.js Environment
var module;
if (module && module.exports) {
    makeVorbisEncoderModule({}, module);
}

// Web Worker Environment
if (self.document === undefined) {
    VorbisWorkerScript.main(self);
}
