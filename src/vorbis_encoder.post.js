    return Module;
}

// node.js Environment
var module;
if (module && module.exports) {
    makeVorbisEncoderModule({}, module);
}

// Web Worker Environment
var self;
if (self && self.document === undefined) {
    VorbisWorkerScript.main(self);
}
