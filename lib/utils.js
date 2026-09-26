// Ask Cloudinary for a resized, auto-format/quality version instead of the full original.
export function optimizedImage(url, width = 1600) {
  if (typeof url !== "string" || !url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto,c_limit,w_${width}/`);
}
