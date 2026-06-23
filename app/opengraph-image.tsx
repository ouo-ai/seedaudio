import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Seed Audio AI - Production KIE Audio API"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #080c14 0%, #0d1724 52%, #101017 100%)",
          color: "#f2f3f5",
          padding: 72,
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "#67e8f9",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          <span>Seed Audio AI</span>
          <span style={{ color: "#a7abb3", fontSize: 22 }}>seedaudioai.ai</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={{ color: "#a7abb3", fontSize: 28 }}>Production KIE audio API for Seed Audio workflows</div>
          <div style={{ maxWidth: 980, fontSize: 82, fontWeight: 700, lineHeight: 1.02 }}>
            Generate production voice with Seed Audio AI
          </div>
          <div style={{ display: "flex", gap: 14, color: "#d8dce3", fontSize: 24 }}>
            {["KIE API", "Voice synthesis", "Server-side key", "Responsible AI"].map((item) => (
              <span
                key={item}
                style={{
                  border: "1px solid rgba(255,255,255,0.16)",
                  borderRadius: 999,
                  padding: "10px 18px",
                  background: "rgba(255,255,255,0.06)",
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  )
}
