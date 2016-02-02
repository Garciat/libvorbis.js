# libvorbis.js

[![Build Status](https://travis-ci.org/Garciat/libvorbis.js.svg?branch=master)](https://travis-ci.org/Garciat/libvorbis.js)

## What?

**libvorbis.js** is an ASM.JS distribution of C libraries `libogg`,
`libvorbis`, and `libvorbisenc`. It also includes a library wrapper
that implements the W3C [`MediaRecorder`](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
interface**.

Ultimately, **libvorbis.js** allows you to *encode PCM data to Ogg Vorbis in the browser*.
**Ogg Vorbis** is a free and open-source codec for lossy audio compression.

**libvorbis.js** is 216KB big (minified, gzipped) and runs about 3x slower in V8, compared to native. (2.5x in Firefox).

** Full compliance under development.

## Why?

Yes, Firefox already supports the `MediaRecorder` API, which renders this library useless.

Unfortunately, Chromium (Chrome) does not yet ship a public, audio-capable
implementation of `MediaRecorder`. (It should arrive with Chromium 49.)

**libvorbis.js** aims to fill this void for the time being.

Besides this, encoding audio in the browser is beneficial in the following ways:

* Reduces server load; all the hard work is done in the client's browser

* Reduces browser storage usage ([IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) / [Web Storage](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API))

* Reduces upload time and data transfer; encoded audio files are a fraction of the size of raw WAV files

## OK, cool. What now?

## Demo it.

(Soon)

## Install it.

You can use **bower** to install **libvorbis.js** as a dependency:

```bash
bower install libvorbis.js
```

## Download it.

[Download](https://github.com/Garciat/libvorbis.js-bower/releases/latest) from the bower distribution repo.

## Build it.

**Requirements**

- emscripten compiler
- node.js & npm

**Preparations**

```bash
npm install --dev
```

That should install (locally):

- TypeScript 1.8+ compiler
- TypeScript Definition Manager
- UglifyJS

**Instructions**

```bash
git submodule init
git submodule update
make -j
```

Then, look for `build/libvorbis.js` or `build/libvorbis.min.js`.

## Credits

 - [Alex Barkan](http://hotcashew.com/2014/02/chrome-audio-api-and-ogg-vorbis/)
 - [Devon Govett](https://github.com/devongovett/ogg.js)
 - [Salehen Shovon Rahman](https://github.com/shovon/libvorbis.js)
 - [Jose Sullivan](https://github.com/itsjoesullivan/libvorbis.js)
