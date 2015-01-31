function getAudioStream() {
  var getUserMedia  =  navigator.getUserMedia
                    || navigator.webkitGetUserMedia
                    || navigator.mozGetUserMedia
                    || navigator.msGetUserMedia;
  
  return new Promise(function (resolve, reject) {
    getUserMedia.call(navigator, { audio: true }, function (stream) {
      resolve(stream);
    }, function (err) {
      reject(err);
    });
  });
}

function beginAudioCapture(stream, bufferSize) {
  var audioContext = new AudioContext();
  var audioSourceNode = audioContext.createMediaStreamSource(stream);
  var scriptProcessorNode = audioContext.createScriptProcessor(bufferSize);
  
  var ch0 = [];
  var ch1 = [];
  
  scriptProcessorNode.onaudioprocess = function (ev) {
    var inputBuffer = ev.inputBuffer;
    var buffL = inputBuffer.getChannelData(0);
    var buffR = inputBuffer.getChannelData(1);
    
    // store copies; audio buffers get reused
    ch0.push(new Float32Array(buffL));
    ch1.push(new Float32Array(buffR));
  };
  
  audioSourceNode.connect(scriptProcessorNode);
  scriptProcessorNode.connect(audioContext.destination); // WebKit BUG
  
  return {
    stop: function () {
      audioSourceNode.disconnect(scriptProcessorNode);
      scriptProcessorNode.disconnect(audioContext.destination); // WebKit BUG
      
      stream.stop();
      
      return {
        sampleRate: audioContext.sampleRate,
        bufferSize: scriptProcessorNode.bufferSize,
        bufferCount: ch0.length,
        frameCount: ch0.length * scriptProcessorNode.bufferSize,
        ch0: ch0,
        ch1: ch1
      };
    }
  };
}

function downloadBlob(url) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'blob';
    
    xhr.onload = function () {
      resolve(xhr.response)
    };
    
    xhr.onerror = reject;
    
    xhr.send();
  });
}

function uploadBlob(url, blob) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    
    xhr.onload = resolve;
    
    xhr.onerror = reject;
    
    xhr.send(blob);
  });
}
