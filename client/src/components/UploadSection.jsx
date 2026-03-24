import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const permissionMessage = 'Could not read this file. Try another or check permissions.';

function getFileKind(file) {
  const type = (file.type || '').toLowerCase();
  const ext = (file.name?.split('.').pop() || '').toLowerCase();
  const imageExt = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif', 'heic', 'heif'];
  const videoExt = ['mp4', 'webm', 'ogg', 'ogv', 'mov', 'm4v', 'mkv'];
  if (type.startsWith('image/') || imageExt.includes(ext)) return 'image';
  if (type.startsWith('video/') || videoExt.includes(ext)) return 'video';
  if (type === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (
    type === 'application/msword' ||
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'doc' ||
    ext === 'docx'
  ) {
    return 'document';
  }
  return null;
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

const ACCEPT =
  'image/*,video/*,.pdf,application/pdf,.doc,application/msword,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export default function UploadSection() {
  const inputRef = useRef(null);
  const blobRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [videoError, setVideoError] = useState(false);

  const revokeBlob = () => {
    const u = blobRef.current;
    if (u) {
      URL.revokeObjectURL(u);
      blobRef.current = null;
    }
  };

  useEffect(() => () => revokeBlob(), []);

  const clearPreview = () => {
    revokeBlob();
    setPreview(null);
    setVideoError(false);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const pick = () => {
    setError('');
    inputRef.current?.click();
  };

  const onChange = (e) => {
    setError('');
    setVideoError(false);
    const file = e.target.files?.[0];
    if (!file) return;
    const kind = getFileKind(file);
    if (!kind) {
      setError('Unsupported type. Use images, videos, PDF, or Word (.doc / .docx).');
      e.target.value = '';
      return;
    }
    try {
      revokeBlob();
      const url = URL.createObjectURL(file);
      blobRef.current = url;
      setPreview({ kind, src: url, name: file.name, size: file.size });
    } catch {
      setError(permissionMessage);
      e.target.value = '';
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mb-4 rounded-3xl border border-white/30 bg-white/40 p-4 shadow-glass backdrop-blur-2xl"
    >
      <div className="flex items-center gap-2">
        <span className="text-xl" aria-hidden>
          📎
        </span>
        <h3 className="text-sm font-semibold text-text-dark">Files &amp; media</h3>
      </div>
      <p className="mt-1 text-xs text-text-dark/60">
        Images, videos, PDF, and Word documents. Word files download for opening elsewhere.
      </p>
      <div className="mt-3 flex flex-col gap-3">
        <button
          type="button"
          onClick={pick}
          className="min-h-[44px] rounded-2xl bg-primary-end px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
        >
          Upload from gallery
        </button>
        <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={onChange} />
        {error ? (
          <p className="rounded-xl border border-red-200/90 bg-red-50/95 px-3 py-2 text-xs font-medium text-red-900/90">
            {error}
          </p>
        ) : null}
        {preview ? (
          <div className="rounded-2xl border border-white/20 bg-white/70 p-2">
            {preview.kind === 'image' ? (
              <img src={preview.src} alt={preview.name} className="max-h-64 w-full rounded-xl object-contain" />
            ) : null}
            {preview.kind === 'video' ? (
              <div className="space-y-2">
                {!videoError ? (
                  <video
                    src={preview.src}
                    controls
                    playsInline
                    className="max-h-64 w-full rounded-xl bg-black object-contain"
                    onError={() => setVideoError(true)}
                  />
                ) : (
                  <p className="rounded-xl px-3 py-2 text-center text-xs text-text-dark/60">
                    Can’t play inline.{' '}
                    <a href={preview.src} download={preview.name} className="font-semibold text-sky-600 hover:underline">
                      Download
                    </a>
                  </p>
                )}
              </div>
            ) : null}
            {preview.kind === 'pdf' ? (
              <div className="space-y-2">
                <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
                  <iframe title={`PDF: ${preview.name}`} src={preview.src} className="h-72 w-full border-0" />
                </div>
                <a
                  href={preview.src}
                  download={preview.name}
                  className="block text-center text-xs font-semibold text-sky-600 hover:underline"
                >
                  Download PDF
                </a>
              </div>
            ) : null}
            {preview.kind === 'document' ? (
              <div className="flex flex-col items-center gap-3 rounded-xl bg-slate-50/90 px-4 py-6 text-center">
                <span className="text-4xl" aria-hidden>
                  📄
                </span>
                <p className="max-w-full truncate text-sm font-semibold text-text-dark">{preview.name}</p>
                <p className="text-xs text-text-dark/55">{formatBytes(preview.size)} · Word document</p>
                <a
                  href={preview.src}
                  download={preview.name}
                  className="min-h-[44px] w-full max-w-xs rounded-xl bg-primary-end px-4 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Download file
                </a>
              </div>
            ) : null}
            <button
              type="button"
              onClick={clearPreview}
              className="mt-2 w-full rounded-xl border border-white/50 bg-white/70 px-3 py-2.5 text-sm font-semibold text-text-dark hover:bg-white"
            >
              Clear
            </button>
          </div>
        ) : null}
      </div>
    </motion.section>
  );
}
