package main

import (
	"context"
	"encoding/binary"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	whisper "github.com/ggerganov/whisper.cpp/bindings/go/pkg/whisper"
)

// App struct
type App struct {
	ctx          context.Context
	whisperModel whisper.Model
	whisperCtx   whisper.Context
	modelPath    string
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	
}

func (a *App) GetBundledModelPath() string {
    execPath, _ := os.Executable()
    execDir := filepath.Dir(execPath)
    
    // On macOS: app bundle structure
    
	return filepath.Join(execDir, "..", "Resources", "models", "ggml-base.en.bin")

    
}

// LoadModel loads the Whisper model from the specified path
func (a *App) LoadModel(modelPath string) error {
	// Check if model exists
	if _, err := os.Stat(modelPath); os.IsNotExist(err) {
		return fmt.Errorf("model file not found: %s", modelPath)
	}

	// Create whisper model
	model, err := whisper.New(modelPath)
	if err != nil {
		return fmt.Errorf("failed to load model: %w", err)
	}

	// Create context from model
	ctx, err := model.NewContext()
	if err != nil {
		return fmt.Errorf("failed to create context: %w", err)
	}

	a.whisperModel = model
	a.whisperCtx = ctx
	a.modelPath = modelPath
	return nil
}

// ConvertToWav converts an audio file to 16kHz mono WAV format using ffmpeg
func (a *App) ConvertToWav(inputPath, outputPath string) error {
	cmd := exec.Command("ffmpeg",
		"-y",                // Overwrite output file
		"-i", inputPath,     // Input file
		"-ar", "16000",      // 16kHz sample rate
		"-ac", "1",          // Mono channel
		"-c:a", "pcm_s16le", // PCM 16-bit little-endian
		outputPath,          // Output file
	)
	
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("ffmpeg conversion failed: %w\nOutput: %s", err, string(output))
	}
	
	return nil
}

// readWav reads a WAV file and returns the audio data as float32 samples
func (a *App) readWav(path string) ([]float32, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	// Skip WAV header (44 bytes)
	_, err = file.Seek(44, 0)
	if err != nil {
		return nil, err
	}

	// Read PCM data
	var samples []float32
	buf := make([]byte, 2)
	
	for {
		_, err := io.ReadFull(file, buf)
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}
		
		// Convert PCM16 to float32 (normalize to [-1, 1])
		sample := int16(binary.LittleEndian.Uint16(buf))
		samples = append(samples, float32(sample)/32768.0)
	}
	
	return samples, nil
}

// TranscribeFile transcribes an audio file and returns the text
func (a *App) TranscribeFile(path string) (string, error) {
	if a.whisperCtx == nil {
		return "", fmt.Errorf("model not loaded. Please load a model first")
	}

	// Create temporary WAV file
	wavFile := filepath.Join(os.TempDir(), "whisper_temp.wav")
	defer os.Remove(wavFile)

	// Convert to WAV
	if err := a.ConvertToWav(path, wavFile); err != nil {
		return "", fmt.Errorf("failed to convert audio: %w", err)
	}

	// Read WAV data
	data, err := a.readWav(wavFile)
	if err != nil {
		return "", fmt.Errorf("failed to read WAV: %w", err)
	}

	// Process with Whisper
	if err := a.whisperCtx.Process(data, nil, nil, nil); err != nil {
		return "", fmt.Errorf("transcription failed: %w", err)
	}

	// Get all segments
	var sb strings.Builder
	for {
		segment, err := a.whisperCtx.NextSegment()
		if err != nil {
			break
		}
		sb.WriteString(segment.Text)
		sb.WriteString(" ")
	}

	result := strings.TrimSpace(sb.String())
	if result == "" {
		return "", fmt.Errorf("no speech detected in audio")
	}

	return result, nil
}

// GetModelInfo returns information about the loaded model
func (a *App) GetModelInfo() string {
	if a.whisperCtx == nil {
		return "No model loaded"
	}
	return fmt.Sprintf("Model loaded: %s", filepath.Base(a.modelPath))
}

// TranscribeAudioData transcribes PCM audio data directly (from browser recording)
// audioData should be Float32 PCM samples at 16kHz mono
func (a *App) TranscribeAudioData(audioData []float32) (string, error) {
	if a.whisperCtx == nil {
		return "", fmt.Errorf("model not loaded. Please load a model first")
	}

	if len(audioData) == 0 {
		return "", fmt.Errorf("no audio data provided")
	}

	// Process with Whisper
	if err := a.whisperCtx.Process(audioData, nil, nil, nil); err != nil {
		return "", fmt.Errorf("transcription failed: %w", err)
	}

	// Get all segments
	var sb strings.Builder
	for {
		segment, err := a.whisperCtx.NextSegment()
		if err != nil {
			break
		}
		sb.WriteString(segment.Text)
		sb.WriteString(" ")
	}

	result := strings.TrimSpace(sb.String())
	if result == "" {
		return "", fmt.Errorf("no speech detected in audio")
	}

	return result, nil
}

// SaveAndTranscribeRecording saves browser audio recording and transcribes it
// audioBlob is the raw audio data from browser (likely WebM or similar)
func (a *App) SaveAndTranscribeRecording(audioBlob []byte) (string, error) {
	if a.whisperCtx == nil {
		return "", fmt.Errorf("model not loaded. Please load a model first")
	}

	// Create temporary files
	tempInput := filepath.Join(os.TempDir(), "whisper_recording.webm")
	tempWav := filepath.Join(os.TempDir(), "whisper_recording.wav")
	defer os.Remove(tempInput)
	defer os.Remove(tempWav)

	// Save the blob to temp file
	if err := os.WriteFile(tempInput, audioBlob, 0644); err != nil {
		return "", fmt.Errorf("failed to save recording: %w", err)
	}

	// Convert to WAV
	if err := a.ConvertToWav(tempInput, tempWav); err != nil {
		return "", fmt.Errorf("failed to convert audio: %w", err)
	}

	// Read WAV data
	data, err := a.readWav(tempWav)
	if err != nil {
		return "", fmt.Errorf("failed to read WAV: %w", err)
	}

	// Process with Whisper
	if err := a.whisperCtx.Process(data, nil, nil, nil); err != nil {
		return "", fmt.Errorf("transcription failed: %w", err)
	}

	// Get all segments
	var sb strings.Builder
	for {
		segment, err := a.whisperCtx.NextSegment()
		if err != nil {
			break
		}
		sb.WriteString(segment.Text)
		sb.WriteString(" ")
	}

	result := strings.TrimSpace(sb.String())
	if result == "" {
		return "", fmt.Errorf("no speech detected in audio")
	}

	a.saveToCopy(result)
	return result, nil
}

func (a *App) saveToCopy(text string){
	cmd := exec.Command("pbcopy")
	stdin, err := cmd.StdinPipe()
	if err != nil {
		panic(err)
	}

	// Start the command
	if err := cmd.Start(); err != nil {
		panic(err)
	}

	// Write the text to pbcopy's stdin
	if _, err := stdin.Write([]byte(text)); err != nil {
		panic(err)
	}
	stdin.Close()

	// Wait for pbcopy to finish
	if err := cmd.Wait(); err != nil {
		panic(err)
	}

	fmt.Println("Text copied to clipboard. Try pasting it now!")
}
