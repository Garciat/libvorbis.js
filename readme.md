# libvorbis.js

This is my attempt at trying to encode audio into OGG Vorbis. So far, it's proven to be very slow.

However, if you want to give it a try yourself, be my guest. Follow these steps:

- install the Git submodules by running `git submodule init && git submodule update`
- and then run `sh compileOgg.sh && sh compileVorbis.sh`

You should now be able to write your own Vorbis encoder. For a quick start, give the `encoder_example.c` a try, by running

```shell
sh compileProgram.sh
cat techno.wav | node encoder_example.js > techno.ogg
```

## "Why?"

*My* primary goal is to be able to encode WebM video on the browser. Although, I'm already able to encode WAVE, WebM, however, only accepts Vorbis as audio.

But I also acknowledge that other people might be interested in this project, for various other reasons, other than my stated goal. So if you are intersted, feel free to fork this project, and then issue pull request if you think you solved the performance issue.

## Acknowledgement

This code is a fork of [Devon Govett](https://github.com/devongovett)'s [ogg.js](https://github.com/devongovett/ogg.js).