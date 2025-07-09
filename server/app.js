require('dotenv').config();
const express = require('express');
const cors = require('cors');
const poseRoutes = require('./routes/poseRoutes');
const fileUpload = require('express-fileupload');


const app = express();

app.use(cors());
app.use(express.json());
//express fileupload middleware
app.use(fileUpload({ useTempFiles: true, tempFileDir: '/tmp/' }));

// Health check
app.get('/', (req, res) => {
  res.send('Server is up and running');
});

// Route for posture analysis
app.use('/api', poseRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(` Server running at http://localhost:${PORT}`);
});
