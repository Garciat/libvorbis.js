CC=emcc
CCFLAGS="-O3 -ffast-math -Iinclude"

TARGET_DIR=dist

LIBOGG_SRCDIR=libogg/src
LIBOGG_INCLUDES="-I$LIBOGG_SRCDIR -Ilibogg/include"
LIBOGG_SRCS="bitwise.c framing.c"
LIBOGG_OUTDIR=build/libogg

LIBVORBIS_SRCDIR=libvorbis/lib
LIBVORBIS_INCLUDES="$LIBOGG_INCLUDES -I$LIBVORBIS_SRCDIR -Ilibvorbis/include"
LIBVORBIS_SRCS="analysis.c bitrate.c block.c codebook.c envelope.c floor0.c floor1.c info.c lookup.c lpc.c lsp.c mapping0.c mdct.c psy.c registry.c res0.c sharedbook.c smallft.c synthesis.c vorbisenc.c window.c"
LIBVORBIS_OUTDIR=build/libvorbis

WRAPPER_SRCDIR=src/native
WRAPPER_INCLUDES="$LIBVORBIS_INCLUDES"
WRAPPER_SRCS="ogg_vbr_encoder.c"
WRAPPER_OUTDIR=build/wrapper

LIBRARY_SRCDIR=src
LIBRARY_OUTDIR=build/lib

COMPILE_PREJS=src/libvorbis.asmjs.pre
COMPILE_POSTJS=src/libvorbis.asmjs.post
COMPILE_TARGET=libvorbis.asmjs.js
COMPILE_TARGET_OPT=libvorbis.asmjs.min.js
COMPILE_OUTDIR=$TARGET_DIR
COMPILE_FLAGS="-s ALLOW_MEMORY_GROWTH=0 -s ASM_JS=1 -s EXPORTED_FUNCTIONS=@exported_functions.json"
COMPILE_FLAGS="$COMPILE_FLAGS --pre-js $COMPILE_PREJS --post-js $COMPILE_POSTJS"
COMPILE_FLAGS_OPT="-O3 $COMPILE_FLAGS"
COMPILE_FLAGS="-O1 $COMPILE_FLAGS"

set -e

### libogg

echo ":: Compiling libogg..."

mkdir -p $LIBOGG_OUTDIR

for srcfile in $LIBOGG_SRCS; do
  buildcmd="$CC $CCFLAGS $LIBOGG_INCLUDES $LIBOGG_SRCDIR/$srcfile -o $LIBOGG_OUTDIR/${srcfile%.*}.bc"
  echo $buildcmd
  $buildcmd
done

### libvorbis

echo ":: Compiling libvorbis..."

mkdir -p $LIBVORBIS_OUTDIR

for srcfile in $LIBVORBIS_SRCS; do
  buildcmd="$CC $CCFLAGS $LIBVORBIS_INCLUDES $LIBVORBIS_SRCDIR/$srcfile -o $LIBVORBIS_OUTDIR/${srcfile%.*}.bc"
  echo $buildcmd
  $buildcmd
done

### wrapper

echo ":: Compiling wrapper..."

mkdir -p $WRAPPER_OUTDIR

for srcfile in $WRAPPER_SRCS; do
  buildcmd="$CC $CCFLAGS $WRAPPER_INCLUDES $WRAPPER_SRCDIR/$srcfile -o $WRAPPER_OUTDIR/${srcfile%.*}.bc"
  echo $buildcmd
  $buildcmd
done

### compile

LIBOGG_BCS=$LIBOGG_OUTDIR/*.bc
LIBVORBIS_BCS=$LIBVORBIS_OUTDIR/*.bc
WRAPPER_BCS=$WRAPPER_OUTDIR/*.bc

mkdir -p $COMPILE_OUTDIR

echo ":: Compiling target..."

buildcmd="$CC $COMPILE_FLAGS $LIBOGG_BCS $LIBVORBIS_BCS $WRAPPER_BCS -o $COMPILE_OUTDIR/$COMPILE_TARGET"
echo $buildcmd
$buildcmd

echo ":: Compiling target (minified)..."

buildcmd="$CC $COMPILE_FLAGS_OPT $LIBOGG_BCS $LIBVORBIS_BCS $WRAPPER_BCS -o $COMPILE_OUTDIR/$COMPILE_TARGET_OPT"
echo $buildcmd
$buildcmd

echo ":: Building library files..."

mkdir -p $LIBRARY_OUTDIR

libbuild() {
  tsc --out $LIBRARY_OUTDIR/$2.js $LIBRARY_SRCDIR/$1.ts
  uglifyjs -o $LIBRARY_OUTDIR/$2.min.js $LIBRARY_OUTDIR/$2.js
}

libbuild OggVbrEncoder libvorbis.oggvbr.encoder
libbuild OggVbrAsyncEncoder libvorbis.oggvbr.asyncencoder
libbuild OggVbrAsyncEncoderWorker libvorbis.oggvbr.asyncencoder.worker

#for jsfile in $(ls $LIBRARY_OUTDIR | grep .js); do
#  cat $LIBRARY_OUTDIR/$jsfile | uglifyjs > $LIBRARY_OUTDIR/${jsfile%.js}.min.js
#done

cp $LIBRARY_OUTDIR/* $TARGET_DIR
#find $LIBRARY_SRCDIR -name \*.d.ts -exec cp {} $TARGET_DIR \;

echo ":: DONE"
