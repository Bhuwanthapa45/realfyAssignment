import { useState, useMemo } from "react";

export default function FeedbackResult({ result, fps = 30 }) {
  if (!result || !result.summary || !result.frames) return null;

  const { summary, frames } = result;

  const [showAll, setShowAll] = useState(false);
//Converting frames into time in seconds according to the time stamps
  const formatTime = (frame) => {
    const seconds = frame / fps;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const issueCounts = useMemo(() => {
    const counts = {};
    frames.forEach(f => {
      if (f.bad_posture) {
        f.reasons.forEach(reason => {
          counts[reason] = (counts[reason] || 0) + 1;
        });
      }
    });
    return counts;
  }, [frames]);

  const filteredFrames = showAll ? frames : frames.filter(f => f.bad_posture);
//download report for the file
  const downloadReport = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `posture-report-${timestamp}.txt`;

    let content = `Posture Feedback Report\nGenerated at: ${new Date().toLocaleString()}\n\n`;
    content += `Total Frames: ${summary.total_frames}\n`;
    content += `Bad Posture Frames: ${summary.bad_posture_frames}\n`;
    content += `Good Posture %: ${summary.good_posture_percentage}%\n\n`;
    content += `--- Issue Breakdown ---\n`;

    Object.entries(issueCounts).forEach(([issue, count]) => {
      content += `• ${issue}: ${count} times\n`;
    });

    content += `\n--- Frame Feedback ---\n`;

    filteredFrames.forEach(f => {
      const time = formatTime(f.frame);
      content += `\n[${time}] Frame ${f.frame}: `;
      if (f.bad_posture) {
        content += ` Bad Posture\n`;
        f.reasons.forEach(reason => {
          content += `  - ${reason}\n`;
        });
      } else {
        content += `Good Posture\n`;
      }
    });

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-3xl mt-8 bg-white p-6 rounded-lg shadow font-[Inter,sans-serif]">
          {/* Frame-by-frame Feedback */}
        <div className="border-t pt-4 max-h-72 overflow-y-auto space-y-4">
        {filteredFrames.length === 0 ? (
          <p className="text-center text-green-600"> No bad posture detected! Great job!</p>
        ) : (
          filteredFrames.map((f, i) => (
            <div
              key={i}
              className={`p-4 border rounded-lg ${
                f.bad_posture ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span
                  className={`font-semibold ${
                    f.bad_posture ? "text-red-700" : "text-green-700"
                  }`}
                >
                  {f.bad_posture ? " Bad Posture" : " Good Posture"} at {formatTime(f.frame)}
                </span>
                <span className="text-sm text-gray-500">Frame {f.frame}</span>
              </div>

              {f.bad_posture && f.reasons.length > 0 && (
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                  {f.reasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              )}
            </div>
          ))
        )}
      </div>
      {/* Summary Section */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold mb-2 text-[#00D5BD]">Posture Summary</h2>
        <p>Total Frames: <strong>{summary.total_frames}</strong></p>
        <p>
          Bad Posture Detected:{" "}
          <strong className="text-[#FF5252]">{summary.bad_posture_frames}</strong>
        </p>
        <p>
          Good Posture %:{" "}
          <strong className="text-green-600">{summary.good_posture_percentage}%</strong>
        </p>
      </div>

      {/* Issue Breakdown */}
      <div className="bg-gray-50 border rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Issue Breakdown</h3>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          {Object.entries(issueCounts).map(([issue, count]) => (
            <li key={issue}><strong>{issue}</strong>: {count} times</li>
          ))}
        </ul>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-sm px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded"
        >
          {showAll ? "Hide Good Frames" : "Show All Frames"}
        </button>

        <button
          onClick={downloadReport}
          className="text-sm px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
        >
          📥 Download Report
        </button>
      </div>

    
      
    </div>
  );
}