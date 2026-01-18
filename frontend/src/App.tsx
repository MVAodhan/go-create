import { useState, useRef, useEffect } from "react";
import "./App.css";
import VoiceVisualizer from "./components/VoiceVisualizer";
import CircleButton from "./components/Button";
// import {
//   LoadModel,
//   TranscribeFile,
//   GetModelInfo,
//   SaveAndTranscribeRecording,
// } from "../wailsjs/go/main/App";

function App() {
  const [modelInfo, setModelInfo] = useState<string>("No model loaded");
  const [transcription, setTranscription] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [modelPath, setModelPath] = useState(
    "./whisper.cpp/models/ggml-medium.en.bin",
  );
  const [audioPath, setAudioPath] = useState("");
  const [isRecording, setIsRecording] = useState<Boolean>(false);
  const [dictationText, setDictationText] = useState<string>("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    console.log("effect");
  }, []);

  // async function loadModel() {
  //   if (!modelPath) {
  //     setError("Please enter a model path");
  //     return;
  //   }

  //   setIsLoading(true);
  //   setError("");

  //   try {
  //     await LoadModel(modelPath);
  //     const info = await GetModelInfo();
  //     setModelInfo(info);
  //     setError("");
  //   } catch (err) {
  //     setError(`Failed to load model: ${err}`);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // }

  // async function transcribeAudio() {
  //   if (!audioPath) {
  //     setError("Please enter an audio file path");
  //     return;
  //   }

  //   setIsLoading(true);
  //   setError("");
  //   setTranscription("");

  //   try {
  //     const result = await TranscribeFile(audioPath);
  //     setTranscription(result);
  //     setError("");
  //   } catch (err) {
  //     setError(`Transcription failed: ${err}`);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // }

  // async function startRecording() {
  //   // Check if model is loaded first
  //   if (modelInfo === "No model loaded") {
  //     setError(
  //       "Please load the Whisper model first! Click 'Load Model' above before recording."
  //     );
  //     return;
  //   }

  //   try {
  //     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  //     const mediaRecorder = new MediaRecorder(stream);
  //     mediaRecorderRef.current = mediaRecorder;
  //     audioChunksRef.current = [];

  //     mediaRecorder.ondataavailable = (event) => {
  //       if (event.data.size > 0) {
  //         audioChunksRef.current.push(event.data);
  //       }
  //     };

  //     mediaRecorder.onstop = async () => {
  //       const audioBlob = new Blob(audioChunksRef.current, {
  //         type: "audio/webm",
  //       });
  //       await transcribeRecording(audioBlob);

  //       // Stop all tracks to release the microphone
  //       stream.getTracks().forEach((track) => track.stop());
  //     };

  //     mediaRecorder.start();
  //     setIsRecording(true);
  //     setError("");
  //   } catch (err) {
  //     setError(`Failed to start recording: ${err}`);
  //   }
  // }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }

  // async function transcribeRecording(audioBlob: Blob) {
  //   setIsLoading(true);
  //   setError("");

  //   try {
  //     // Convert blob to array buffer then to byte array
  //     const arrayBuffer = await audioBlob.arrayBuffer();
  //     const uint8Array = new Uint8Array(arrayBuffer);
  //     const byteArray = Array.from(uint8Array);

  //     const result = await SaveAndTranscribeRecording(byteArray);
  //     setDictationText((prev) => prev + result + " ");
  //     setTranscription(result);
  //     setError("");
  //   } catch (err) {
  //     setError(`Recording transcription failed: ${err}`);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // }

  function clearDictation() {
    setDictationText("");
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(dictationText);
  }

  return (
    <div id="App">
      <div
        className="section"
        style={{
          backgroundColor: "transparent",
          padding: "20px",
          borderRadius: "8px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <VoiceVisualizer isRecording={isRecording} />
        <CircleButton
          setIsRecording={setIsRecording}
          isRecording={isRecording}
        />
        {/* <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
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
        </div> */}
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
