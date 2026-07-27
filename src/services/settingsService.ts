import apiService from "./apiService";

export interface SystemSettings {
  _id?: string;
  performanceMetrics: string[];
  defaultFeeAmount: number;
  currency: string;
  heroMode?: "video" | "carousel";
  heroImages?: string[];
  logoUrl?: string;
  logoAlignment?: "top_left" | "middle";
  logoIsCircular?: boolean;
  logoScale?: number;
  themeColor?: string;
}

export const getSystemSettings = async (): Promise<SystemSettings> => {
  const response = await apiService.get("/admin/settings");
  return (response as any).data;
};

export const updateSystemSettings = async (
  settings: Partial<SystemSettings>,
): Promise<SystemSettings> => {
  const response = await apiService.put("/admin/settings", settings);
  return (response as any).data;
};

/**
 * Image uploads go to Cloudinary via /api/upload/*, NOT to the local disk.
 *
 * These previously pointed at /admin/settings/upload-{hero,logo}, which write
 * into public/uploads with fs.writeFile. That could never work in production:
 * Vercel's filesystem is read-only outside /tmp, and anything written to a
 * serverless instance is gone on the next invocation and never served. The same
 * class of bug took the whole site down via the winston file transport.
 *
 * Two further reasons those calls failed even locally: the routes read the form
 * fields `file`/`files` while these functions sent `logo`/`images`, and setting
 * Content-Type to "multipart/form-data" by hand omits the boundary parameter,
 * so req.formData() cannot parse the body. Axios sets the full header itself —
 * including the boundary — only when we leave it unset, which is what the
 * `undefined` below is for.
 */
const MULTIPART: { headers: Record<string, undefined> } = {
  headers: { "Content-Type": undefined },
};

export const uploadHeroImages = async (files: File[]): Promise<string[]> => {
  // /api/upload/hero takes one file per request (it applies a 1920x1080
  // transform per image), so fan out rather than sending them as a batch.
  const urls = await Promise.all(
    files.map(async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await apiService.post("/upload/hero", formData, MULTIPART);
      return (response as any).data.url as string;
    }),
  );
  return urls;
};

export const uploadLogo = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", "logos");

  const response = await apiService.post("/upload/image", formData, MULTIPART);
  return (response as any).data.url;
};

/** A gallery/carousel image. Same pipeline as the logo, different folder. */
export const uploadGalleryImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", "gallery");

  const response = await apiService.post("/upload/image", formData, MULTIPART);
  return (response as any).data.url;
};

/**
 * Uploads a hero background video DIRECTLY to Cloudinary from the browser.
 *
 * Was previously posted to /upload/image — which hard-rejects any real video
 * both on size (5MB cap) and MIME type (image-only allowlist). Even a
 * dedicated proxy route on our own server would still fail in production:
 * this app deploys on Vercel, where serverless functions have a hard ~4.5MB
 * request-body limit, and a real video clip is routinely well above that.
 * Getting a signed upload signature from our server and then POSTing the
 * file straight to Cloudinary's own endpoint is Cloudinary's documented
 * pattern for exactly this — the video binary never touches our server at
 * all, so no server-side body limit applies.
 */
export const uploadVideo = async (file: File): Promise<string> => {
  const maxBytes = 50 * 1024 * 1024; // 50MB
  if (file.size > maxBytes) {
    throw new Error("File too large. Max 50MB — compress the clip or trim its length.");
  }

  const sigResponse = await apiService.post("/upload/video-signature", {});
  const { signature, timestamp, folder, apiKey, cloudName } = (sigResponse as any).data as {
    signature: string;
    timestamp: number;
    folder: string;
    apiKey: string;
    cloudName: string;
  };

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", folder);

  const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
    method: "POST",
    body: formData,
  });
  const uploadJson = await uploadResponse.json();

  if (!uploadResponse.ok) {
    throw new Error(uploadJson?.error?.message || "Video upload failed");
  }

  return uploadJson.secure_url as string;
};
