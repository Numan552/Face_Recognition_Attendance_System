// src/pages/FaceRegistrationPage.jsx
// Core face registration using face-api.js and webcam
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import Layout from '../components/common/Layout';
import { studentsAPI, faceAPI } from '../services/api';
import toast from 'react-hot-toast';

// face-api.js loaded via CDN in index.html; access via window.faceapi
const MODELS_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

export default function FaceRegistrationPage() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [captureStatus, setCaptureStatus] = useState('');
  const [descriptor, setDescriptor] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const webcamRef = useRef(null);
  const intervalRef = useRef(null);

  // Load students
  useEffect(() => {
    studentsAPI.getAll({ limit: 200 }).then(r => setStudents(r.data.data)).catch(() => {});
  }, []);

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      if (!window.faceapi) {
        setCaptureStatus('❌ face-api.js not loaded. Add CDN script to index.html');
        return;
      }
      try {
        setCaptureStatus('⏳ Loading AI models...');
        await Promise.all([
          window.faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_URL),
          window.faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
          window.faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
        ]);
        setModelsLoaded(true);
        setCaptureStatus('✅ AI Models loaded. Select a student and start capture.');
      } catch (err) {
        setCaptureStatus('❌ Failed to load models. Check internet connection.');
      }
    };
    loadModels();
  }, []);

  const captureDescriptor = useCallback(async () => {
    if (!webcamRef.current || !window.faceapi || !modelsLoaded) return;
    const video = webcamRef.current.video;
    if (!video || video.readyState !== 4) return;

    try {
      const detection = await window.faceapi
        .detectSingleFace(video, new window.faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setCaptureStatus('👀 No face detected. Position face in frame...');
        return;
      }

      // Got descriptor
      setDescriptor(Array.from(detection.descriptor));
      setPreview(webcamRef.current.getScreenshot());
      setCapturing(false);
      clearInterval(intervalRef.current);
      setCaptureStatus('✅ Face captured successfully! Click "Save" to register.');
      toast.success('Face captured!');
    } catch (err) {
      setCaptureStatus('⚠️ Detection error. Try again.');
    }
  }, [modelsLoaded]);

  const startCapture = () => {
    if (!selectedStudent) { toast.error('Please select a student first.'); return; }
    if (!modelsLoaded) { toast.error('AI models not loaded yet.'); return; }
    setDescriptor(null);
    setPreview(null);
    setCapturing(true);
    setCaptureStatus('📸 Detecting face...');
    intervalRef.current = setInterval(captureDescriptor, 500);
  };

  const stopCapture = () => {
    setCapturing(false);
    clearInterval(intervalRef.current);
    setCaptureStatus('⏸️ Stopped. Click start to try again.');
  };

  const saveFaceData = async () => {
    if (!descriptor || !selectedStudent) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('student_id', selectedStudent);
      fd.append('face_descriptor', JSON.stringify(descriptor));

      // Convert preview to blob and attach
      if (preview) {
        const blob = await fetch(preview).then(r => r.blob());
        fd.append('face_image', blob, 'face.jpg');
      }

      await faceAPI.register(fd);
      toast.success('Face registered successfully!');
      setDescriptor(null);
      setPreview(null);
      setCaptureStatus('✅ Saved! You can register another student.');
      // Refresh student list to update face_registered flag
      studentsAPI.getAll({ limit: 200 }).then(r => setStudents(r.data.data));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => { return () => clearInterval(intervalRef.current); }, []);

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.roll_number.toLowerCase().includes(search.toLowerCase())
  );

  const selectedStudentData = students.find(s => s.id == selectedStudent);

  return (
    <Layout title="Face Registration">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Student selector */}
        <div className="card">
          <h2 className="text-base font-semibold text-slate-200 mb-4">1️⃣ Select Student</h2>
          <input
            className="input mb-3"
            placeholder="🔍 Search by name or roll..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {filtered.map(s => (
              <button
                key={s.id}
                onClick={() => { setSelectedStudent(s.id); setDescriptor(null); setPreview(null); }}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-all text-sm ${
                  selectedStudent == s.id
                    ? 'bg-blue-600/20 border border-blue-500/40 text-blue-300'
                    : 'hover:bg-slate-700 text-slate-300'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {s.name[0]}
                </div>
                <div className="overflow-hidden">
                  <p className="font-medium truncate">{s.name}</p>
                  <p className="text-xs text-slate-500 font-mono">{s.roll_number}</p>
                </div>
                {s.face_registered ? (
                  <span className="ml-auto badge badge-green text-xs">✓</span>
                ) : (
                  <span className="ml-auto badge badge-red text-xs">✗</span>
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-4">No students found</p>
            )}
          </div>
        </div>

        {/* Webcam capture */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-200">2️⃣ Capture Face</h2>
              {selectedStudentData && (
                <span className="badge badge-blue">{selectedStudentData.name}</span>
              )}
            </div>

            {/* Status bar */}
            <div className={`mb-4 px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 ${
              captureStatus.startsWith('✅') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
              captureStatus.startsWith('❌') ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
              captureStatus.startsWith('⏳') ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
              'bg-slate-900 text-slate-400 border border-slate-700'
            }`}>
              {captureStatus || '💡 Load models and select a student to begin.'}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Live webcam */}
              <div>
                <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">Live Camera</p>
                <div className="webcam-wrapper bg-slate-900 rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
                  <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover"
                    videoConstraints={{ facingMode: 'user', width: 640, height: 480 }}
                  />
                  {capturing && (
                    <div className="absolute inset-0 border-2 border-blue-500/60 rounded-xl pointer-events-none">
                      <div className="scan-line absolute top-0 left-0 right-0" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="border-2 border-blue-400/50 rounded-lg w-40 h-48" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Preview */}
              <div>
                <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">Captured Face</p>
                <div className="bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center" style={{ aspectRatio: '4/3' }}>
                  {preview ? (
                    <img src={preview} alt="Captured face" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-slate-600">
                      <div className="text-4xl mb-2">📷</div>
                      <p className="text-sm">Face preview will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-3 mt-4">
              {!capturing ? (
                <button
                  onClick={startCapture}
                  disabled={!modelsLoaded || !selectedStudent}
                  className="btn-primary flex-1 justify-center"
                >
                  📸 Start Face Capture
                </button>
              ) : (
                <button onClick={stopCapture} className="btn-secondary flex-1 justify-center">
                  ⏸️ Stop
                </button>
              )}
              {descriptor && (
                <button
                  onClick={saveFaceData}
                  disabled={saving}
                  className="btn-success flex-1 justify-center"
                >
                  {saving ? <><span className="spinner w-4 h-4 border-2" />Saving...</> : '💾 Save Face Data'}
                </button>
              )}
            </div>
          </div>

          {/* Descriptor info */}
          {descriptor && (
            <div className="card bg-emerald-500/5 border-emerald-500/20">
              <h3 className="text-sm font-semibold text-emerald-400 mb-2">✅ Face Descriptor Extracted</h3>
              <div className="font-mono text-xs text-slate-400 bg-slate-900 rounded-lg p-3 overflow-x-auto max-h-20">
                [{descriptor.slice(0, 10).map(v => v.toFixed(4)).join(', ')}...] (128 values)
              </div>
              <p className="text-xs text-slate-500 mt-2">
                128-dimensional embedding vector generated by FaceNet deep learning model.
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="card bg-blue-500/5 border-blue-500/20">
            <h3 className="text-sm font-semibold text-blue-400 mb-3">📋 Registration Guidelines</h3>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>• Ensure face is well-lit and clearly visible in the webcam</li>
              <li>• Look directly at the camera and keep a neutral expression</li>
              <li>• Remove glasses or masks for better recognition accuracy</li>
              <li>• Face should be centered within the detection box</li>
              <li>• The system uses a 128-dimensional face embedding (FaceNet)</li>
              <li>• Minimum confidence threshold: 50% for registration</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
