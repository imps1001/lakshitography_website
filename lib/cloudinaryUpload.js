"use client";

import { api } from "@/lib/api";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

// Uploads one image straight from the browser to Cloudinary using a signature from our API, and
// reports progress (0–100). Resolves with Cloudinary's response; the caller then registers the
// returned public_id with /api/gallery, which verifies it server-side.
export async function uploadToCloudinary(file, onProgress) {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Image must be 10 MB or smaller.");
  const { data: signed } = await api.post("/uploads/signature");

  const form = new FormData();
  form.append("file", file);
  Object.entries(signed.params).forEach(([key, value]) => form.append(key, value));
  form.append("api_key", signed.api_key);
  form.append("signature", signed.signature);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${signed.cloud_name}/image/upload`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let body = {};
      try { body = JSON.parse(xhr.responseText || "{}"); } catch { /* non-JSON error page */ }
      if (xhr.status >= 200 && xhr.status < 300) resolve(body);
      else reject(new Error(body.error?.message || "Upload to Cloudinary failed. Please try again."));
    };
    xhr.onerror = () => reject(new Error("Network error while uploading — check your connection."));
    xhr.send(form);
  });
}
