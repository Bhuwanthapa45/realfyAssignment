
        
import sys
import json
import cv2  # type: ignore
import mediapipe as mp  # type: ignore
import math
import time
import os
import numpy as np  # type: ignore
import subprocess


# ---------------- Utility Functions ----------------

def get_angle(a, b, c):
    """Returns angle ABC in degrees where b is the joint"""
    angle = math.degrees(math.atan2(c.y - b.y, c.x - b.x) -
                         math.atan2(a.y - b.y, a.x - b.x))
    return abs(angle)


def is_knee_forward_of_ankle(knee, ankle, threshold=0.05):
    """Checks if the knee is ahead of the ankle on the x-axis (indicative of bad squatting)"""
    return (knee.x - ankle.x) > threshold


def get_neck_angle(shoulder, ear):
    """Returns the angle of the neck w.r.t horizontal"""
    dx = ear.x - shoulder.x
    dy = ear.y - shoulder.y
    return abs(math.degrees(math.atan2(dy, dx)))


def landmark_to_dict(landmark):
    """Converts a landmark to a dictionary"""
    return { "x": landmark.x, "y": landmark.y }


# ---------------- Drawing Functions ----------------

def draw_pose_connections(frame, landmarks, connections, color=(0, 255, 0), thickness=2):
    """Draw pose connections for better visualization"""
    h, w = frame.shape[:2]
    for start_idx, end_idx in connections:
        if start_idx < len(landmarks) and end_idx < len(landmarks):
            start = landmarks[start_idx]
            end = landmarks[end_idx]
            x1, y1 = int(start.x * w), int(start.y * h)
            x2, y2 = int(end.x * w), int(end.y * h)
            cv2.line(frame, (x1, y1), (x2, y2), color, thickness)


def draw_feedback_overlay(frame, feedback):
    """Overlay posture feedback on video frame"""
    h, w = frame.shape[:2]
    overlay = frame.copy()
    cv2.rectangle(overlay, (10, 10), (w - 10, 150), (0, 0, 0), -1)
    cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)

    # Frame number
    cv2.putText(frame, f"Frame: {feedback['frame']}", (20, 35),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    # Status
    if feedback['bad_posture'] is None:
        status = "No Person Detected"
        color = (0, 255, 255)
    elif feedback['bad_posture']:
        status = "BAD POSTURE DETECTED"
        color = (0, 0, 255)
    else:
        status = "Good Posture"
        color = (0, 255, 0)

    cv2.putText(frame, status, (20, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)

    # Reasons
    y_offset = 100
    if feedback['bad_posture'] and feedback["reasons"]:
        for reason in feedback["reasons"]:
            cv2.putText(frame, f"• {reason}", (20, y_offset),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
            y_offset += 25


# ---------------- Posture Analysis Logic ----------------

def analyze(video_path):
    mp_pose = mp.solutions.pose

    base_name = os.path.splitext(os.path.basename(video_path))[0]
    raw_output = f"uploads/processed_raw_{base_name}.mp4"
    final_output = f"uploads/processed_{base_name}.mp4"
    os.makedirs("uploads", exist_ok=True)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return { "error": f"Cannot open video file: {video_path}" }

    fps = int(cap.get(cv2.CAP_PROP_FPS)) or 30
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    out = cv2.VideoWriter(raw_output, cv2.VideoWriter_fourcc(*'mp4v'), fps, (width, height))

    frame_results = []
    bad_frames = 0
    frame_number = 0

    with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame_number += 1
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(rgb)
            output_frame = frame.copy()

            feedback = {
                "frame": frame_number,
                "bad_posture": False,
                "reasons": [],
                "landmarks": []
            }

            if results.pose_landmarks:
                lm = results.pose_landmarks.landmark
                try:
                    # Extract landmarks
                    landmarks = {
                        "l_sh": lm[mp_pose.PoseLandmark.LEFT_SHOULDER.value],
                        "l_hip": lm[mp_pose.PoseLandmark.LEFT_HIP.value],
                        "l_knee": lm[mp_pose.PoseLandmark.LEFT_KNEE.value],
                        "l_ankle": lm[mp_pose.PoseLandmark.LEFT_ANKLE.value],
                        "l_ear": lm[mp_pose.PoseLandmark.LEFT_EAR.value],
                        "r_sh": lm[mp_pose.PoseLandmark.RIGHT_SHOULDER.value],
                        "r_hip": lm[mp_pose.PoseLandmark.RIGHT_HIP.value],
                        "r_knee": lm[mp_pose.PoseLandmark.RIGHT_KNEE.value],
                        "r_ankle": lm[mp_pose.PoseLandmark.RIGHT_ANKLE.value],
                        "r_ear": lm[mp_pose.PoseLandmark.RIGHT_EAR.value],
                    }

                    # Rules
                    back_angle = (get_angle(landmarks["l_sh"], landmarks["l_hip"], landmarks["l_knee"]) +
                                  get_angle(landmarks["r_sh"], landmarks["r_hip"], landmarks["r_knee"])) / 2

                    neck_angle = (get_neck_angle(landmarks["l_sh"], landmarks["l_ear"]) +
                                  get_neck_angle(landmarks["r_sh"], landmarks["r_ear"])) / 2

                    # Back posture rule
                    if back_angle < 150:
                        feedback["bad_posture"] = True
                        feedback["reasons"].append(f"Severe back bend ({int(back_angle)}°)")
                    elif back_angle < 160:
                        feedback["bad_posture"] = True
                        feedback["reasons"].append(f"Back not straight enough ({int(back_angle)}°)")

                    # Knee posture rule
                    if (is_knee_forward_of_ankle(landmarks["l_knee"], landmarks["l_ankle"]) or
                        is_knee_forward_of_ankle(landmarks["r_knee"], landmarks["r_ankle"])):
                        feedback["bad_posture"] = True
                        feedback["reasons"].append("Knee exceeds ankle position")

                    # Neck posture rule
                    if neck_angle > 30:
                        feedback["bad_posture"] = True
                        feedback["reasons"].append(f"Neck angle too steep ({int(neck_angle)}°)")

                    # Count bad frames
                    if feedback["bad_posture"]:
                        bad_frames += 1

                    # Store selected landmarks
                    feedback["landmarks"] = [landmark_to_dict(lm) for lm in landmarks.values()]

                except Exception as e:
                    feedback["bad_posture"] = None
                    feedback["reasons"].append(f"Landmark processing error: {str(e)}")
            else:
                feedback["bad_posture"] = None
                feedback["reasons"].append("No person detected")

            draw_feedback_overlay(output_frame, feedback)
            out.write(output_frame)
            frame_results.append(feedback)

    cap.release()
    out.release()

    if frame_number == 0:
        return { "error": "No frames could be read from video." }

    # Re-encode using FFmpeg for browser compatibility
    try:
        subprocess.run([
            "ffmpeg", "-y",
            "-i", raw_output,
            "-vcodec", "libx264", "-acodec", "aac",
            final_output
        ], check=True)
        os.remove(raw_output)
    except subprocess.CalledProcessError as e:
        return { "error": f"FFmpeg re-encoding failed: {str(e)}" }

    return {
        "summary": {
            "total_frames": frame_number,
            "bad_posture_frames": bad_frames,
            "good_posture_percentage": round(((frame_number - bad_frames) / frame_number) * 100, 2)
        },
        "frames": frame_results,
        "processed_video_path": final_output
    }


# ---------------- Entry Point ----------------

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({ "error": "Missing video path" }))
        sys.exit(1)

    video_path = sys.argv[1]
    try:
        start = time.time()
        result = analyze(video_path)
        print(json.dumps(result))
        print(f"Processed in {round(time.time() - start, 2)}s", file=sys.stderr)
    except Exception as e:
        print(json.dumps({ "error": str(e) }))
        sys.exit(1)
    