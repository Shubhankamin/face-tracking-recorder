"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "@vladmandic/face-api";

export default function FaceDetection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedVideo, setSavedVideo] = useState<string | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68TinyNet.loadFromUri("/models");
    };

    const startCamera = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();

      const canvas = canvasRef.current!;
      faceapi.matchDimensions(canvas, {
        width: video.videoWidth,
        height: video.videoHeight,
      });

      const detect = async () => {
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks(true);

        const resized = faceapi.resizeResults(detections, {
          width: video.videoWidth,
          height: video.videoHeight,
        });

        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resized);
        faceapi.draw.drawFaceLandmarks(canvas, resized);

        requestAnimationFrame(detect);
      };

      detect();
      setLoading(false);
    };

    loadModels().then(startCamera);
  }, []);

  const startRecording = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    if (!stream) return;

    recordedChunksRef.current = [];

    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, {
        type: "video/webm",
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        localStorage.setItem("recordedVideo", base64String);
        setToast("Video saved to local storage!");
        setTimeout(() => setToast(null), 3000);
      };
      reader.readAsDataURL(blob);
    };

    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleViewSavedVideo = () => {
    const video = localStorage.getItem("recordedVideo");
    if (video) {
      setSavedVideo(video);
      setIsModalOpen(true);
    } else {
      setToast("No saved video found.");
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 flex flex-col items-center justify-center px-4 py-8 space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center">
        Face Detection & Video Recorder
      </h1>

      <div className="relative w-full max-w-[90vw] sm:max-w-[540px] aspect-video rounded-xl overflow-hidden shadow-xl border border-gray-300 bg-white">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white bg-opacity-80 text-gray-600 text-lg">
            Loading face models...
          </div>
        )}
        <video
          ref={videoRef}
          className={`absolute inset-0 object-cover w-full h-full z-0 rounded-xl border-4 ${
            isRecording ? "border-red-500 animate-pulse" : "border-blue-500"
          }`}
          muted
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="absolute inset-0 w-full h-full z-10 pointer-events-none"
        />
        {isRecording && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs sm:text-sm font-semibold px-3 py-1 rounded shadow-md z-30">
            Recording...
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button
          onClick={startRecording}
          disabled={isRecording}
          className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md shadow hover:bg-green-700 disabled:opacity-50"
        >
          Start Recording
        </button>
        <button
          onClick={stopRecording}
          disabled={!isRecording}
          className="px-6 py-2 bg-red-600 text-white font-semibold rounded-md shadow hover:bg-red-700 disabled:opacity-50"
        >
          Stop Recording
        </button>
      </div>

      <button
        onClick={handleViewSavedVideo}
        className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md shadow hover:bg-blue-700"
      >
        View Saved Video
      </button>

      {toast && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded shadow-lg transition-opacity duration-300 z-50">
          {toast}
        </div>
      )}

      {isModalOpen && savedVideo && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg overflow-hidden shadow-2xl max-w-xl w-full relative">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Saved Video</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <video controls src={savedVideo} className="w-full rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
