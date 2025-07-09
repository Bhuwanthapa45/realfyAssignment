import { useState } from "react";

export default function UploadForm({ onResult }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setUploaded(false);

    try {
      await onResult(file);
      setUploaded(true);
    } catch {
      alert("Error analyzing video");
    } finally {
      setLoading(false);
    }
  };

  const getButtonText = () => {
    if (loading) return "Analyzing...";
    if (uploaded) return "Uploaded";
    return "Upload & Analyze";
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#122430] p-6 rounded-lg shadow-lg w-full max-w-xl mx-auto"
    >
      <input
        type="file"
        accept="video/*"
        onChange={(e) => {
          setFile(e.target.files[0]);
          setUploaded(false);
        }}
        className="mb-4 block w-full text-sm text-[#00D5BE] file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#1B4D5D] file:text-white hover:file:bg-blue-700"
        required
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#1B4D5D] text-white font-semibold py-2 px-4 rounded hover:bg-blue-700 transition disabled:opacity-50"
      >
        {getButtonText()}
      </button>
    </form>
  );
}