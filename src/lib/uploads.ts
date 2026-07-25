const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export const UPLOAD_LIMITS = {
  imageBytes: 15 * 1024 * 1024,
  videoBytes: 50 * 1024 * 1024,
  avatarBytes: 5 * 1024 * 1024,
} as const;

export function validateMediaFile(file: File, allowVideo = false) {
  const isImage = IMAGE_TYPES.has(file.type);
  const isVideo = allowVideo && VIDEO_TYPES.has(file.type);

  if (!isImage && !isVideo) {
    return {
      valid: false as const,
      error: allowVideo
        ? "Use a JPEG, PNG, WebP, AVIF, MP4, WebM, or MOV file."
        : "Use a JPEG, PNG, WebP, or AVIF image.",
    };
  }

  const limit = isVideo ? UPLOAD_LIMITS.videoBytes : UPLOAD_LIMITS.imageBytes;
  if (file.size > limit) {
    return {
      valid: false as const,
      error: `The file is larger than ${isVideo ? "50 MB" : "15 MB"}.`,
    };
  }

  return { valid: true as const, kind: isVideo ? "video" : "image" };
}

export function buildPrivateMediaPath(
  userId: string,
  file: File,
  visibility: "private" | "shared" = "private",
) {
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  return `${userId}/${visibility}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
}
