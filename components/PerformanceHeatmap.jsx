import { useState, useMemo } from "react";

// ═══════════════════════════════════════════════════════
// DATA — 6 locations × 7 days × multiple metrics
// ═══════════════════════════════════════════════════════

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DAYS_SHORT = ["L", "M", "X", "J", "V", "S", "D"];
const DATES = ["17 Feb", "18 Feb", "19 Feb", "20 Feb", "21 Feb", "22 Feb", "23 Feb"];

const METRICS = {
  revenue: { label: "Ingresos", unit: "€", format: (v) => `€${v.toLocaleString()}`, icon: "💰" },
  covers: { label: "Comensales", unit: "", format: (v) => v.toString(), icon: "👥" },
  ticket: { label: "Ticket medio", unit: "€", format: (v) => `€${v.toFixed(1)}`, icon: "🧾" },
  food_cost: { label: "Food Cost %", unit: "%", format: (v) => `${v.toFixed(1)}%`, icon: "🍽️", inverted: true },
  labor_cost: { label: "Labor Cost %", unit: "%", format: (v) => `${v.toFixed(1)}%`, icon: "👷", inverted: true },
  prime_cost: { label: "Prime Cost %", unit: "%", format: (v) => `${v.toFixed(1)}%`, icon: "📊", inverted: true },
};

// Objectives per location
const OBJECTIVES = {
  Pamplona: { revenue: 4800, covers: 140, ticket: 34, food_cost: 28, labor_cost: 30, prime_cost: 58 },
  Bilbao: { revenue: 4200, covers: 120, ticket: 35, food_cost: 27, labor_cost: 31, prime_cost: 58 },
  Burgos: { revenue: 3800, covers: 110, ticket: 34, food_cost: 29, labor_cost: 29, prime_cost: 58 },
  "San Sebastián": { revenue: 5500, covers: 130, ticket: 42, food_cost: 26, labor_cost: 28, prime_cost: 54 },
  Vitoria: { revenue: 3500, covers: 100, ticket: 35, food_cost: 28, labor_cost: 32, prime_cost: 60 },
  Zaragoza: { revenue: 4000, covers: 115, ticket: 34, food_cost: 28, labor_cost: 30, prime_cost: 58 },
};

const DATA = {
  Pamplona: {
    revenue:    [4200, 3800, 4500, 4900, 6200, 7100, 5400],
    covers:     [120,  108,  130,  142,  175,  198,  155],
    ticket:     [35.0, 35.2, 34.6, 34.5, 35.4, 35.9, 34.8],
    food_cost:  [27.2, 28.5, 26.8, 27.0, 29.1, 30.2, 28.0],
    labor_cost: [31.0, 33.2, 30.5, 29.8, 27.5, 26.0, 28.5],
    prime_cost: [58.2, 61.7, 57.3, 56.8, 56.6, 56.2, 56.5],
    channels:   { sala: 72, delivery: 18, takeaway: 10 },
    shifts:     { lunch: 45, dinner: 55 },
  },
  Bilbao: {
    revenue:    [3900, 4100, 3700, 4300, 5100, 5800, 4600],
    covers:     [112,  118,  106,  124,  148,  168,  132],
    ticket:     [34.8, 34.7, 34.9, 34.7, 34.5, 34.5, 34.8],
    food_cost:  [26.5, 26.8, 27.0, 26.2, 27.5, 28.0, 26.8],
    labor_cost: [30.5, 30.0, 31.2, 29.8, 28.5, 27.0, 29.5],
    prime_cost: [57.0, 56.8, 58.2, 56.0, 56.0, 55.0, 56.3],
    channels:   { sala: 78, delivery: 14, takeaway: 8 },
    shifts:     { lunch: 42, dinner: 58 },
  },
  Burgos: {
    revenue:    [3200, 3000, 3400, 3600, 4800, 5500, 4200],
    covers:     [94,   88,   100,  106,  140,  162,  124],
    ticket:     [34.0, 34.1, 34.0, 34.0, 34.3, 34.0, 33.9],
    food_cost:  [28.5, 29.2, 28.0, 28.8, 30.5, 31.0, 29.0],
    labor_cost: [30.0, 31.5, 29.5, 29.0, 27.0, 26.5, 28.0],
    prime_cost: [58.5, 60.7, 57.5, 57.8, 57.5, 57.5, 57.0],
    channels:   { sala: 80, delivery: 12, takeaway: 8 },
    shifts:     { lunch: 48, dinner: 52 },
  },
  "San Sebastián": {
    revenue:    [5200, 5000, 5400, 5800, 7200, 8100, 6300],
    covers:     [124,  119,  129,  138,  172,  193,  150],
    ticket:     [41.9, 42.0, 41.9, 42.0, 41.9, 42.0, 42.0],
    food_cost:  [25.5, 25.8, 25.2, 25.0, 26.0, 26.5, 25.5],
    labor_cost: [27.5, 28.0, 27.0, 26.5, 25.0, 24.0, 26.0],
    prime_cost: [53.0, 53.8, 52.2, 51.5, 51.0, 50.5, 51.5],
    channels:   { sala: 85, delivery: 10, takeaway: 5 },
    shifts:     { lunch: 40, dinner: 60 },
  },
  Vitoria: {
    revenue:    [3100, 2800, 3200, 3400, 4200, 4800, 3600],
    covers:     [89,   80,   92,   97,   120,  137,  103],
    ticket:     [34.8, 35.0, 34.8, 35.1, 35.0, 35.0, 35.0],
    food_cost:  [28.0, 29.5, 27.8, 28.2, 29.8, 30.5, 28.5],
    labor_cost: [33.0, 35.0, 32.5, 32.0, 30.0, 29.0, 31.5],
    prime_cost: [61.0, 64.5, 60.3, 60.2, 59.8, 59.5, 60.0],
    channels:   { sala: 75, delivery: 16, takeaway: 9 },
    shifts:     { lunch: 44, dinner: 56 },
  },
  Zaragoza: {
    revenue:    [3800, 3600, 4000, 4200, 5300, 6000, 4500],
    covers:     [112,  106,  118,  124,  156,  176,  132],
    ticket:     [33.9, 34.0, 33.9, 33.9, 34.0, 34.1, 34.1],
    food_cost:  [27.5, 28.0, 27.2, 27.8, 28.5, 29.0, 27.8],
    labor_cost: [30.0, 30.5, 29.5, 29.0, 27.5, 26.5, 28.5],
    prime_cost: [57.5, 58.5, 56.7, 56.8, 56.0, 55.5, 56.3],
    channels:   { sala: 77, delivery: 15, takeaway: 8 },
    shifts:     { lunch: 46, dinner: 54 },
  },
};

const LOCATIONS = Object.keys(DATA);

// ═══════════════════════════════════════════════════════
// HELPERS — Performance relative to objective
// ═══════════════════════════════════════════════════════
function perfRatio(value, objective, inverted) {
  if (!objective) return 1;
  if (inverted) {
    // For costs: lower is better. ratio > 1 means over-spending
    return value / objective;
  }
  return value / objective;
}

function heatColor(value, objective, inverted) {
  const ratio = perfRatio(value, objective, inverted);
  if (inverted) {
    // Costs: green when below objective, red when above
    if (ratio <= 0.92) return { bg: "#064e3b", text: "#34d399", intensity: "excellent" };
    if (ratio <= 1.0)  return { bg: "#14532d", text: "#4ade80", intensity: "good" };
    if (ratio <= 1.05) return { bg: "#422006", text: "#fbbf24", intensity: "attention" };
    if (ratio <= 1.12) return { bg: "#7c2d12", text: "#fb923c", intensity: "warning" };
    return { bg: "#7f1d1d", text: "#f87171", intensity: "critical" };
  } else {
    // Revenue/covers: green when above objective
    if (ratio >= 1.15) return { bg: "#064e3b", text: "#34d399", intensity: "excellent" };
    if (ratio >= 1.0)  return { bg: "#14532d", text: "#4ade80", intensity: "good" };
    if (ratio >= 0.90) return { bg: "#422006", text: "#fbbf24", intensity: "attention" };
    if (ratio >= 0.80) return { bg: "#7c2d12", text: "#fb923c", intensity: "warning" };
    return { bg: "#7f1d1d", text: "#f87171", intensity: "critical" };
  }
}

function weekTotal(loc, metric) {
  return DATA[loc][metric].reduce((s, v) => s + v, 0);
}

function weekAvg(loc, metric) {
  const arr = DATA[loc][metric];
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

// ═══════════════════════════════════════════════════════
// SPARKLINE — tiny inline trend
// ═══════════════════════════════════════════════════════
function Sparkline({ data, color, width = 60, height = 20 }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* End dot */}
      {data.length > 0 && (() => {
        const lastX = width;
        const lastY = height - ((data[data.length - 1] - min) / range) * (height - 4) - 2;
        return <circle cx={lastX} cy={lastY} r={2} fill={color} />;
      })()}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════
// CHANNEL BAR — stacked mini bar
// ═══════════════════════════════════════════════════════
function ChannelBar({ channels, width = 100 }) {
  const colors = { sala: "#22c55e", delivery: "#f59e0b", takeaway: "#3b82f6" };
  let offset = 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", width }}>
        {Object.entries(channels).map(([ch, pct]) => {
          const w = (pct / 100) * width;
          const el = <div key={ch} style={{ width: w, height: "100%", background: colors[ch], opacity: 0.7 }} />;
          offset += w;
          return el;
        })}
      </div>
      <div style={{ display: "flex", gap: 8, fontSize: 9, color: "#64748b" }}>
        {Object.entries(channels).map(([ch, pct]) => (
          <span key={ch} style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <span style={{ width: 5, height: 5, borderRadius: 1, background: colors[ch], opacity: 0.7, display: "inline-block" }} />
            {ch === "sala" ? "Sala" : ch === "delivery" ? "Dlvry" : "Take"} {pct}%
          </span>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════
export default function PerformanceHeatmap() {
  const [selectedMetric, setSelectedMetric] = useState("revenue");
  const [selectedCell, setSelectedCell] = useState(null); // { loc, day }
  const [hoveredCell, setHoveredCell] = useState(null);
  const [sortBy, setSortBy] = useState("performance"); // performance | alpha | total

  const metric = METRICS[selectedMetric];
  const isInverted = metric.inverted || false;

  // Sort locations
  const sortedLocations = useMemo(() => {
    const locs = [...LOCATIONS];
    if (sortBy === "alpha") return locs.sort();
    if (sortBy === "total") {
      return locs.sort((a, b) => {
        const totA = weekTotal(a, selectedMetric);
        const totB = weekTotal(b, selectedMetric);
        return isInverted ? totA - totB : totB - totA;
      });
    }
    // performance: best performing vs objective
    return locs.sort((a, b) => {
      const avgA = weekAvg(a, selectedMetric);
      const avgB = weekAvg(b, selectedMetric);
      const objA = OBJECTIVES[a][selectedMetric];
      const objB = OBJECTIVES[b][selectedMetric];
      const perfA = isInverted ? objA / avgA : avgA / objA;
      const perfB = isInverted ? objB / avgB : avgB / objB;
      return perfB - perfA;
    });
  }, [selectedMetric, sortBy, isInverted]);

  // Group totals
  const groupDayTotals = useMemo(() => {
    return DAYS.map((_, dayIdx) => {
      const values = LOCATIONS.map((loc) => DATA[loc][selectedMetric][dayIdx]);
      if (selectedMetric === "revenue" || selectedMetric === "covers") {
        return values.reduce((s, v) => s + v, 0);
      }
      return values.reduce((s, v) => s + v, 0) / values.length;
    });
  }, [selectedMetric]);

  const groupWeekTotal = useMemo(() => {
    if (selectedMetric === "revenue" || selectedMetric === "covers") {
      return LOCATIONS.reduce((s, loc) => s + weekTotal(loc, selectedMetric), 0);
    }
    return LOCATIONS.reduce((s, loc) => s + weekAvg(loc, selectedMetric), 0) / LOCATIONS.length;
  }, [selectedMetric]);

  // Detail for selected cell
  const cellDetail = useMemo(() => {
    const c = selectedCell || hoveredCell;
    if (!c) return null;
    const { loc, day } = c;
    const dayIdx = day;
    const val = DATA[loc][selectedMetric][dayIdx];
    const obj = OBJECTIVES[loc][selectedMetric];
    const hc = heatColor(val, obj, isInverted);

    // All metrics for this cell
    const allMetrics = {};
    Object.keys(METRICS).forEach((m) => {
      allMetrics[m] = {
        value: DATA[loc][m][dayIdx],
        objective: OBJECTIVES[loc][m],
        ...METRICS[m],
      };
    });

    return { loc, dayIdx, dayName: DAYS[dayIdx], date: DATES[dayIdx], val, obj, hc, allMetrics, channels: DATA[loc].channels, shifts: DATA[loc].shifts };
  }, [selectedCell, hoveredCell, selectedMetric, isInverted]);

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: "#0c0c1d", minHeight: "100vh", color: "#e2e8f0", padding: 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* ──── HEADER ──── */}
      <div style={{ background: "linear-gradient(180deg, #12122a 0%, #0c0c1d 100%)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: "0 4px 16px rgba(124,58,237,0.25)" }}>
              📊
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>Vista Express</h1>
          </div>
          <p style={{ fontSize: 12, color: "#64748b", marginTop: 4, marginLeft: 42 }}>
            Rendimiento por local · Semana 17–23 Feb 2026
          </p>
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "#94a3b8" }}>
          Semana 8 · 2026
        </div>
      </div>

      <div style={{ padding: "20px 28px" }}>
        {/* ──── METRIC SELECTOR ──── */}
        <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
          {Object.entries(METRICS).map(([key, m]) => {
            const active = selectedMetric === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedMetric(key)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 16px", borderRadius: 10,
                  border: `1px solid ${active ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.06)"}`,
                  background: active ? "rgba(124,58,237,0.12)" : "transparent",
                  color: active ? "#e2e8f0" : "#64748b",
                  fontSize: 13, fontWeight: active ? 600 : 400, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 14 }}>{m.icon}</span>
                {m.label}
              </button>
            );
          })}

          <div style={{ marginLeft: "auto", display: "flex", gap: 4, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#475569", marginRight: 4 }}>Ordenar:</span>
            {[
              { key: "performance", label: "Rendimiento" },
              { key: "total", label: "Volumen" },
              { key: "alpha", label: "A-Z" },
            ].map((s) => (
              <button key={s.key} onClick={() => setSortBy(s.key)} style={{
                padding: "4px 10px", borderRadius: 14, fontSize: 10, fontWeight: 500, cursor: "pointer",
                border: `1px solid ${sortBy === s.key ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)"}`,
                background: sortBy === s.key ? "rgba(255,255,255,0.06)" : "transparent",
                color: sortBy === s.key ? "#cbd5e1" : "#475569",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 20 }}>
          {/* ──── HEATMAP TABLE ──── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, overflow: "hidden" }}>
              {/* Column headers */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "160px repeat(7, 1fr) 80px 70px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Local
                </div>
                {DAYS.map((day, i) => (
                  <div key={day} style={{ padding: "10px 4px", textAlign: "center" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: i >= 5 ? "#94a3b8" : "#475569" }}>{DAYS_SHORT[i]}</div>
                    <div style={{ fontSize: 9, color: "#3f3f46" }}>{DATES[i]}</div>
                  </div>
                ))}
                <div style={{ padding: "10px 8px", textAlign: "center", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  Sem
                </div>
                <div style={{ padding: "10px 8px", textAlign: "center", fontSize: 10, fontWeight: 700, color: "#64748b" }}>
                  Trend
                </div>
              </div>

              {/* Location rows */}
              {sortedLocations.map((loc, locIdx) => {
                const weekVal = selectedMetric === "revenue" || selectedMetric === "covers"
                  ? weekTotal(loc, selectedMetric)
                  : weekAvg(loc, selectedMetric);
                const weekObj = selectedMetric === "revenue" || selectedMetric === "covers"
                  ? OBJECTIVES[loc][selectedMetric] * 7
                  : OBJECTIVES[loc][selectedMetric];
                const weekHc = heatColor(weekVal, weekObj, isInverted);

                return (
                  <div
                    key={loc}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "160px repeat(7, 1fr) 80px 70px",
                      borderBottom: locIdx < sortedLocations.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
                      alignItems: "center",
                    }}
                  >
                    {/* Location name */}
                    <div style={{ padding: "10px 16px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{loc}</div>
                      <div style={{ fontSize: 10, color: "#475569" }}>
                        Obj: {metric.format(OBJECTIVES[loc][selectedMetric])}/día
                      </div>
                    </div>

                    {/* Day cells — THE HEATMAP */}
                    {DAYS.map((_, dayIdx) => {
                      const val = DATA[loc][selectedMetric][dayIdx];
                      const obj = OBJECTIVES[loc][selectedMetric];
                      const hc = heatColor(val, obj, isInverted);
                      const isSel = selectedCell?.loc === loc && selectedCell?.day === dayIdx;
                      const isHov = hoveredCell?.loc === loc && hoveredCell?.day === dayIdx;

                      return (
                        <div
                          key={dayIdx}
                          onClick={() => setSelectedCell(isSel ? null : { loc, day: dayIdx })}
                          onMouseEnter={() => setHoveredCell({ loc, day: dayIdx })}
                          onMouseLeave={() => setHoveredCell(null)}
                          style={{
                            margin: "3px 2px",
                            padding: "8px 4px",
                            borderRadius: 8,
                            textAlign: "center",
                            background: hc.bg,
                            border: isSel ? `2px solid ${hc.text}` : isHov ? `1px solid ${hc.text}44` : "1px solid transparent",
                            cursor: "pointer",
                            transition: "all 0.15s",
                            position: "relative",
                          }}
                        >
                          <div style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 13,
                            fontWeight: 700,
                            color: hc.text,
                            lineHeight: 1,
                          }}>
                            {selectedMetric === "revenue"
                              ? `${(val / 1000).toFixed(1)}k`
                              : metric.format(val)}
                          </div>
                          {/* Vs objective micro indicator */}
                          <div style={{ fontSize: 9, color: hc.text, opacity: 0.6, marginTop: 2 }}>
                            {isInverted
                              ? (val <= obj ? "✓" : `+${(val - obj).toFixed(1)}`)
                              : (val >= obj ? "✓" : `${Math.round(((val - obj) / obj) * 100)}%`)}
                          </div>
                        </div>
                      );
                    })}

                    {/* Week total/avg */}
                    <div style={{ padding: "8px", textAlign: "center" }}>
                      <div style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 13,
                        fontWeight: 700,
                        color: weekHc.text,
                      }}>
                        {selectedMetric === "revenue"
                          ? `${(weekVal / 1000).toFixed(1)}k`
                          : metric.format(weekVal)}
                      </div>
                    </div>

                    {/* Sparkline */}
                    <div style={{ padding: "8px 6px", display: "flex", justifyContent: "center" }}>
                      <Sparkline data={DATA[loc][selectedMetric]} color={weekHc.text} />
                    </div>
                  </div>
                );
              })}

              {/* ──── GROUP TOTAL ROW ──── */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "160px repeat(7, 1fr) 80px 70px",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.02)",
                alignItems: "center",
              }}>
                <div style={{ padding: "10px 16px", fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>
                  {selectedMetric === "revenue" || selectedMetric === "covers" ? "Total grupo" : "Media grupo"}
                </div>
                {DAYS.map((_, dayIdx) => (
                  <div key={dayIdx} style={{ margin: "3px 2px", padding: "8px 4px", textAlign: "center" }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>
                      {selectedMetric === "revenue"
                        ? `${(groupDayTotals[dayIdx] / 1000).toFixed(1)}k`
                        : METRICS[selectedMetric].format(groupDayTotals[dayIdx])}
                    </div>
                  </div>
                ))}
                <div style={{ padding: "8px", textAlign: "center" }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>
                    {selectedMetric === "revenue"
                      ? `${(groupWeekTotal / 1000).toFixed(1)}k`
                      : METRICS[selectedMetric].format(groupWeekTotal)}
                  </div>
                </div>
                <div style={{ padding: "8px 6px", display: "flex", justifyContent: "center" }}>
                  <Sparkline data={groupDayTotals} color="#94a3b8" />
                </div>
              </div>
            </div>

            {/* ──── LEGEND ──── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, padding: "0 4px" }}>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#475569", marginRight: 6 }}>
                  {isInverted ? "Coste vs objetivo:" : "Rendimiento vs objetivo:"}
                </span>
                {(isInverted
                  ? [
                      { bg: "#064e3b", label: "Muy bajo" },
                      { bg: "#14532d", label: "Bajo" },
                      { bg: "#422006", label: "Ligeramente alto" },
                      { bg: "#7c2d12", label: "Alto" },
                      { bg: "#7f1d1d", label: "Muy alto" },
                    ]
                  : [
                      { bg: "#7f1d1d", label: "<80%" },
                      { bg: "#7c2d12", label: "80-90%" },
                      { bg: "#422006", label: "90-100%" },
                      { bg: "#14532d", label: "100-115%" },
                      { bg: "#064e3b", label: ">115%" },
                    ]
                ).map((item) => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 14, height: 10, borderRadius: 2, background: item.bg }} />
                    <span style={{ fontSize: 10, color: "#475569" }}>{item.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 10, color: "#3f3f46" }}>
                ✓ = cumple objetivo · Click celda = detalle
              </div>
            </div>
          </div>

          {/* ──── RIGHT: CELL DETAIL PANEL ──── */}
          <div style={{ width: 300, flexShrink: 0 }}>
            {cellDetail ? (
              <div style={{
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${cellDetail.hc.text}22`,
                borderRadius: 14,
                padding: "18px 20px",
                animation: "fadeIn 0.2s ease",
                position: "sticky",
                top: 20,
              }}>
                <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }`}</style>

                {/* Header */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>{cellDetail.loc}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{cellDetail.dayName} {cellDetail.date}</div>
                </div>

                {/* All metrics for this day/location */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                  {Object.entries(cellDetail.allMetrics).map(([key, m]) => {
                    const hc = heatColor(m.value, m.objective, m.inverted);
                    const isActive = key === selectedMetric;
                    return (
                      <div
                        key={key}
                        onClick={() => setSelectedMetric(key)}
                        style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "8px 12px", borderRadius: 8, cursor: "pointer",
                          background: isActive ? hc.bg : "rgba(255,255,255,0.02)",
                          border: `1px solid ${isActive ? hc.text + "33" : "rgba(255,255,255,0.04)"}`,
                          transition: "all 0.15s",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 13 }}>{m.icon}</span>
                          <span style={{ fontSize: 12, fontWeight: isActive ? 600 : 400, color: isActive ? "#f1f5f9" : "#94a3b8" }}>
                            {m.label}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                          <span style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 14, fontWeight: 700,
                            color: isActive ? hc.text : "#cbd5e1",
                          }}>
                            {m.format(m.value)}
                          </span>
                          <span style={{ fontSize: 10, color: "#475569" }}>
                            / {m.format(m.objective)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Channel split */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                    Origen de ingresos
                  </div>
                  <ChannelBar channels={cellDetail.channels} width={250} />
                </div>

                {/* Shift split */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                    Distribución por turno
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ flex: cellDetail.shifts.lunch, background: "rgba(251,191,36,0.15)", borderRadius: 6, padding: "6px 10px", textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#fbbf24" }}>{cellDetail.shifts.lunch}%</div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>Comida</div>
                    </div>
                    <div style={{ flex: cellDetail.shifts.dinner, background: "rgba(96,165,250,0.15)", borderRadius: 6, padding: "6px 10px", textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#60a5fa" }}>{cellDetail.shifts.dinner}%</div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>Cena</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 14, padding: "40px 24px", textAlign: "center",
                position: "sticky", top: 20,
              }}>
                <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>🔍</div>
                <div style={{ fontSize: 14, color: "#64748b", fontWeight: 500, marginBottom: 6 }}>Explora el heatmap</div>
                <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
                  Pasa el ratón sobre cualquier celda para ver el detalle. Click para fijar la vista y comparar todas las métricas de ese día y local.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ──── FOOTER ──── */}
      <div style={{ padding: "16px 28px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#475569" }}>
        <div>Color = rendimiento vs objetivo diario · Verde = cumple o supera · Rojo = por debajo del 80%</div>
        <div>Fuente: POS · Datos del cierre diario</div>
      </div>
    </div>
  );
}
