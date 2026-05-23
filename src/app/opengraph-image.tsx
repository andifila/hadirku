import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#f6f3ee",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "serif",
          position: "relative",
        }}
      >
        {/* Decorative rings */}
        <div style={{
          position: "absolute",
          width: 480,
          height: 480,
          borderRadius: "50%",
          border: "1px solid rgba(176,141,87,0.18)",
          display: "flex",
        }} />
        <div style={{
          position: "absolute",
          width: 320,
          height: 320,
          borderRadius: "50%",
          border: "1px solid rgba(176,141,87,0.25)",
          display: "flex",
        }} />

        {/* Heart */}
        <div style={{ color: "#b08d57", fontSize: 32, marginBottom: 28, display: "flex" }}>♥</div>

        {/* Brand */}
        <div style={{
          fontSize: 16,
          letterSpacing: "0.4em",
          textTransform: "uppercase",
          color: "#b08d57",
          marginBottom: 24,
          fontFamily: "sans-serif",
          display: "flex",
        }}>
          Hadirku
        </div>

        {/* Headline */}
        <div style={{
          fontSize: 52,
          fontWeight: 700,
          color: "#1a1a1a",
          textAlign: "center",
          lineHeight: 1.18,
          maxWidth: 740,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>
          Undangan Pernikahan Digital
        </div>

        {/* Subtext */}
        <div style={{
          marginTop: 24,
          fontSize: 22,
          color: "#6b6459",
          fontFamily: "sans-serif",
          textAlign: "center",
          maxWidth: 600,
          display: "flex",
        }}>
          Buat, bagikan, dan pantau RSVP tamu secara real-time
        </div>

        {/* Divider */}
        <div style={{
          marginTop: 40,
          width: 48,
          height: 1,
          background: "#b08d57",
          display: "flex",
        }} />
      </div>
    ),
    { ...size }
  );
}
