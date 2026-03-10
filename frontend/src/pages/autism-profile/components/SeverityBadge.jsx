// src/components/SeverityBadge.jsx
export default function SeverityBadge({ level }) {
  const map = {
    1: { label: "Level 1", cls: "badge-level1" },
    2: { label: "Level 2", cls: "badge-level2" },
    3: { label: "Level 3", cls: "badge-level3" }
  };
  const info = map[level] || { label: "Unknown", cls: "" };
  return <span className={`badge ${info.cls}`}>{info.label}</span>;
}
