CC=emcc
CCFLAGS="-O2 -Iinclude"

LIBOGG_SRCDIR=libogg/src
LIBOGG_INCLUDES="-I$LIBOGG_SRCDIR -Ilibogg/include"
LIBOGG_SRCS="bitwise.c framing.c"
LIBOGG_OUTDIR=build/libogg

LIBVORBIS_SRCDIR=libvorbis/lib
LIBVORBIS_INCLUDES="$LIBOGG_INCLUDES -I$LIBVORBIS_SRCDIR -Ilibvorbis/include"
LIBVORBIS_SRCS="analysis.c bitrate.c block.c codebook.c envelope.c floor0.c floor1.c info.c lookup.c lpc.c lsp.c mapping0.c mdct.c psy.c registry.c res0.c sharedbook.c smallft.c synthesis.c vorbisenc.c window.c"
LIBVORBIS_OUTDIR=build/libvorbis

WRAPPER_SRCDIR=src
WRAPPER_INCLUDES="$LIBVORBIS_INCLUDES"
WRAPPER_SRCS="wrapper.cpp"
WRAPPER_OUTDIR=build/wrapper

COMPILE_PREJS=src/pre.js
COMPILE_POSTJS=src/post.js
COMPILE_TARGET=libvorbis.js
COMPILE_OUTDIR=dist
COMPILE_FLAGS="-s ALLOW_MEMORY_GROWTH=1 -s ASM_JS=1 -s EXPORTED_FUNCTIONS=@exported_functions.json"

### libogg

mkdir -p $LIBOGG_OUTDIR

for srcfile in $LIBOGG_SRCS; do
	buildcmd="$CC $CCFLAGS $LIBOGG_INCLUDES $LIBOGG_SRCDIR/$srcfile -o $LIBOGG_OUTDIR/${srcfile%.*}.bc"
	echo $buildcmd
	$buildcmd
done

### libvorbis

mkdir -p $LIBVORBIS_OUTDIR

for srcfile in $LIBVORBIS_SRCS; do
	buildcmd="$CC $CCFLAGS $LIBVORBIS_INCLUDES $LIBVORBIS_SRCDIR/$srcfile -o $LIBVORBIS_OUTDIR/${srcfile%.*}.bc"
	echo $buildcmd
	$buildcmd
done

### wrapper

mkdir -p $WRAPPER_OUTDIR

for srcfile in $WRAPPER_SRCS; do
	buildcmd="$CC $CCFLAGS $WRAPPER_INCLUDES $WRAPPER_SRCDIR/$srcfile -o $WRAPPER_OUTDIR/${srcfile%.*}.bc"
	echo $buildcmd
	$buildcmd
done

### compile

LIBOGG_BCS=build/libogg/*.bc
LIBVORBIS_BCS=build/libvorbis/*.bc
WRAPPER_BCS=build/wrapper/*.bc

-s ALLOW_MEMORY_GROWTH=1 -s ASM_JS=1 -s EXPORTED_FUNCTIONS='["_lexy_encoder_start", "_lexy_encoder_write", "_lexy_encoder_finish", "_lexy_get_buffer_length", "_lexy_get_buffer"]'

mkdir -p $COMPILE_OUTDIR

buildcmd="$CC $COMPILE_FLAGS $LIBOGG_BCS $LIBVORBIS_BCS $WRAPPER_BCS --pre-js $COMPILE_PREJS --post-js $COMPILE_POSTJS -o $COMPILE_OUTDIR/$COMPILE_TARGET"
echo $buildcmd
$buildcmd
