import { useState, useMemo, useRef, useEffect } from "react";

// ═══════════════════════════════════════════════════════
// DATA — Operators across locations with void metrics
// ═══════════════════════════════════════════════════════
const OPERATORS = [
  // Pamplona
  { id: "op1", name: "Carlos M.", location: "Pamplona", role: "Camarero", shift: "Noche", voids: 34, totalAmount: 920, transactions: 480, avgTicket: 28.5, topCategory: "Bebidas", withSupervisor: 8, postClose: 5, maxSingleVoid: 85 },
  { id: "op2", name: "María L.", location: "Pamplona", role: "Camarera", shift: "Tarde", voids: 7, totalAmount: 180, transactions: 520, avgTicket: 26.2, topCategory: "Entrantes", withSupervisor: 5, postClose: 0, maxSingleVoid: 42 },
  { id: "op3", name: "Javier R.", location: "Pamplona", role: "Encargado", shift: "Noche", voids: 18, totalAmount: 620, transactions: 390, avgTicket: 32.1, topCategory: "Alcohol premium", withSupervisor: 0, postClose: 3, maxSingleVoid: 120 },
  { id: "op4", name: "Ana P.", location: "Pamplona", role: "Camarera", shift: "Mañana", voids: 4, totalAmount: 95, transactions: 410, avgTicket: 24.8, topCategory: "Cafetería", withSupervisor: 3, postClose: 0, maxSingleVoid: 38 },

  // Bilbao
  { id: "op5", name: "Iñaki G.", location: "Bilbao", role: "Camarero", shift: "Tarde", voids: 9, totalAmount: 210, transactions: 470, avgTicket: 27.3, topCategory: "Platos principales", withSupervisor: 6, postClose: 0, maxSingleVoid: 45 },
  { id: "op6", name: "Leire S.", location: "Bilbao", role: "Camarera", shift: "Noche", voids: 5, totalAmount: 130, transactions: 440, avgTicket: 29.1, topCategory: "Postres", withSupervisor: 4, postClose: 0, maxSingleVoid: 36 },
  { id: "op7", name: "Mikel A.", location: "Bilbao", role: "Encargado", shift: "Mañana", voids: 6, totalAmount: 155, transactions: 500, avgTicket: 25.7, topCategory: "Entrantes", withSupervisor: 0, postClose: 1, maxSingleVoid: 48 },

  // Burgos
  { id: "op8", name: "Diego F.", location: "Burgos", role: "Camarero", shift: "Noche", voids: 42, totalAmount: 1380, transactions: 360, avgTicket: 30.5, topCategory: "Alcohol premium", withSupervisor: 2, postClose: 8, maxSingleVoid: 145 },
  { id: "op9", name: "Lucía V.", location: "Burgos", role: "Camarera", shift: "Tarde", voids: 8, totalAmount: 195, transactions: 490, avgTicket: 26.8, topCategory: "Bebidas", withSupervisor: 7, postClose: 0, maxSingleVoid: 40 },
  { id: "op10", name: "Pablo N.", location: "Burgos", role: "Camarero", shift: "Mañana", voids: 6, totalAmount: 140, transactions: 430, avgTicket: 25.2, topCategory: "Cafetería", withSupervisor: 5, postClose: 0, maxSingleVoid: 32 },
  { id: "op11", name: "Sara T.", location: "Burgos", role: "Encargada", shift: "Noche", voids: 15, totalAmount: 480, transactions: 380, avgTicket: 31.4, topCategory: "Platos principales", withSupervisor: 0, postClose: 2, maxSingleVoid: 78 },

  // San Sebastián
  { id: "op12", name: "Ander Z.", location: "San Sebastián", role: "Camarero", shift: "Tarde", voids: 3, totalAmount: 75, transactions: 510, avgTicket: 34.2, topCategory: "Entrantes", withSupervisor: 2, postClose: 0, maxSingleVoid: 35 },
  { id: "op13", name: "Nerea K.", location: "San Sebastián", role: "Camarera", shift: "Noche", voids: 5, totalAmount: 110, transactions: 480, avgTicket: 33.8, topCategory: "Bebidas", withSupervisor: 4, postClose: 0, maxSingleVoid: 30 },
  { id: "op14", name: "Jon B.", location: "San Sebastián", role: "Encargado", shift: "Mañana", voids: 4, totalAmount: 90, transactions: 460, avgTicket: 32.5, topCategory: "Cafetería", withSupervisor: 0, postClose: 0, maxSingleVoid: 28 },

  // Vitoria
  { id: "op15", name: "Aitor D.", location: "Vitoria", role: "Camarero", shift: "Tarde", voids: 22, totalAmount: 680, transactions: 420, avgTicket: 27.9, topCategory: "Bebidas", withSupervisor: 4, postClose: 4, maxSingleVoid: 92 },
  { id: "op16", name: "Marta H.", location: "Vitoria", role: "Camarera", shift: "Noche", voids: 11, totalAmount: 290, transactions: 450, avgTicket: 28.4, topCategory: "Platos principales", withSupervisor: 8, postClose: 0, maxSingleVoid: 55 },
  { id: "op17", name: "Gorka E.", location: "Vitoria", role: "Encargado", shift: "Noche", voids: 16, totalAmount: 520, transactions: 370, avgTicket: 30.2, topCategory: "Alcohol premium", withSupervisor: 0, postClose: 3, maxSingleVoid: 110 },

  // Zaragoza
  { id: "op18", name: "Raúl C.", location: "Zaragoza", role: "Camarero", shift: "Tarde", voids: 10, totalAmount: 250, transactions: 460, avgTicket: 26.5, topCategory: "Entrantes", withSupervisor: 7, postClose: 1, maxSingleVoid: 48 },
  { id: "op19", name: "Elena J.", location: "Zaragoza", role: "Camarera", shift: "Mañana", voids: 5, totalAmount: 120, transactions: 490, avgTicket: 25.1, topCategory: "Cafetería", withSupervisor: 4, postClose: 0, maxSingleVoid: 35 },
  { id: "op20", name: "Tomás W.", location: "Zaragoza", role: "Encargado", shift: "Noche", voids: 12, totalAmount: 340, transactions: 400, avgTicket: 29.8, topCategory: "Bebidas", withSupervisor: 0, postClose: 2, maxSingleVoid: 65 },
];

const LOCATIONS = [...new Set(OPERATORS.map((o) => o.location))];
const LOCATION_COLORS = {
  Pamplona: "#ef4444",
  Bilbao: "#3b82f6",
  Burgos: "#f59e0b",
  "San Sebastián": "#22c55e",
  Vitoria: "#a855f7",
  Zaragoza: "#06b6d4",
};

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════
function voidRate(op) {
  return ((op.voids / op.transactions) * 100).toFixed(1);
}

function avgVoidAmount(op) {
  return op.voids > 0 ? (op.totalAmount / op.voids).toFixed(0) : 0;
}

function isOutlier(op, allOps) {
  const rates = allOps.map((o) => o.voids / o.transactions);
  const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
  const std = Math.sqrt(rates.map((r) => (r - mean) ** 2).reduce((a, b) => a + b, 0) / rates.length);
  const opRate = op.voids / op.transactions;
  return opRate > mean + 1.8 * std;
}

function riskLevel(op) {
  const rate = (op.voids / op.transactions) * 100;
  const avg = op.voids > 0 ? op.totalAmount / op.voids : 0;
  if (rate > 5 && avg > 30) return "critical";
  if (rate > 3 || avg > 25) return "elevated";
  if (rate > 1.5) return "moderate";
  return "low";
}

const RISK_CONFIG = {
  critical: { label: "Crítico", color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)" },
  elevated: { label: "Elevado", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" },
  moderate: { label: "Moderado", color: "#3b82f6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)" },
  low: { label: "Bajo", color: "#22c55e", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)" },
};

// ═══════════════════════════════════════════════════════
// BUBBLE CHART — Custom SVG (no recharts dependency for scatter)
// ═══════════════════════════════════════════════════════
function BubbleChart({ data, allData, selected, onSelect, onHover, hovered, width, height }) {
  const pad = { top: 40, right: 40, bottom: 56, left: 64 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;

  const maxVoids = Math.max(...data.map((d) => d.voids)) * 1.15;
  const maxAvg = Math.max(...data.map((d) => Number(avgVoidAmount(d)))) * 1.2;
  const maxTotal = Math.max(...data.map((d) => d.totalAmount));

  const xScale = (v) => pad.left + (v / maxVoids) * w;
  const yScale = (v) => pad.top + h - (v / maxAvg) * h;
  const rScale = (v) => 8 + (v / maxTotal) * 28;

  // Threshold lines
  const thresholdRate = 3;
  const thresholdVoids = Math.round((thresholdRate / 100) * 450);
  const thresholdAvg = 30;

  // Grid lines
  const xTicks = [0, Math.round(maxVoids * 0.25), Math.round(maxVoids * 0.5), Math.round(maxVoids * 0.75), Math.round(maxVoids)];
  const yTicks = [0, Math.round(maxAvg * 0.25), Math.round(maxAvg * 0.5), Math.round(maxAvg * 0.75), Math.round(maxAvg)];

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      {/* Background */}
      <rect x={pad.left} y={pad.top} width={w} height={h} fill="rgba(255,255,255,0.015)" rx={4} />

      {/* Grid */}
      {xTicks.map((t) => (
        <g key={`xg-${t}`}>
          <line x1={xScale(t)} y1={pad.top} x2={xScale(t)} y2={pad.top + h} stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
          <text x={xScale(t)} y={pad.top + h + 20} textAnchor="middle" fill="#64748b" fontSize={11} fontFamily="'JetBrains Mono', monospace">
            {t}
          </text>
        </g>
      ))}
      {yTicks.map((t) => (
        <g key={`yg-${t}`}>
          <line x1={pad.left} y1={yScale(t)} x2={pad.left + w} y2={yScale(t)} stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
          <text x={pad.left - 12} y={yScale(t) + 4} textAnchor="end" fill="#64748b" fontSize={11} fontFamily="'JetBrains Mono', monospace">
            €{t}
          </text>
        </g>
      ))}

      {/* Axis labels */}
      <text x={pad.left + w / 2} y={height - 6} textAnchor="middle" fill="#94a3b8" fontSize={12} fontWeight={500} fontFamily="'DM Sans', sans-serif">
        Nº de anulaciones (30 días)
      </text>
      <text transform={`translate(16, ${pad.top + h / 2}) rotate(-90)`} textAnchor="middle" fill="#94a3b8" fontSize={12} fontWeight={500} fontFamily="'DM Sans', sans-serif">
        Importe medio por anulación (€)
      </text>

      {/* Danger zone — top right quadrant */}
      <rect
        x={xScale(thresholdVoids)}
        y={pad.top}
        width={pad.left + w - xScale(thresholdVoids)}
        height={yScale(thresholdAvg) - pad.top}
        fill="rgba(239,68,68,0.04)"
        rx={3}
      />
      <text x={xScale(thresholdVoids) + 6} y={pad.top + 16} fill="rgba(239,68,68,0.4)" fontSize={10} fontWeight={600} fontFamily="'DM Sans', sans-serif">
        ZONA DE RIESGO
      </text>

      {/* Threshold lines */}
      <line x1={xScale(thresholdVoids)} y1={pad.top} x2={xScale(thresholdVoids)} y2={pad.top + h} stroke="rgba(239,68,68,0.2)" strokeDasharray="6 4" strokeWidth={1.5} />
      <line x1={pad.left} y1={yScale(thresholdAvg)} x2={pad.left + w} y2={yScale(thresholdAvg)} stroke="rgba(239,68,68,0.2)" strokeDasharray="6 4" strokeWidth={1.5} />

      {/* Threshold labels */}
      <text x={xScale(thresholdVoids) + 4} y={pad.top + h + 36} fill="rgba(239,68,68,0.5)" fontSize={10} fontFamily="'DM Sans', sans-serif">
        ~3% ratio
      </text>
      <text x={pad.left + w + 4} y={yScale(thresholdAvg) + 4} fill="rgba(239,68,68,0.5)" fontSize={10} fontFamily="'DM Sans', sans-serif">
        €{thresholdAvg}
      </text>

      {/* Bubbles */}
      {data.map((op) => {
        const cx = xScale(op.voids);
        const cy = yScale(Number(avgVoidAmount(op)));
        const r = rScale(op.totalAmount);
        const isHov = hovered === op.id;
        const isSel = selected === op.id;
        const isOut = isOutlier(op, allData);
        const color = LOCATION_COLORS[op.location];
        const risk = riskLevel(op);
        const dimmed = selected && !isSel && !isHov;

        return (
          <g
            key={op.id}
            onClick={() => onSelect(isSel ? null : op.id)}
            onMouseEnter={() => onHover(op.id)}
            onMouseLeave={() => onHover(null)}
            style={{ cursor: "pointer", transition: "opacity 0.2s" }}
            opacity={dimmed ? 0.25 : 1}
          >
            {/* Outlier pulse */}
            {isOut && !dimmed && (
              <circle cx={cx} cy={cy} r={r + 6} fill="none" stroke={RISK_CONFIG[risk].color} strokeWidth={1} opacity={0.3}>
                <animate attributeName="r" values={`${r + 4};${r + 12};${r + 4}`} dur="2.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;0.05;0.3" dur="2.5s" repeatCount="indefinite" />
              </circle>
            )}

            {/* Main bubble */}
            <circle
              cx={cx}
              cy={cy}
              r={isHov || isSel ? r + 2 : r}
              fill={color}
              fillOpacity={isHov || isSel ? 0.35 : 0.2}
              stroke={color}
              strokeWidth={isHov || isSel ? 2.5 : 1.5}
              strokeOpacity={isHov || isSel ? 1 : 0.6}
              style={{ transition: "all 0.2s" }}
            />

            {/* Center dot */}
            <circle cx={cx} cy={cy} r={3} fill={color} opacity={0.9} />

            {/* Label for outliers or hovered */}
            {(isOut || isHov || isSel) && !dimmed && (
              <text
                x={cx}
                y={cy - r - 8}
                textAnchor="middle"
                fill={isOut ? RISK_CONFIG[risk].color : "#e2e8f0"}
                fontSize={11}
                fontWeight={600}
                fontFamily="'DM Sans', sans-serif"
              >
                {op.name}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════
// DETAIL PANEL
// ═══════════════════════════════════════════════════════
function DetailPanel({ op, allOps }) {
  if (!op) return null;
  const risk = riskLevel(op);
  const rc = RISK_CONFIG[risk];
  const rate = voidRate(op);
  const avg = avgVoidAmount(op);
  const isOut = isOutlier(op, allOps);
  const color = LOCATION_COLORS[op.location];

  // Peer comparison
  const peers = allOps.filter((o) => o.id !== op.id && o.location === op.location);
  const peerAvgRate = peers.length > 0 ? (peers.reduce((s, p) => s + (p.voids / p.transactions) * 100, 0) / peers.length).toFixed(1) : "—";
  const peerAvgAmount = peers.length > 0 ? Math.round(peers.reduce((s, p) => s + (p.voids > 0 ? p.totalAmount / p.voids : 0), 0) / peers.length) : "—";

  const flags = [];
  if (op.postClose > 0) flags.push({ icon: "⚠️", text: `${op.postClose} anulaciones post-cierre`, severity: "high" });
  if (op.withSupervisor === 0 && op.voids > 10) flags.push({ icon: "🔓", text: "Anulaciones sin autorización de supervisor", severity: "high" });
  if (Number(avg) > 50) flags.push({ icon: "💶", text: `Importe medio €${avg} (muy por encima del ticket medio €${op.avgTicket})`, severity: "medium" });
  if (op.topCategory === "Alcohol premium") flags.push({ icon: "🍷", text: "Concentración en alcohol premium (alto margen)", severity: "medium" });
  if (Number(rate) > Number(peerAvgRate) * 2) flags.push({ icon: "📊", text: `Ratio ${rate}% vs ${peerAvgRate}% de sus compañeros`, severity: "high" });

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: `1px solid ${rc.border}`,
        borderRadius: 14,
        padding: "20px 22px",
        animation: "fadeIn 0.25s ease",
      }}
    >
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
            <span style={{ fontSize: 17, fontWeight: 700, color: "#f1f5f9" }}>{op.name}</span>
            {isOut && (
              <span style={{ fontSize: 10, fontWeight: 700, color: rc.color, background: rc.bg, padding: "2px 8px", borderRadius: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
                outlier
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", display: "flex", gap: 12 }}>
            <span>{op.location}</span>
            <span>·</span>
            <span>{op.role}</span>
            <span>·</span>
            <span>Turno {op.shift}</span>
          </div>
        </div>
        <div style={{ background: rc.bg, border: `1px solid ${rc.border}`, borderRadius: 8, padding: "6px 14px", textAlign: "center" }}>
          <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Riesgo</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: rc.color }}>{rc.label}</div>
        </div>
      </div>

      {/* Metrics grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Anulaciones", value: op.voids, sub: `de ${op.transactions} txns` },
          { label: "Ratio", value: `${rate}%`, sub: `peers: ${peerAvgRate}%` },
          { label: "Importe total", value: `€${op.totalAmount.toLocaleString()}`, sub: `media €${avg}` },
          { label: "Máx. unitario", value: `€${op.maxSingleVoid}`, sub: `ticket: €${op.avgTicket}` },
        ].map((m) => (
          <div key={m.label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>{m.value}</div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Secondary metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 4 }}>Con supervisor</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 600, color: op.withSupervisor === 0 && op.voids > 5 ? "#ef4444" : "#e2e8f0" }}>
            {op.withSupervisor} de {op.voids}
          </div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{op.voids > 0 ? Math.round((op.withSupervisor / op.voids) * 100) : 0}% supervisadas</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 4 }}>Post-cierre</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 600, color: op.postClose > 0 ? "#ef4444" : "#22c55e" }}>
            {op.postClose}
          </div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{op.postClose > 0 ? "Requiere investigación" : "Ninguna"}</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 4 }}>Categoría top</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: op.topCategory === "Alcohol premium" ? "#f59e0b" : "#e2e8f0" }}>
            {op.topCategory}
          </div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>Más anulado por importe</div>
        </div>
      </div>

      {/* Flags */}
      {flags.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>
            Señales detectadas
          </div>
          {flags.map((f, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                borderRadius: 8,
                background: f.severity === "high" ? "rgba(239,68,68,0.06)" : "rgba(245,158,11,0.06)",
                border: `1px solid ${f.severity === "high" ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.1)"}`,
              }}
            >
              <span style={{ fontSize: 14 }}>{f.icon}</span>
              <span style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.4 }}>{f.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════
export default function VoidBubbleChart() {
  const [selectedLocs, setSelectedLocs] = useState(new Set(LOCATIONS));
  const [selectedOp, setSelectedOp] = useState(null);
  const [hoveredOp, setHoveredOp] = useState(null);
  const chartRef = useRef(null);
  const [chartSize, setChartSize] = useState({ w: 700, h: 440 });

  useEffect(() => {
    function measure() {
      if (chartRef.current) {
        const rect = chartRef.current.getBoundingClientRect();
        setChartSize({ w: rect.width, h: 440 });
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const filteredOps = useMemo(
    () => OPERATORS.filter((op) => selectedLocs.has(op.location)),
    [selectedLocs]
  );

  const toggleLoc = (loc) => {
    setSelectedLocs((prev) => {
      const next = new Set(prev);
      if (next.has(loc)) {
        if (next.size > 1) next.delete(loc);
      } else {
        next.add(loc);
      }
      return next;
    });
  };

  const selectedOpData = OPERATORS.find((o) => o.id === selectedOp) || OPERATORS.find((o) => o.id === hoveredOp);

  // Summary stats
  const totalVoids = filteredOps.reduce((s, o) => s + o.voids, 0);
  const totalAmount = filteredOps.reduce((s, o) => s + o.totalAmount, 0);
  const outlierCount = filteredOps.filter((o) => isOutlier(o, filteredOps)).length;
  const avgRate = filteredOps.length > 0 ? (filteredOps.reduce((s, o) => s + (o.voids / o.transactions) * 100, 0) / filteredOps.length).toFixed(1) : "0";

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: "#0c0c1d", minHeight: "100vh", color: "#e2e8f0", padding: 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* ──── HEADER ──── */}
      <div style={{ background: "linear-gradient(180deg, #12122a 0%, #0c0c1d 100%)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: "0 4px 16px rgba(239,68,68,0.25)" }}>
              ↩️
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>Análisis de Anulaciones</h1>
          </div>
          <p style={{ fontSize: 12, color: "#64748b", marginTop: 4, marginLeft: 42 }}>
            Volumen × Importe × Operador · Identificación de outliers · Últimos 30 días
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ background: outlierCount > 0 ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)", border: `1px solid ${outlierCount > 0 ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`, borderRadius: 8, padding: "6px 14px", fontSize: 12, color: outlierCount > 0 ? "#ef4444" : "#22c55e", fontWeight: 600 }}>
            {outlierCount} outlier{outlierCount !== 1 ? "s" : ""} detectado{outlierCount !== 1 ? "s" : ""}
          </div>
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "#94a3b8" }}>
            Feb 2026
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 28px" }}>
        {/* ──── TOP ROW: Summary + Filters ──── */}
        <div style={{ display: "flex", gap: 16, marginBottom: 20, alignItems: "stretch" }}>
          {/* Summary cards */}
          {[
            { label: "Anulaciones", value: totalVoids, icon: "↩️" },
            { label: "Importe total", value: `€${totalAmount.toLocaleString()}`, icon: "💶" },
            { label: "Ratio medio", value: `${avgRate}%`, icon: "📊" },
            { label: "Outliers", value: outlierCount, icon: "🎯", alert: outlierCount > 0 },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                flex: 1,
                background: s.alert ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${s.alert ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)"}`,
                borderRadius: 12,
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <span style={{ fontSize: 22 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: s.alert ? "#ef4444" : "#f1f5f9" }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ──── LOCATION FILTERS ──── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500, alignSelf: "center", marginRight: 4 }}>Locales:</span>
          {LOCATIONS.map((loc) => {
            const active = selectedLocs.has(loc);
            return (
              <button
                key={loc}
                onClick={() => toggleLoc(loc)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 14px",
                  borderRadius: 20,
                  border: `1px solid ${active ? LOCATION_COLORS[loc] + "55" : "rgba(255,255,255,0.08)"}`,
                  background: active ? LOCATION_COLORS[loc] + "18" : "transparent",
                  color: active ? "#e2e8f0" : "#64748b",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: LOCATION_COLORS[loc], opacity: active ? 1 : 0.3 }} />
                {loc}
              </button>
            );
          })}
        </div>

        {/* ──── MAIN CONTENT: Chart + Detail ──── */}
        <div style={{ display: "flex", gap: 20 }}>
          {/* Bubble chart */}
          <div style={{ flex: 1, minWidth: 0 }} ref={chartRef}>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "8px 4px 4px" }}>
              <BubbleChart
                data={filteredOps}
                allData={filteredOps}
                selected={selectedOp}
                onSelect={setSelectedOp}
                onHover={setHoveredOp}
                hovered={hoveredOp}
                width={chartSize.w}
                height={chartSize.h}
              />
            </div>

            {/* Reading guide */}
            <div style={{ display: "flex", gap: 20, marginTop: 12, padding: "0 8px", fontSize: 11, color: "#475569" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }} />
                <span>Tamaño = importe total anulado</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", border: "1.5px solid rgba(239,68,68,0.5)", position: "relative" }}>
                  <div style={{ position: "absolute", inset: 2, borderRadius: "50%", background: "rgba(239,68,68,0.3)" }} />
                </div>
                <span>Pulso = outlier estadístico (&gt;1.8σ)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 20, height: 0, borderTop: "2px dashed rgba(239,68,68,0.3)" }} />
                <span>Línea = umbral de alerta</span>
              </div>
            </div>
          </div>

          {/* Detail panel */}
          <div style={{ width: 360, flexShrink: 0 }}>
            {selectedOpData ? (
              <DetailPanel op={selectedOpData} allOps={filteredOps} />
            ) : (
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "40px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>↩️</div>
                <div style={{ fontSize: 14, color: "#64748b", fontWeight: 500, marginBottom: 8 }}>Selecciona un operador</div>
                <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
                  Haz click en cualquier burbuja para ver el detalle de anulaciones del operador, señales de riesgo y comparativa con sus compañeros.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ──── OUTLIER TABLE ──── */}
        {outlierCount > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.2, color: "#64748b", fontWeight: 600, marginBottom: 12 }}>
              Operadores outlier — requieren investigación
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["Operador", "Local", "Turno", "Anulaciones", "Ratio", "Importe", "Post-cierre", "Sin supervisor", "Categoría top"].map((h) => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredOps
                    .filter((op) => isOutlier(op, filteredOps))
                    .sort((a, b) => b.totalAmount - a.totalAmount)
                    .map((op) => {
                      const risk = riskLevel(op);
                      const rc = RISK_CONFIG[risk];
                      return (
                        <tr
                          key={op.id}
                          onClick={() => setSelectedOp(op.id)}
                          style={{
                            borderBottom: "1px solid rgba(255,255,255,0.03)",
                            cursor: "pointer",
                            background: selectedOp === op.id ? "rgba(255,255,255,0.04)" : "transparent",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; setHoveredOp(op.id); }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = selectedOp === op.id ? "rgba(255,255,255,0.04)" : "transparent"; setHoveredOp(null); }}
                        >
                          <td style={{ padding: "10px 14px", fontWeight: 600 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: LOCATION_COLORS[op.location] }} />
                              {op.name}
                            </div>
                          </td>
                          <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{op.location}</td>
                          <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{op.shift}</td>
                          <td style={{ padding: "10px 14px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{op.voids}</td>
                          <td style={{ padding: "10px 14px" }}>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: rc.color }}>{voidRate(op)}%</span>
                          </td>
                          <td style={{ padding: "10px 14px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>€{op.totalAmount.toLocaleString()}</td>
                          <td style={{ padding: "10px 14px" }}>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: op.postClose > 0 ? "#ef4444" : "#475569" }}>
                              {op.postClose}
                            </span>
                          </td>
                          <td style={{ padding: "10px 14px" }}>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: op.withSupervisor === 0 && op.voids > 5 ? "#ef4444" : "#475569" }}>
                              {op.voids - op.withSupervisor}
                            </span>
                          </td>
                          <td style={{ padding: "10px 14px", color: op.topCategory === "Alcohol premium" ? "#f59e0b" : "#94a3b8" }}>
                            {op.topCategory}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ──── FOOTER ──── */}
      <div style={{ padding: "16px 28px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#475569" }}>
        <div>Outlier = operador cuyo ratio de anulaciones supera la media + 1.8 desviaciones estándar del grupo filtrado</div>
        <div>Fuente: POS · Datos de los últimos 30 días</div>
      </div>
    </div>
  );
}
