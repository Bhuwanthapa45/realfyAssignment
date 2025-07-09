

// const { PythonShell } = require('python-shell');
// const fs = require('fs');
// const path = require('path');

// exports.analyzePosture = (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ error: 'No video file provided' });
//   }

//   const videoPath = req.file.path;

//   const options = {
//     mode: 'text',
//     pythonOptions: ['-u'],
//     scriptPath: './utils',
//     args: [videoPath]
//   };

//   console.log("▶️ Running pose analysis on:", videoPath);

//   PythonShell.run('poseAnalyzer.py', options)
//     .then(results => {
//       console.log("Python returned:", results);

//       // Clean up original video file
//       if (fs.existsSync(videoPath)) {
//         fs.unlinkSync(videoPath);
//       }

//       try {
//         const parsed = JSON.parse(results.join(''));
        
//         // Check if processed video was created
//         if (parsed.processed_video_path && fs.existsSync(parsed.processed_video_path)) {
//           console.log(" Processed video created:", parsed.processed_video_path);
          
//           // Just send the path, let the frontend request the video via the video endpoint
//           res.json({ feedback: parsed });
//         } else {
//           console.log(" No processed video found");
//           res.json({ feedback: parsed });
//         }
//       } catch (e) {
//         console.error(" JSON parse error:", e);
//         res.status(500).json({ error: 'Invalid Python output' });
//       }
//     })
//     .catch(err => {
//       console.error(" Python script error:", err);
//       if (fs.existsSync(videoPath)) {
//         fs.unlinkSync(videoPath); // Clean up even on error
//       }
//       res.status(500).json({ error: 'Python script execution failed' });
//     });
// };

// // New endpoint to serve processed video files
// exports.getProcessedVideo = (req, res) => {
//   const filename = req.params.filename;
//   const filePath = path.join(__dirname, '../uploads', filename);
  
//   if (!fs.existsSync(filePath)) {
//     return res.status(404).json({ error: 'Video file not found' });
//   }
  
//   const stat = fs.statSync(filePath);
//   const fileSize = stat.size;
//   const range = req.headers.range;
  
//   if (range) {
//     const parts = range.replace(/bytes=/, "").split("-");
//     const start = parseInt(parts[0], 10);
//     const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
//     const chunksize = (end - start) + 1;
//     const file = fs.createReadStream(filePath, { start, end });
//     const head = {
//       'Content-Range': `bytes ${start}-${end}/${fileSize}`,
//       'Accept-Ranges': 'bytes',
//       'Content-Length': chunksize,
//       'Content-Type': 'video/mp4',
//     };
//     res.writeHead(206, head);
//     file.pipe(res);
//   } else {
//     const head = {
//       'Content-Length': fileSize,
//       'Content-Type': 'video/mp4',
//     };
//     res.writeHead(200, head);
//     fs.createReadStream(filePath).pipe(res);
//   }
// };

//fixing the error due to multer at production

const { PythonShell } = require('python-shell');
const fs = require('fs');
const path = require('path');

exports.analyzePosture = (req, res) => {
  //  Ensure uploads folder exists (important for Render)
  const uploadsDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No video file provided' });
  }

  const videoPath = req.file.path;

  const options = {
    mode: 'text',
    pythonOptions: ['-u'],
    scriptPath: './utils',
    args: [videoPath]
  };

  console.log("▶Running pose analysis on:", videoPath);

  PythonShell.run('poseAnalyzer.py', options)
    .then(results => {
      console.log(" Python returned:", results);

      // Clean up uploaded video
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }

      try {
        const parsed = JSON.parse(results.join(''));

        // Check if processed video was created
        if (parsed.processed_video_path && fs.existsSync(parsed.processed_video_path)) {
          console.log(" Processed video created:", parsed.processed_video_path);
          res.json({ feedback: parsed });
        } else {
          console.warn(" No processed video found");
          res.json({ feedback: parsed });
        }
      } catch (e) {
        console.error(" JSON parse error:", e);
        res.status(500).json({ error: 'Invalid Python output' });
      }
    })
    .catch(err => {
      console.error(" Python script error:", err);
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
      res.status(500).json({ error: 'Python script execution failed' });
    });
};

//  Endpoint to stream the processed video
exports.getProcessedVideo = (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Video file not found' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
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
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
};