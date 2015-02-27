#include <vorbis/vorbisenc.h>

/* source: https://svn.xiph.org/trunk/vorbis/examples/encoder_example.c */

struct encoder_state {
  ogg_stream_state os;
  
  ogg_packet op;
  
  vorbis_info vi;
  vorbis_comment vc;
  
  vorbis_dsp_state vd;
  vorbis_block vb;
  
  float **analysis_buffer;
  int analysis_vals;
  
  unsigned char *data;
  long data_len;
};

typedef struct encoder_state *encoder_instance;

encoder_instance encoder_create_vbr(int ch, int bitrate, float quality);

void encoder_write_headers(encoder_instance state);

void encoder_prepare_analysis_buffers(encoder_instance state, int vals);

float *encoder_get_analysis_buffer(encoder_instance state, int ch);

void encoder_encode(encoder_instance state);

unsigned char *encoder_get_data(encoder_instance state);

long encoder_get_data_len(encoder_instance state);

void encoder_clear_data(encoder_instance state);

void encoder_finish(encoder_instance state);

void encoder_destroy(encoder_instance state);
