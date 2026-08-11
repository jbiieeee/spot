import React, { useRef, useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { useSpot } from '../context/SpotContext';
import { updateItem } from '../lib/dataSource';
import { hasFirebaseConfig } from '../lib/firebase';
import {
  Camera, ShieldCheck, X, ScanFace, AlertTriangle, CheckCircle2,
  RefreshCw, UserCheck
} from 'lucide-react';

// ─── Simple pixel-based brightness comparison for face detection hint ─────────
function getBrightnessFraction(ctx, w, h) {
  const data = ctx.getImageData(0, 0, w, h).data;
  let total = 0;
  for (let i = 0; i < data.length; i += 4) {
    total += (data[i] + data[i + 1] + data[i + 2]) / 3;
  }
  return total / (w * h * 255);
}

// ─── Capture a base64 JPEG from the video element ────────────────────────────
function captureFrame(videoEl, size = 320) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  // Center-crop
  const vw = videoEl.videoWidth;
  const vh = videoEl.videoHeight;
  const dim = Math.min(vw, vh);
  const sx = (vw - dim) / 2;
  const sy = (vh - dim) / 2;
  ctx.drawImage(videoEl, sx, sy, dim, dim, 0, 0, size, size);
  const brightness = getBrightnessFraction(ctx, size, size);
  return { dataUrl: canvas.toDataURL('image/jpeg', 0.85), brightness };
}

// ─── Guard selector pill ──────────────────────────────────────────────────────
function GuardPill({ guard, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition ${
        selected
          ? 'border-blue-500 bg-blue-500/20 text-blue-300'
          : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-500'
      }`}
    >
      <img
        src={guard.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'}
        alt={guard.name}
        className="h-6 w-6 rounded-full object-cover border border-slate-600"
      />
      <span className="font-semibold">{guard.name}</span>
      {guard.faceVerified && (
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
      )}
    </button>
  );
}

export default function FaceVerify() {
  const { guards, addToast, updateGuard } = useSpot();

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  const [selectedGuard, setSelectedGuard] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [livePreview, setLivePreview] = useState(null); // base64
  const [status, setStatus] = useState('idle'); // idle | capturing | verifying | success | failed
  const [brightness, setBrightness] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const guardList = guards.filter(
    g => g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─── Start camera ───────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      setCameraError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setStatus('capturing');

      // Live preview frames
      intervalRef.current = setInterval(() => {
        if (!videoRef.current || !videoRef.current.videoWidth) return;
        const { dataUrl, brightness: b } = captureFrame(videoRef.current, 240);
        setLivePreview(dataUrl);
        setBrightness(b);
      }, 200);
    } catch (e) {
      setCameraError(`Camera access denied: ${e.message}`);
    }
  }, []);

  // ─── Stop camera ────────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
    setStatus('idle');
    setLivePreview(null);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // ─── Capture face photo ─────────────────────────────────────────────────────
  const handleCapture = () => {
    if (!videoRef.current) return;
    const { dataUrl, brightness: b } = captureFrame(videoRef.current, 320);

    if (b < 0.05) {
      addToast('Low Light', 'Face not clearly visible. Please improve lighting.', 'danger');
      return;
    }

    setCapturedImage(dataUrl);
    setStatus('verifying');
  };

  // ─── Verify (save photo + mark faceVerified = true) ─────────────────────────
  const handleVerify = async () => {
    if (!selectedGuard || !capturedImage) return;
    setStatus('verifying');

    try {
      const patch = {
        faceVerified: true,
        faceVerifiedAt: new Date().toLocaleString(),
        facePhoto: capturedImage, // store as data URL (use Storage in production)
      };

      // Update in Firestore
      if (hasFirebaseConfig) {
        await updateItem('users', selectedGuard.id, patch);
      }

      // Update in local context
      await updateGuard(selectedGuard.id, patch);

      setStatus('success');
      addToast('Face Verified ✓', `${selectedGuard.name}'s identity has been confirmed.`, 'success');

      // Auto reset
      setTimeout(() => {
        setCapturedImage(null);
        setStatus('capturing');
      }, 3000);
    } catch (e) {
      setStatus('failed');
      addToast('Verification Failed', e.message || 'Could not save face data.', 'danger');
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setStatus('capturing');
  };

  const handleReset = () => {
    stopCamera();
    setSelectedGuard(null);
    setCapturedImage(null);
  };

  const statusColor = {
    idle: 'text-slate-400',
    capturing: 'text-blue-400',
    verifying: 'text-amber-400',
    success: 'text-emerald-400',
    failed: 'text-rose-400',
  };

  const statusLabel = {
    idle: 'Select a guard and start camera',
    capturing: 'Position face in frame, then capture',
    verifying: 'Review the captured photo',
    success: 'Face verification complete!',
    failed: 'Verification failed — please retry',
  };

  return (
    <Layout
      title="Face Verification Center"
      subtitle="Capture and verify guard identity before shift — links face photo to guard record"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Guard Selector ─────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="card-spot p-5 space-y-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-400" />
              <span className="text-sm font-bold text-white">Select Guard</span>
            </div>

            <input
              className="input-spot text-xs"
              placeholder="Search guard..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />

            <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
              {guardList.length === 0 && (
                <div className="text-xs text-slate-500 text-center py-6">No guards found</div>
              )}
              {guardList.map(guard => (
                <GuardPill
                  key={guard.id}
                  guard={guard}
                  selected={selectedGuard?.id === guard.id}
                  onClick={() => {
                    setSelectedGuard(guard);
                    handleReset();
                  }}
                />
              ))}
            </div>
          </div>

          {/* Selected guard detail */}
          {selectedGuard && (
            <div className="card-spot p-5 space-y-3">
              <img
                src={selectedGuard.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'}
                alt={selectedGuard.name}
                className="h-20 w-20 rounded-2xl object-cover border-2 border-blue-500/40 mx-auto block"
              />
              <div className="text-center">
                <div className="text-sm font-bold text-white">{selectedGuard.name}</div>
                <div className="text-xs text-slate-400">{selectedGuard.siteName}</div>
              </div>
              <div className={`flex items-center justify-center gap-1.5 text-xs font-bold ${selectedGuard.faceVerified ? 'text-emerald-400' : 'text-amber-400'}`}>
                {selectedGuard.faceVerified
                  ? <><ShieldCheck className="h-3.5 w-3.5" /> Verified — {selectedGuard.faceVerifiedAt}</>
                  : <><AlertTriangle className="h-3.5 w-3.5" /> Not Yet Verified</>}
              </div>
            </div>
          )}
        </div>

        {/* ── Center: Camera / Capture View ───────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card-spot p-6 space-y-4">

            {/* Status bar */}
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2 text-sm font-semibold ${statusColor[status]}`}>
                <ScanFace className="h-5 w-5" />
                {statusLabel[status]}
              </div>
              {cameraActive && (
                <button onClick={stopCamera} className="btn-secondary text-xs flex items-center gap-1.5">
                  <X className="h-3.5 w-3.5" /> Stop Camera
                </button>
              )}
            </div>

            {/* Camera / preview area */}
            <div className="relative w-full aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-950">

              {/* Live video (hidden but captures stream) */}
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ display: cameraActive && !capturedImage ? 'block' : 'none' }}
                muted
                playsInline
              />

              {/* Captured still */}
              {capturedImage && (
                <img
                  src={capturedImage}
                  alt="Captured face"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}

              {/* Idle / no camera */}
              {!cameraActive && !capturedImage && (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-500">
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                    <Camera className="h-10 w-10" />
                  </div>
                  <div className="text-sm font-medium">Camera not started</div>
                </div>
              )}

              {/* Face guide overlay */}
              {cameraActive && !capturedImage && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="h-48 w-40 rounded-full border-4 border-blue-400/60 shadow-[0_0_40px_rgba(59,130,246,0.25)]" />
                </div>
              )}

              {/* Success overlay */}
              {status === 'success' && (
                <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center">
                  <CheckCircle2 className="h-20 w-20 text-emerald-400 drop-shadow-lg" />
                </div>
              )}
            </div>

            {/* Brightness indicator */}
            {cameraActive && !capturedImage && (
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>Lighting:</span>
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${brightness > 0.3 ? 'bg-emerald-500' : brightness > 0.15 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${Math.min(brightness * 200, 100)}%` }}
                  />
                </div>
                <span className={brightness > 0.3 ? 'text-emerald-400' : brightness > 0.15 ? 'text-amber-400' : 'text-rose-400'}>
                  {brightness > 0.3 ? 'Good' : brightness > 0.15 ? 'Low' : 'Too Dark'}
                </span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 justify-center flex-wrap">
              {!cameraActive && !capturedImage && (
                <button
                  onClick={startCamera}
                  disabled={!selectedGuard}
                  className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Camera className="h-4 w-4" />
                  {selectedGuard ? 'Start Camera' : 'Select a Guard First'}
                </button>
              )}

              {cameraActive && !capturedImage && (
                <button
                  onClick={handleCapture}
                  className="btn-primary flex items-center gap-2 text-sm px-6 py-2.5"
                >
                  <ScanFace className="h-4 w-4" /> Capture Face
                </button>
              )}

              {capturedImage && status !== 'success' && (
                <>
                  <button
                    onClick={handleRetake}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" /> Retake
                  </button>
                  <button
                    onClick={handleVerify}
                    className="btn-primary flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500"
                  >
                    <ShieldCheck className="h-4 w-4" /> Confirm & Verify
                  </button>
                </>
              )}

              {status === 'success' && (
                <button onClick={handleReset} className="btn-secondary flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" /> Verify Another Guard
                </button>
              )}
            </div>

            {cameraError && (
              <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                <AlertTriangle className="h-4 w-4 shrink-0" /> {cameraError}
              </div>
            )}
          </div>

          {/* Verified guards grid */}
          <div className="card-spot p-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Recently Verified Guards
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {guards.filter(g => g.faceVerified).length === 0 && (
                <div className="col-span-3 text-xs text-slate-500 text-center py-4">No guards verified yet</div>
              )}
              {guards.filter(g => g.faceVerified).map(g => (
                <div key={g.id} className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <img
                    src={g.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'}
                    alt={g.name}
                    className="h-8 w-8 rounded-full object-cover border border-emerald-500/40"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">{g.name}</div>
                    <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="h-2.5 w-2.5" /> Verified
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
