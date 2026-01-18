import React from "react";
import "./VoiceVisualizer.css"; // We will create this file next

const VoiceVisualizer = ({ isRecording = true }: { isRecording?: Boolean }) => {
  // We create an array of 5 bars for the visualizer
  const bars = [1, 2, 3, 4, 5];

  return (
    <div className={`voice-capsule ${isRecording ? "active" : ""}`}>
      <div className="wave-container">
        {bars.map((bar, index) => (
          <div
            key={index}
            className={`wave-bar ${isRecording ? "animate" : ""}`}
            style={{ animationDelay: `${index * 0.1}s` }}
          />
        ))}
      </div>
    </div>
  );
};

export default VoiceVisualizer;
