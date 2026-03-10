// src/components/RadarChartPanel.jsx
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend
} from "recharts";

const DOMAIN_COLORS = {
  "Social Communication": "#1c8296",
  "Restricted & Repetitive Behavior": "#f59e0b",
  "Restricted & Repetitive Behavior (Sensory)": "#f59e0b"
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: "white",
      border: "1px solid #e2e8f0",
      borderRadius: 10,
      padding: "10px 14px",
      fontSize: "0.8rem",
      boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
      maxWidth: 220
    }}>
      <div style={{ fontWeight: 700, color: "#0a2e35", marginBottom: 4 }}>{d.indicator}</div>
      <div style={{ color: "#64748b", lineHeight: 1.5, marginBottom: 6 }}>{d.label}</div>
      <div style={{ fontWeight: 600, color: d.value ? "#f43f5e" : "#22c55e" }}>
        {d.value ? "Present (1)" : "Absent (0)"}
      </div>
    </div>
  );
}

export default function RadarChartPanel({ radarData }) {
  if (!radarData || radarData.length === 0) return null;

  // Format for recharts
  const data = radarData.map(d => ({
    ...d,
    subject: d.indicator,
    fullMark: 1
  }));

  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="75%">
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#334155", fontSize: 13, fontWeight: 600 }}
          />
          <PolarRadiusAxis
            domain={[0, 1]}
            tickCount={2}
            tick={{ fill: "#94a3b8", fontSize: 10 }}
          />
          <Radar
            name="Score"
            dataKey="value"
            stroke="#1c8296"
            fill="#1c8296"
            fillOpacity={0.25}
            strokeWidth={2}
            dot={{ r: 4, fill: "#1c8296" }}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
