# Voice Transcription & Dictation App

A macOS desktop application built with **Wails** (Go + React) and **Whisper.cpp** for local, privacy-focused voice transcription and accessibility-focused dictation.

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

1. **Install ffmpeg**:

   ```bash
   brew install ffmpeg
   ```

2. **Grant microphone permissions** when prompted

### Running the App

1. **Start development server**:

   ```bash
   ./dev.sh
   ```

2. **Load the AI model**:

   - Click "Load Model" (default path is pre-filled)
   - Wait for confirmation

3. **Start dictating**:
   - Click "🎙️ Start Recording"
   - Speak into your microphone
   - Click "⏹️ Stop Recording"
   - Your speech appears as text!

## 📚 Documentation

- **[VOICE_DICTATION_SETUP.md](VOICE_DICTATION_SETUP.md)** - Complete setup guide and user manual
- **[WAILS_WHISPER_GUIDE.md](WAILS_WHISPER_GUIDE.md)** - Technical integration guide
- **[WHISPER_BUILD_EXPLAINED.md](WHISPER_BUILD_EXPLAINED.md)** - Build process explanation

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
   ./download-ggml-model.sh base.en
   cd ../..
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

## 🐛 Troubleshooting

### Common Issues

**"ffmpeg conversion failed"**

```bash
brew install ffmpeg
```

**"Microphone access denied"**

- Grant permissions in System Settings > Privacy & Security > Microphone

**"Model file not found"**

```bash
cd whisper.cpp/models
./download-ggml-model.sh base.en
```

See [VOICE_DICTATION_SETUP.md](VOICE_DICTATION_SETUP.md) for more troubleshooting tips.

## 📝 License

See LICENSE file in the repository.

## 🙏 Acknowledgments

- [Whisper.cpp](https://github.com/ggerganov/whisper.cpp) - Fast C++ implementation of Whisper
- [Wails](https://wails.io) - Go + Web framework for desktop apps
- [OpenAI Whisper](https://github.com/openai/whisper) - Original Whisper model

---

**Built with ❤️ for accessibility and privacy**
