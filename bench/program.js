'use strict';

const fs = require('fs');
const encoder = require('vorbis_encoder.min');

if (process.argv.length !== 4) {
    process.exit();
}

const fileData = fs.readFileSync(process.argv[2]);

const handle = encoder._encoder_create_vbr(1, 44100, 0.5);

const chunks = [];

function flush() {
    const dataLength = encoder._encoder_get_data_len(handle);
    
    if (dataLength === 0)
        return;
    
    const dataPointer = encoder._encoder_get_data(handle);
    
    const chunk = encoder.HEAPU8.subarray(dataPointer, dataPointer + dataLength);
    
    const data = new Uint8Array(chunk); // copy
    
    const buffer = data.buffer;
    
    encoder._encoder_clear_data(handle);
    
    chunks.push(new Buffer(buffer));
}

encoder._encoder_write_headers(handle);

flush();

const READ = 4096 * 10;

const fileBuffer = fileData.buffer;

for (let offset = 0; offset < fileData.length; offset += READ) {
    const samples = Math.min(READ, fileData.length - offset) / 4;
    
    encoder._encoder_prepare_analysis_buffers(handle, samples);
    
    const array = new Float32Array(fileBuffer, offset, samples);
    
    const bufferPtr = encoder._encoder_get_analysis_buffer(handle, 0);
    
    encoder.HEAPF32.set(array, bufferPtr >> 2);
    
    encoder._encoder_encode(handle);
    
    flush();
}

encoder._encoder_finish(handle);

flush();

encoder._encoder_destroy(handle);

const result = Buffer.concat(chunks);

fs.writeFileSync(process.argv[3], result);
