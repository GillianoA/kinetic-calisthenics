import { describe, expect, it } from "vitest";

import {
  UPLOAD_LIMITS,
  buildPrivateMediaPath,
  validateMediaFile,
} from "@/lib/uploads";

function mediaFile(type: string, size: number, name = "progress.webp") {
  return { type, size, name } as File;
}

describe("validateMediaFile", () => {
  it.each(["image/jpeg", "image/png", "image/webp", "image/avif"])(
    "accepts supported image type %s",
    (type) => {
      expect(validateMediaFile(mediaFile(type, 1024))).toEqual({
        valid: true,
        kind: "image",
      });
    },
  );

  it("rejects HEIC and unrelated content types", () => {
    expect(validateMediaFile(mediaFile("image/heic", 1024)).valid).toBe(false);
    expect(validateMediaFile(mediaFile("text/html", 1024)).valid).toBe(false);
  });

  it("requires explicit video permission", () => {
    const video = mediaFile("video/mp4", 1024, "skill.mp4");

    expect(validateMediaFile(video).valid).toBe(false);
    expect(validateMediaFile(video, true)).toEqual({
      valid: true,
      kind: "video",
    });
  });

  it("enforces limits compatible with the private Storage buckets", () => {
    expect(UPLOAD_LIMITS.avatarBytes).toBe(5 * 1024 * 1024);
    expect(
      validateMediaFile(
        mediaFile("image/avif", UPLOAD_LIMITS.imageBytes + 1, "progress.avif"),
      ).valid,
    ).toBe(false);
    expect(
      validateMediaFile(
        mediaFile("video/webm", UPLOAD_LIMITS.videoBytes + 1, "skill.webm"),
        true,
      ).valid,
    ).toBe(false);
  });
});

describe("buildPrivateMediaPath", () => {
  it("places media below the authenticated owner and visibility segment", () => {
    const path = buildPrivateMediaPath(
      "00000000-0000-4000-8000-000000000001",
      mediaFile("image/avif", 1024, "Progress Final.AVIF"),
      "shared",
    );

    expect(path).toMatch(
      /^00000000-0000-4000-8000-000000000001\/shared\/\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}\.avif$/,
    );
  });
});
