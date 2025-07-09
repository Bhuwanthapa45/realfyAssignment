# 🧍‍♂️ RealFly Posture Video App

A web application that analyzes your posture from videos or webcam recordings. The app provides frame-by-frame feedback highlighting poor posture using pose detection with MediaPipe and OpenCV.

---

## 🛠 Tech Stack MERN Stack (No database for Now)

### 🖥 Frontend:
- React (with Tailwind CSS)
- React Webcam
- Custom Player with Timeline + Feedback

### ⚙️ Backend:
- Node.js + Express.js
- Python (OpenCV, MediaPipe)
- `python-shell` for Node ↔ Python integration
- Multer for video upload

---

## 🌐 Live Demo (Hosted on Render)

URL: 

---

## 📁 Project Structure

realflyVideoApp/
│
├── client/
│   └── posture-frontend/    # React + Tailwind UI
│       ├── src/
│       └── public/
│
├── server/                  # Express backend
│   ├── routes/
│   ├── controllers/
│   ├── uploads/             # Uploaded and processed video files
│   ├── utils/               # Python scripts
│   └── index.js
│
└── README.md