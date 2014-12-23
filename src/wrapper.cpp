#include <stdio.h>  // printf
#include <math.h>   // sin
#include <time.h>   // time
#include <stdlib.h> // srand
#include <string.h> // memcpy

#include <vorbis/vorbisenc.h>

struct tEncoderState
{
  ogg_stream_state os;
  
  vorbis_info vi;
  vorbis_comment vc;
  vorbis_dsp_state vd;
  vorbis_block vb;
  ogg_packet op;
  
  int packet_id;
  int rate;
  int num_channels;
  int sample_rate;
  int granulepos;
  
  int input_num_samples;
  float **input_buffer;
  
  unsigned char *output_buffer;
  long output_buffer_max;
  long output_buffer_len;
  
  tEncoderState() {
    output_buffer = NULL;
    alloc_output_buffer(512 * 1024); // 0.5MB initial size
  }
  
  void alloc_output_buffer(long n) {
    output_buffer = (unsigned char*)realloc(output_buffer, n);
    output_buffer_max = n;
  }
  
  void grow_output_buffer(long n) {
    long new_max = output_buffer_max;
    while (output_buffer_len + n > new_max) {
        new_max *= 2;
    }
    alloc_output_buffer(new_max);
  }
  
  void push_output(unsigned char *p, long n) {
    if (output_buffer_len + n > output_buffer_max) {
      grow_output_buffer(n);
    }
    
    memcpy(output_buffer + output_buffer_len, p, n);
    output_buffer_len += n;
  }
};

void write_page(tEncoderState* state, ogg_page* page)
{
    state->push_output(page->header, page->header_len);
    state->push_output(page->body,   page->body_len);
}

// preps encoder, allocates output buffer
extern "C" tEncoderState* lexy_encoder_start(int sample_rate = 48000, float vbr_quality = 0.4f)
{
    tEncoderState *state = new tEncoderState();
    state->packet_id = 0;
    state->granulepos = 0;
    
    srand(time(NULL));
    ogg_stream_init(&state->os, rand());
    
    int size, error;
    
    state->num_channels = 2;
    state->sample_rate = sample_rate;
    
#if DEBUG
    printf("lexy_encoder_start(); initializing vorbis encoder with sample_rate = %i Hz and vbr quality = %3.2f\n", state->sample_rate, vbr_quality);
#endif
    
    // initialize vorbis
    vorbis_info_init(&state->vi);
    if(vorbis_encode_init_vbr(&state->vi, 2, state->sample_rate, vbr_quality)) // vbr
    //if(vorbis_encode_init(&state->vi,state->num_channels,sample_rate,-1,192000,-1)) // abr
    {
#if DEBUG
        printf("lexy_encoder_start(); error initializing vorbis encoder\n");
#endif
        return NULL;
    }
    
    vorbis_comment_init(&state->vc);
    vorbis_comment_add_tag(&state->vc, "ENCODER", "lexy-coder");
    
    vorbis_analysis_init(&state->vd, &state->vi);
    vorbis_block_init(&state->vd, &state->vb);
    
    ogg_packet vorbis_header, vorbis_header_comment, vorbis_header_code;
    
    // write out vorbis's headers
    vorbis_analysis_headerout(&state->vd, &state->vc, &vorbis_header, &vorbis_header_comment, &vorbis_header_code);
    
    ogg_stream_packetin(&state->os, &vorbis_header);
    ogg_stream_packetin(&state->os, &vorbis_header_comment);
    ogg_stream_packetin(&state->os, &vorbis_header_code);

    ogg_page og;

    // flush packet into its own page
    while(ogg_stream_flush(&state->os, &og))
        write_page(state, &og);

    return state;
}

extern "C" void lexy_request_input_buffer(tEncoderState* state, int num_samples)
{
    state->input_buffer = vorbis_analysis_buffer(&state->vd, num_samples);
    state->input_num_samples = num_samples;
}

extern "C" float* lexy_get_left_input_buffer(tEncoderState* state)
{
    return state->input_buffer[0];
}

extern "C" float* lexy_get_right_input_buffer(tEncoderState* state)
{
    return state->input_buffer[1];
}

// input should be more than 10ms long
extern "C" void lexy_encode(tEncoderState* state)
{
    vorbis_analysis_wrote(&state->vd, state->input_num_samples);

    ogg_page og;    
    int num_packets = 0;

    while(vorbis_analysis_blockout(&state->vd, &state->vb) == 1)
    {
        vorbis_analysis(&state->vb, NULL);
        vorbis_bitrate_addblock(&state->vb);
        
        while(vorbis_bitrate_flushpacket(&state->vd, &state->op))
        {
            // push packet into ogg
            ogg_stream_packetin(&state->os, &state->op);
            num_packets++;
            
            // fetch page from ogg
            while(ogg_stream_pageout(&state->os, &og) || (state->op.e_o_s && ogg_stream_flush(&state->os, &og)))
            {
#if DEBUG
                printf("lexy_encoder_write(); writing ogg samples page after packet %i\n", num_packets);
#endif
                write_page(state, &og);
            }
        }
    }
}

// finish encoding
extern "C" void lexy_encoder_finish(tEncoderState* state)
{
#if DEBUG
    printf("lexy_encoder_finish(); ending stream\n");
#endif
    
    // write an end-of-stream packet
    vorbis_analysis_wrote(&state->vd, 0);
    
    ogg_page og;
    
    while(vorbis_analysis_blockout(&state->vd, &state->vb) == 1)
    {
        vorbis_analysis(&state->vb, NULL);
        vorbis_bitrate_addblock(&state->vb);
        
        while(vorbis_bitrate_flushpacket(&state->vd, &state->op))
        {
            ogg_stream_packetin(&state->os, &state->op);
            
            while(ogg_stream_flush(&state->os, &og))
                write_page(state, &og);
        }
    }
    
#if DEBUG
    printf("lexy_encoder_finish(); final encoded stream length: %ld bytes\n", state->output_buffer_len);
    printf("lexy_encoder_finish(); cleaning up\n");
#endif
    
    ogg_stream_clear(&state->os);
    vorbis_block_clear(&state->vb);
    vorbis_dsp_clear(&state->vd);
    vorbis_comment_clear(&state->vc);
    vorbis_info_clear(&state->vi);
}

// grab buffer and its length
extern "C" unsigned char* lexy_get_buffer(tEncoderState* state)
{
    return state->output_buffer;
}

extern "C" int lexy_get_buffer_length(tEncoderState* state)
{
    return state->output_buffer_len;
}
