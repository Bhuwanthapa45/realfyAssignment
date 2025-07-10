# posture-python-api/app.py

from flask import Flask, request, jsonify
from poseAnalyzer import analyze_video_url

app = Flask(__name__)

@app.route('/analyze', methods=['POST'])
def analyze_posture():
    try:
        data = request.get_json()
        video_url = data.get("video_url")
        if not video_url:
            return jsonify({"error": "Missing video_url"}), 400

        result = analyze_video_url(video_url)
        return jsonify({"feedback": result})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5000)