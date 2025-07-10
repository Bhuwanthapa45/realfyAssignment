from flask import Flask, request, jsonify
from poseAnalyzer import analyze_video_url
from dotenv import load_dotenv  # Used to load .env file
import os  # Required to access environment variables

# Initialize Flask app
app = Flask(__name__)

# Load environment variables from .env file
load_dotenv()

# Define POST route to receive video URL and return analysis
@app.route('/analyze', methods=['POST'])
def analyze_posture():
    try:
        data = request.get_json()
        video_url = data.get("video_url")

        if not video_url:
            return jsonify({"error": "Missing video_url"}), 400

        # Analyze the video using poseAnalyzer.py
        result = analyze_video_url(video_url)
        return jsonify({"feedback": result})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Run server with proper host and port settings for deployment
if __name__ == "__main__":
    # Host 0.0.0.0 allows external access (important for Render)
    # Port is pulled from environment (Render sets it dynamically)
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
    