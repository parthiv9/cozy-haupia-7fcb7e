import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const PDF_KEY = 'skycast_user_pdf_v1';
const FOLDER_META_KEY = 'skycast_user_folder_meta_v1';
const FOLDER_PREVIEW_KEY = 'skycast_user_folder_preview_v1';
const MAX_PDF_BYTES = 2.5 * 1024 * 1024; // keep localStorage footprint reasonable
const MAX_IMAGE_BYTES = 3.5 * 1024 * 1024; // preview only

function permissionMessage() {
  return 'Permission required to use this feature';
}

function readPdfFromLocalStorage() {
  try {
    const raw = localStorage.getItem(PDF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.dataUrl === 'string') return parsed;
    return null;
  } catch {
    return null;
  }
}

function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readFolderMetaFromLocalStorage() {
  const parsed = readJson(FOLDER_META_KEY);
  if (!parsed || typeof parsed !== 'object') return null;
  if (!Array.isArray(parsed.files)) return null;
  return parsed;
}

function readFolderPreviewFromLocalStorage() {
  const parsed = readJson(FOLDER_PREVIEW_KEY);
  if (!parsed || typeof parsed !== 'object') return null;
  if (typeof parsed.dataUrl !== 'string') return null;
  return parsed;
}

export default function StorageSection() {
  const [error, setError] = useState('');

  const [pdf, setPdf] = useState(() => readPdfFromLocalStorage());
  const pdfInputRef = useRef(null);

  const [folderMeta, setFolderMeta] = useState(() => readFolderMetaFromLocalStorage());
  const [folderPreview, setFolderPreview] = useState(() => readFolderPreviewFromLocalStorage());
  const folderInputRef = useRef(null);

  const removePdf = () => {
    setPdf(null);
    try {
      localStorage.removeItem(PDF_KEY);
    } catch {
      /* ignore */
    }
  };

  const clearFolder = () => {
    setFolderMeta(null);
    setFolderPreview(null);
    try {
      localStorage.removeItem(FOLDER_META_KEY);
      localStorage.removeItem(FOLDER_PREVIEW_KEY);
    } catch {
      /* ignore */
    }
  };

  const openPdfPicker = () => {
    setError('');
    pdfInputRef.current?.click();
  };

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('read failed'));
      reader.readAsDataURL(file);
    });

  const onPdfChange = async (e) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setError(permissionMessage());
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setError('Unable to store PDF (file may be too large).');
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const next = {
        id: `${Date.now()}`,
        name: file.name || 'Uploaded PDF',
        size: file.size,
        uploadedAt: Date.now(),
        dataUrl: String(dataUrl),
      };
      setPdf(next);
      try {
        localStorage.setItem(PDF_KEY, JSON.stringify(next));
      } catch {
        setError('Unable to store PDF (storage quota exceeded).');
      }
    } catch {
      setError(permissionMessage());
    } finally {
      // allow selecting the same file again
      e.target.value = '';
    }
  };

  const openFolderPicker = () => {
    setError('');
    // Folder selection is browser-specific; if unsupported, fail gracefully.
    if (!folderInputRef.current) {
      setError(permissionMessage());
      return;
    }
    folderInputRef.current.click();
  };

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === PDF_KEY) setPdf(readPdfFromLocalStorage());
      if (e.key === FOLDER_META_KEY) setFolderMeta(readFolderMetaFromLocalStorage());
      if (e.key === FOLDER_PREVIEW_KEY) setFolderPreview(readFolderPreviewFromLocalStorage());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const onFolderChange = async (e) => {
    setError('');
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const folderName =
      files[0]?.webkitRelativePath?.split?.('/')?.[0] || files[0]?.name?.split?.('.')[0] || 'Folder';

    // Cap metadata list to keep UI responsive.
    const metaFiles = files.slice(0, 120).map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type,
    }));

    const isPdf = (f) => f.type === 'application/pdf' || f.name?.toLowerCase().endsWith('.pdf');
    const isImage = (f) =>
      (f.type || '').startsWith('image/') ||
      /\.(png|jpe?g|gif|webp|bmp)$/i.test(f.name || '');

    const firstPdf = files.find(isPdf) || null;
    const firstImage = files.find(isImage) || null;

    let preview = null;
    try {
      if (firstPdf) {
        if (firstPdf.size > MAX_PDF_BYTES) {
          setError('Folder selected, but the preview PDF is too large to store.');
        } else {
          const dataUrl = await readFileAsDataUrl(firstPdf);
          preview = {
            kind: 'pdf',
            dataUrl: String(dataUrl),
            name: firstPdf.name,
            size: firstPdf.size,
            uploadedAt: Date.now(),
          };
        }
      } else if (firstImage) {
        if (firstImage.size > MAX_IMAGE_BYTES) {
          setError('Folder selected, but the preview image is too large to store.');
        } else {
          const dataUrl = await readFileAsDataUrl(firstImage);
          preview = {
            kind: 'image',
            dataUrl: String(dataUrl),
            name: firstImage.name,
            size: firstImage.size,
            uploadedAt: Date.now(),
          };
        }
      } else {
        // No preview files found, but we still keep metadata.
      }
    } catch {
      setError(permissionMessage());
    } finally {
      e.target.value = '';
    }

    const nextMeta = {
      folderName,
      total: files.length,
      files: metaFiles,
      updatedAt: Date.now(),
    };

    setFolderMeta(nextMeta);
    try {
      localStorage.setItem(FOLDER_META_KEY, JSON.stringify(nextMeta));
    } catch {
      /* ignore */
    }

    setFolderPreview(preview);
    try {
      if (preview) {
        localStorage.setItem(FOLDER_PREVIEW_KEY, JSON.stringify(preview));
      } else {
        localStorage.removeItem(FOLDER_PREVIEW_KEY);
      }
    } catch {
      /* ignore */
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
          📁
        </span>
        <h3 className="text-sm font-semibold text-text-dark">Storage</h3>
      </div>

      <div className="mt-3 flex flex-col gap-3">
        <input ref={pdfInputRef} type="file" accept="application/pdf" className="hidden" onChange={onPdfChange} />
        <button
          type="button"
          onClick={openPdfPicker}
          className="rounded-2xl border border-white/40 bg-white/70 px-4 py-2 text-sm font-semibold text-text-dark shadow-inner transition hover:bg-white/90"
        >
          Attach / Upload PDF
        </button>

        <input
          ref={folderInputRef}
          type="file"
          className="hidden"
          multiple
          webkitdirectory="true"
          accept="application/pdf,image/*"
          onChange={onFolderChange}
        />
        <button
          type="button"
          onClick={openFolderPicker}
          className="rounded-2xl border border-white/40 bg-white/70 px-4 py-2 text-sm font-semibold text-text-dark shadow-inner transition hover:bg-white/90"
        >
          Attach / Upload Folder
        </button>

        {error ? (
          <p className="rounded-xl border border-red-200/90 bg-red-50/95 px-3 py-2 text-xs font-medium text-red-900/90">
            {error}
          </p>
        ) : null}

        {pdf ? (
          <div className="rounded-2xl border border-white/20 bg-white/70 p-2">
            <p className="truncate px-2 text-sm font-semibold text-text-dark">{pdf.name}</p>
            <p className="px-2 text-[11px] text-text-dark/55">
              {(pdf.size / 1024 / 1024).toFixed(2)} MB · {new Date(pdf.uploadedAt).toLocaleString()}
            </p>
            <div className="mt-2 flex gap-2">
              <a
                href={pdf.dataUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-xl border border-white/40 bg-white/85 px-3 py-2 text-center text-sm font-semibold text-text-dark hover:bg-white"
              >
                Open
              </a>
              <button
                type="button"
                onClick={removePdf}
                className="rounded-xl border border-white/40 bg-white/85 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-white"
              >
                Remove
              </button>
            </div>
            <div className="mt-3 overflow-hidden rounded-xl border border-white/20 bg-white">
              <iframe title="PDF preview" src={pdf.dataUrl} className="h-48 w-full" />
            </div>
          </div>
        ) : null}

        {folderMeta ? (
          <div className="rounded-2xl border border-white/20 bg-white/70 p-2">
            <p className="truncate px-2 text-sm font-semibold text-text-dark">{folderMeta.folderName}</p>
            <p className="px-2 text-[11px] text-text-dark/55">
              {folderMeta.total} file(s) · folder selected
            </p>
            {Array.isArray(folderMeta.files) && folderMeta.files.length > 0 ? (
              <ul className="mt-2 max-h-24 overflow-auto px-2 text-[11px] text-text-dark/60">
                {folderMeta.files.slice(0, 12).map((f, i) => (
                  <li key={`${f.name}-${i}`} className="truncate">
                    {f.name}
                  </li>
                ))}
              </ul>
            ) : null}

            {folderPreview ? (
              <div className="mt-3 overflow-hidden rounded-xl border border-white/20 bg-white">
                {folderPreview.kind === 'pdf' ? (
                  <iframe title="Folder PDF preview" src={folderPreview.dataUrl} className="h-48 w-full" />
                ) : (
                  <img
                    src={folderPreview.dataUrl}
                    alt="Folder preview"
                    className="h-48 w-full object-cover"
                  />
                )}
              </div>
            ) : (
              <p className="mt-3 px-2 text-[11px] text-text-dark/55">
                No preview available (no small PDF/image found).
              </p>
            )}

            <div className="mt-2 flex gap-2 px-2">
              {folderPreview ? (
                <a
                  href={folderPreview.dataUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-xl border border-white/40 bg-white/85 px-3 py-2 text-center text-sm font-semibold text-text-dark hover:bg-white"
                >
                  Open
                </a>
              ) : (
                <button
                  type="button"
                  onClick={openFolderPicker}
                  className="flex-1 rounded-xl border border-white/40 bg-white/85 px-3 py-2 text-center text-sm font-semibold text-text-dark hover:bg-white"
                >
                  Pick again
                </button>
              )}
              <button
                type="button"
                onClick={clearFolder}
                className="rounded-xl border border-white/40 bg-white/85 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-white"
              >
                Clear
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </motion.section>
  );
}

