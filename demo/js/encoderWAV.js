function encodeAudioCaptureWAV(data) {
  var channels = 2;
  
  var buffer = new ArrayBuffer(44 + 2 * 4 * data.frameCount);
  
  writeHeader(buffer, data);
  
  writeData(buffer, data);
  
  var blob = new Blob([buffer], { type: 'audio/wav' });
  
  return blob;
}

function writeHeader(buffer, data) {
  var view = new DataView(buffer);
  
  var WAVE_FORMAT_IEEE_FLOAT = 3;
  
  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* RIFF chunk length */
  view.setUint32(4, 36 + 4 * 2 * data.frameCount, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, WAVE_FORMAT_IEEE_FLOAT, true);
  /* channel count */
  view.setUint16(22, 2, true);
  /* sample rate */
  view.setUint32(24, data.sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, data.sampleRate * 4, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 2 * 4, true);
  /* bits per sample */
  view.setUint16(34, 32, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, 4 * 2 * data.frameCount, true);
}

function writeData(buffer, data) {
  var interleaved = new Float32Array(buffer, 44);
  var offset = 0;
  
  for (var i = 0; i < data.bufferCount; ++i) {
    var buff1 = data.ch0[i];
    var buff2 = data.ch1[i];
    
    offset = interleaveBuffers(interleaved, offset, buff1, buff2);
  }
}

function interleaveBuffers(dest, offset, bufferL, bufferR) {
  for (var i = 0; i < bufferL.length; ++i) {
    dest[offset++] = bufferL[i];
    dest[offset++] = bufferR[i];
  }
  
  return offset;
}

function writeString(view, offset, string) {
  for (var i = 0; i < string.length; i++){
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
