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

[Bare bones recorder](https://libvorbis-js.surge.sh/)

[Voice Memos fork](https://voice-memos-vorbis.surge.sh/) (original by: [Paul Lewis](https://aerotwist.com/blog/voice-memos/))

## Install it.

You can use **bower** to install **libvorbis.js** as a dependency:

```bash
bower install libvorbis.js
```

## Download it.

[Download](https://github.com/Garciat/libvorbis.js-dist/releases/latest) from the distribution repo.

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

## Ogg License (BSD)

Copyright (c) 2002, Xiph.org Foundation

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions
are met:

- Redistributions of source code must retain the above copyright
notice, this list of conditions and the following disclaimer.

- Redistributions in binary form must reproduce the above copyright
notice, this list of conditions and the following disclaimer in the
documentation and/or other materials provided with the distribution.

- Neither the name of the Xiph.org Foundation nor the names of its
contributors may be used to endorse or promote products derived from
this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
``AS IS'' AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE FOUNDATION
OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

## Vorbis License (BSD)

Copyright (c) 2002-2015 Xiph.org Foundation

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions
are met:

- Redistributions of source code must retain the above copyright
notice, this list of conditions and the following disclaimer.

- Redistributions in binary form must reproduce the above copyright
notice, this list of conditions and the following disclaimer in the
documentation and/or other materials provided with the distribution.

- Neither the name of the Xiph.org Foundation nor the names of its
contributors may be used to endorse or promote products derived from
this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
``AS IS'' AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE FOUNDATION
OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
