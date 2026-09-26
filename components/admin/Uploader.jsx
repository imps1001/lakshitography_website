"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, ImagePlus, Loader2, Sparkles, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { MAX_UPLOAD_BYTES, uploadToCloudinary } from "@/lib/cloudinaryUpload";
import { Toggle, errorText } from "./ui";

// Multi-file uploader: files are sent one request at a time so each shows its own progress.
export default function Uploader({ categories, defaultCategoryId, onUploaded }) {
  const inputRef = useRef(null);
  const [queue, setQueue] = useState([]);
  const [categoryId, setCategoryId] = useState(defaultCategoryId || categories[0]?.id || "");
  const [inGallery, setInGallery] = useState(true);
  const [inHero, setInHero] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (defaultCategoryId) setCategoryId(defaultCategoryId);
    else if (!categories.some((c) => c.id === categoryId)) setCategoryId(categories[0]?.id || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultCategoryId, categories]);

  const addFiles = (files) => {
    const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (images.length < files.length) toast.error("Only image files can be uploaded.");
    setQueue((q) => [
      ...q,
      ...images.map((file) => ({ key: `${file.name}-${file.size}-${Math.random()}`, file, preview: URL.createObjectURL(file), status: "ready" })),
    ]);
  };

  const removeItems = (predicate) =>
    setQueue((q) => q.filter((item) => {
      if (!predicate(item)) return true;
      URL.revokeObjectURL(item.preview);
      return false;
    }));

  const uploadAll = async () => {
    setBusy(true);
    let uploaded = 0;
    for (const item of queue.filter((i) => i.status !== "done")) {
      const setStatus = (status, extra = {}) => setQueue((q) => q.map((i) => (i.key === item.key ? { ...i, status, ...extra } : i)));
      if (item.file.size > MAX_UPLOAD_BYTES) { setStatus("error", { error: "Over 10 MB" }); continue; }
      setStatus("uploading", { progress: 0 });
      try {
        const result = await uploadToCloudinary(item.file, (progress) => setStatus("uploading", { progress }));
        await api.post("/gallery", { public_id: result.public_id, category_id: categoryId, show_in_gallery: inGallery, show_in_hero: inHero });
        setStatus("done");
        uploaded += 1;
      } catch (error) {
        setStatus("error", { error: errorText(error) });
      }
    }
    setBusy(false);
    if (uploaded) {
      toast.success(`${uploaded} photo${uploaded === 1 ? "" : "s"} uploaded`);
      onUploaded();
      removeItems((i) => i.status === "done");
    }
  };

  const pending = queue.filter((i) => i.status !== "done").length;
  const categoryName = categories.find((c) => c.id === categoryId)?.name;

  return (
    <section className="card p-5 sm:p-6">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        data-testid="upload-dropzone"
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
          dragOver ? "border-sun bg-sun/10" : "border-ink/15 hover:border-ink/30 hover:bg-ink/[0.02]"
        }`}
      >
        <UploadCloud size={28} className="text-sun" />
        <p className="mt-3 font-display text-lg font-bold">
          {defaultCategoryId ? `Add photos to ${categoryName}` : "Drop photos here or click to browse"}
        </p>
        <p className="mt-1 text-sm text-muted">JPG, PNG, WebP or GIF · up to 10 MB each · select as many as you like</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          data-testid="gallery-image-input"
          onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
        />
      </div>

      {queue.length > 0 && (
        <>
          <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-8">
            {queue.map((item) => (
              <div key={item.key} className="relative aspect-square overflow-hidden rounded-xl bg-surface-2">
                <img src={item.preview} alt="" className="h-full w-full object-cover" />
                {item.status === "uploading" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/60 text-xs font-semibold text-white">
                    <Loader2 size={18} className="animate-spin" />
                    {item.progress ? `${item.progress}%` : null}
                    <span className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
                      <span className="block h-full bg-sun transition-all" style={{ width: `${item.progress || 0}%` }} />
                    </span>
                  </div>
                )}
                {item.status === "error" && (
                  <div className="absolute inset-0 flex items-end bg-red-900/60 p-1.5 text-[10px] leading-tight text-white">{item.error}</div>
                )}
                {!busy && (
                  <button
                    type="button"
                    aria-label="Remove from upload"
                    onClick={() => removeItems((i) => i.key === item.key)}
                    className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-end gap-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">Category</span>
              <select data-testid="gallery-category-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input !w-auto !py-2.5">
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <div className="flex gap-2 pb-1">
              <Toggle on={inGallery} onClick={() => setInGallery((v) => !v)}><Eye size={12} /> Show in gallery</Toggle>
              <Toggle on={inHero} onClick={() => setInHero((v) => !v)}><Sparkles size={12} /> Home slideshow</Toggle>
            </div>
            <div className="ml-auto flex gap-2">
              <button type="button" onClick={() => removeItems(() => true)} disabled={busy} className="btn-ghost !py-2.5 disabled:opacity-50">Clear</button>
              <button type="button" onClick={uploadAll} disabled={busy || !pending || !categoryId} data-testid="gallery-upload-submit" className="btn-primary !py-2.5 disabled:opacity-60">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                {busy ? "Uploading…" : `Upload ${pending} photo${pending === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
