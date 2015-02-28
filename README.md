# libvorbis.js

## What it is

This spits out a javascript file that can be used in the browser to convert PCM audio data to compressed ogg vorbis audio.

## Download

See [releases](https://github.com/Garciat/libvorbis.js/releases).

## Build

- Ensure that you have emscripten installed.
  - i.e. you need access to `emcc`

```bash
git submodule init
git submodule update
./build.sh
```

## Demos

[Microphone recorder](http://garciat.com/libvorbis.js/demos/microphone-recorder.html).

## API

(types added for descriptive purposes)

```csharp
// library options object format (with default values)
object VorbisOptions {
  // location of worker script
  string workerURL = 'libvorbis.worker.js';
  
  // location of module script
  // Note: this is relative to workerURL!
  string moduleURL = 'libvorbis.module.min.js';
  
  // location of memory initializer (for minified build)
  // Note: this is relative to workerURL!
  string memoryInitializerURL = 'libvorbis.module.min.js.mem';
}

// call this to configure script routes
void Vorbis.configure(VorbisOptions options);

// opaque type representing VBR encoding state
object VorbisEncoderVBR;

// standard promises
object Promise<T>;

// unary function
object Func<Param, Return>;

// creates a new encoder instance
Promise<VorbisEncoderVBR> Vorbis.Encoding.createVBR(int channels, int sampleRate, float quality);

// writes vorbis headers
// this must be called before encoding
Promise<VorbisEncoderVBR> Vorbis.Encoding.writeHeaders(VorbisEncoderVBR encoder);

// encodes an array of buffers (one for each channel)
Func<VorbisEncoderVBR, Promise<VorbisEncoderVBR>> Vorbis.Encoding.encode(int samples, Float32Array[] buffers);

// same as above, but will transfer the buffers instead of copying
Func<VorbisEncoderVBR, Promise<VorbisEncoderVBR>> Vorbis.Encoding.encodeTransfer(int samples, Float32Array[] buffers);

// finishes encoding and produces a Blob with final contents
Promise<Blob> Vorbis.Encoding.encode(VorbisEncoderVBR encoder);
```

## Emscripten API

(types added for descriptive purposes)

```csharp
using EncoderInstance = int;
using Pointer = int;

// Creates a new encoder instance
// quality from -0.1 to 1.0
EncoderInstance Module.lib.encoder_create_vbr(int channels, int sampleRate, float quality);

// Writes initial vorbis headers to output data buffer
void Module.lib.encoder_write_headers(EncoderInstance state);

// Prepares vorbis encoding analysis buffers for the number of samples
void Module.lib.encoder_prepare_analysis_buffers(EncoderInstance state, int samples);

// Gets the analysis buffer for the specified channel
Pointer Module.lib.encoder_get_analysis_buffer(EncoderInstance state, int channel);

// Encodes data from the analysis buffers and writes to output data buffer
void Module.lib.encoder_encode(EncoderInstance state);

// Gets output data buffer
// Note: you should copy the data out (see encoder_clear_data)
Pointer Module.lib.encoder_get_data(EncoderInstance state);

// Returns size of output data buffer
long Module.lib.encoder_get_data_len(EncoderInstance state);

// Clears output data buffer
// Note: this simply tells the encoder to reuse the data buffer
void Module.lib.encoder_clear_data(EncoderInstance state);

// Signals the encoder that we are done
// The encoder may write additional data to the output data buffer
void Module.lib.encoder_finish(EncoderInstance state);

// Frees all data related to the encoder
void Module.lib.encoder_destroy(EncoderInstance state);

// The following helpers are included:

// Encodes an array of buffers (one for each channel)
void Module.lib.helpers.encode(EncoderInstance state, int samples, Float32Array[] data);

// Returns the output data buffer. Does not call encoder_clear_data.
// Note: You still need to make a copy of the data (see encoder_get_data)
Uint8Array Module.lib.helpers.get_data(EncoderInstance state);
```

## Credits

 - [Alex Barkan](http://hotcashew.com/2014/02/chrome-audio-api-and-ogg-vorbis/)
 - [Salehen Rahman](https://github.com/shovon/libvorbis.js)
 - [Devon Govett](https://github.com/devongovett/ogg.js)
 - [Salehen Shovon Rahman](https://github.com/shovon/libvorbis.js)
 - [Jose Sullivan](https://github.com/itsjoesullivan/libvorbis.js)
