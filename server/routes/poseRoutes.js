
// const express = require('express');
// const multer = require('multer');
// const { analyzePosture, getProcessedVideo } = require('../controllers/poseController');

// const router = express.Router();

// // Store uploaded videos in /uploads
// const upload = multer({ dest: 'uploads/' });

// // Route: POST /api/analyze
// router.post('/analyze', upload.single('video'), analyzePosture);

// // Route: GET /api/video/:filename - Serve processed video files
// router.get('/video/:filename', getProcessedVideo);

// module.exports = router;

//fixing the error due to multer 

const express = require('express');
const multer = require('multer');
const path = require('path');
const { analyzePosture, getProcessedVideo } = require('../controllers/poseController');

const router = express.Router();

// ✅ Ensure uploaded videos go into ./uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Route: POST /api/analyzea
router.post('/analyze', upload.single('video'), analyzePosture);

// Route: GET /api/video/:filename
router.get('/video/:filename', getProcessedVideo);

module.exports = router;
