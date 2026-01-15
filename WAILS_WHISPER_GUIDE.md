# Guide: Building a Voice Transcription Mac App with Wails & Whisper.cpp

This guide outlines how to build a macOS desktop application using the **Wails** framework (Go backend + Web frontend) and **Whisper.cpp** for local, privacy-focused voice transcription.

## 1. Prerequisites & Architecture

### Architecture Overview

- **Frontend (UI):** React, Vue, or Svelte (driven by Wails). Handles file selection, recording controls, and displaying text.
- **Backend (Go):** The Wails application binary. It bridges the UI to the system.
- **Whisper Engine:** The C++ library (`whisper.cpp`) linked directly into the Go binary using CGO.

### Required Tools

- **Go (1.20+)**: The language backend.
- **Node.js / npm**: For building the frontend assets.
- **Wails CLI**: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`
- **Xcode Command Line Tools**: Required for CGO compilation on macOS (`xcode-select --install`).
- **ffmpeg**: Required for audio conversion (converting user audio to 16kHz WAV).

---

## 2. Project Setup

1.  **Initialize Wails Project**

    ```bash
    wails init -n VoiceDictate -t react-ts
    cd VoiceDictate
    ```

2.  **Add Whisper Submodule**
    Add the repository as a submodule to access both the C++ source and the Go bindings.
    ```bash
    git submodule add https://github.com/ggerganov/whisper.cpp.git
    ```

## 3. The Whisper Binding Strategy

Instead of manually copying files, we will legitimate usage of the official Go bindings located at `whisper.cpp/bindings/go`.

### A. Configuring the Dependency

Since the bindings are inside a subdirectory of the repo, the easiest way to use them without publishing your own module is to use a `replace` directive in `go.mod` or simply import the local path if appropriate.

**Recommended Approach:** Use the `replace` directive to point to your local submodule.

1.  Open `go.mod`.
2.  Add the replacement at the bottom:
    ```go
    replace github.com/ggerganov/whisper.cpp/bindings/go => ./whisper.cpp/bindings/go
    ```
3.  Get the dependencies:
    ```bash
    go get github.com/ggerganov/whisper.cpp/bindings/go
    ```

### B. Understanding CGO & Linking

The bindings use **CGO** to compile the C++ library and link it into your Go binary.

#### How CGO Works

CGO acts as a bridge between Go and C/C++. When you build the app:

1.  The Go toolchain encounters `import "C"` and the `// #cgo` directives in the binding files.
2.  It invokes a C compiler (Clang on macOS) to compile the C++ source files (or link against a pre-built `.a` library).
3.  It generates Go wrappers allowing you to call the C functions as if they were Go functions.
4.  Finally, it merges everything into a single executable.

#### Linking Apple's Frameworks

On macOS, the bindings link against specific system frameworks to ensure performance:

- **Accelerate Framework**: Provides highly optimized vector math functions (BLAS). Using this allows Whisper to perform matrix multiplications much faster on the CPU compared to generic C++ math.
- **Metal Framework**: Allows the application to use the GPU (Apple Silicon or AMD EGPU) for tensor computations. This significantly reduces CPU usage and improves transcription speed.
- **Foundation / CoreGraphics**: Standard system libraries required by the above frameworks.

These are included via flags in the CGO LDFLAGS, for example:
`#cgo darwin LDFLAGS: -framework Accelerate -framework Metal ...`

#### Is there an option NOT to link these?

**Yes.** You may want to do this to support older Intel Macs without Metal support or to reduce binary complexity.

To disable them, you generally need to:

1.  **Modify the CGO flags:** You would need to edit the `whisper.cpp/bindings/go/whisper.go` file (or provide build tags if supported) to remove `-framework Accelerate` and `-framework Metal`.
2.  **Disable in Compilation:** You must ensure the `whisper.cpp` library is compiled without the `GGML_USE_ACCELERATE` or `GGML_USE_METAL` defines.

**Warning:** Doing so will revert the inference to generic CPU math, which can be **5x-10x slower** on Apple Silicon.

### C. Building the Library (Static Linking)

For the bindings to work reliably, it is often best to pre-build the static library.

1.  Navigate to the submodule: `cd whisper.cpp`
2.  Build the library: `make libwhisper.a`
3.  Return to root: `cd ..`

The Go bindings will look for this library during the build process.

## 4. Implementation Logic

### A. Audio Conversion (Go Backend)

Whisper **requires** 16kHz, mono, PCM WAV files.

```go
func ConvertToWav(inputPath, outputPath string) error {
    cmd := exec.Command("ffmpeg",
        "-y",
        "-i", inputPath,
        "-ar", "16000",   // 16kHz Sample Rate
        "-ac", "1",       // Mono
        "-c:a", "pcm_s16le",
        outputPath,
    )
    return cmd.Run()
}
```

### B. The Wails Application Struct

In `app.go`, expose the transcription method. Note the import path matches the official repo.

```go
import (
    "context"
    "fmt"
    "os"
    "os/exec"
    "path/filepath"
    "strings"

    // Import the bindings via the module name managed by your replace directive
    whisper "github.com/ggerganov/whisper.cpp/bindings/go"
)

type App struct {
    ctx context.Context
    whisperCtx whisper.Context // Use the interface or struct provided by bindings
}

func (a *App) LoadModel(modelPath string) error {
    // Standard binding usage often involves creating a context from a model
    ctx, err := whisper.New(modelPath)
    if err != nil {
        return err
    }
    a.whisperCtx = ctx
    return nil
}

func (a *App) TranscribeFile(path string) (string, error) {
    wavFile := path + ".wav"
    if err := ConvertToWav(path, wavFile); err != nil {
        return "", err
    }
    defer os.Remove(wavFile)

    // Process the audio
    // (You would decode the WAV to []float32 here - omitted for brevity)
    var data []float32
    // ... load wav data into 'data' ...

    // Call Whisper
    // Validate the exact API method from the bindings; usually:
    if err := a.whisperCtx.Process(data, nil, nil); err != nil {
        return "", err
    }

    // Retrieve text (looping through segments)
    var sb strings.Builder
    for {
        segment, err := a.whisperCtx.NextSegment()
        if err != nil {
            break
        }
        sb.WriteString(segment.Text)
    }
    return sb.String(), nil
}
```

_*Note: The exact Go API methods (`New`, `Process`, `NextSegment`) generally follow the C API closely but may vary slightly by binding version. Check `whisper.cpp/bindings/go` source for the exact signatures.*_

## 5. Frontend Implementation

(This remains largely the same as standard Wails React/Vue setup)

```typescript
import { TranscribeFile } from "../wailsjs/go/main/App";

// ... UI Logic calling TranscribeFile(path) ...
```

## 6. Build & Deployment

To build a .app for macOS:

```bash
wails build
```

**Common Pitfalls:**

1.  **"Library not found":** Ensure `libwhisper.a` exists in `whisper.cpp/`.
2.  **Permissions:** Add microphone/file permissions to `build/darwin/Info.plist`.

## 7. Model Management

You should download models (like `ggml-base.en.bin`) inside the app or include a "Setup" screen where the user downloads them. Do not bundle heavy models in the git repo.

---

**Summary Checklist**

- [ ] Initialize Wails.
- [ ] Add `whisper.cpp` submodule.
- [ ] Update `go.mod` with `replace` directive.
- [ ] Build `libwhisper.a` inside the submodule.
- [ ] Implement `ffmpeg` wrapper & Go logic.
- [ ] Build UI.
- [ ] Build & Run.
