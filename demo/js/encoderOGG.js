function encodeAudioCaptureOGG(data, quality) {
  var output = [];
  
  function read_data() {
    var data = Vorbis.helpers.get_data(state);
    Vorbis.encoder_clear_data(state);
    
    // The ogg stream has not flushed any data out yet
    if (data.length === 0) {
      return;
    }
    
    // The data buffer gets reused.
    // We need to copy the data out.
    var copy = new Uint8Array(data);
    
    output.push(copy);
  }
  
  var state = Vorbis.encoder_create_vbr(2, data.sampleRate, quality);
  
  Vorbis.encoder_write_headers(state);
  read_data()
  
  for (var i = 0; i < data.bufferCount; ++i) {
    Vorbis.helpers.encode(state, data.ch0[i].length, [data.ch0[i], data.ch1[i]]);
    read_data();
  }
  
  Vorbis.encoder_finish(state);
  read_data();
  
  Vorbis.encoder_destroy(state);
  
  var blob = new Blob(output, { type: 'audio/ogg' });
  
  return blob;
}
