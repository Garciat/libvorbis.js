# libvorbis.js

## What?

**libvorbis.js** is an ASM.JS distribution of C libraries `libogg`,
`libvorbis`, and `libvorbisenc`. It also includes a library wrapper
that implements the W3C [`MediaRecorder`](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
interface**.

** Full compliance under development.

## Why?

Unfortunately, Chromium (Chrome) does not yet ship a public, audio-capable
implementation of `MediaRecorder`. (It should arrive with Chromium 49.)

**libvorbis.js** aims to fill this void for the time being.

## OK, cool. What now?

## Demo it.

(Soon)

## Install it.

(Soon)

## Download it.

(Soon)

## Build it.

**Requirements**

- emscripten compiler
- TypeScript 1.5+ compiler (`npm install -g typescript`)

**Instructions**

```bash
git submodule init
git submodule update
make -j
```

Then, look for `build/vorbis_encoder.js` and `build/library.js`.

## Credits

 - [Alex Barkan](http://hotcashew.com/2014/02/chrome-audio-api-and-ogg-vorbis/)
 - [Devon Govett](https://github.com/devongovett/ogg.js)
 - [Salehen Shovon Rahman](https://github.com/shovon/libvorbis.js)
 - [Jose Sullivan](https://github.com/itsjoesullivan/libvorbis.js)
