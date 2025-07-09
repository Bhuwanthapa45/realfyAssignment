import React, { useRef, useEffect, useState, useMemo } from "react";

export default function ProcessedVideoPlayer({ videoData, videoPath, frames, onFrameChange }) {
  const videoRef = useRef(null);

  // State to track playback
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Generate a usable video URL (either base64 or from server path)
  const videoUrl = useMemo(() => {
    if (videoData) {
      return `data:video/mp4;base64,${videoData}`;
    } else if (videoPath) {
      const filename = videoPath.split('/').pop();
      return `http://localhost:3001/api/video/${filename}`;
    }
    return null;
  }, [videoData, videoPath]);

  // Set up video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);

      // Calculate current frame (assuming 30 FPS)
      const frameIndex = Math.floor(time * 30);
      if (frameIndex < frames.length && frameIndex >= 0) {
        onFrameChange(frameIndex);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };
    const handleError = () => {
      setError("Failed to load video");
      setIsLoading(false);
    };

    // Add listeners
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("error", handleError);

    // Cleanup on unmount
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("error", handleError);
    };
  }, [frames.length, onFrameChange, videoUrl]);

  // Allow user to click anywhere on the progress bar to seek
  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;

    video.currentTime = percentage * duration;
  };

  // Play or pause video on button click
  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(() => setError("Failed to play video"));
    }
  };

  // Format seconds into MM:SS
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Get current frame info based on video time
  const currentFrame = useMemo(() => {
    const index = Math.floor(currentTime * 30);
    return index >= 0 && index < frames.length ? frames[index] : null;
  }, [currentTime, frames]);

  // Show message if video is missing
  if (!videoUrl) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <p className="text-[#00D5BD]">No processed video available</p>
      </div>
    );
  }

  // Show error if video fails to load/play
  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg border border-red-200">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <button onClick={() => window.location.reload()} className="text-blue-600 hover:underline">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-[#1B4D5D] rounded-lg shadow-lg overflow-hidden">
      {/* Video Player Section */}
      <div className="relative w-full aspect-video bg-black">
        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-[#00D5BD]">Loading processed video...</p>
            </div>
          </div>
        )}

        {/* Video Element */}
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          preload="metadata"
          style={{ display: isLoading ? "none" : "block" }}
        />

        {/* Optional play/pause overlay on hover */}
        {/* 
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer z-20"
          onClick={togglePlayPause}
        >
          <div className="text-white text-6xl bg-black bg-opacity-40 p-4 rounded-full">
            {isPlaying ? "⏸️" : "▶️"}
          </div>
        </div> 
        */}
      </div>

      {/* Controls & Info */}
      <div className="p-4 bg-gray-50 space-y-4">
        {/* Play/Pause and Seek Bar */}
        <div className="flex items-center space-x-4">
          <button
            onClick={togglePlayPause}
            disabled={isLoading}
            className="bg-[#1A73E8] text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isPlaying ? "⏸️ Pause" : "▶️ Play"}
          </button>

          {/* Seek Progress Bar */}
          <div className="flex-1">
            <div className="bg-gray-300 h-2 rounded-full cursor-pointer relative" onClick={handleSeek}>
              <div
                className="bg-[#1A73E8] h-2 rounded-full transition-all"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Time Display */}
          <span className="text-sm text-gray-600 min-w-20">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Frame Info Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-gray-600">
            <span className="font-semibold">Frame:</span> {Math.floor(currentTime * 30) + 1} / {frames.length}
          </div>

          <div className="text-center">
            {currentFrame && (
              <span className="font-semibold">
                Status:{" "}
                {currentFrame.bad_posture === null ? (
                  <span className="text-yellow-600">No Detection</span>
                ) : currentFrame.bad_posture ? (
                  <span className="text-red-600">Bad Posture</span>
                ) : (
                  <span className="text-green-600">Good Posture</span>
                )}
              </span>
            )}
          </div>

          <div className="text-right text-gray-600">
            <span className="font-semibold">Bad Frames:</span>{" "}
            {frames.filter((f) => f.bad_posture).length}
          </div>
        </div>

        {/* Display reasons for bad posture */}
        {currentFrame?.bad_posture && currentFrame.reasons.length > 0 && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-200 min-h-[100px]">
            <h4 className="font-semibold text-red-800 mb-2">Issues Detected:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              {currentFrame.reasons.map((reason, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}