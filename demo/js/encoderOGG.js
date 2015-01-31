function encodeAudioCaptureOGG(data, quality) {
  var state = Vorbis.init(data.sampleRate, quality);
  
  for (var i = 0; i < data.bufferCount; ++i) {
    Vorbis.encode(state, data.ch0[i], data.ch1[i]);
  }
  
  var data = Vorbis.finish(state);
  
  var blob = new Blob([data], { type: 'audio/ogg' });
  
  return blob;
}
