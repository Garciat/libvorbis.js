#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <time.h>

#include <vorbis/vorbisenc.h>

#include "ogg_vbr_encoder.h"

/* source: https://svn.xiph.org/trunk/vorbis/examples/encoder_example.c */

static void encoder_write_page(encoder_instance state, ogg_page *og);
static void encoder_encode_work(encoder_instance state);

encoder_instance encoder_create_vbr(int ch, int bitrate, float quality) {
  encoder_instance state = malloc(sizeof(struct encoder_state));
  state->data = NULL;
  state->data_len = 0;
  
  vorbis_info_init(&state->vi);
  
  if (vorbis_encode_init_vbr(&state->vi, ch, bitrate, quality) != 0) {
    free(state);
    return NULL;
  }
  
  vorbis_comment_init(&state->vc);
  vorbis_comment_add_tag(&state->vc, "ENCODER", "libvorbis.js");
  
  vorbis_analysis_init(&state->vd, &state->vi);
  vorbis_block_init(&state->vd, &state->vb);
  
  srand(time(NULL));
  ogg_stream_init(&state->os, rand());
  
  return state;
}

void encoder_destroy(encoder_instance state) {
  ogg_stream_clear(&state->os);
  vorbis_block_clear(&state->vb);
  vorbis_dsp_clear(&state->vd);
  vorbis_comment_clear(&state->vc);
  vorbis_info_clear(&state->vi);
  
  free(state->data);
  free(state);
}

void encoder_write_headers(encoder_instance state) {
  ogg_packet header;
  ogg_packet header_comm;
  ogg_packet header_code;
  
  ogg_page og;
  
  vorbis_analysis_headerout(&state->vd, &state->vc, &header, &header_comm, &header_code);
  ogg_stream_packetin(&state->os, &header);
  ogg_stream_packetin(&state->os, &header_comm);
  ogg_stream_packetin(&state->os, &header_code);
  
  while (ogg_stream_flush(&state->os, &og) != 0) {
    encoder_write_page(state, &og);
  }
}

void encoder_prepare_analysis_buffers(encoder_instance state, int vals) {
  state->analysis_buffer = vorbis_analysis_buffer(&state->vd, vals);
  state->analysis_vals = vals;
}

void encoder_encode(encoder_instance state) {
  vorbis_analysis_wrote(&state->vd, state->analysis_vals);
  
  encoder_encode_work(state);
}

void encoder_finish(encoder_instance state) {
  vorbis_analysis_wrote(&state->vd, 0);
  
  encoder_encode_work(state);
}

unsigned char *encoder_get_data(encoder_instance state) {
  return state->data;
}

long encoder_get_data_len(encoder_instance state) {
  return state->data_len;
}

void encoder_clear_data(encoder_instance state) {
  state->data_len = 0;
}

float *encoder_get_analysis_buffer(encoder_instance state, int ch) {
  return state->analysis_buffer[ch];
}

void encoder_encode_work(encoder_instance state) {
  ogg_page og;
  
  while (vorbis_analysis_blockout(&state->vd, &state->vb) == 1) {
    vorbis_analysis(&state->vb, NULL);
    vorbis_bitrate_addblock(&state->vb);
    
    while (vorbis_bitrate_flushpacket(&state->vd, &state->op)) {
      
      ogg_stream_packetin(&state->os, &state->op);
      
      while (ogg_stream_pageout(&state->os, &og) != 0) {
        encoder_write_page(state, &og);
      }
    }
  }
}

void encoder_write_page(encoder_instance state, ogg_page *og) {
  long size = state->data_len + og->header_len + og->body_len;
  
  if (size == 0) {
    return;
  }
  
  state->data = realloc(state->data, size);
  
  memcpy(state->data + state->data_len, og->header, og->header_len);
  state->data_len += og->header_len;
  
  memcpy(state->data + state->data_len, og->body, og->body_len);
  state->data_len += og->body_len;
}
