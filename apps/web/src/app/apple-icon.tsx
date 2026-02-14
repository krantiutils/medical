import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2563EB",
          borderRadius: 36,
        }}
      >
        {/* Medical cross */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              width: 40,
              height: 110,
              background: "white",
              borderRadius: 8,
              position: "absolute",
            }}
          />
          <div
            style={{
              width: 110,
              height: 40,
              background: "white",
              borderRadius: 8,
              position: "absolute",
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
