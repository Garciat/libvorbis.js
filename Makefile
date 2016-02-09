NATIVE_DIR=$(PWD)/native
OUTPUT_DIR=$(PWD)/build
NODE_BIN_DIR=$(PWD)/node_modules/.bin

TSC=$(NODE_BIN_DIR)/tsc
TSD=$(NODE_BIN_DIR)/tsd
UGLIFYJS=$(NODE_BIN_DIR)/uglifyjs

EMCC_OPTS=--llvm-lto 1 --memory-init-file 0 \
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
VORBIS_ENCODER_MIN=$(OUTPUT_DIR)/vorbis_encoder.min.js

VORBIS_LIB=$(OUTPUT_DIR)/libvorbis.js
VORBIS_LIB_MIN=$(OUTPUT_DIR)/libvorbis.min.js

VORBIS_LIB_HEAD=$(OUTPUT_DIR)/libvorbis.head.js
VORBIS_LIB_HEAD_MIN=$(OUTPUT_DIR)/libvorbis.head.min.js

all: $(VORBIS_LIB)

min: $(VORBIS_LIB_MIN)

clean: reset-submodules clean-bench
	rm -rf typings \
	$(VORBIS_LIB) \
	$(VORBIS_LIB_MIN) \
	$(VORBIS_LIB_HEAD) \
	$(VORBIS_LIB_HEAD_MIN) \
	$(VORBIS_ENCODER) \
	$(VORBIS_ENCODER_MIN) \
	$(WRAPPER_OBJ) \
	$(OGG_PRE) \
	$(VORBIS_PRE)

reset-submodules:
	(cd $(OGG_DIR); rm -rf *; git reset --hard); \
	(cd $(VORBIS_DIR); rm -rf *; git reset --hard)

$(OUTPUT_DIR):
	mkdir $@

$(VORBIS_LIB): $(VORBIS_LIB_HEAD) $(VORBIS_ENCODER)
	cat $(VORBIS_LIB_HEAD) $(VORBIS_ENCODER) > $@

$(VORBIS_LIB_MIN): $(VORBIS_LIB_HEAD_MIN) $(VORBIS_ENCODER_MIN)
	cat $(VORBIS_LIB_HEAD_MIN) $(VORBIS_ENCODER_MIN) > $@

$(VORBIS_LIB_HEAD): typings src/libvorbis.head.ts
	$(TSC) --outDir $(OUTPUT_DIR) -p src

$(VORBIS_LIB_HEAD_MIN): $(VORBIS_LIB_HEAD)
	cat $(VORBIS_LIB_HEAD) | $(UGLIFYJS) -m > $@

typings:
	$(TSD) install

OBJS=$(OGG_OBJ) $(VORBIS_OBJ) $(VORBISENC_OBJ) $(WRAPPER_OBJ)

VORBIS_ENCODER_OPTS=$(EMCC_OPTS) -s EXPORTED_FUNCTIONS="@exported_functions.json" \
		$(OGG_OBJ) $(VORBIS_OBJ) $(VORBISENC_OBJ) $(WRAPPER_OBJ) \
		--pre-js src/vorbis_encoder.pre.js --post-js src/vorbis_encoder.post.js

$(VORBIS_ENCODER): $(OBJS) src/vorbis_encoder.pre.js src/vorbis_encoder.post.js | $(OUTPUT_DIR)
	emcc -O0 $(VORBIS_ENCODER_OPTS) -o $@ 

$(VORBIS_ENCODER_MIN): $(OBJS) src/vorbis_encoder.pre.js src/vorbis_encoder.post.js | $(OUTPUT_DIR)
	emcc -O3 $(VORBIS_ENCODER_OPTS) -o $@

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
	cd $(VORBIS_DIR); \
	export OGG_LIBS="-L$(OGG_PRE)/lib"; \
	export OGG_CFLAGS="-I$(OGG_PRE)/include"; \
	emconfigure ./configure --prefix=$(VORBIS_PRE)
$(VORBIS_DIR)/configure: $(OGG_INC) $(OGG_OBJ)
	cd $(VORBIS_DIR); PKG_CONFIG_PATH=$(OGG_DIR) ./autogen.sh

$(VORBISENC_OBJ): $(VORBIS_OBJ)

$(WRAPPER_OBJ): $(OGG_INC) $(VORBIS_INC) $(WRAPPER_DIR)/vorbis_encoder.c
	emcc -c -o $@ -Wall -O3 -I$(OGG_INC) -I$(VORBIS_INC) $(WRAPPER_DIR)/vorbis_encoder.c

# ========================================
#   Benchmark
# ========================================

BENCH_WD=build/bench

bench: bench-cpp bench-node

clean-bench:
	cd build; rm -f test300.raw program-cpp

$(BENCH_WD): | $(OUTPUT_DIR)
	mkdir $@

bench-cpp: $(BENCH_WD)/test300.raw $(BENCH_WD)/program-cpp
	cd $(BENCH_WD); time ./program-cpp test300.raw /dev/null

bench-node: $(BENCH_WD)/test300.raw $(BENCH_WD)/program.js $(VORBIS_ENCODER_MIN)
	cd $(BENCH_WD); \
	export NODE_PATH=$(OUTPUT_DIR); \
	time node ./program.js test300.raw /dev/null

$(BENCH_WD)/test300.raw: | $(BENCH_WD)
	curl https://gist.githubusercontent.com/Garciat/c01d75e88891f66c8565/raw/4f247e6affba184142d87dee7f8c39f153254149/test300.raw.xz.b64 | base64 -d | unxz > $@

$(BENCH_WD)/program.js: bench/program.js | $(BENCH_WD)
	cp bench/program.js $@

$(BENCH_WD)/program-cpp: bench/program.cpp | $(BENCH_WD)
	g++ -std=c++14 -o $@ -logg -lvorbis -lvorbisenc bench/program.cpp
