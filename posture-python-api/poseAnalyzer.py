# posture-python-api/poseAnalyzer.py

import cv2
import mediapipe as mp
import math
import os
import numpy as np
import tempfile
import requests
import json
import time

def get_angle(a, b, c):
    angle = math.degrees(math.atan2(c.y - b.y, c.x - b.x) -
                         math.atan2(a.y - b.y, a.x - b.x))
    return abs(angle)

def is_knee_forward_of_ankle(knee, ankle, threshold=0.05):
    return (knee.x - ankle.x) > threshold

def get_neck_angle(shoulder, ear):
    dx = ear.x - shoulder.x
    dy = ear.y - shoulder.y
    return abs(math.degrees(math.atan2(dy, dx)))

def landmark_to_dict(landmark):
    return {"x": landmark.x, "y": landmark.y}

def analyze_video_url(url):
    # Download video to temporary file
    r = requests.get(url, stream=True)
    if r.status_code != 200:
        raise Exception("Could not download video")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
        for chunk in r.iter_content(chunk_size=8192):
            tmp.write(chunk)
        temp_path = tmp.name

    # Begin analysis
    mp_pose = mp.solutions.pose
    cap = cv2.VideoCapture(temp_path)
    if not cap.isOpened():
        raise Exception("Failed to open video")

    frame_number = 0
    bad_frames = 0
    results_list = []

    with mp_pose.Pose() as pose:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frame_number += 1
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(rgb)

            feedback = {
                "frame": frame_number,
                "bad_posture": None,
                "reasons": []
            }

            if results.pose_landmarks:
                lm = results.pose_landmarks.landmark
                try:
                    back_angle = (get_angle(lm[mp_pose.PoseLandmark.LEFT_SHOULDER],
                                            lm[mp_pose.PoseLandmark.LEFT_HIP],
                                            lm[mp_pose.PoseLandmark.LEFT_KNEE]) +
                                  get_angle(lm[mp_pose.PoseLandmark.RIGHT_SHOULDER],
                                            lm[mp_pose.PoseLandmark.RIGHT_HIP],
                                            lm[mp_pose.PoseLandmark.RIGHT_KNEE])) / 2

                    neck_angle = (get_neck_angle(lm[mp_pose.PoseLandmark.LEFT_SHOULDER],
                                                 lm[mp_pose.PoseLandmark.LEFT_EAR]) +
                                  get_neck_angle(lm[mp_pose.PoseLandmark.RIGHT_SHOULDER],
                                                 lm[mp_pose.PoseLandmark.RIGHT_EAR])) / 2

                    if back_angle < 150:
                        feedback["bad_posture"] = True
                        feedback["reasons"].append(f"Severe back bend ({int(back_angle)}°)")
                    elif back_angle < 160:
                        feedback["bad_posture"] = True
                        feedback["reasons"].append(f"Back not straight enough ({int(back_angle)}°)")

                    if is_knee_forward_of_ankle(lm[mp_pose.PoseLandmark.LEFT_KNEE],
                                                lm[mp_pose.PoseLandmark.LEFT_ANKLE]) or \
                       is_knee_forward_of_ankle(lm[mp_pose.PoseLandmark.RIGHT_KNEE],
                                                lm[mp_pose.PoseLandmark.RIGHT_ANKLE]):
                        feedback["bad_posture"] = True
                        feedback["reasons"].append("Knee exceeds ankle position")

                    if neck_angle > 30:
                        feedback["bad_posture"] = True
                        feedback["reasons"].append(f"Neck angle too steep ({int(neck_angle)}°)")

                    if feedback["bad_posture"]:
                        bad_frames += 1
                    else:
                        feedback["bad_posture"] = False
                except Exception as e:
                    feedback["bad_posture"] = None
                    feedback["reasons"].append(str(e))
            else:
                feedback["reasons"].append("No person detected")

            results_list.append(feedback)

    cap.release()
    os.remove(temp_path)

    return {
        "summary": {
            "total_frames": frame_number,
            "bad_posture_frames": bad_frames,
            "good_posture_percentage": round(((frame_number - bad_frames) / frame_number) * 100, 2)
        },
        "frames": results_list
    }
