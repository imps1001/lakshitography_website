import { v2 as cloudinary } from "cloudinary";

// Photos are uploaded by the admin's browser straight to Cloudinary (keeps large files off our
// serverless functions, which cap request bodies at ~4.5 MB on Vercel). The server only signs
// each upload and then verifies the result before saving it.
export const GALLERY_FOLDER = "lakshitography/gallery";
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_FORMATS = "jpg,jpeg,png,webp,gif,heic,heif,avif";

function configureCloudinary() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary credentials are not configured.");
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// Everything the browser needs for one signed upload. The browser must send `params` unchanged,
// otherwise Cloudinary rejects the signature — so it can't pick another folder or file type.
export function signGalleryUpload() {
  configureCloudinary();
  const params = { folder: GALLERY_FOLDER, allowed_formats: ALLOWED_FORMATS, timestamp: Math.round(Date.now() / 1000) };
  return {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    params,
    signature: cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET),
  };
}

// Looks the upload up on Cloudinary rather than trusting what the browser reports about it.
export async function verifyGalleryUpload(publicId) {
  if (typeof publicId !== "string" || !publicId.startsWith(`${GALLERY_FOLDER}/`)) {
    return { error: "Upload not recognised. Please try again." };
  }
  configureCloudinary();
  let resource;
  try {
    resource = await cloudinary.api.resource(publicId, { resource_type: "image" });
  } catch {
    return { error: "Couldn't find the uploaded image. Please try again." };
  }
  if (resource.bytes > MAX_IMAGE_BYTES) {
    await deleteGalleryImage(publicId);
    return { error: "Image must be 10 MB or smaller." };
  }
  return { image: { url: resource.secure_url, public_id: resource.public_id, width: resource.width, height: resource.height } };
}

// Best-effort: a failed Cloudinary cleanup should never block removing the photo from the site.
export async function deleteGalleryImage(publicId) {
  if (!publicId) return;
  try {
    configureCloudinary();
    await cloudinary.uploader.destroy(publicId, { resource_type: "image", invalidate: true });
  } catch (error) {
    console.error(`Cloudinary delete failed for ${publicId}:`, error.message);
  }
}
