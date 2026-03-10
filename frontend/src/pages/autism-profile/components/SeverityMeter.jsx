// src/components/SeverityMeter.jsx
import "./SeverityMeter.css";

const LEVELS = [
  { level: 1, label: "Level 1", desc: "Requiring Support",                color: "#22c55e", range: "TSS ≤ 6" },
  { level: 2, label: "Level 2", desc: "Requiring Substantial Support",    color: "#f59e0b", range: "6 < TSS ≤ 12" },
  { level: 3, label: "Level 3", desc: "Requiring Very Substantial Support",color: "#f43f5e", range: "TSS > 12" }
];

export default function SeverityMeter({ level, label }) {
  return (
    <div className="severity-meter">
      {/* Track */}
      <div className="severity-track">
        {LEVELS.map(l => (
          <div
            key={l.level}
            className={`severity-segment ${l.level === level ? "active" : ""}`}
            style={{ "--seg-color": l.color }}
          >
            <span className="seg-label">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Active level card */}
      <div className="severity-result" style={{ "--res-color": LEVELS[level - 1]?.color }}>
        <div className="severity-result-dot" />
        <div>
          <div className="severity-result-level">{label || `Level ${level}`}</div>
          <div className="severity-result-sub">DSM-5 Autism Spectrum Disorder Severity</div>
        </div>
      </div>

      {/* Legend */}
      <div className="severity-legend">
        {LEVELS.map(l => (
          <div key={l.level} className={`legend-item ${l.level === level ? "active" : ""}`}>
            <span className="legend-dot" style={{ background: l.color }} />
            <span className="legend-label">{l.label}</span>
            <span className="legend-range">{l.range}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
