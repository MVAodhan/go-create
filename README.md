# Voice Transcription & Dictation App

A macOS desktop application built with [Wails](https://wails.io/) (Go + React) and [Whisper.cpp](https://github.com/ggml-org/whisper.cpp) for local, privacy-focused voice dictation.

## ✨ Features

### 🎤 Voice Dictation (Accessibility)

- **Real-time voice recording** with visual feedback
- **Automatic speech-to-text** conversion using AI
- **Continuous dictation** - build longer text through multiple recordings
- **Copy to clipboard** functionality
- Perfect for physically impaired users who need hands-free text input

### 📁 File Transcription

- Transcribe audio files (MP3, WAV, M4A, etc.)
- Automatic audio format conversion via ffmpeg
- Support for various audio formats

### 🔐 Privacy-First

- **100% local processing** - no cloud APIs
- Audio never leaves your machine
- Powered by Whisper.cpp running on your Mac

### ⚡ Performance

- **GPU-accelerated** via Metal framework (Apple Silicon)
- **Optimized CPU operations** via Accelerate framework
- **5-10x faster** than generic implementations

## 🚀 Quick Start

### Prerequisites

1. **Install [ffmpeg](https://www.ffmpeg.org/)**:

2. **Grant microphone permissions when prompted**

### Running the App

1. **Start development server**:

   ```bash
   ./dev.sh
   ```

2. **Start dictating**:
   - Click "🎙️ Start Recording"
   - Speak into your microphone
   - Click "⏹️ Stop Recording"
   - Your speech will be pasted into pbpaste

## 📚 Documentation

- **[Build Guide](docs/PRODUCTION_BUILD_GUIDE.md)** - Production build and distribution guide

### Additional Resources

- [Whisper.cpp Documentation](https://github.com/ggerganov/whisper.cpp)
- [Wails Documentation](https://wails.io)
- [Web MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)

## 🛠️ Technology Stack

- **Backend**: Go with Whisper.cpp bindings (CGO)
- **Frontend**: React + TypeScript + Vite
- **Framework**: Wails v2 (Go + Web tech)
- **AI Engine**: Whisper.cpp (local AI transcription)
- **Audio Processing**: ffmpeg

## 🏗️ Project Structure

```
go-create/
├── app.go                          # Go backend (Whisper integration)
├── main.go                         # Application entry point
├── frontend/
│   └── src/
│       └── App.tsx                 # React UI with recording controls
├── whisper.cpp/                    # Whisper.cpp submodule
│   ├── models/
│   │   └── ggml-base.en.bin       # AI model (141MB)
│   └── build_go/                   # Compiled libraries
├── dev.sh                          # Development helper script
└── build/                          # Build artifacts
```

## 🎯 Key Implementation Details

### Backend Methods (`app.go`)

```go
// Load Whisper AI model
LoadModel(modelPath string) error

// Transcribe browser recording
SaveAndTranscribeRecording(audioBlob []byte) (string, error)

// Transcribe audio file
TranscribeFile(path string) (string, error)

// Transcribe raw PCM data
TranscribeAudioData(audioData []float32) (string, error)
```

### Frontend Features (`App.tsx`)

- MediaRecorder API for browser-based audio capture
- Real-time recording status indicators
- Continuous dictation text accumulation
- One-click clipboard operations

## 🔧 Development

### Building from Source

1. **Clone the repository** (with submodules):

   ```bash
   git clone --recursive <repository-url>
   cd go-create
   ```

2. **Download the AI model**:

   ```bash
   cd whisper.cpp/models
   ./download-ggml-model.sh medium.en
   cd ../..
   ```

   **Note**: For local development, the app looks for models in the following order:
   - `bundled-resources/models/` (preferred for development)
   - `whisper.cpp/models/` (fallback)

   To use the preferred development location:

   ```bash
   mkdir -p bundled-resources/models
   cp whisper.cpp/models/ggml-medium.en.bin bundled-resources/models/
   ```

3. **Run in development**:
   ```bash
   ./dev.sh
   ```

### Building for Production

```bash
export CGO_LDFLAGS="-L${PWD}/whisper.cpp/build_go/src -L${PWD}/whisper.cpp/build_go/ggml/src -L${PWD}/whisper.cpp/build_go/ggml/src/ggml-metal -L${PWD}/whisper.cpp/build_go/ggml/src/ggml-blas"
export CGO_CFLAGS="-I${PWD}/whisper.cpp/include -I${PWD}/whisper.cpp/ggml/include"
wails build
```

The compiled app will be in `build/bin/`.

## 🤝 Contributing

To add features or improve dictation:

1. **Backend changes**: Edit `app.go`
2. **Frontend changes**: Edit `frontend/src/App.tsx`
3. **Regenerate bindings**: `wails generate module`
4. **Test**: `./dev.sh`

### Model Location for Development vs Production

The app uses a smart fallback system to locate models in different environments. The `GetBundledModelPath()` function searches in the following order:

**Lookup Order (always checked in this sequence):**

1. **Production Bundle Path** (checked first):
   - `MyApp.app/Contents/Resources/models/ggml-medium.en.bin`
   - This path is relative to the executable in a built app bundle

2. **Development Bundle Path** (checked if #1 not found):
   - `bundled-resources/models/ggml-medium.en.bin`
   - Preferred location for local development

3. **Original Source Path** (final fallback):
   - `whisper.cpp/models/ggml-medium.en.bin`
   - Where models are initially downloaded

**How this works in practice:**

- **In production**: The app first checks the app bundle's Resources folder. If the model wasn't properly bundled, it falls back to development paths (useful for debugging).
- **In development**: The production path won't exist, so it immediately tries the `bundled-resources/` directory, then falls back to `whisper.cpp/models/`.

To set up models for local development:

```bash
# Download the model
cd whisper.cpp/models
./download-ggml-model.sh <model-name>

# Copy to preferred development location
mkdir -p ../../bundled-resources/models
cp ggml-<model-name>.bin ../../bundled-resources/models/
cd ../..
```

Available model names: `tiny.en`, `base.en`, `small.en`, `medium.en` (see Model Options table above for details).

## 📊 Model Options

| Model     | Size  | Speed     | Accuracy  | Use Case           |
| --------- | ----- | --------- | --------- | ------------------ |
| tiny.en   | 75MB  | Very Fast | Good      | Quick notes        |
| base.en   | 141MB | Fast      | Better    | **Default choice** |
| small.en  | 466MB | Medium    | Great     | Accurate dictation |
| medium.en | 1.5GB | Slow      | Excellent | Professional use   |

## 🎨 Accessibility Features

- Large, clearly labeled buttons
- Visual recording indicators (pulsing animation)
- Keyboard-friendly navigation
- No time limits on recordings
- Text accumulation for building longer documents
- One-click copy to clipboard

## 🙏 Acknowledgments

- [Whisper.cpp](https://github.com/ggerganov/whisper.cpp) - Fast C++ implementation of Whisper
- [Wails](https://wails.io) - Go + Web framework for desktop apps
- [OpenAI Whisper](https://github.com/openai/whisper) - Original Whisper model

---

**Built with ❤️ for accessibility and privacy**
