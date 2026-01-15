import { useState, useRef } from "react";
import logo from "./assets/images/logo-universal.png";
import "./App.css";
import {
  LoadModel,
  TranscribeFile,
  GetModelInfo,
  SaveAndTranscribeRecording,
} from "../wailsjs/go/main/App";

function App() {
  const [modelInfo, setModelInfo] = useState<string>("No model loaded");
  const [transcription, setTranscription] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [modelPath, setModelPath] = useState(
    "./whisper.cpp/models/ggml-base.en.bin"
  );
  const [audioPath, setAudioPath] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [dictationText, setDictationText] = useState<string>("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  async function loadModel() {
    if (!modelPath) {
      setError("Please enter a model path");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await LoadModel(modelPath);
      const info = await GetModelInfo();
      setModelInfo(info);
      setError("");
    } catch (err) {
      setError(`Failed to load model: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function transcribeAudio() {
    if (!audioPath) {
      setError("Please enter an audio file path");
      return;
    }

    setIsLoading(true);
    setError("");
    setTranscription("");

    try {
      const result = await TranscribeFile(audioPath);
      setTranscription(result);
      setError("");
    } catch (err) {
      setError(`Transcription failed: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function startRecording() {
    // Check if model is loaded first
    if (modelInfo === "No model loaded") {
      setError(
        "Please load the Whisper model first! Click 'Load Model' above before recording."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        await transcribeRecording(audioBlob);

        // Stop all tracks to release the microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError("");
    } catch (err) {
      setError(`Failed to start recording: ${err}`);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }

  async function transcribeRecording(audioBlob: Blob) {
    setIsLoading(true);
    setError("");

    try {
      // Convert blob to array buffer then to byte array
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const byteArray = Array.from(uint8Array);

      const result = await SaveAndTranscribeRecording(byteArray);
      setDictationText((prev) => prev + result + " ");
      setTranscription(result);
      setError("");
    } catch (err) {
      setError(`Recording transcription failed: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }

  function clearDictation() {
    setDictationText("");
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(dictationText);
  }

  return (
    <div id="App">
      <img src={logo} id="logo" alt="logo" />
      <h1>Voice Transcription & Dictation</h1>

      <div
        style={{
          marginBottom: "20px",
          padding: "10px",
          backgroundColor: "#f0f0f0",
          borderRadius: "5px",
        }}
      >
        <strong>Status:</strong> {modelInfo}
      </div>

      <div className="section">
        <h2>1. Load Whisper Model</h2>
        <div className="input-box">
          <input
            className="input"
            placeholder="Model path (e.g., ./whisper.cpp/models/ggml-base.en.bin)"
            value={modelPath}
            onChange={(e) => setModelPath(e.target.value)}
            type="text"
          />
          <button className="btn" onClick={loadModel} disabled={isLoading}>
            {isLoading ? "Loading..." : "Load Model"}
          </button>
        </div>
      </div>

      <div
        className="section"
        style={{
          backgroundColor: "#e3f2fd",
          padding: "20px",
          borderRadius: "8px",
        }}
      >
        <h2>🎤 Voice Dictation (Accessibility Feature)</h2>
        <p style={{ fontSize: "14px", color: "#555", marginBottom: "15px" }}>
          Record your voice and convert it to text - perfect for hands-free
          input
        </p>

        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          {!isRecording ? (
            <button
              className="btn"
              onClick={startRecording}
              disabled={isLoading}
              style={{
                backgroundColor: "#4CAF50",
                color: "white",
                fontSize: "16px",
                padding: "12px 24px",
              }}
            >
              🎙️ Start Recording
            </button>
          ) : (
            <button
              className="btn"
              onClick={stopRecording}
              style={{
                backgroundColor: "#f44336",
                color: "white",
                fontSize: "16px",
                padding: "12px 24px",
                animation: "pulse 1.5s infinite",
              }}
            >
              ⏹️ Stop Recording
            </button>
          )}

          <button
            className="btn"
            onClick={clearDictation}
            disabled={!dictationText}
            style={{ backgroundColor: "#ff9800", color: "white" }}
          >
            Clear
          </button>

          <button
            className="btn"
            onClick={copyToClipboard}
            disabled={!dictationText}
            style={{ backgroundColor: "#2196F3", color: "white" }}
          >
            📋 Copy to Clipboard
          </button>
        </div>

        {isRecording && (
          <div
            style={{
              padding: "10px",
              backgroundColor: "#ffebee",
              borderRadius: "5px",
              marginBottom: "15px",
              border: "2px solid #f44336",
            }}
          >
            <strong>🔴 Recording in progress...</strong> Click "Stop Recording"
            when finished
          </div>
        )}

        <div
          style={{
            minHeight: "150px",
            padding: "15px",
            backgroundColor: "white",
            border: "2px solid #2196F3",
            borderRadius: "5px",
            textAlign: "left",
            fontSize: "16px",
            lineHeight: "1.6",
            whiteSpace: "pre-wrap",
          }}
        >
          {dictationText || "Your dictation will appear here..."}
        </div>
      </div>

      <div className="section">
        <h2>📁 Transcribe Audio File</h2>
        <div className="input-box">
          <input
            className="input"
            placeholder="Audio file path (e.g., ./whisper.cpp/samples/jfk.mp3)"
            value={audioPath}
            onChange={(e) => setAudioPath(e.target.value)}
            type="text"
          />
          <button
            className="btn"
            onClick={transcribeAudio}
            disabled={isLoading}
          >
            {isLoading ? "Transcribing..." : "Transcribe File"}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            marginTop: "20px",
            padding: "10px",
            backgroundColor: "#ffebee",
            color: "#c62828",
            borderRadius: "5px",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {transcription && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            backgroundColor: "#e8f5e9",
            borderRadius: "5px",
            textAlign: "left",
          }}
        >
          <h3>Last Transcription:</h3>
          <p style={{ fontSize: "16px", lineHeight: "1.5" }}>{transcription}</p>
        </div>
      )}

      <div
        style={{
          marginTop: "30px",
          padding: "10px",
          fontSize: "12px",
          color: "#666",
        }}
      >
        <p>
          <strong>Quick Start:</strong>
        </p>
        <ol
          style={{ textAlign: "left", margin: "10px auto", maxWidth: "600px" }}
        >
          <li>
            Click "Load Model" to load the Whisper AI model (default path
            provided)
          </li>
          <li>Click "Start Recording" and speak into your microphone</li>
          <li>Click "Stop Recording" to transcribe your speech</li>
          <li>Use "Copy to Clipboard" to use the text elsewhere</li>
        </ol>
        <p>
          <em>
            Note: Microphone permissions required. ffmpeg must be installed.
          </em>
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

export default App;
