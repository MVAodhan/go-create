import React from "react";
import "./Button.css";

const CircleButton = ({
  isRecording,
  setIsRecording,
}: {
  isRecording?: Boolean;
  setIsRecording: React.Dispatch<React.SetStateAction<Boolean>>;
}) => {
  return (
    <button
      className={`circle-btn ${isRecording ? "recording" : ""}`}
      onClick={() => setIsRecording((prev) => !prev)}
    >
      {!isRecording && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3m7 9c0 3.53-2.61 6.44-6 6.93V21h-2v-3.07c-3.39-.49-6-3.4-6-6.93h2a5 5 0 0 0 5 5a5 5 0 0 0 5-5z"
          />
        </svg>
      )}
      {isRecording && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
        >
          <path fill="currentColor" d="M6 18V6h12v12z" />
        </svg>
      )}
    </button>
  );
};

export default CircleButton;
