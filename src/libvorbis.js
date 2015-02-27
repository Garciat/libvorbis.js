
var Vorbis = (function () {
  'use strict';
  
  var config = {
    workerURL: 'libvorbis.worker.js',
    moduleURL: 'libvorbis.module.min.js',
    memoryInitializerURL: 'libvorbis.module.min.js.mem'
  };
  
  function VorbisEncoderVBR() {
    this._worker = new Worker(config.workerURL);
    this._data = [];
    
    var self = this;
    
    this.on('flush', function (data) {
      if (!data) return;
      self._data.push(data);
    });
  }
  
  VorbisEncoderVBR.prototype.send = function (type, data, transferList) {
    sendMessage(this._worker, type, data, transferList);
  };
  
  VorbisEncoderVBR.prototype.on = function (type, callback) {
    return onMessageType(this._worker, type, callback);
  };
  
  VorbisEncoderVBR.prototype.once = function (type, callback) {
    return onMessageTypeOnce(this._worker, type, callback);
  };
  
  VorbisEncoderVBR.prototype.request = function (type, requestData, transferList) {
    var self = this;
    
    return new Promise(function (resolve, reject) {
      var errorListener = self.once('error', function (error) {
        listener.cancel();
        self.destroy();
        reject(error);
      });
      
      var listener = self.once(type, function (responseData) {
        errorListener.cancel();
        //console.log('recv: ', type, responseData);
        resolve(self, responseData);
      });
      
      //console.log('send: ', type, requestData);
      self.send(type, requestData, transferList);
    });
  };
  
  VorbisEncoderVBR.prototype.requestDefer = function (type, requestData, transferList) {
    var self = this;
    return function () {
      return self.request(type, requestData, transferList);
    };
  }
  
  VorbisEncoderVBR.prototype.makeBlob = function () {
    return new Blob(this._data, { type: 'audio/ogg' });
  };
  
  VorbisEncoderVBR.prototype.destroy = function () {
    this._worker.terminate();
    
    this._worker = null;
    this._data = null;
  };
  
  return {
    Encoding: {
      
      createVBR: function createVBR(channels, sampleRate, quality) {
        var encoder = new VorbisEncoderVBR();
        
        var conf = encoder.requestDefer('config', config);
        
        var init = encoder.requestDefer('init', {
          channels: channels,
          sampleRate: sampleRate,
          quality: quality
        });
        
        return conf().then(init);
      },
      
      writeHeaders: function writeHeaders(encoder) {
        var flush = encoder.requestDefer('flush');
        
        return encoder.request('writeHeaders').then(flush);
      },
      
      encode: function encode(samples, buffers) {
        buffers = buffers.map(function (typed) {
          return typed.buffer;
        });
        
        return function (encoder) {
          var encode = encoder.requestDefer('encode', {
            samples: samples,
            buffers: buffers
          });
          
          var flush = encoder.requestDefer('flush');
          
          return encode().then(flush);
        };
      },
      
      encodeTransfer: function encode(samples, buffers) {
        return function (encoder) {
          return encoder.request('encode', {
            samples: samples,
            buffers: buffers
          }, buffers);
        };
      },
      
      finish: function finish(encoder) {
        var finish = encoder.requestDefer('finish');
        
        var flush = encoder.requestDefer('flush');
        
        return finish().then(flush).then(function () {
          var blob = encoder.makeBlob();
          encoder.destroy();
          return blob;
        });
      }
      
    },
    
    configure: function (options) {
      Object.keys(options).forEach(function (key) {
        config[key] = options[key];
      });
    }
  };
  
  // -- Helpers
  
  function sendMessage(dest, type, data, transferList) {
    dest.postMessage({
      type: type,
      data: data
    }, transferList);
  }
  
  function onMessageType(source, type, callback) {
    source.addEventListener('message', handler);
    
    function handler(ev) {
      var message = ev.data;
      
      if (message.type === type) {
        callback(message.data);
      }
    }
    
    return {
      cancel: function () {
        source.removeEventListener('message', handler);
      }
    };
  }
  
  function onMessageTypeOnce(source, type, callback) {
    var listener = onMessageType(source, type, function (data) {
      listener.cancel();
      callback(data);
    });
    
    return listener;
  }
  
})();
