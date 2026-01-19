import { useState, useRef, useEffect } from "react";
import "./App.css";
import VoiceVisualizer from "./components/VoiceVisualizer";
import CircleButton from "./components/Button";
import {
  LoadModel,
  GetModelInfo,
  SaveAndTranscribeRecording,
} from "../wailsjs/go/main/App";

function App() {
  const [modelInfo, setModelInfo] = useState<string>("");
  const [transcription, setTranscription] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [modelPath, setModelPath] = useState(
    "./whisper.cpp/models/ggml-medium.en.bin",
  );
  const [isRecording, setIsRecording] = useState<Boolean>(false);
  const [dictationText, setDictationText] = useState<string>("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!modelInfo) {
      loadModel();
      console.log(modelInfo);
    }
  }, []);

  // Handle recording state changes
  useEffect(() => {
    if (isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  }, [isRecording]);

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

  async function startRecording() {
    // Check if model is loaded first
    if (modelInfo === "No model loaded") {
      setError(
        "Please load the Whisper model first! Click 'Load Model' above before recording.",
      );
      setIsRecording(false);
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
      setError("");
    } catch (err) {
      setError(`Failed to start recording: ${err}`);
      setIsRecording(false);
    }
  }

  function stopRecording() {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
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
      console.log("result", result);
    } catch (err) {
      console.log(err);
      setError(`Recording transcription failed: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }

  function clearDictation() {
    setDictationText("");
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
        {modelInfo && (
          <>
            <VoiceVisualizer isRecording={isRecording} />
            <CircleButton
              setIsRecording={setIsRecording}
              isRecording={isRecording}
            />
          </>
        )}
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
