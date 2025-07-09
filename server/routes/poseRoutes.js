
const express = require('express');
const multer = require('multer');
const { analyzePosture, getProcessedVideo } = require('../controllers/poseController');

const router = express.Router();

// Store uploaded videos in /uploads
const upload = multer({ dest: 'uploads/' });

// Route: POST /api/analyze
router.post('/analyze', upload.single('video'), analyzePosture);

// Route: GET /api/video/:filename - Serve processed video files
router.get('/video/:filename', getProcessedVideo);

module.exports = router;