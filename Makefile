NATIVE_DIR=$(PWD)/native
OUTPUT_DIR=$(PWD)/build

EMCC_OPTS=-O3 --llvm-lto 1 --memory-init-file 0 \
		-s NO_EXIT_RUNTIME=1 -s AGGRESSIVE_VARIABLE_ELIMINATION=1 \
		-s NO_FILESYSTEM=1 -s NO_BROWSER=1

OGG_DIR=$(NATIVE_DIR)/ogg
OGG_PRE=$(OUTPUT_DIR)/ogg
OGG_INC=$(OGG_PRE)/include
OGG_OBJ=$(OGG_PRE)/lib/libogg.a

VORBIS_DIR=$(NATIVE_DIR)/vorbis
VORBIS_PRE=$(OUTPUT_DIR)/vorbis
VORBIS_INC=$(VORBIS_PRE)/include
VORBIS_OBJ=$(VORBIS_PRE)/lib/libvorbis.a

VORBISENC_OBJ=$(VORBIS_PRE)/lib/libvorbisenc.a

WRAPPER_DIR=$(NATIVE_DIR)/wrapper
WRAPPER_OBJ=$(OUTPUT_DIR)/vorbis_encoder.o

VORBIS_ENCODER=$(OUTPUT_DIR)/vorbis_encoder.js

VORBIS_LIB=$(OUTPUT_DIR)/library.js

TARGETS=$(OGG_OBJ) $(VORBIS_OBJ) $(VORBISENC_OBJ) $(WRAPPER_OBJ) $(VORBIS_ENCODER) $(VORBIS_LIB)

all: $(TARGETS)

clean: reset-submodules clean-bench
	rm -rf typings $(OGG_PRE) $(VORBIS_PRE) $(WRAPPER_OBJ) $(VORBIS_ENCODER) $(VORBIS_LIB)

reset-submodules:
	(cd $(OGG_DIR); rm -rf *; git reset --hard); \
	(cd $(VORBIS_DIR); rm -rf *; git reset --hard)

$(OUTPUT_DIR):
	mkdir $@

$(VORBIS_LIB): typings src/library.ts
	tsc --outDir $(OUTPUT_DIR) -p src

typings:
	tsd install

$(VORBIS_ENCODER): $(OUTPUT_DIR) $(OGG_OBJ) $(VORBIS_OBJ) $(VORBISENC_OBJ) $(WRAPPER_OBJ)
	emcc -o $@ $(EMCC_OPTS) -s EXPORTED_FUNCTIONS="@exported_functions.json" $(OGG_OBJ) $(VORBIS_OBJ) $(VORBISENC_OBJ) $(WRAPPER_OBJ)

$(OGG_INC): $(OGG_OBJ)
$(OGG_OBJ): $(OGG_DIR)/Makefile
	cd $(OGG_DIR); emmake make; emmake make install
$(OGG_DIR)/Makefile: $(OGG_DIR)/configure
	cd $(OGG_DIR); emconfigure ./configure --prefix=$(OGG_PRE)
$(OGG_DIR)/configure: $(OGG_DIR)/configure.ac.bak
	cd $(OGG_DIR); ./autogen.sh
# emscripten bug (https://github.com/kripken/emscripten/pull/3711)
$(OGG_DIR)/configure.ac.bak:
	cd $(OGG_DIR); \
	cp configure.ac configure.ac.bak; \
	sed -i -e "s/O20/O2/g" configure.ac

$(VORBIS_INC): $(VORBIS_OBJ)
$(VORBIS_OBJ): $(VORBIS_DIR)/Makefile
	cd $(VORBIS_DIR); emmake make; emmake make install
$(VORBIS_DIR)/Makefile: $(VORBIS_DIR)/configure
	cd $(VORBIS_DIR); emconfigure ./configure --prefix=$(VORBIS_PRE) --with-ogg=$(OGG_PRE)
$(VORBIS_DIR)/configure: $(OGG_INC) $(OGG_OBJ)
	cd $(VORBIS_DIR); PKG_CONFIG_PATH=$(OGG_DIR) ./autogen.sh

$(VORBISENC_OBJ): $(VORBIS_OBJ)

$(WRAPPER_OBJ): $(OGG_INC) $(VORBIS_INC) $(WRAPPER_DIR)/vorbis_encoder.c
	emcc -c -o $@ -Wall -O3 -I$(OGG_INC) -I$(VORBIS_INC) $(WRAPPER_DIR)/vorbis_encoder.c

# ========================================
#   Benchmark
# ========================================

bench: bench-cpp bench-node

bench-cpp: bench/test300.raw bench/program-cpp
	cd bench; time ./program-cpp test300.raw /dev/null

bench-node: bench/test300.raw bench/program.js $(VORBIS_ENCODER)
	cd bench; time node ./program.js test300.raw /dev/null

clean-bench:
	cd bench; rm -f test300.raw program-cpp

bench/test300.raw:
	curl https://gist.githubusercontent.com/Garciat/c01d75e88891f66c8565/raw/4f247e6affba184142d87dee7f8c39f153254149/test300.raw.xz.b64 | base64 -d | unxz > $@

bench/program-cpp: bench/program.cpp
	g++ -std=c++14 -o $@ -logg -lvorbis -lvorbisenc bench/program.cpp
