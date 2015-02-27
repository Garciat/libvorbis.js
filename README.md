# libvorbis.js

## Credit

This combines work from [Alex Barkan](http://hotcashew.com/2014/02/chrome-audio-api-and-ogg-vorbis/) ( vorbis.cpp ) and effort from  [Salehen Rahman](https://github.com/shovon/libvorbis.js) who, in turn, forked, Devon Govett's [original repo](https://github.com/devongovett/ogg.js)

## What it is

This spits out a javascript file that can be used in the browser to convert PCM audio data to compressed ogg vorbis audio.

## Download

Head over to the [releases](https://github.com/Garciat/libvorbis.js/releases) page
and download either the development version (libvorbis.js) or the minified "production"
version (libvorbis.min.js **and** libvorbis.min.js.mem)

## Build

- Ensure that you have the emscripten installed.
  - i.e. you need access to `emcc`

```bash
git submodule init
git submodule update
./build.sh
```

## Usage

See [demo](demo).

## API

(types added for descriptive purposes)

```csharp
// access to emscripten Module object
// e.g. Vorbis.module.HEAP is the program memory buffer
Vorbis.module

using EncoderInstance = int;
using Pointer = int;

// Creates a new encoder instance
// quality from -0.1 to 1.0
EncoderInstance Vorbis.encoder_create_vbr(int channels, int sampleRate, float quality);

// Writes initial vorbis headers to output data buffer
void Vorbis.encoder_write_headers(EncoderInstance state);

// Prepares vorbis encoding analysis buffers for the number of samples
void Vorbis.encoder_prepare_analysis_buffers(EncoderInstance state, int samples);

// Gets the analysis buffer for the specified channel
Pointer Vorbis.encoder_get_analysis_buffer(EncoderInstance state, int channel);

// Encodes data from the analysis buffers and writes to output data buffer
void Vorbis.encoder_encode(EncoderInstance state);

// Gets output data buffer
// Note: you should copy the data out (see encoder_clear_data)
Pointer Vorbis.encoder_get_data(EncoderInstance state);

// Returns size of output data buffer
long Vorbis.encoder_get_data_len(EncoderInstance state);

// Clears output data buffer
// Note: this simply tells the encoder to reuse the data buffer
void Vorbis.encoder_clear_data(EncoderInstance state);

// Signals the encoder that we are done
// The encoder may write additional data to the output data buffer
void Vorbis.encoder_finish(EncoderInstance state);

// Frees all data related to the encoder
void Vorbis.encoder_destroy(EncoderInstance state);

// The following helpers are included:

// Encodes an array of buffers (one for each channel)
void Vorbis.helpers.encode(EncoderInstance state, int samples, Float32Array[] data);

// Returns the output data buffer. Does not call encoder_clear_data.
// Note: You still need to make a copy of the data (see encoder_get_data)
Uint8Array Vorbis.helpers.get_data(EncoderInstance state);
```
