import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background:
            "radial-gradient(circle at 20% 15%, #67e8f9 0, transparent 42%), linear-gradient(145deg, #1677ff, #7258ef)",
          color: "white",
          display: "flex",
          fontSize: 240,
          fontWeight: 800,
          height: "100%",
          justifyContent: "center",
          letterSpacing: "-0.12em",
          width: "100%",
        }}
      >
        K
      </div>
    ),
    size,
  );
}
