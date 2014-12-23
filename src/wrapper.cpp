#include <stdio.h>  // printf
#include <math.h>   // sin
#include <time.h>   // time
#include <stdlib.h> // srand
#include <string.h> // memcpy

#include <vector>

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
  
  std::vector<unsigned char> output_buffer;
};

static inline void append(std::vector<unsigned char> &v, unsigned char *p, long n)
{
    v.insert(end(v), p, p + n);
}

// write encoded ogg page to a file or buffer
void write_page(tEncoderState* state, ogg_page* page)
{
    append(state->output_buffer, page->header, page->header_len);

    append(state->output_buffer, page->body, page->body_len);
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

// input should be more than 10ms long
extern "C" void lexy_encoder_write(tEncoderState* state, float* input_buffer_left, float* input_buffer_right, int num_samples)
{
    // get space in which to copy uncompressed data
    float** buffer = vorbis_analysis_buffer(&state->vd, num_samples);

    // write uncompressed data
    memcpy(buffer[0], input_buffer_left,  num_samples * sizeof(float));
    memcpy(buffer[1], input_buffer_right, num_samples * sizeof(float));

    vorbis_analysis_wrote(&state->vd, num_samples);

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
    printf("lexy_encoder_finish(); final encoded stream length: %i bytes\n", state->output_buffer.size());
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
    return state->output_buffer.data();
}

extern "C" int lexy_get_buffer_length(tEncoderState* state)
{
    return state->output_buffer.size();
}

#if DEBUG
// complete encoder test: init, encode, shutdown.
extern "C" tEncoderState* lexy_test()
{
    tEncoderState *state = lexy_encoder_start();
    
    // generate a test sound
    float* input_buffer_left = new float[state->sample_rate]; // one second long buffer
    float* input_buffer_right = new float[state->sample_rate]; // one second long buffer
    float test_frequency = 400; // hz

    for(int i = 0; i < state->sample_rate; i ++)
    {
        float fraction = (float) i / (float) state->sample_rate;
        input_buffer_left[i] =  sin(M_PI * 2 * test_frequency * fraction);
        input_buffer_right[i] =  sin(M_PI * 2 * test_frequency * fraction);
    }
    
    lexy_encoder_write(state, input_buffer_left, input_buffer_right, state->sample_rate);
    lexy_encoder_finish(state);
    return state;
}

// encodes a test signal
extern "C" void lexy_write_test(tEncoderState *state)
{
    printf("lexy_write_test(); writing test sound at %i samples/sec with %i channels\n", state->sample_rate, state->num_channels);

     // generate a test sound
    float* input_buffer_left = new float[state->sample_rate]; // one second long buffer
    float* input_buffer_right = new float[state->sample_rate]; // one second long buffer
    float test_frequency = 400; // hz

    for(int i = 0; i < state->sample_rate; i ++)
    {
        float fraction = (float) i / (float) state->sample_rate;
        input_buffer_left[i] =  sin(M_PI * 2 * test_frequency * fraction);
        input_buffer_right[i] =  sin(M_PI * 2 * test_frequency * fraction);
    }
    
    lexy_encoder_write(state, input_buffer_left, input_buffer_right, state->sample_rate);
}

// for testing in console
extern "C" int main()
{
    lexy_test();

    return 0;
}
#endif
