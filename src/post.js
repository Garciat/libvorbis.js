
var lib = {
  module: Module,
  
  encoder_create_vbr: Module.cwrap('encoder_create_vbr', 'number', ['number', 'number', 'number']),
  
  encoder_write_headers: Module.cwrap('encoder_write_headers', null, ['number']),
  
  encoder_prepare_analysis_buffers: Module.cwrap('encoder_prepare_analysis_buffers', null, ['number', 'number']),
  
  encoder_get_analysis_buffer: Module.cwrap('encoder_get_analysis_buffer', 'number', ['number', 'number']),
  
  encoder_encode: Module.cwrap('encoder_encode', null, ['number']),
  
  encoder_get_data: Module.cwrap('encoder_get_data', 'number', ['number']),
  
  encoder_get_data_len: Module.cwrap('encoder_get_data_len', 'number', ['number']),
  
  encoder_clear_data: Module.cwrap('encoder_clear_data', null, ['number']),
  
  encoder_finish: Module.cwrap('encoder_finish', null, ['number']),
  
  encoder_destroy: Module.cwrap('encoder_destroy', null, ['number']),
  
  helpers: {
    encode: function (state, n_samples, ch_data) {
      lib.encoder_prepare_analysis_buffers(state, n_samples);
      
      for (var ch = 0; ch < ch_data.length; ++ch) {
        var data = ch_data[ch];
        var dest_ptr = lib.encoder_get_analysis_buffer(state, ch);
        
        Module.HEAPF32.set(data, dest_ptr >> 2);
      }
      
      lib.encoder_encode(state);
    },
    
    get_data: function (state) {
      var data_ptr = lib.encoder_get_data(state);
      var data_len = lib.encoder_get_data_len(state);
      
      var data = Module.HEAPU8.subarray(data_ptr, data_ptr + data_len);
      
      return data;
    }
  }
};

return lib;

})();