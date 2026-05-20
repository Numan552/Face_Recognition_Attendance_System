// src/pages/teacher/AttendancePage.jsx
// Real-time face recognition attendance marking
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import Layout from '../../components/common/Layout';
import { subjectsAPI, attendanceAPI, faceAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const CONFIDENCE_THRESHOLD = 0.5; // Euclidean distance threshold
const MODELS_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

export default function AttendancePage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [session, setSession] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [knownFaces, setKnownFaces] = useState([]); // [{student_id, name, roll_number, descriptor}]
  const [recognizing, setRecognizing] = useState(false);
  const [markedStudents, setMarkedStudents] = useState([]); // [{id, name, roll_number, time, confidence}]
  const [status, setStatus] = useState('');
  const [sessionRecords, setSessionRecords] = useState([]);
  const webcamRef = useRef(null);
  const intervalRef = useRef(null);
  const processingRef = useRef(false);

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    subjectsAPI.getAll({ teacher_id: user.id }).then(r => setSubjects(r.data.data)).catch(() => {});
    loadModels();
  }, []);

  const loadModels = async () => {
    if (!window.faceapi) { setStatus('❌ face-api.js CDN not loaded'); return; }
    try {
      setStatus('⏳ Loading AI recognition models...');
      await Promise.all([
        window.faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_URL),
        window.faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
        window.faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
      ]);
      setModelsLoaded(true);
      setStatus('✅ Models loaded. Select a subject to begin.');
    } catch { setStatus('❌ Model loading failed. Check network.'); }
  };

  const loadKnownFaces = async () => {
    try {
      const res = await faceAPI.getAllDescriptors();
      setKnownFaces(res.data.data);
      return res.data.data;
    } catch { return []; }
  };

  const startSession = async () => {
    if (!selectedSubject) { toast.error('Select a subject first.'); return; }
    try {
      const res = await attendanceAPI.startSession({ subject_id: selectedSubject, session_date: today });
      setSession(res.data.data);
      toast.success(`Session started: ${res.data.data.subject_name}`);
      const faces = await loadKnownFaces();
      setStatus(faces.length === 0 ? '⚠️ No face data enrolled. Students must register faces first.' : `✅ ${faces.length} students' faces loaded. Start recognition.`);
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error('Session already active for this subject today.');
      }
    }
  };

  const endSession = async () => {
    if (!session) return;
    if (!window.confirm('End this attendance session?')) return;
    try {
      await attendanceAPI.endSession(session.id);
      setSession(null);
      setRecognizing(false);
      clearInterval(intervalRef.current);
      toast.success('Session ended.');
    } catch {}
  };

  // Euclidean distance between two descriptors
  const getDistance = (d1, d2) => {
    return Math.sqrt(d1.reduce((sum, val, i) => sum + (val - d2[i]) ** 2, 0));
  };

  const recognizeFace = useCallback(async () => {
    if (processingRef.current || !webcamRef.current || !window.faceapi || knownFaces.length === 0) return;
    processingRef.current = true;

    try {
      const video = webcamRef.current.video;
      if (!video || video.readyState !== 4) return;

      const detections = await window.faceapi
        .detectAllFaces(video, new window.faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (!detections.length) {
        setStatus('👀 No faces detected. Ensure students face the camera...');
        return;
      }

      setStatus(`🔍 Detected ${detections.length} face(s). Matching...`);

      for (const detection of detections) {
        const queryDescriptor = Array.from(detection.descriptor);

        // Find best match
        let bestMatch = null;
        let bestDistance = Infinity;
        for (const known of knownFaces) {
          const dist = getDistance(queryDescriptor, known.face_descriptor);
          if (dist < bestDistance) {
            bestDistance = dist;
            bestMatch = known;
          }
        }

        if (bestDistance < CONFIDENCE_THRESHOLD && bestMatch) {
          const confidence = ((1 - bestDistance) * 100).toFixed(1);
          const alreadyMarked = markedStudents.some(m => m.id === bestMatch.student_id);

          if (!alreadyMarked) {
            // Mark attendance via API
            try {
              await attendanceAPI.markAttendance({
                session_id: session.id,
                student_id: bestMatch.student_id,
                status: 'present',
                confidence_score: (1 - bestDistance).toFixed(4),
                recognition_method: 'face',
              });

              const newRecord = {
                id: bestMatch.student_id,
                name: bestMatch.name,
                roll_number: bestMatch.roll_number,
                time: format(new Date(), 'HH:mm:ss'),
                confidence: `${confidence}%`,
              };
              setMarkedStudents(prev => [newRecord, ...prev]);
              toast.success(`✅ ${bestMatch.name} — ${confidence}% confidence`, { duration: 3000 });
              setStatus(`✅ Marked: ${bestMatch.name}`);
            } catch (err) {
              if (err.response?.status === 409) {
                // Already marked - just note it
                if (!markedStudents.some(m => m.id === bestMatch.student_id)) {
                  setMarkedStudents(prev => [{
                    id: bestMatch.student_id, name: bestMatch.name,
                    roll_number: bestMatch.roll_number,
                    time: '—', confidence: `${confidence}%`,
                  }, ...prev]);
                }
              }
            }
          }
        } else {
          setStatus(`❓ Unknown face (distance: ${bestDistance.toFixed(2)}). Not in database.`);
        }
      }
    } finally {
      processingRef.current = false;
    }
  }, [knownFaces, markedStudents, session]);

  const toggleRecognition = () => {
    if (!session) { toast.error('Start a session first.'); return; }
    if (recognizing) {
      clearInterval(intervalRef.current);
      setRecognizing(false);
      setStatus('⏸️ Recognition paused.');
    } else {
      setRecognizing(true);
      setStatus('🔄 Scanning for faces...');
      intervalRef.current = setInterval(recognizeFace, 1000);
    }
  };

  const markManual = async (studentId, studentName) => {
    if (!session) return;
    try {
      await attendanceAPI.markAttendance({
        session_id: session.id, student_id: studentId,
        status: 'present', recognition_method: 'manual',
      });
      setMarkedStudents(prev => [{
        id: studentId, name: studentName, roll_number: '—',
        time: format(new Date(), 'HH:mm:ss'), confidence: 'Manual',
      }, ...prev]);
      toast.success(`${studentName} marked manually.`);
    } catch (err) {
      if (err.response?.status === 409) toast.error('Already marked!');
    }
  };

  useEffect(() => { return () => clearInterval(intervalRef.current); }, []);

  return (
    <Layout title="Take Attendance">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left panel - controls */}
        <div className="space-y-4">
          {/* Session setup */}
          {!session ? (
            <div className="card">
              <h2 className="text-base font-semibold text-slate-200 mb-4">📅 Start Session</h2>
              <div className="space-y-3">
                <div>
                  <label className="label">Select Subject</label>
                  <select className="input" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                    <option value="">Choose subject...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Date</label>
                  <input className="input" type="date" value={today} readOnly />
                </div>
                <button onClick={startSession} disabled={!modelsLoaded} className="btn-primary w-full justify-center">
                  ▶️ Start Attendance Session
                </button>
              </div>
            </div>
          ) : (
            <div className="card bg-emerald-500/5 border-emerald-500/20">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-emerald-400">🟢 Active Session</h2>
                <span className="badge badge-green">Live</span>
              </div>
              <p className="text-sm text-slate-300 font-medium">{session.subject_name}</p>
              <p className="text-xs text-slate-500 mt-1">{session.subject_code} • {today}</p>
              <p className="text-xs text-slate-500">Started: {session.start_time}</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={toggleRecognition}
                  className={recognizing ? 'btn-secondary flex-1 justify-center text-sm' : 'btn-primary flex-1 justify-center text-sm'}
                >
                  {recognizing ? '⏸️ Pause' : '▶️ Start Recognition'}
                </button>
                <button onClick={endSession} className="btn-danger text-sm px-3">End</button>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="card-sm bg-slate-900">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Recognition Status</p>
            <p className="text-sm text-slate-300">{status || 'Idle'}</p>
            {recognizing && (
              <div className="mt-2 flex items-center gap-2 text-xs text-blue-400">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                Actively scanning...
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="card">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">📊 Session Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Marked Present</span>
                <span className="font-bold text-emerald-400">{markedStudents.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Face Enrolled</span>
                <span className="font-mono text-slate-300">{knownFaces.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center - webcam */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-base font-semibold text-slate-200 mb-3">📷 Live Camera</h2>
            <div className="webcam-wrapper rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full h-full object-cover"
                videoConstraints={{ facingMode: 'user', width: 640, height: 480 }}
                mirrored
              />
              {recognizing && (
                <div className="absolute inset-0 border-2 border-blue-500/70 rounded-xl pointer-events-none">
                  <div className="scan-line absolute top-0 left-0 right-0" />
                  <div className="absolute top-2 right-2 badge badge-blue animate-pulse">● SCANNING</div>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="card-sm bg-blue-500/5 border-blue-500/20">
            <p className="text-xs font-semibold text-blue-400 mb-2">💡 How It Works</p>
            <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside">
              <li>Start a session for your subject</li>
              <li>Students stand in front of camera</li>
              <li>AI detects and matches faces automatically</li>
              <li>Attendance marked with confidence score</li>
              <li>End session when done</li>
            </ol>
          </div>
        </div>

        {/* Right - marked students */}
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">✅ Marked Present</h2>
            <span className="badge badge-green">{markedStudents.length}</span>
          </div>
          <div className="divide-y divide-slate-700/50 max-h-96 overflow-y-auto">
            {markedStudents.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                <p className="text-3xl mb-2">👥</p>
                <p>No attendance marked yet</p>
              </div>
            ) : (
              markedStudents.map((m, i) => (
                <div key={`${m.id}-${i}`} className="flex items-center gap-3 px-4 py-3 animate-fade-in">
                  <div className="w-8 h-8 bg-emerald-600/30 rounded-full flex items-center justify-center text-xs font-bold text-emerald-400 flex-shrink-0">
                    {m.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{m.name}</p>
                    <p className="text-xs text-slate-500">{m.roll_number}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-mono text-slate-400">{m.time}</p>
                    <p className="text-xs text-emerald-400">{m.confidence}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
