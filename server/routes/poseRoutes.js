const express = require('express');
const { analyzePosture, getProcessedVideo } = require('../controllers/poseController');

const router = express.Router();

//handled by express-fileupload
router.post('/analyze', analyzePosture);

// Optional  serve local videos
router.get('/video/:filename', getProcessedVideo);

module.exports = router;
