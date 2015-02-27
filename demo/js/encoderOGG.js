function encodeAudioCaptureOGG(data, quality) {
  var buffer = new Uint8Array(512 * 1024);
  var length = 0;
  
  function read_data() {
    var data = Vorbis.helpers.get_data(state);
    Vorbis.encoder_clear_data(state);
    
    var newsize = buffer.length;
    
    while (length + data.length > newsize) {
      newsize *= 2;
    }
    
    if (newsize !== buffer.length) {
      var newbuf = new Uint8Array(buffer.length * 2);
      newbuf.set(buffer, 0);
      buffer = newbuf;
    }
    
    buffer.set(data, length);
    length += data.length;
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
  
  var result = buffer.subarray(0, length);
  
  var blob = new Blob([result], { type: 'audio/ogg' });
  
  return blob;
}
