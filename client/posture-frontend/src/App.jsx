import UploadForm from "./components/UploadForm";
import WebcamCapture from "./components/WebcamCapture";
import FeedbackResult from "./components/FeedbackResult";
import ProcessedVideoPlayer from "./components/ProcessedVideoPlayer";
import { useState } from "react";

export default function App() {
  const [feedback, setFeedback] = useState(null);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
 


  // Handle analysis from both upload and webcam
  const analyzeFile = async (blob) => {
    const form = new FormData();
    form.append("video", blob, "capture.webm");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/analyze`, {
  method: "POST",
  body: form,
});;

      const data = await res.json();
      setFeedback(data.feedback);
      setCurrentFrameIndex(0);
   
    } catch (error) {
      console.error("Analysis error:", error);
      alert("Failed to analyze posture.");
    }
  };

  const currentFrameData = feedback?.frames?.[currentFrameIndex];

  return (
    <div className="min-h-screen bg-[#19202E] p-6 font-[Inter,sans-serif]">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-[#00D5BE] mb-8">
          Posture Analysis App
        </h1>

        {/* Upload Option */}
        <UploadForm onResult={analyzeFile} />

        <div className="my-8 text-center text-gray-600 font-semibold">OR</div>

        {/* Webcam Option */}
        <WebcamCapture onFeedbackReceived={setFeedback} />

        {/* Show Results */}
        {feedback && (
          <>
            {/* Frame-by-frame feedback */}
            <div className="mt-10 text-center">
              <h2 className="text-xl font-semibold text-[#1A73E8] mb-2">Live Feedback</h2>
              {currentFrameData ? (
                <div className="bg-white p-4 rounded-lg shadow max-w-2xl mx-auto">
                  <p className="text-gray-700">
                    <strong>Frame {currentFrameData.frame}:</strong>{" "}
                    {currentFrameData.bad_posture ? (
                      <span className="text-[#FF5252]">{currentFrameData.reasons.join(", ")}</span>
                    ) : (
                      <span className="text-green-600">Good posture</span>
                    )}
                  </p>
                </div>
              ) : (
                <p className="text-gray-400 italic">Waiting for playback...</p>
              )}
            </div>

            {/* Processed Video */}
            {(feedback.processed_video_base64 || feedback.processed_video_path) && (
              <div className="mt-10">
                <h2 className="text-xl font-semibold text-[#1A73E8] mb-4 text-center">
                  Processed Video with Pose Analysis
                </h2>
                <ProcessedVideoPlayer
                  videoData={feedback.processed_video_base64}
                  videoPath={feedback.processed_video_path}
                  frames={feedback.frames}
                  onFrameChange={setCurrentFrameIndex}
                />
              </div>
            )}

            {/* Feedback breakdown */}
            <FeedbackResult result={feedback} selectedFrame={currentFrameIndex} />
          </>
        )}
      </div>
    </div>
  );
}