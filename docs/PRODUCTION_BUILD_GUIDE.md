# Production Build Guide - Go Create Voice Dictation App

This guide explains how to build a production version of your Wails + Whisper.cpp dictation app with bundled resources.

## 📦 What Gets Bundled

Your production app will include these files as **sidecar resources**:

1. **Whisper Model** (`ggml-medium.en.bin`) - 1.5GB
   - Pre-trained speech recognition model
   - Bundled inside the app so users don't need to download it

2. **Metal Shader** (`ggml-metal.metal`) - ~600KB
   - GPU acceleration shader for Apple Silicon
   - Required for fast transcription on M1/M2/M3/M4 Macs

## 🚀 Quick Build

The simplest way to build:

```bash
./build.sh
```

This script will:

- ✅ Check all prerequisites
- ✅ Set up environment variables
- ✅ Build the app with bundled resources
- ✅ Create `build/bin/go-create.app`

## 📋 Prerequisites

### 1. System Dependencies

```bash
# Wails CLI
go install github.com/wailsapp/wails/v2/cmd/wails@latest

# FFmpeg (required by users at runtime)
brew install ffmpeg

# Xcode Command Line Tools
xcode-select --install
```

### 2. Whisper Library

The whisper.cpp library must be built first:

```bash
cd whisper.cpp/bindings/go
make whisper
cd ../../..
```

This creates the compiled libraries in `whisper.cpp/build_go/`.

### 3. Bundled Resources

The following files must exist in `bundled-resources/`:

- `models/ggml-medium.en.bin` - Whisper model
- `ggml-metal.metal` - Metal GPU shader

These are already copied by the setup, but if you need to recreate them:

```bash
mkdir -p bundled-resources/models
cp whisper.cpp/models/ggml-medium.en.bin bundled-resources/models/
cp whisper.cpp/ggml/src/ggml-metal/ggml-metal.metal bundled-resources/
```

## 🔧 Manual Build (Advanced)

If you need to build manually without the script:

```bash
# Set environment variables
export C_INCLUDE_PATH="$(pwd)/whisper.cpp/include:$(pwd)/whisper.cpp/ggml/include"
export LIBRARY_PATH="$(pwd)/whisper.cpp/build_go/src:$(pwd)/whisper.cpp/build_go/ggml/src:$(pwd)/whisper.cpp/build_go/ggml/src/ggml-blas:$(pwd)/whisper.cpp/build_go/ggml/src/ggml-metal"
export GGML_METAL_PATH_RESOURCES="$(pwd)/bundled-resources"

# Build
wails build
```

## 📱 App Bundle Structure

After building, your app will have this structure:

```
go-create.app/
├── Contents/
│   ├── MacOS/
│   │   └── go-create                 # Main executable
│   ├── Resources/
│   │   ├── models/
│   │   │   └── ggml-medium.en.bin    # Whisper model (bundled)
│   │   ├── ggml-metal.metal          # Metal shader (bundled)
│   │   └── iconfile.icns             # App icon
│   └── Info.plist                     # App metadata
```

## 🎯 How Runtime Resource Loading Works

The app automatically detects whether it's running in development or production:

### Production Mode (Built App)

- **Executable path**: `go-create.app/Contents/MacOS/go-create`
- **Model loaded from**: `../Resources/models/ggml-medium.en.bin`
- **Metal shader from**: `../Resources/ggml-metal.metal`

### Development Mode (`wails dev`)

- **Executable path**: Project directory
- **Model loaded from**: `bundled-resources/models/ggml-medium.en.bin`
- **Metal shader from**: `bundled-resources/ggml-metal.metal`

The code in `app.go` handles both scenarios automatically.

## 🚚 Distribution

### Option 1: Direct Distribution

Simply zip the app and share it:

```bash
cd build/bin
zip -r go-create.zip go-create.app
```

**Users need to:**

1. Download and unzip
2. Install ffmpeg: `brew install ffmpeg`
3. Right-click app → Open (first time only, to bypass Gatekeeper)

### Option 2: Code Signing (Recommended)

For a better user experience, sign the app:

```bash
# Sign the app
codesign --force --deep --sign "Developer ID Application: Your Name" build/bin/go-create.app

# Verify signature
codesign --verify --verbose build/bin/go-create.app
```

### Option 3: Notarization (Best)

For seamless installation without security warnings:

1. Sign the app (see above)
2. Create a DMG or ZIP
3. Submit to Apple for notarization
4. Staple the notarization ticket

See [Apple's notarization guide](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution) for details.

## 🐛 Troubleshooting

### Build fails with "library 'whisper' not found"

**Solution**: Make sure Whisper library is built:

```bash
cd whisper.cpp/bindings/go
make whisper
cd ../../..
```

### Build fails with "whisper.h: No such file or directory"

**Solution**: Use the build script which sets correct environment variables:

```bash
./build.sh
```

### App runs but GPU acceleration doesn't work

**Solution**: Check that Metal shader is bundled:

```bash
ls build/bin/go-create.app/Contents/Resources/ggml-metal.metal
```

If missing, rebuild with the build script.

### App says "model not found"

**Solution**: Verify the model is bundled:

```bash
ls build/bin/go-create.app/Contents/Resources/models/ggml-medium.en.bin
```

### Transcription fails with "ffmpeg not found"

This is expected! Users must install ffmpeg:

```bash
brew install ffmpeg
```

Consider adding a check in your app startup to detect if ffmpeg is installed and show a helpful message.

## 📝 User Requirements

Users of your app need:

- ✅ macOS 11.0+ (Big Sur or later)
- ✅ FFmpeg installed (`brew install ffmpeg`)
- ✅ ~3GB disk space (1.5GB for model + app overhead)
- ✅ Apple Silicon Mac recommended (M1/M2/M3/M4) for GPU acceleration
  - Intel Macs will work but use CPU-only (slower)

## 🔄 Updating the Model

To bundle a different Whisper model:

1. Download desired model:

   ```bash
   cd whisper.cpp/models
   ./download-ggml-model.sh tiny.en    # Smaller, less accurate
   ./download-ggml-model.sh base.en    # Balanced
   ./download-ggml-model.sh small.en   # Good quality
   ./download-ggml-model.sh medium.en  # High quality (current)
   ./download-ggml-model.sh large-v3   # Best quality
   ```

2. Copy to bundled-resources:

   ```bash
   cp whisper.cpp/models/ggml-[model].bin bundled-resources/models/
   ```

3. Update `app.go` - change the model filename in `GetBundledModelPath()`:

   ```go
   modelPath := filepath.Join(execDir, "..", "Resources", "models", "ggml-[model].bin")
   ```

4. Rebuild:
   ```bash
   ./build.sh
   ```

## ⚡ Performance Notes

With GPU acceleration enabled:

- **Tiny model**: ~10x realtime (very fast)
- **Base model**: ~5x realtime (fast)
- **Medium model**: ~2-3x realtime (good balance - current)
- **Large model**: ~1x realtime (slower, best accuracy)

The medium model provides excellent accuracy while maintaining good performance on Apple Silicon.

## 📄 License Considerations

Make sure to comply with licenses:

- Your app code: [Your license]
- Wails: MIT License
- whisper.cpp: MIT License
- FFmpeg: GPL/LGPL (not bundled, user-installed)

## ✅ Final Checklist

Before distributing your app:

- [ ] App builds without errors (`./build.sh`)
- [ ] App launches successfully
- [ ] Model loads correctly
- [ ] GPU acceleration works (check for "Metal" in logs)
- [ ] Transcription works with test audio
- [ ] Icon displays correctly
- [ ] About/version info is correct
- [ ] README for users explains ffmpeg requirement
- [ ] (Optional) App is code-signed
- [ ] (Optional) App is notarized

## 🎉 You're Done!

Your app is now ready for distribution with all resources bundled as sidecars. The final app will be self-contained (except for the ffmpeg system requirement) and ready to share with users.

For questions or issues, refer to:

- Wails documentation: https://wails.io
- whisper.cpp: https://github.com/ggerganov/whisper.cpp
