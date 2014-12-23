# vorbis.js

This combines work from [Alex Barkan](http://hotcashew.com/2014/02/chrome-audio-api-and-ogg-vorbis/) ( vorbis.cpp ) and effort from  [Salehen Rahman](https://github.com/shovon/libvorbis.js) who, in turn, forked, Devon Govett's [original repo](https://github.com/devongovett/ogg.js)

##What it is

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

## MIT License

Copyright (c) 2014 Joe Sullivan, Gabriel Garcia

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
