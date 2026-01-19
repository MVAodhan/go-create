import React, { useEffect } from "react";
import "./VoiceVisualizer.css";

interface VoiceVisualizerProps {
  isRecording?: boolean;
  isCopied?: boolean;
}

const VoiceVisualizer = ({
  isRecording = true,
  isCopied = false,
}: VoiceVisualizerProps) => {
  // We create an array of 5 bars for the visualizer
  const bars = [1, 2, 3, 4, 5];

  return (
    <div
      className={`voice-capsule ${isRecording ? "active" : ""} ${isCopied ? "copied" : ""}`}
    >
      <div className="wave-container">
        {isCopied ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="m10.6 16.6l7.05-7.05l-1.4-1.4l-5.65 5.65l-2.85-2.85l-1.4 1.4zM12 22q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22"
            />
          </svg>
        ) : (
          // Wave bars when not copied
          bars.map((bar, index) => (
            <div
              key={index}
              className={`wave-bar ${isRecording ? "animate" : ""}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default VoiceVisualizer;
