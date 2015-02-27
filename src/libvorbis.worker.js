(function () {
  'use strict';
  
  var state = null;
  
  handleRequestOnce('config', function (config) {
    self.Module = {
      locateFile: function (file) {
        switch (file) {
        case 'libvorbis.module.min.js.mem':
          return config.memoryInitializerURL;
        }
      },
      onRuntimeInitialized: function () {
        // manually reply to request
        sendMessage('config');
      }
    };
    
    importScripts(config.moduleURL);
    
    return NO_RESPONSE;
  });
  
  handleRequestOnce('init', function (options) {
    state = Module.lib.encoder_create_vbr(
      options.channels,
      options.sampleRate,
      options.quality
    );
    
    if (state === 0) {
      sendMessage('error', 'Could not create encoder.');
    }
  })
  
  handleRequestOnce('writeHeaders', function () {
    Module.lib.encoder_write_headers(state);
  });
  
  handleRequest('encode', function (input) {
    // we receive untyped ArrayBuffers
    // we need to make Float32Array views
    var buffers = input.buffers.map(function (buffer) {
      return new Float32Array(buffer);
    });
    
    Module.lib.helpers.encode(state, input.samples, buffers);
  });
  
  handleRequest('flush', function (input) {
    // we should make a copy of the data buffer,
    // but the client-worker communication layer
    // will automatically do the copy for us.
    
    var data = Module.lib.helpers.get_data(state);
    
    if (data.length === 0) {
      return null;
    }
    
    Module.lib.encoder_clear_data(state);
    return data;
  });
  
  handleRequestOnce('finish', function () {
    Module.lib.encoder_finish(state);
  });
  
  handleRequestOnce('destroy', function () {
    Module.lib.encoder_destroy(state);
  });
  
  // -- Helpers
  
  var NO_RESPONSE = {};
  
  function sendMessage(type, data) {
    self.postMessage({
      type: type,
      data: data
    });
  }
  
  function handleRequest(type, func) {
    self.addEventListener('message', handler);
    
    function handler(ev) {
      var message = ev.data;
      
      if (message.type === type) {
        var request = message.data;
        var response = func(request);
        
        if (response === NO_RESPONSE) {
          // do nothing
        } else {
          sendMessage(type, response);
        }
      }
    }
    
    return {
      cancel: function () {
        self.removeEventListener('message', handler);
      }
    };
  }
  
  function handleRequestOnce(type, func) {
    var listener = handleRequest(type, function (request) {
      listener.cancel();
      return func(request);
    });
    
    return listener;
  }
  
})();