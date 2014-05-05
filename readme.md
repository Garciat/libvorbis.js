# vorbis.js

This combines work from [Alex Barkan](http://hotcashew.com/2014/02/chrome-audio-api-and-ogg-vorbis/) ( vorbis.cpp ) and effort from  [Salehen Rahman](https://github.com/shovon/libvorbis.js) who, in turn, forked, Devon Govett's [original repo](https://github.com/devongovett/ogg.js)

##What it is

This spits out a javascript file that can be used in the browser to convert PCM audio data to compressed ogg vorbis audio.

## Build

- Ensure that you have the emscripten installed.
  - i.e. you need access to `emcc`

```bash
git submodule init
git submodule update
./compileOgg.sh
./compileVorbis.sh
./build.sh
```

These steps will output vorbis.js

## Example
```html
<script src='vorbis.js'></script>
<script>
  var state = Module._lexy_encoder_start(44100, 3);

  this.on('write', function(left_buffer, right_buffer) {

    // Allocate memory using _malloc
    var left_buffer_ptr = Module._malloc( left_buffer.length * left_buffer.BYTES_PER_ELEMENT );
    var right_buffer_ptr = Module._malloc( right_buffer.length * right_buffer.BYTES_PER_ELEMENT );

    // Set the buffer values in memory
    Module.HEAPF32.set( left_buffer, left_buffer_ptr>>2 );
    Module.HEAPF32.set( right_buffer, right_buffer_ptr>>2 );

    // Write data to encoder
    Module._lexy_encoder_write( state, left_buffer_ptr, right_buffer_ptr, buffer_length );

    // Free the memory
    Module._free( left_buffer_ptr );
    Module._free( right_buffer_ptr );
  }

  this.on('finish', function() {
    Module._lexy_encoder_finish( state );
    var ogg_ptr = Module._lexy_get_buffer( state );
    var ogg_data = Module.HEAPU8.subarray( ptr, ptr + Module._lexy_get_buffer_length( state )

    var ogg_blob = new Blob([ ogg_data ], {
      type: 'audio/ogg'
    });
  });
</script>
```

## MIT License

Copyright (c) 2014 Joe Sullivan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
