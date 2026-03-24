import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

function permissionError() {
  return 'Permission required to use this feature';
}

export default function CameraSection({ isNight = false }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  const [status, setStatus] = useState('idle'); // idle | requesting | ready | denied
  const [error, setError] = useState('');
  const [captured, setCaptured] = useState(null);

  const stopStream = () => {
    const s = streamRef.current;
    if (!s) return;
    try {
      s.getTracks().forEach((t) => t.stop());
    } catch {
      /* ignore */
    }
    streamRef.current = null;
  };

  useEffect(() => {
    return () => stopStream();
  }, []);

  const startCamera = async () => {
    setError('');
    setCaptured(null);
    setStatus('requesting');

    if (!navigator?.mediaDevices?.getUserMedia) {
      setStatus('denied');
      setError(permissionError());
      return;
    }

    try {
      stopStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => {});
      }

      setStatus('ready');
    } catch (err) {
      stopStream();
      setStatus('denied');
      setError(permissionError());
    }
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvasRef.current = canvas;
    if (!video || !canvas) return;

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCaptured(dataUrl);
    stopStream();
    setStatus('idle');
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`mb-4 rounded-3xl border p-4 shadow-lg backdrop-blur-2xl ${
        isNight ? 'border-white/15 bg-white/[0.06]' : 'border-white/30 bg-white/40'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden>
            📷
          </span>
          <h3 className={`text-sm font-semibold ${isNight ? 'text-slate-100' : 'text-slate-900'}`}>Camera</h3>
        </div>
        <span className={`text-[10px] ${isNight ? 'text-slate-400' : 'text-slate-900/50'}`}>
          {status === 'requesting' ? 'Requesting…' : null}
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-3">
        <button
          type="button"
          onClick={startCamera}
          disabled={status === 'requesting'}
          className="rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
        >
          Capture Weather Photo
        </button>

        {error ? (
          <p className="rounded-xl border border-red-200/90 bg-red-50/95 px-3 py-2 text-xs font-medium text-red-900/90">
            {error}
          </p>
        ) : null}

        {status === 'ready' && !captured ? (
          <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-black/5">
            <video ref={videoRef} className="h-52 w-full object-cover" playsInline muted />
            <div className="absolute bottom-3 left-3 right-3 flex gap-2">
              <button
                type="button"
                onClick={captureFrame}
                className="min-h-[44px] flex-1 rounded-xl bg-white/85 px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm"
              >
                Capture
              </button>
              <button
                type="button"
                onClick={() => {
                  stopStream();
                  setStatus('idle');
                }}
                className="min-h-[44px] rounded-xl border border-white/40 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-900 shadow-inner"
              >
                Stop
              </button>
            </div>
          </div>
        ) : null}

        {captured ? (
          <div className="rounded-2xl border border-white/20 bg-white/70 p-2">
            <img src={captured} alt="Captured weather" className="h-52 w-full rounded-xl object-cover" />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setCaptured(null)}
                className="flex-1 rounded-xl border border-white/50 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-white"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={startCamera}
                className="flex-1 rounded-xl border border-white/50 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-white"
              >
                Retake
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </motion.section>
  );
}

