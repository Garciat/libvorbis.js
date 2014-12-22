
return {
  init: Module.cwrap('lexy_encoder_start', 'number', ['number', 'number']),
  
  encode: function (state, l_buff, r_buff) {
    var n_samples = l_buff.length;
    
    var l_buff_ptr = Module._malloc(l_buff.length * l_buff.BYTES_PER_ELEMENT);
    var r_buff_ptr = Module._malloc(r_buff.length * r_buff.BYTES_PER_ELEMENT);
    
    Module.HEAPF32.set(l_buff, l_buff_ptr >> 2);
    Module.HEAPF32.set(r_buff, r_buff_ptr >> 2);
    
    Module._lexy_encoder_write(state, l_buff_ptr, r_buff_ptr, n_samples);
    
    Module._free(l_buff_ptr);
    Module._free(r_buff_ptr);
  },
  
  finish: function (state) {
    Module._lexy_encoder_finish(state);
    
    var ogg_ptr = Module._lexy_get_buffer(state);
    var ogg_len = Module._lexy_get_buffer_length(state);
    
    var ogg_data = Module.HEAPU8.subarray(ogg_ptr, ogg_ptr + ogg_len);
    
    return ogg_data;
  }
};


})();