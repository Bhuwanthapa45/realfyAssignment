const cloudinary = require('../utils/cloudinaryConfig');
const axios = require('axios');

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

    console.log("Uploaded to Cloudinary:", uploadResult.secure_url);

    // Call Python microservice
    const response = await axios.post(
      process.env.PYTHON_API_URL + '/analyze',
      { video_url: uploadResult.secure_url }
    );

    res.json({
      feedback: response.data.feedback,
      processed_video_url: uploadResult.secure_url
    });

  } catch (error) {
    console.error(" Error during posture analysis:", error.message);
    res.status(500).json({ error: 'Posture analysis failed' });
  }
};
