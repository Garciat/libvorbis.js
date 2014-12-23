
return {
  init: Module.cwrap('lexy_encoder_start', 'number', ['number', 'number']),
  
  encode: function (state, l_buff, r_buff) {
    var n_samples = l_buff.length;
    
    Module._lexy_request_input_buffer(state, n_samples);
    
    var l_buff_ptr = Module._lexy_get_left_input_buffer(state);
    var r_buff_ptr = Module._lexy_get_right_input_buffer(state);
    
    Module.HEAPF32.set(l_buff, l_buff_ptr >> 2);
    Module.HEAPF32.set(r_buff, r_buff_ptr >> 2);
    
    Module._lexy_encode(state);
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