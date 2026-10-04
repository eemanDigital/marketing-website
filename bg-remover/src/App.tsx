import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { removeBackground, type Config } from "@imgly/background-removal";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Asterisk,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  ImagePlus,
  LoaderCircle,
  LockKeyhole,
  ScanLine,
  Sparkles,
  Trash2,
  Upload,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import "./App.css";

type ModelMode = "detail" | "quick";
type ViewMode = "cutout" | "original";
type QueueImage = { id: number; file: File; result: Blob | null };

const backgrounds = [
  { label: "Transparent", value: "transparent" },
  { label: "Paper", value: "#f4f1e9" },
  { label: "Sky", value: "#c8e4e8" },
  { label: "Citrus", value: "#e7ec8c" },
  { label: "Coral", value: "#f0a18b" },
  { label: "Ink", value: "#24332f" },
];

function App() {
  const fileInput = useRef<HTMLInputElement>(null);
  const nextImageId = useRef(0);
  const [queue, setQueue] = useState<QueueImage[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [modelMode, setModelMode] = useState<ModelMode>("detail");
  const [viewMode, setViewMode] = useState<ViewMode>("original");
  const [background, setBackground] = useState("transparent");
  const [exportScale, setExportScale] = useState(1);
  const [progress, setProgress] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const activeImage = queue.find((image) => image.id === activeId) ?? null;
  const file = activeImage?.file ?? null;

  useEffect(() => {
    if (sourceUrl) return () => URL.revokeObjectURL(sourceUrl);
  }, [sourceUrl]);

  useEffect(() => {
    if (resultUrl) return () => URL.revokeObjectURL(resultUrl);
  }, [resultUrl]);

  function selectQueueImage(image: QueueImage) {
    if (image.id === activeId) return;
    setActiveId(image.id);
    setSourceUrl(URL.createObjectURL(image.file));
    setResultUrl(image.result ? URL.createObjectURL(image.result) : "");
    setDimensions({ width: 0, height: 0 });
    setViewMode(image.result ? "cutout" : "original");
    setProgress(0);
    setError("");
  }

  function addFiles(files: FileList | File[]) {
    const incoming = Array.from(files);
    const images = incoming.filter((item) => item.type.startsWith("image/"));
    const known = new Set(
      queue.map(
        ({ file: item }) => `${item.name}:${item.size}:${item.lastModified}`,
      ),
    );
    const added = images
      .filter((item) => {
        const key = `${item.name}:${item.size}:${item.lastModified}`;
        if (known.has(key)) return false;
        known.add(key);
        return true;
      })
      .map((item) => ({ id: nextImageId.current++, file: item, result: null }));

    if (added.length > 0) {
      setQueue([...queue, ...added]);
      if (activeId === null) {
        const first = added[0];
        setActiveId(first.id);
        setSourceUrl(URL.createObjectURL(first.file));
        setResultUrl("");
        setViewMode("original");
      }
    }

    if (images.length < incoming.length) {
      setError("Non-image files were skipped.");
    } else if (added.length < images.length) {
      setError("Duplicate images were skipped.");
    } else if (added.length > 0) {
      setError("");
    } else if (incoming.length > 0) {
      setError("Choose image files to add to the queue.");
    }
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) addFiles(event.target.files);
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setIsDragging(false);
    addFiles(event.dataTransfer.files);
  }

  async function createCutout() {
    if (!file || isBusy) return;
    setIsBusy(true);
    setProgress(0);
    setError("");

    const config: Config = {
      model: modelMode === "quick" ? "isnet_quint8" : "isnet_fp16",
      rescale: true,
      output: { format: "image/png" },
      progress: (_asset, current, total) => {
        if (total > 0)
          setProgress(Math.min(99, Math.round((current / total) * 100)));
      },
    };

    try {
      const result = await removeBackground(file, config);
      setQueue((images) =>
        images.map((image) =>
          image.id === activeId ? { ...image, result } : image,
        ),
      );
      setResultUrl(URL.createObjectURL(result));
      setViewMode("cutout");
      setProgress(100);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? `Could not finish this image. ${cause.message}`
          : "Could not finish this image. Check your connection and try again.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function downloadCutout() {
    if (!resultUrl || !file) return;
    const link = document.createElement("a");
    const baseName = file.name.replace(/\.[^.]+$/, "") || "cutout";

    if (background === "transparent" && exportScale === 1) {
      link.href = resultUrl;
      link.download = `${baseName}-cutout.png`;
      link.click();
      return;
    }

    const image = new Image();
    image.src = resultUrl;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * exportScale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * exportScale));
    const context = canvas.getContext("2d");
    if (!context) return;
    if (background !== "transparent") {
      context.fillStyle = background;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const flattened = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!flattened) return;
    const downloadUrl = URL.createObjectURL(flattened);
    link.href = downloadUrl;
    link.download = `${baseName}-${Math.round(exportScale * 100)}pct-cutout.png`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  }

  function clearImage() {
    if (!activeImage || isBusy) return;
    const remaining = queue.filter((image) => image.id !== activeImage.id);
    setQueue(remaining);
    const next =
      remaining[Math.min(queue.indexOf(activeImage), remaining.length - 1)];
    if (next) {
      setActiveId(next.id);
      setSourceUrl(URL.createObjectURL(next.file));
      setResultUrl(next.result ? URL.createObjectURL(next.result) : "");
      setViewMode(next.result ? "cutout" : "original");
    } else {
      setActiveId(null);
      setSourceUrl("");
      setResultUrl("");
    }
    setDimensions({ width: 0, height: 0 });
    setError("");
    setProgress(0);
  }

  function clearQueue() {
    if (isBusy) return;
    setQueue([]);
    setActiveId(null);
    setSourceUrl("");
    setResultUrl("");
    setDimensions({ width: 0, height: 0 });
    setError("");
    setProgress(0);
  }

  const showingResult = Boolean(resultUrl) && viewMode === "cutout";
  const imageUrl = showingResult ? resultUrl : sourceUrl;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Forma home">
          <span className="brand-mark">
            <ScanLine size={17} strokeWidth={2.2} />
          </span>
          <span>
            forma<span className="brand-period">.</span>
          </span>
        </a>
        <div className="topbar-right">
          <span className="privacy-note">
            <LockKeyhole size={14} /> Runs on your device
          </span>
          <span className="topbar-divider" />
          <button
            className="icon-button top-upload"
            onClick={() => fileInput.current?.click()}
            aria-label="Add images"
            title="Add images to queue">
            <ImagePlus size={17} />
          </button>
        </div>
      </header>

      <section className="intro" id="top">
        <div className="intro-copy">
          <p className="eyebrow">
            <span className="eyebrow-dot" /> IMAGE STUDIO{" "}
            <span className="eyebrow-divider">/</span> 01
          </p>
          <h1>
            Keep the subject.
            <br />
            <span>Lose the rest.</span>
          </h1>
          <p className="intro-description">
            A clean cutout, at full resolution. No upload, no waiting in line.
          </p>
        </div>
        <div className="privacy-stamp">
          <Sparkles size={16} />
          <span>
            PRIVATE BY
            <br />
            DESIGN
          </span>
        </div>
      </section>

      <section className="editor" aria-label="Background removal editor">
        <div className="workspace">
          <div
            className={`canvas-area ${isDragging ? "is-dragging" : ""} ${!file ? "is-empty" : ""}`}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node))
                setIsDragging(false);
            }}
            onDrop={onDrop}>
            <div className="canvas-toolbar">
              <div className="canvas-file-label">
                <span
                  className={`file-state ${showingResult ? "is-ready" : ""}`}
                />
                <span>{file?.name ?? "Your canvas"}</span>
              </div>
              {file && (
                <div className="canvas-toolbar-actions">
                  {dimensions.width > 0 && (
                    <span className="dimension-label">
                      {dimensions.width} x {dimensions.height}
                    </span>
                  )}
                  <button
                    className="icon-button clear-button"
                    onClick={clearImage}
                    disabled={isBusy}
                    title="Remove image"
                    aria-label="Remove image">
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            {file ? (
              <div
                className={`image-stage ${background === "transparent" || !showingResult ? "checkerboard" : ""}`}
                style={
                  showingResult && background !== "transparent"
                    ? { backgroundColor: background }
                    : undefined
                }>
                {imageUrl && (
                  <img
                    className="stage-image"
                    src={imageUrl}
                    alt={
                      showingResult
                        ? "Background-removed result"
                        : "Original image"
                    }
                    onLoad={(event) =>
                      setDimensions({
                        width: event.currentTarget.naturalWidth,
                        height: event.currentTarget.naturalHeight,
                      })
                    }
                  />
                )}
                {!showingResult && resultUrl && (
                  <span className="preview-tag">ORIGINAL</span>
                )}
                {showingResult && (
                  <span className="preview-tag result-tag">
                    <Check size={12} /> CUTOUT
                  </span>
                )}
                {isBusy && (
                  <div
                    className="processing-overlay"
                    role="status"
                    aria-live="polite">
                    <span className="processing-icon">
                      <LoaderCircle size={22} />
                    </span>
                    <span>
                      {progress === 0
                        ? "Waking up the model"
                        : progress < 100
                          ? "Preparing image"
                          : "Finishing cutout"}
                    </span>
                    <div className="progress-track">
                      <span style={{ width: `${Math.max(progress, 3)}%` }} />
                    </div>
                    <small>
                      {progress === 0
                        ? "The first run takes a little longer"
                        : `${progress}%`}
                    </small>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="dropzone"
                onClick={() => fileInput.current?.click()}>
                <span className="dropzone-icon">
                  <Upload size={21} />
                </span>
                <span className="dropzone-title">Drop images here</span>
                <span className="dropzone-subtitle">
                  or <span>browse files</span> from your device
                </span>
                <span className="dropzone-formats">JPG / PNG / WEBP</span>
              </button>
            )}

            <div className="canvas-footer">
              <span>
                {file
                  ? `${(file.size / (1024 * 1024)).toFixed(file.size < 1024 * 1024 ? 2 : 1)} MB`
                  : queue.length > 0
                    ? `${queue.length} images queued`
                    : "READY WHEN YOU ARE"}
              </span>
              <span className="canvas-footer-right">
                <span className="green-indicator" />{" "}
                {showingResult ? "Full-size preview" : "Local workspace"}
              </span>
            </div>
          </div>

          <aside className="inspector" aria-label="Cutout settings">
            <div className="inspector-heading">
              <div>
                <p className="section-kicker">YOUR CUTOUT</p>
                <h2>
                  Make it yours<span>.</span>
                </h2>
              </div>
              <span className="inspector-sparkle">
                <WandSparkles size={17} />
              </span>
            </div>

            {queue.length > 0 && (
              <div className="queue-panel">
                <div className="queue-heading">
                  <span className="setting-label">IMAGE QUEUE <span>{queue.length}</span></span>
                  <button
                    className="queue-clear"
                    onClick={clearQueue}
                    disabled={isBusy}
                    title="Clear image queue"
                    aria-label="Clear image queue">
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="queue-list">
                  {queue.map((image) => (
                    <button
                      key={image.id}
                      className={`queue-item ${image.id === activeId ? "active" : ""}`}
                      onClick={() => selectQueueImage(image)}
                      disabled={isBusy && image.id !== activeId}>
                      {image.result ? (
                        <CheckCircle2 className="queue-done" size={14} />
                      ) : (
                        <Circle className="queue-pending" size={14} />
                      )}
                      <span className="queue-name">{image.file.name}</span>
                      <span className="queue-status">{image.result ? "Done" : "Ready"}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="setting-block">
              <div className="setting-heading">
                <span className="setting-label">MODEL</span>
                <button className="text-select" title="Choose a model preset">
                  IMG.LY <ChevronDown size={13} />
                </button>
              </div>
              <div
                className="model-options"
                role="radiogroup"
                aria-label="Processing quality">
                <button
                  className={`model-option ${modelMode === "detail" ? "selected" : ""}`}
                  role="radio"
                  aria-checked={modelMode === "detail"}
                  onClick={() => setModelMode("detail")}>
                  <ScanLine size={16} />
                  <span>
                    <strong>Fine detail</strong>
                    <small>Best edge quality</small>
                  </span>
                  {modelMode === "detail" && (
                    <span className="option-check">
                      <Check size={12} />
                    </span>
                  )}
                </button>
                <button
                  className={`model-option ${modelMode === "quick" ? "selected" : ""}`}
                  role="radio"
                  aria-checked={modelMode === "quick"}
                  onClick={() => setModelMode("quick")}>
                  <Zap size={16} />
                  <span>
                    <strong>Quick pass</strong>
                    <small>Smaller, faster model</small>
                  </span>
                  {modelMode === "quick" && (
                    <span className="option-check">
                      <Check size={12} />
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="setting-block background-setting">
              <div className="setting-heading">
                <span className="setting-label">PREVIEW BACKGROUND</span>
                <span className="setting-value">
                  {backgrounds.find((item) => item.value === background)?.label}
                </span>
              </div>
              <div
                className="swatches"
                role="radiogroup"
                aria-label="Preview background">
                {backgrounds.map((item) => (
                  <button
                    key={item.value}
                    className={`swatch ${item.value === "transparent" ? "swatch-transparent" : ""} ${background === item.value ? "active" : ""}`}
                    style={
                      item.value === "transparent"
                        ? undefined
                        : { backgroundColor: item.value }
                    }
                    role="radio"
                    aria-checked={background === item.value}
                    aria-label={item.label}
                    title={item.label}
                    onClick={() => setBackground(item.value)}>
                    {background === item.value && <Check size={13} />}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}

            {resultUrl && (
              <div className="compare-row">
                <span>Compare</span>
                <div
                  className="compare-toggle"
                  role="group"
                  aria-label="Compare original and cutout">
                  <button
                    className={viewMode === "original" ? "active" : ""}
                    onClick={() => setViewMode("original")}>
                    Before
                  </button>
                  <button
                    className={viewMode === "cutout" ? "active" : ""}
                    onClick={() => setViewMode("cutout")}>
                    After
                  </button>
                </div>
              </div>
            )}

            {resultUrl && (
              <label className="export-size-row">
                <span className="setting-label">EXPORT SIZE</span>
                <select
                  value={exportScale}
                  onChange={(event) => setExportScale(Number(event.target.value))}
                  aria-label="Export resolution">
                  <option value={1}>Original · 100%</option>
                  <option value={0.75}>Large · 75%</option>
                  <option value={0.5}>Medium · 50%</option>
                  <option value={0.25}>Small · 25%</option>
                </select>
              </label>
            )}

            <div className="action-area">
              {resultUrl ? (
                <button className="primary-action" onClick={downloadCutout}>
                  <ArrowDownToLine size={17} /> Download PNG{" "}
                  <span className="action-arrow">↗</span>
                </button>
              ) : (
                <button
                  className="primary-action"
                  onClick={
                    file ? createCutout : () => fileInput.current?.click()
                  }
                  disabled={isBusy}>
                  {isBusy ? (
                    <LoaderCircle className="button-spinner" size={17} />
                  ) : (
                    <WandSparkles size={17} />
                  )}
                  {isBusy
                    ? "Working on it..."
                    : file
                      ? "Remove background"
                      : "Choose an image"}
                  {!isBusy && (
                    <ArrowUpRight className="action-arrow" size={17} />
                  )}
                </button>
              )}
              {resultUrl && (
                <button
                  className="secondary-action"
                  onClick={createCutout}
                  disabled={isBusy}>
                  {isBusy ? "Processing…" : "Run again with this model"}
                </button>
              )}
              <p className="action-note">
                <LockKeyhole size={12} /> Your image never leaves this browser
              </p>
            </div>
          </aside>
        </div>

        <div className="editor-footnote">
          <span>
            <Asterisk className="footnote-star" size={13} /> EDGE-AWARE AI, BY
            IMG.LY
          </span>
          <span>
            PNG EXPORT <span className="footnote-separator">/</span> ORIGINAL
            DIMENSIONS
          </span>
        </div>
      </section>

      <footer className="page-footer">
        <span>
          FORMA STUDIO <span className="footer-year">2026</span>
        </span>
        <span>MADE FOR THE DETAILS</span>
      </footer>

      <input
        ref={fileInput}
        className="visually-hidden"
        type="file"
        accept="image/*"
        multiple
        onChange={onFileChange}
      />
    </main>
  );
}

export default App;
