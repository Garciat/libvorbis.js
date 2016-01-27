#include <algorithm>
#include <vector>
#include <cstdio>
#include <cstring>

#include "../native/wrapper/vorbis_encoder.c"

using namespace std;

typedef unsigned char byte;

vector<byte> read_file(const char *path) {
    vector<byte> data;
    
    FILE* fd = fopen(path, "rb");
    
    if (fd == nullptr) {
        exit(1);
    }
    
    byte buffer[4096];
    
    while (feof(fd) == 0) {
        size_t n = fread(buffer, 1, sizeof buffer, fd);
        data.insert(data.end(), buffer, buffer + n);
    }
    
    fclose(fd);
    
    return data;
}

void write_file(const char *path, const vector<byte>& data) {
    FILE* fd = fopen(path, "wb");
    
    if (fd == nullptr) {
        exit(1);
    }
    
    fwrite(data.data(), 1, data.size(), fd);
    
    fclose(fd);
}

void flush(encoder_instance handle, vector<byte>& out) {
    const auto data_len = encoder_get_data_len(handle);
    
    if (data_len == 0)
        return;
    
    const auto data_ptr = encoder_get_data(handle);
    
    out.insert(out.end(), data_ptr, data_ptr + data_len);
    
    encoder_clear_data(handle);
}

int main(int argc, char *argv[]) {
    if (argc != 3) {
        exit(1);
    }
    
    auto input = read_file(argv[1]);
    
    vector<byte> output;
    
    encoder_instance handle = encoder_create_vbr(1, 44100, 0.5);
    
    encoder_write_headers(handle);
    
    flush(handle, output);
    
    const size_t READ = 4096 * 10;
    
    for (size_t offset = 0; offset < input.size(); offset += READ) {
        const auto size = min(READ, input.size() - offset);
        const auto samples = size / 4;
        
        encoder_prepare_analysis_buffers(handle, samples);
        
        const auto buf = encoder_get_analysis_buffer(handle, 0);
        
        memcpy(buf, input.data() + offset, size);
        
        encoder_encode(handle);
        
        flush(handle, output);
    }
    
    encoder_finish(handle);
    
    flush(handle, output);
    
    encoder_destroy(handle);
    
    write_file(argv[2], output);
}
