import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 6,
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
              width: 8,
              height: 20,
              background: "white",
              borderRadius: 2,
              position: "absolute",
            }}
          />
          <div
            style={{
              width: 20,
              height: 8,
              background: "white",
              borderRadius: 2,
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
