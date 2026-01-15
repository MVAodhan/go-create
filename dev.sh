#!/bin/bash

# Set CGO paths for whisper.cpp bindings
export CGO_LDFLAGS="-L${PWD}/whisper.cpp/build_go/src -L${PWD}/whisper.cpp/build_go/ggml/src -L${PWD}/whisper.cpp/build_go/ggml/src/ggml-metal -L${PWD}/whisper.cpp/build_go/ggml/src/ggml-blas"
export CGO_CFLAGS="-I${PWD}/whisper.cpp/include -I${PWD}/whisper.cpp/ggml/include"

# Run wails dev
wails dev
