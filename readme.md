# libvorbis.js

This is my (failed) attempt at trying to encode audio into OGG Vorbis.

However, if you want to give it a try yourself, be my guest. Follow these steps:

- install the Git submodules by running `git submodule init && git submodule update`
- and then run `compileOgg.sh && compileVorbis.sh`

You should now be able to write your own Vorbis encoder. For a quick start, give the `encoder_example.c` a try, by running

```shell
compileProgram.sh
cat techno.wav | node encoder_example.js > techno.ogg
```

# Acknowledgement

This code is a fork of [Devon Govett](https://github.com/devongovett)'s [ogg.js](https://github.com/devongovett/ogg.js).