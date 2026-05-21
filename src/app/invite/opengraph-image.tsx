import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(160deg, #fffdf9 0%, #f3ede3 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "serif",
          position: "relative",
        }}
      >
        {/* Background ring ornament */}
        <div style={{
          position: "absolute",
          width: 560,
          height: 560,
          borderRadius: "50%",
          border: "1px solid rgba(176,141,87,0.15)",
          display: "flex",
        }} />
        <div style={{
          position: "absolute",
          width: 380,
          height: 380,
          borderRadius: "50%",
          border: "1px solid rgba(176,141,87,0.22)",
          display: "flex",
        }} />

        {/* Card mockup */}
        <div style={{
          background: "linear-gradient(160deg, #fffdf9 0%, #f8f4ee 100%)",
          border: "1px solid #e0dbd2",
          boxShadow: "0 40px 100px -24px rgba(0,0,0,0.14)",
          padding: "64px 72px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
          minWidth: 400,
          position: "relative",
        }}>
          <div style={{
            fontSize: 11,
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            color: "#b08d57",
            fontFamily: "sans-serif",
            marginBottom: 40,
            display: "flex",
          }}>
            Undangan Pernikahan
          </div>

          <div style={{ fontSize: 11, color: "#6b6459", fontFamily: "sans-serif", marginBottom: 6, display: "flex" }}>
            Kepada Yth.
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#1a1a1a", marginBottom: 32, display: "flex" }}>
            Bapak/Ibu Tamu Undangan
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28, width: "100%" }}>
            <div style={{ flex: 1, height: 1, background: "#e0dbd2", display: "flex" }} />
            <div style={{ color: "#b08d57", fontSize: 18, display: "flex" }}>♥</div>
            <div style={{ flex: 1, height: 1, background: "#e0dbd2", display: "flex" }} />
          </div>

          <div style={{ fontSize: 34, fontWeight: 700, color: "#1a1a1a", display: "flex" }}>Nama Pengantin</div>
          <div style={{ fontSize: 12, color: "#6b6459", fontFamily: "sans-serif", margin: "8px 0", display: "flex" }}>
            &amp;
          </div>
          <div style={{ fontSize: 34, fontWeight: 700, color: "#1a1a1a", display: "flex" }}>Nama Pengantin</div>

          <div style={{
            marginTop: 28,
            fontSize: 11,
            letterSpacing: "0.25em",
            color: "#6b6459",
            fontFamily: "sans-serif",
            display: "flex",
          }}>
            Sabtu, 15 Maret 2026
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
