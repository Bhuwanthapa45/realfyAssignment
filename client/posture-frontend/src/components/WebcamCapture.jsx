
import { useRef, useCallback, useState, useEffect } from "react";
import Webcam from "react-webcam";

export default function WebcamCapture({ onFeedbackReceived }) {
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [uploading, setUploading] = useState(false);

  const startRecording = useCallback(() => {
    setRecordedChunks([]);
    const stream = webcamRef.current?.stream;

    if (stream) {
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "video/webm"
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        setIsRecording(false);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } else {
      alert("Webcam stream not available.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [isRecording]);

  useEffect(() => {
    if (!isRecording && recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const formData = new FormData();
      const file = new File([blob], "recorded_video.webm", {
        type: "video/webm"
      });
      formData.append("video", file);

      setUploading(true);
      fetch("http://localhost:3001/api/analyze", {
        method: "POST",
        body: formData,
      })
        .then(res => res.json())
        .then(data => {
          setUploading(false);
          onFeedbackReceived(data.feedback); // pass to parent
        })
        .catch(err => {
          console.error("Recording upload failed:", err);
          setUploading(false);
        });

      setRecordedChunks([]);
    }
  }, [isRecording, recordedChunks, onFeedbackReceived]);

  return (
    <div className="flex flex-col items-center gap-4 bg-[#1B4D5D] p-6 rounded-lg shadow-lg max-w-xl mx-auto">
      <h3 className="text-lg font-semibold text-gray-100 mb-2">
        Record Live Video
      </h3>

      <Webcam
        audio={false}
        ref={webcamRef}
        mirrored
        screenshotFormat="image/jpeg"
        videoConstraints={{
          facingMode: "user",
          width: 640,
          height: 480,
        }}
        className="rounded-lg shadow-md"
      />

      <div className="flex gap-3">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="bg-red-500 text-white py-2 px-6 rounded-lg hover:bg-red-600 transition font-semibold"
          >
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="bg-gray-600 text-white py-2 px-6 rounded-lg hover:bg-gray-700 transition font-semibold"
          >
            Stop Recording
          </button>
        )}
      </div>

      {isRecording && (
        <div className="text-red-500 font-semibold animate-pulse">
          Recording in progress...
        </div>
      )}

      {uploading && (
        <div className="text-blue-600 font-semibold animate-pulse">
          Uploading and analyzing video...
        </div>
      )}

      <p className="text-sm text-gray-200 text-center max-w-md">
        Record yourself performing squats or sitting at a desk. After stopping,
        the video will be analyzed automatically.
      </p>
    </div>
  );
}