# Voice Dictation Setup & User Guide

This application now includes **voice dictation functionality** to help physically impaired users input text using their voice instead of typing.

## 🎯 Features

- **Real-time Voice Recording**: Click to start/stop recording your voice
- **Automatic Transcription**: Speech is converted to text using Whisper AI (runs locally, privacy-focused)
- **Continuous Dictation**: Multiple recordings are appended to build longer text
- **Copy to Clipboard**: Easy copying of dictated text
- **File Transcription**: Also supports transcribing audio files

## 🚀 Quick Start

### 1. Prerequisites

Ensure you have:

- **ffmpeg** installed (for audio conversion)
  ```bash
  brew install ffmpeg
  ```
- **Microphone permissions** granted to the app

### 2. Running in Development Mode

Use the provided script:

```bash
./dev.sh
```

Or manually:

```bash
export CGO_LDFLAGS="-L${PWD}/whisper.cpp/build_go/src -L${PWD}/whisper.cpp/build_go/ggml/src -L${PWD}/whisper.cpp/build_go/ggml/src/ggml-metal -L${PWD}/whisper.cpp/build_go/ggml/src/ggml-blas"
export CGO_CFLAGS="-I${PWD}/whisper.cpp/include -I${PWD}/whisper.cpp/ggml/include"
wails dev
```

### 3. Using Voice Dictation

1. **Load the Model** (first time only):

   - The default model path is pre-filled: `./whisper.cpp/models/ggml-base.en.bin`
   - Click "Load Model"
   - Wait for confirmation: "Model loaded: ggml-base.en.bin"

2. **Start Dictation**:

   - Click the green "🎙️ Start Recording" button
   - Speak clearly into your microphone
   - Click the red "⏹️ Stop Recording" button when done

3. **View & Use Your Text**:
   - Transcribed text appears in the blue box
   - Multiple recordings are automatically appended
   - Click "📋 Copy to Clipboard" to paste elsewhere
   - Click "Clear" to start fresh

## 🧠 How It Works

### Technical Overview

1. **Browser Recording**: Uses Web MediaRecorder API to capture audio
2. **Audio Processing**: Audio is sent to Go backend and converted to 16kHz WAV using ffmpeg
3. **AI Transcription**: Whisper.cpp processes audio locally on your M4 Mac (GPU-accelerated)
4. **Result Display**: Transcribed text is sent back to the UI

### Performance Optimizations

The app uses:

- **Metal Framework**: GPU acceleration on Apple Silicon (your M4)
- **Accelerate Framework**: Optimized CPU math operations
- These provide **5-10x faster** transcription compared to generic implementations

## 📁 Project Structure

```
go-create/
├── app.go                          # Backend logic (Go/Whisper integration)
├── frontend/src/App.tsx            # Frontend UI (React)
├── whisper.cpp/                    # Whisper.cpp submodule
│   ├── models/ggml-base.en.bin    # AI model (141MB)
│   └── build_go/                   # Compiled libraries
├── dev.sh                          # Development run script
└── VOICE_DICTATION_SETUP.md       # This file
```

## 🛠️ Backend Methods

### Go Functions (app.go)

```go
// Load the Whisper AI model
LoadModel(modelPath string) error

// Transcribe a recorded audio blob from browser
SaveAndTranscribeRecording(audioBlob []byte) (string, error)

// Transcribe an audio file from disk
TranscribeFile(path string) (string, error)

// Transcribe raw PCM audio data directly
TranscribeAudioData(audioData []float32) (string, error)
```

## 🌐 Frontend Components

### Recording Flow (App.tsx)

```typescript
startRecording(); // Requests mic access, starts MediaRecorder
stopRecording(); // Stops recording, sends to backend
transcribeRecording(audioBlob); // Converts blob to byte array, calls Go
```

## 🔧 Troubleshooting

### Issue: "ffmpeg conversion failed"

**Solution**: Install ffmpeg

```bash
brew install ffmpeg
```

### Issue: "Microphone access denied" or "navigator.mediaDevices.getUserMedia is undefined"

**Solution**:

1. Stop the app if running
2. Rebuild to apply microphone permissions from Info.plist:
   ```bash
   ./dev.sh
   ```
3. When prompted, allow microphone access
4. If still not working, check System Settings > Privacy & Security > Microphone and enable for the app

### Issue: "Model file not found"

**Solution**: Download the model:

```bash
cd whisper.cpp/models
./download-ggml-model.sh base.en
```

### Issue: Linker errors during build

**Solution**: Ensure whisper.cpp is built:

```bash
cd whisper.cpp/bindings/go
make test
```

### Issue: Slow transcription

**Solution**: The app uses GPU acceleration by default. If it's slow:

- Check if Metal is enabled (look for "using Metal backend" in logs)
- Try a smaller model (tiny.en instead of base.en)

## 📊 Model Options

Different models provide different speed/accuracy tradeoffs:

| Model     | Size  | Speed     | Accuracy  | Recommended For    |
| --------- | ----- | --------- | --------- | ------------------ |
| tiny.en   | 75MB  | Very Fast | Good      | Quick notes        |
| base.en   | 141MB | Fast      | Better    | **Default choice** |
| small.en  | 466MB | Medium    | Great     | Accurate dictation |
| medium.en | 1.5GB | Slow      | Excellent | Professional use   |

To download a different model:

```bash
cd whisper.cpp/models
./download-ggml-model.sh small.en
```

Then update the model path in the UI.

## 🎨 Accessibility Features

This implementation is designed with accessibility in mind:

- **Large, Clear Buttons**: Easy to click recording controls
- **Visual Feedback**: Red pulsing indicator during recording
- **Keyboard-Friendly**: All controls accessible via tab navigation
- **No Time Limits**: Record as long as needed
- **Text Accumulation**: Build documents through multiple recordings
- **Copy Support**: One-click clipboard copying

## 🔐 Privacy & Security

- **100% Local Processing**: All transcription happens on your Mac
- **No Cloud API**: No audio is sent to external servers
- **No Data Storage**: Temporary files are automatically deleted
- **Microphone Control**: You control when the mic is active

## 📝 Building for Production

To build a production .app bundle:

```bash
export CGO_LDFLAGS="-L${PWD}/whisper.cpp/build_go/src -L${PWD}/whisper.cpp/build_go/ggml/src -L${PWD}/whisper.cpp/build_go/ggml/src/ggml-metal -L${PWD}/whisper.cpp/build_go/ggml/src/ggml-blas"
export CGO_CFLAGS="-I${PWD}/whisper.cpp/include -I${PWD}/whisper.cpp/ggml/include"
wails build
```

The app will be in `build/bin/`.

## 🤝 Contributing

To add features or improve dictation:

1. Backend changes: Edit `app.go`
2. Frontend changes: Edit `frontend/src/App.tsx`
3. Regenerate bindings: `wails generate module`
4. Test: `./dev.sh`

## 📚 Resources

- [Whisper.cpp Documentation](https://github.com/ggerganov/whisper.cpp)
- [Wails Documentation](https://wails.io)
- [Web MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)

---

**Enjoy hands-free text input! 🎤✨**
