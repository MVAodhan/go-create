# Build Instructions for Voice Transcription App

This document explains how to build and run the Wails + Whisper.cpp voice transcription application.

## Prerequisites

- Go 1.20+
- Node.js & npm
- Wails CLI: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`
- Xcode Command Line Tools (macOS): `xcode-select --install`
- ffmpeg: `brew install ffmpeg`

## Project Setup (Already Completed)

1. ✅ Wails project initialized
2. ✅ whisper.cpp added as submodule
3. ✅ go.mod configured with replace directive for local whisper.cpp bindings
4. ✅ Whisper library built using cmake
5. ✅ Backend (app.go) implemented with transcription logic
6. ✅ Frontend (App.tsx) created with UI for loading models and transcribing audio

## Building the Whisper Library

The Whisper C++ library has already been built, but if you need to rebuild:

```bash
cd whisper.cpp/bindings/go
make whisper
cd ../../..
```

This creates the static libraries in `whisper.cpp/build_go/` with:

- Metal GPU acceleration (for Apple Silicon)
- Accelerate framework support (optimized CPU math)

## Environment Variables Required

When building or running the app, you need to set environment variables so CGO can find the Whisper libraries:

### What These Variables Do:

1. **C_INCLUDE_PATH** - Tells the C compiler where to find Whisper header files
2. **LIBRARY_PATH** - Tells the linker where to find compiled library files (.a files)
3. **GGML_METAL_PATH_RESOURCES** - Tells the runtime where to find Metal shader files (for GPU acceleration)

### Set Environment Variables:

```bash
export C_INCLUDE_PATH="$(pwd)/whisper.cpp/include:$(pwd)/whisper.cpp/ggml/include"
export LIBRARY_PATH="$(pwd)/whisper.cpp/build_go/src:$(pwd)/whisper.cpp/build_go/ggml/src:$(pwd)/whisper.cpp/build_go/ggml/src/ggml-blas:$(pwd)/whisper.cpp/build_go/ggml/src/ggml-metal"
export GGML_METAL_PATH_RESOURCES="$(pwd)/whisper.cpp"
```

## Running the App

### Development Mode

```bash
# Set environment variables first (see above), then:
wails dev
```

This will:

1. Compile the Go backend with CGO linking to Whisper libraries
2. Build the React frontend
3. Open the app in a development window with hot reload

### Production Build

```bash
# Set environment variables first (see above), then:
wails build
```

The compiled app will be in `build/bin/`.

## Quick Start - One-Line Commands

### Development:

```bash
export C_INCLUDE_PATH="$(pwd)/whisper.cpp/include:$(pwd)/whisper.cpp/ggml/include" && export LIBRARY_PATH="$(pwd)/whisper.cpp/build_go/src:$(pwd)/whisper.cpp/build_go/ggml/src:$(pwd)/whisper.cpp/build_go/ggml/src/ggml-blas:$(pwd)/whisper.cpp/build_go/ggml/src/ggml-metal" && export GGML_METAL_PATH_RESOURCES="$(pwd)/whisper.cpp" && wails dev
```

### Production Build:

```bash
export C_INCLUDE_PATH="$(pwd)/whisper.cpp/include:$(pwd)/whisper.cpp/ggml/include" && export LIBRARY_PATH="$(pwd)/whisper.cpp/build_go/src:$(pwd)/whisper.cpp/build_go/ggml/src:$(pwd)/whisper.cpp/build_go/ggml/src/ggml-blas:$(pwd)/whisper.cpp/build_go/ggml/src/ggml-metal" && export GGML_METAL_PATH_RESOURCES="$(pwd)/whisper.cpp" && wails build
```

### Regenerate TypeScript Bindings:

```bash
export C_INCLUDE_PATH="$(pwd)/whisper.cpp/include:$(pwd)/whisper.cpp/ggml/include" && export LIBRARY_PATH="$(pwd)/whisper.cpp/build_go/src:$(pwd)/whisper.cpp/build_go/ggml/src:$(pwd)/whisper.cpp/build_go/ggml/src/ggml-blas:$(pwd)/whisper.cpp/build_go/ggml/src/ggml-metal" && wails generate module
```

## Using the App

1. **Download a Whisper Model:**

   ```bash
   cd whisper.cpp/models
   ./download-ggml-model.sh base.en
   cd ../..
   ```

2. **Run the app** (see commands above)

3. **In the app UI:**
   - Enter model path: `whisper.cpp/models/ggml-base.en.bin`
   - Click "Load Model"
   - Enter audio file path: `whisper.cpp/samples/jfk.mp3` (or your own audio file)
   - Click "Transcribe"

## Troubleshooting

### "library 'whisper' not found"

- Make sure you've set the LIBRARY_PATH environment variable
- Verify libraries exist: `ls whisper.cpp/build_go/src/libwhisper.a`

### "whisper.h: No such file or directory"

- Make sure you've set the C_INCLUDE_PATH environment variable
- Verify headers exist: `ls whisper.cpp/include/whisper.h`

### TypeScript errors about missing exports

- Run: `wails generate module` (with environment variables set)

### ffmpeg not found when transcribing

- Install ffmpeg: `brew install ffmpeg`

## Project Structure

```
go-create/
├── app.go                  # Go backend with Whisper integration
├── main.go                 # Wails app entry point
├── go.mod                  # Go dependencies (includes replace directive)
├── frontend/
│   └── src/
│       └── App.tsx         # React UI for transcription
├── whisper.cpp/            # Submodule with whisper.cpp source
│   ├── build_go/           # Built libraries (created by cmake)
│   ├── bindings/go/        # Official Go bindings (linked via replace)
│   ├── models/             # Download models here
│   └── samples/            # Sample audio files
└── BUILD_INSTRUCTIONS.md   # This file
```

## Technologies Used

- **Wails v2** - Go + Web frontend framework
- **whisper.cpp** - C++ implementation of OpenAI's Whisper
- **CGO** - Go's C interop for linking whisper.cpp
- **React + TypeScript** - Frontend UI
- **Metal Framework** - GPU acceleration on Apple Silicon
- **Accelerate Framework** - Optimized CPU math operations
