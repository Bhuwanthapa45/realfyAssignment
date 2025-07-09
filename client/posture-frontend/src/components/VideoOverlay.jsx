import React, { useRef, useEffect, useState } from "react";
import ReactPlayer from "react-player";

export default function VideoOverlay({ videoUrl, frames, onFrameChange }) {
  const canvasRef = useRef(null);
  const playerRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);

  const handleProgress = (state) => {
    setCurrentTime(state.playedSeconds);
    const frameIndex = Math.floor(state.playedSeconds * 30); // assuming 30 fps
    onFrameChange(frameIndex);
  };

  const currentFrame = Math.floor(currentTime * 30);
  const frameData = Array.isArray(frames) ? frames[currentFrame] : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!ctx || !frameData?.landmarks) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frameData.landmarks.forEach((lm) => {
      const x = lm.x * canvas.width;
      const y = lm.y * canvas.height;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "#FF3B3B";
      ctx.fill();
    });
  }, [frameData]);

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <ReactPlayer
        url={videoUrl}
        playing
        controls
        width="100%"
        height="auto"
        ref={playerRef}
        onProgress={handleProgress}
      />
      <canvas
        ref={canvasRef}
        width={640}
        height={360}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      />
    </div>
  );
}