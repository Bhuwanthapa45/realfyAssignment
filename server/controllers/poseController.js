const { PythonShell } = require('python-shell');
const cloudinary = require('../utils/cloudinaryConfig');
const fs = require('fs');

exports.analyzePosture = async (req, res) => {
  try {
    if (!req.files || !req.files.video) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const file = req.files.video;

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(file.tempFilePath, {
      resource_type: 'video',
      folder: 'posture_videos',
    });

    console.log("✅ Uploaded to Cloudinary:", uploadResult.secure_url);

    const videoPath = file.tempFilePath;

    const options = {
      mode: 'text',
      pythonOptions: ['-u'],
      scriptPath: './utils',
      args: [videoPath],
    };

    PythonShell.run('poseAnalyzer.py', options)
      .then(results => {
        if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath); // Clean up

        try {
          const parsed = JSON.parse(results.join(''));
          res.json({
            feedback: parsed,
            processed_video_url: uploadResult.secure_url, // return Cloudinary video URL
          });
        } catch (err) {
          console.error("❌ JSON parse error:", err);
          res.status(500).json({ error: 'Invalid Python output' });
        }
      })
      .catch(err => {
        console.error("❌ Python script error:", err);
        if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath); // Clean on fail
        res.status(500).json({ error: 'Python script execution failed' });
      });

  } catch (error) {
    console.error("❌ Server Error:", error);
    res.status(500).json({ error: 'Server error while analyzing posture' });
  }
};

//  to support local streaming (optional)
exports.getProcessedVideo = (req, res) => {
  const path = require('path');
  const filePath = path.join(__dirname, '../uploads', req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
    const start = parseInt(startStr, 10);
    const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    });
    fs.createReadStream(filePath).pipe(res);
  }
};