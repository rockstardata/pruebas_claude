import { useState, useMemo } from "react";

// ═══════════════════════════════════════════════════════
// DATA — 6 locations × 7 days × 3 shifts
// Each shift has raw indicator values that feed the health score
// ═══════════════════════════════════════════════════════

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DAYS_SHORT = ["L", "M", "X", "J", "V", "S", "D"];
const DATES = ["17", "18", "19", "20", "21", "22", "23"];

const SHIFTS = {
  morning: { label: "Mañana", short: "M", hours: "8–16h", color: "#fbbf24" },
  afternoon: { label: "Tarde", short: "T", hours: "16–00h", color: "#60a5fa" },
  night: { label: "Noche", short: "N", hours: "00–8h", color: "#a78bfa" },
};

// Thresholds — these are the business rules, fully transparent
const THRESHOLDS = {
  cash_gap: { label: "Descuadre caja", unit: "€", icon: "💰", ok: 20, warn: 50, crit: 120, weight: 30 },
  void_rate: { label: "Ratio anulaciones", unit: "%", icon: "↩️", ok: 1.5, warn: 3.0, crit: 6.0, weight: 25 },
  discount_unauth: { label: "Descuentos no autorizados", unit: "", icon: "🏷️", ok: 0, warn: 2, crit: 5, weight: 20 },
  drawer_no_sale: { label: "Aperturas sin venta", unit: "", icon: "🔓", ok: 2, warn: 5, crit: 10, weight: 15 },
  avg_ticket_dev: { label: "Desviación ticket medio", unit: "%", icon: "🧾", ok: 10, warn: 20, crit: 35, weight: 10 },
};

// Generate shift data for all locations
// Format: indicators object with raw values for each threshold metric
function makeShift(cashGap, voidRate, discUnauth, drawerNoSale, ticketDev, transactions, revenue, manager) {
  return {
    cash_gap: cashGap,
    void_rate: voidRate,
    discount_unauth: discUnauth,
    drawer_no_sale: drawerNoSale,
    avg_ticket_dev: ticketDev,
    transactions,
    revenue,
    manager,
  };
}

const LOCATIONS_DATA = {
  Pamplona: {
    shifts: [
      // Day 0 (Mon): morning, afternoon, night
      [makeShift(8, 0.8, 0, 1, 5, 42, 1260, "Fernando D."), makeShift(15, 1.2, 0, 2, 8, 68, 2040, "Patricia E."), makeShift(85, 4.2, 3, 6, 18, 35, 900, "Roberto G.")],
      // Day 1 (Tue)
      [makeShift(5, 0.6, 0, 0, 3, 38, 1140, "Fernando D."), makeShift(12, 1.0, 1, 1, 6, 62, 1860, "Patricia E."), makeShift(92, 3.8, 2, 7, 22, 32, 800, "Roberto G.")],
      // Day 2 (Wed)
      [makeShift(10, 0.9, 0, 1, 7, 45, 1350, "Fernando D."), makeShift(18, 1.5, 0, 2, 9, 72, 2160, "Patricia E."), makeShift(55, 2.5, 1, 4, 12, 38, 990, "Roberto G.")],
      // Day 3 (Thu)
      [makeShift(6, 0.7, 0, 0, 4, 48, 1440, "Fernando D."), makeShift(22, 1.8, 1, 3, 11, 78, 2340, "Patricia E."), makeShift(140, 5.8, 4, 8, 28, 40, 1120, "Roberto G.")],
      // Day 4 (Fri)
      [makeShift(12, 1.0, 0, 1, 6, 55, 1925, "Fernando D."), makeShift(25, 2.0, 1, 3, 10, 95, 3325, "Patricia E."), makeShift(105, 4.5, 3, 7, 20, 52, 1560, "Roberto G.")],
      // Day 5 (Sat)
      [makeShift(15, 1.2, 0, 2, 8, 62, 2170, "Fernando D."), makeShift(30, 2.2, 2, 4, 14, 108, 3780, "Patricia E."), makeShift(130, 5.2, 4, 9, 25, 58, 1740, "Roberto G.")],
      // Day 6 (Sun)
      [makeShift(10, 0.8, 0, 1, 5, 50, 1750, "Fernando D."), makeShift(20, 1.4, 0, 2, 8, 82, 2870, "Patricia E."), makeShift(78, 3.5, 2, 5, 15, 42, 1176, "Roberto G.")],
    ],
  },
  Bilbao: {
    shifts: [
      [makeShift(5, 0.5, 0, 1, 3, 40, 1200, "Mikel A."), makeShift(10, 0.9, 0, 1, 5, 65, 1950, "Leire S."), makeShift(18, 1.2, 0, 2, 7, 30, 870, "Mikel A.")],
      [makeShift(8, 0.7, 0, 0, 4, 42, 1260, "Mikel A."), makeShift(12, 1.0, 0, 2, 6, 60, 1800, "Leire S."), makeShift(22, 1.5, 1, 2, 9, 28, 812, "Mikel A.")],
      [makeShift(6, 0.6, 0, 1, 5, 38, 1140, "Mikel A."), makeShift(15, 1.2, 0, 1, 7, 68, 2040, "Leire S."), makeShift(15, 1.0, 0, 2, 6, 32, 928, "Mikel A.")],
      [makeShift(10, 0.8, 0, 1, 4, 45, 1350, "Mikel A."), makeShift(18, 1.4, 1, 2, 8, 72, 2160, "Leire S."), makeShift(25, 1.8, 1, 3, 10, 35, 1015, "Mikel A.")],
      [makeShift(8, 0.6, 0, 0, 3, 52, 1820, "Mikel A."), makeShift(14, 1.1, 0, 2, 6, 88, 3080, "Leire S."), makeShift(20, 1.3, 0, 2, 8, 40, 1160, "Mikel A.")],
      [makeShift(12, 0.9, 0, 1, 5, 58, 2030, "Mikel A."), makeShift(16, 1.3, 0, 2, 7, 98, 3430, "Leire S."), makeShift(28, 2.0, 1, 3, 11, 45, 1305, "Mikel A.")],
      [makeShift(6, 0.5, 0, 0, 4, 48, 1680, "Mikel A."), makeShift(10, 0.8, 0, 1, 5, 75, 2625, "Leire S."), makeShift(15, 1.1, 0, 2, 6, 38, 1102, "Mikel A.")],
    ],
  },
  Burgos: {
    shifts: [
      [makeShift(12, 1.0, 0, 1, 6, 35, 1050, "Pablo N."), makeShift(20, 1.8, 1, 3, 10, 55, 1650, "Sara T."), makeShift(65, 3.8, 2, 5, 16, 28, 784, "Diego F.")],
      [makeShift(8, 0.8, 0, 0, 5, 32, 960, "Pablo N."), makeShift(15, 1.2, 0, 2, 7, 48, 1440, "Sara T."), makeShift(72, 4.2, 3, 6, 20, 25, 700, "Diego F.")],
      [makeShift(10, 0.9, 0, 1, 4, 38, 1140, "Pablo N."), makeShift(22, 1.5, 1, 2, 8, 58, 1740, "Sara T."), makeShift(48, 2.8, 1, 4, 12, 30, 840, "Diego F.")],
      [makeShift(6, 0.6, 0, 0, 3, 40, 1200, "Pablo N."), makeShift(18, 1.4, 0, 2, 9, 62, 1860, "Sara T."), makeShift(58, 3.2, 2, 5, 14, 32, 896, "Diego F.")],
      [makeShift(14, 1.1, 0, 1, 7, 48, 1680, "Pablo N."), makeShift(28, 2.2, 2, 4, 12, 82, 2870, "Sara T."), makeShift(95, 5.0, 3, 7, 22, 42, 1260, "Diego F.")],
      [makeShift(18, 1.4, 1, 2, 9, 55, 1925, "Pablo N."), makeShift(35, 2.8, 2, 5, 15, 95, 3325, "Sara T."), makeShift(110, 5.5, 4, 8, 26, 48, 1440, "Diego F.")],
      [makeShift(10, 0.8, 0, 1, 5, 42, 1470, "Pablo N."), makeShift(20, 1.6, 1, 2, 8, 70, 2450, "Sara T."), makeShift(68, 3.5, 2, 5, 15, 35, 980, "Diego F.")],
    ],
  },
  "San Sebastián": {
    shifts: [
      [makeShift(5, 0.4, 0, 0, 3, 44, 1540, "Jon B."), makeShift(8, 0.6, 0, 1, 4, 72, 2520, "Nerea K."), makeShift(12, 0.8, 0, 1, 5, 28, 924, "Jon B.")],
      [makeShift(3, 0.3, 0, 0, 2, 42, 1470, "Jon B."), makeShift(10, 0.7, 0, 1, 5, 68, 2380, "Nerea K."), makeShift(8, 0.6, 0, 1, 4, 25, 825, "Jon B.")],
      [makeShift(6, 0.5, 0, 0, 3, 48, 1680, "Jon B."), makeShift(12, 0.9, 0, 1, 6, 75, 2625, "Nerea K."), makeShift(15, 1.0, 0, 2, 6, 30, 990, "Jon B.")],
      [makeShift(4, 0.4, 0, 0, 2, 50, 1750, "Jon B."), makeShift(10, 0.8, 0, 1, 5, 80, 2800, "Nerea K."), makeShift(10, 0.7, 0, 1, 5, 32, 1056, "Jon B.")],
      [makeShift(8, 0.6, 0, 1, 4, 58, 2320, "Jon B."), makeShift(15, 1.0, 0, 2, 6, 98, 3920, "Nerea K."), makeShift(18, 1.2, 0, 2, 7, 40, 1320, "Jon B.")],
      [makeShift(10, 0.7, 0, 1, 5, 65, 2600, "Jon B."), makeShift(18, 1.2, 0, 2, 7, 112, 4480, "Nerea K."), makeShift(20, 1.4, 1, 2, 8, 45, 1485, "Jon B.")],
      [makeShift(5, 0.4, 0, 0, 3, 52, 2080, "Jon B."), makeShift(10, 0.7, 0, 1, 4, 85, 3400, "Nerea K."), makeShift(12, 0.8, 0, 1, 5, 35, 1155, "Jon B.")],
    ],
  },
  Vitoria: {
    shifts: [
      [makeShift(10, 0.9, 0, 1, 5, 32, 960, "Gorka E."), makeShift(18, 1.5, 1, 3, 9, 55, 1650, "Aitor D."), makeShift(42, 2.8, 2, 4, 14, 28, 784, "Gorka E.")],
      [makeShift(8, 0.7, 0, 1, 4, 28, 840, "Gorka E."), makeShift(22, 1.8, 1, 3, 10, 50, 1500, "Aitor D."), makeShift(55, 3.5, 2, 5, 18, 25, 700, "Gorka E.")],
      [makeShift(12, 1.0, 0, 1, 6, 35, 1050, "Gorka E."), makeShift(15, 1.2, 0, 2, 7, 58, 1740, "Aitor D."), makeShift(38, 2.2, 1, 3, 11, 30, 840, "Gorka E.")],
      [makeShift(6, 0.6, 0, 0, 3, 38, 1140, "Gorka E."), makeShift(20, 1.6, 1, 2, 8, 62, 1860, "Aitor D."), makeShift(48, 3.0, 2, 5, 15, 32, 896, "Gorka E.")],
      [makeShift(15, 1.2, 1, 2, 7, 45, 1575, "Gorka E."), makeShift(28, 2.2, 2, 4, 12, 78, 2730, "Aitor D."), makeShift(62, 3.8, 3, 6, 20, 38, 1064, "Gorka E.")],
      [makeShift(18, 1.4, 1, 2, 8, 52, 1820, "Gorka E."), makeShift(32, 2.5, 2, 5, 14, 88, 3080, "Aitor D."), makeShift(75, 4.5, 3, 7, 22, 42, 1176, "Gorka E.")],
      [makeShift(10, 0.8, 0, 1, 5, 40, 1400, "Gorka E."), makeShift(18, 1.4, 1, 2, 8, 65, 2275, "Aitor D."), makeShift(45, 2.8, 2, 4, 13, 32, 896, "Gorka E.")],
    ],
  },
  Zaragoza: {
    shifts: [
      [makeShift(8, 0.7, 0, 1, 4, 40, 1200, "Tomás W."), makeShift(12, 1.0, 0, 1, 6, 65, 1950, "Raúl C."), makeShift(22, 1.5, 1, 2, 8, 30, 870, "Tomás W.")],
      [makeShift(6, 0.5, 0, 0, 3, 38, 1140, "Tomás W."), makeShift(15, 1.2, 0, 2, 7, 60, 1800, "Raúl C."), makeShift(18, 1.2, 0, 2, 7, 28, 812, "Tomás W.")],
      [makeShift(10, 0.8, 0, 1, 5, 42, 1260, "Tomás W."), makeShift(14, 1.1, 0, 1, 6, 68, 2040, "Raúl C."), makeShift(20, 1.4, 1, 2, 8, 32, 928, "Tomás W.")],
      [makeShift(5, 0.4, 0, 0, 3, 45, 1350, "Tomás W."), makeShift(16, 1.3, 0, 2, 8, 72, 2160, "Raúl C."), makeShift(25, 1.8, 1, 3, 10, 35, 1015, "Tomás W.")],
      [makeShift(12, 0.9, 0, 1, 5, 55, 1925, "Tomás W."), makeShift(20, 1.6, 1, 2, 9, 90, 3150, "Raúl C."), makeShift(30, 2.2, 1, 3, 12, 42, 1218, "Tomás W.")],
      [makeShift(15, 1.1, 0, 2, 7, 60, 2100, "Tomás W."), makeShift(22, 1.8, 1, 3, 10, 102, 3570, "Raúl C."), makeShift(35, 2.5, 2, 4, 14, 48, 1392, "Tomás W.")],
      [makeShift(8, 0.6, 0, 0, 4, 48, 1680, "Tomás W."), makeShift(14, 1.0, 0, 1, 6, 78, 2730, "Raúl C."), makeShift(20, 1.4, 0, 2, 8, 35, 1015, "Tomás W.")],
    ],
  },
};

const LOCATIONS = Object.keys(LOCATIONS_DATA);

// ═══════════════════════════════════════════════════════
// HEALTH SCORE ENGINE — fully transparent
// ═══════════════════════════════════════════════════════
function indicatorScore(value, threshold) {
  if (value <= threshold.ok) return 0;
  if (value <= threshold.warn) return 25 + 25 * ((value - threshold.ok) / (threshold.warn - threshold.ok));
  if (value <= threshold.crit) return 50 + 30 * ((value - threshold.warn) / (threshold.crit - threshold.warn));
  return 80 + 20 * Math.min((value - threshold.crit) / threshold.crit, 1);
}

function shiftHealthScore(shift) {
  let totalWeight = 0;
  let weightedScore = 0;
  const breakdown = {};

  Object.entries(THRESHOLDS).forEach(([key, th]) => {
    const raw = shift[key];
    const score = indicatorScore(raw, th);
    breakdown[key] = { raw, score, threshold: th };
    weightedScore += score * th.weight;
    totalWeight += th.weight;
  });

  const health = 100 - Math.round(weightedScore / totalWeight);
  return { health: Math.max(0, Math.min(100, health)), breakdown };
}

function dayHealth(dayShifts) {
  const scores = dayShifts.map((s) => shiftHealthScore(s).health);
  return Math.min(...scores); // worst shift determines the day color
}

// ═══════════════════════════════════════════════════════
// VISUAL HELPERS
// ═══════════════════════════════════════════════════════
function healthColor(score) {
  if (score >= 85) return { bg: "#064e3b", text: "#34d399", ring: "#059669", label: "Sano" };
  if (score >= 70) return { bg: "#14532d", text: "#4ade80", ring: "#22c55e", label: "Bien" };
  if (score >= 55) return { bg: "#422006", text: "#fbbf24", ring: "#d97706", label: "Atención" };
  if (score >= 40) return { bg: "#7c2d12", text: "#fb923c", ring: "#ea580c", label: "Riesgo" };
  return { bg: "#7f1d1d", text: "#f87171", ring: "#dc2626", label: "Crítico" };
}

function indicatorColor(score) {
  if (score <= 15) return "#22c55e";
  if (score <= 35) return "#4ade80";
  if (score <= 55) return "#fbbf24";
  if (score <= 75) return "#fb923c";
  return "#ef4444";
}

// ═══════════════════════════════════════════════════════
// INDICATOR BAR — shows where value sits on the threshold scale
// ═══════════════════════════════════════════════════════
function IndicatorBar({ value, threshold, width = 180 }) {
  const maxVal = threshold.crit * 1.5;
  const scale = (v) => Math.min((v / maxVal) * width, width);

  return (
    <div style={{ position: "relative", height: 12, width }}>
      {/* Background zones */}
      <div style={{ position: "absolute", top: 2, height: 8, left: 0, width: scale(threshold.ok), background: "rgba(34,197,94,0.2)", borderRadius: "3px 0 0 3px" }} />
      <div style={{ position: "absolute", top: 2, height: 8, left: scale(threshold.ok), width: scale(threshold.warn) - scale(threshold.ok), background: "rgba(245,158,11,0.2)" }} />
      <div style={{ position: "absolute", top: 2, height: 8, left: scale(threshold.warn), width: scale(threshold.crit) - scale(threshold.warn), background: "rgba(239,68,68,0.15)" }} />
      <div style={{ position: "absolute", top: 2, height: 8, left: scale(threshold.crit), width: width - scale(threshold.crit), background: "rgba(239,68,68,0.08)", borderRadius: "0 3px 3px 0" }} />
      {/* Value marker */}
      <div style={{
        position: "absolute", top: 0, left: scale(value) - 2, width: 4, height: 12,
        background: indicatorColor(indicatorScore(value, threshold)),
        borderRadius: 2, boxShadow: `0 0 6px ${indicatorColor(indicatorScore(value, threshold))}44`,
      }} />
      {/* Threshold markers */}
      {[threshold.ok, threshold.warn, threshold.crit].map((t, i) => (
        <div key={i} style={{ position: "absolute", top: 2, left: scale(t), width: 1, height: 8, background: "rgba(255,255,255,0.15)" }} />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════
export default function HealthScoreGrid() {
  const [selectedCell, setSelectedCell] = useState(null); // { loc, day }
  const [hoveredCell, setHoveredCell] = useState(null);
  const [expandedLoc, setExpandedLoc] = useState(null);
  const [viewLevel, setViewLevel] = useState("day"); // "day" or "shift"

  // Compute all health scores
  const scores = useMemo(() => {
    const result = {};
    LOCATIONS.forEach((loc) => {
      result[loc] = LOCATIONS_DATA[loc].shifts.map((dayShifts) => ({
        shifts: dayShifts.map((s) => ({ ...s, ...shiftHealthScore(s) })),
        dayScore: dayHealth(dayShifts),
      }));
    });
    return result;
  }, []);

  // Location week summary
  const locSummary = useMemo(() => {
    const result = {};
    LOCATIONS.forEach((loc) => {
      const dayScores = scores[loc].map((d) => d.dayScore);
      const allShiftScores = scores[loc].flatMap((d) => d.shifts.map((s) => s.health));
      const criticalShifts = allShiftScores.filter((s) => s < 40).length;
      const totalShifts = allShiftScores.length;
      result[loc] = {
        worst: Math.min(...dayScores),
        avg: Math.round(dayScores.reduce((s, v) => s + v, 0) / dayScores.length),
        criticalShifts,
        totalShifts,
        weekScore: Math.round(allShiftScores.reduce((s, v) => s + v, 0) / allShiftScores.length),
      };
    });
    return result;
  }, [scores]);

  // Sort by worst health
  const sortedLocs = useMemo(() => {
    return [...LOCATIONS].sort((a, b) => locSummary[a].weekScore - locSummary[b].weekScore);
  }, [locSummary]);

  // Detail for selected cell
  const detail = useMemo(() => {
    const c = selectedCell || hoveredCell;
    if (!c) return null;
    const dayData = scores[c.loc][c.day];
    return { loc: c.loc, dayIdx: c.day, dayName: DAYS[c.day], date: DATES[c.day], ...dayData };
  }, [selectedCell, hoveredCell, scores]);

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: "#0c0c1d", minHeight: "100vh", color: "#e2e8f0", padding: 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* ──── HEADER ──── */}
      <div style={{ background: "linear-gradient(180deg, #12122a 0%, #0c0c1d 100%)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #059669 0%, #22c55e 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: "0 4px 16px rgba(5,150,105,0.25)" }}>
              🏥
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>Salud Operacional — Caja y Ventas</h1>
          </div>
          <p style={{ fontSize: 12, color: "#64748b", marginTop: 4, marginLeft: 42 }}>
            Health Score por turno · Semana 17–23 Feb 2026 · Basado en reglas de negocio
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {/* View toggle */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
            {[{ key: "day", label: "Por día" }, { key: "shift", label: "Por turno" }].map((v) => (
              <button key={v.key} onClick={() => setViewLevel(v.key)} style={{
                padding: "6px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer",
                background: viewLevel === v.key ? "rgba(255,255,255,0.08)" : "transparent",
                color: viewLevel === v.key ? "#e2e8f0" : "#64748b",
                border: "none", fontFamily: "'DM Sans', sans-serif",
              }}>
                {v.label}
              </button>
            ))}
          </div>
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "#94a3b8" }}>
            Feb 2026
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 28px" }}>
        {/* ──── SUMMARY STRIP ──── */}
        <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
          {(() => {
            const allScores = Object.values(scores).flatMap((loc) => loc.flatMap((d) => d.shifts.map((s) => s.health)));
            const critical = allScores.filter((s) => s < 40).length;
            const attention = allScores.filter((s) => s >= 40 && s < 55).length;
            const healthy = allScores.filter((s) => s >= 70).length;
            const avg = Math.round(allScores.reduce((s, v) => s + v, 0) / allScores.length);
            const hc = healthColor(avg);
            return [
              { label: "Salud media grupo", value: avg, icon: "🏥", color: hc.text, sub: hc.label },
              { label: "Turnos analizados", value: allScores.length, icon: "📋", color: "#94a3b8" },
              { label: "Turnos sanos", value: healthy, icon: "✅", color: "#22c55e", sub: `${Math.round(healthy / allScores.length * 100)}%` },
              { label: "Turnos en riesgo", value: critical, icon: "🔴", color: critical > 0 ? "#ef4444" : "#22c55e", sub: critical > 0 ? "Investigar" : "Ninguno" },
            ].map((s) => (
              <div key={s.label} style={{ flex: 1, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 22 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</span>
                    {s.sub && <span style={{ fontSize: 11, color: "#64748b" }}>{s.sub}</span>}
                  </div>
                </div>
              </div>
            ));
          })()}
        </div>

        <div style={{ display: "flex", gap: 20 }}>
          {/* ──── HEATMAP GRID ──── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, overflow: "hidden" }}>
              {/* Column headers */}
              <div style={{
                display: "grid",
                gridTemplateColumns: `160px repeat(7, 1fr) 70px`,
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Local</div>
                {DAYS.map((d, i) => (
                  <div key={d} style={{ padding: "10px 4px", textAlign: "center" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: i >= 5 ? "#94a3b8" : "#475569" }}>{DAYS_SHORT[i]}</div>
                    <div style={{ fontSize: 9, color: "#3f3f46" }}>{DATES[i]} Feb</div>
                  </div>
                ))}
                <div style={{ padding: "10px 8px", textAlign: "center", fontSize: 10, fontWeight: 700, color: "#64748b" }}>Sem</div>
              </div>

              {/* Location rows */}
              {sortedLocs.map((loc, locIdx) => {
                const summary = locSummary[loc];
                const weekHc = healthColor(summary.weekScore);

                return (
                  <div key={loc}>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: `160px repeat(7, 1fr) 70px`,
                      borderBottom: "1px solid rgba(255,255,255,0.03)",
                      alignItems: "center",
                    }}>
                      {/* Location name */}
                      <div style={{ padding: "10px 16px" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{loc}</div>
                        <div style={{ fontSize: 10, color: "#475569" }}>
                          {summary.criticalShifts > 0 ? (
                            <span style={{ color: "#ef4444" }}>{summary.criticalShifts} turno{summary.criticalShifts > 1 ? "s" : ""} crítico{summary.criticalShifts > 1 ? "s" : ""}</span>
                          ) : (
                            <span style={{ color: "#22c55e" }}>Sin turnos críticos</span>
                          )}
                        </div>
                      </div>

                      {/* Day cells */}
                      {DAYS.map((_, dayIdx) => {
                        const dayData = scores[loc][dayIdx];
                        const isSel = selectedCell?.loc === loc && selectedCell?.day === dayIdx;
                        const isHov = hoveredCell?.loc === loc && hoveredCell?.day === dayIdx;

                        if (viewLevel === "day") {
                          // Single cell per day showing worst score
                          const score = dayData.dayScore;
                          const hc = healthColor(score);
                          return (
                            <div
                              key={dayIdx}
                              onClick={() => setSelectedCell(isSel ? null : { loc, day: dayIdx })}
                              onMouseEnter={() => setHoveredCell({ loc, day: dayIdx })}
                              onMouseLeave={() => setHoveredCell(null)}
                              style={{
                                margin: "3px 2px", padding: "8px 4px", borderRadius: 8,
                                textAlign: "center", background: hc.bg, cursor: "pointer",
                                border: isSel ? `2px solid ${hc.text}` : isHov ? `1px solid ${hc.text}44` : "1px solid transparent",
                                transition: "all 0.15s",
                              }}
                            >
                              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: hc.text }}>
                                {score}
                              </div>
                              <div style={{ fontSize: 9, color: hc.text, opacity: 0.6, marginTop: 1 }}>{hc.label}</div>
                            </div>
                          );
                        }

                        // Shift-level: 3 mini cells stacked
                        return (
                          <div
                            key={dayIdx}
                            onClick={() => setSelectedCell(isSel ? null : { loc, day: dayIdx })}
                            onMouseEnter={() => setHoveredCell({ loc, day: dayIdx })}
                            onMouseLeave={() => setHoveredCell(null)}
                            style={{
                              margin: "3px 2px", display: "flex", flexDirection: "column", gap: 2,
                              cursor: "pointer", borderRadius: 8, padding: 2,
                              border: isSel ? "2px solid rgba(255,255,255,0.2)" : isHov ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
                            }}
                          >
                            {dayData.shifts.map((shift, sIdx) => {
                              const shc = healthColor(shift.health);
                              const shiftKey = ["morning", "afternoon", "night"][sIdx];
                              return (
                                <div key={sIdx} style={{
                                  background: shc.bg, borderRadius: 4, padding: "3px 2px",
                                  textAlign: "center",
                                }} title={`${SHIFTS[shiftKey].label}: ${shift.health}`}>
                                  <div style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: 10, fontWeight: 700, color: shc.text,
                                  }}>
                                    {shift.health}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}

                      {/* Week avg */}
                      <div style={{ padding: "8px", textAlign: "center" }}>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: weekHc.text }}>
                          {summary.weekScore}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, padding: "0 4px" }}>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#475569", marginRight: 6 }}>Health Score:</span>
                {[
                  { bg: "#7f1d1d", label: "0-39" },
                  { bg: "#7c2d12", label: "40-54" },
                  { bg: "#422006", label: "55-69" },
                  { bg: "#14532d", label: "70-84" },
                  { bg: "#064e3b", label: "85-100" },
                ].map((item) => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 14, height: 10, borderRadius: 2, background: item.bg }} />
                    <span style={{ fontSize: 10, color: "#475569" }}>{item.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 10, color: "#3f3f46" }}>
                {viewLevel === "day" ? "Muestra el peor turno del día" : "M=Mañana · T=Tarde · N=Noche"}
              </div>
            </div>
          </div>

          {/* ──── RIGHT: DETAIL PANEL ──── */}
          <div style={{ width: 340, flexShrink: 0 }}>
            {detail ? (
              <div style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 14, padding: "16px 18px", position: "sticky", top: 20,
                animation: "fadeIn 0.15s ease",
              }}>
                <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>

                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
                  <div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{detail.loc}</span>
                    <span style={{ fontSize: 12, color: "#64748b", marginLeft: 8 }}>{detail.dayName} {detail.date} Feb</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#475569" }}>
                    Score = peor turno: {detail.dayScore}
                  </div>
                </div>

                {/* ── Shift score strip ── */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 14 }}>
                  {detail.shifts.map((shift, sIdx) => {
                    const shiftKey = ["morning", "afternoon", "night"][sIdx];
                    const shc = healthColor(shift.health);
                    const shiftConf = SHIFTS[shiftKey];
                    return (
                      <div key={sIdx} style={{
                        background: shc.bg, borderRadius: 8, padding: "8px 10px",
                        textAlign: "center", border: `1px solid ${shc.text}22`,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 4 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: shiftConf.color }} />
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#cbd5e1" }}>{shiftConf.label}</span>
                        </div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: shc.text, lineHeight: 1 }}>
                          {shift.health}
                        </div>
                        <div style={{ fontSize: 9, color: "#64748b", marginTop: 3 }}>
                          👤 {shift.manager.split(" ").slice(0, 2).join(" ")}
                        </div>
                        <div style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono', monospace" }}>
                          {shift.transactions} txns · €{shift.revenue.toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── Comparison table: indicators as rows, shifts as columns ── */}
                <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)" }}>
                  {/* Table header */}
                  <div style={{
                    display: "grid", gridTemplateColumns: "1fr 62px 62px 62px",
                    background: "rgba(255,255,255,0.03)", padding: "6px 10px",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 }}>Indicador</div>
                    {["morning", "afternoon", "night"].map((sk) => (
                      <div key={sk} style={{ textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: SHIFTS[sk].color }} />
                        <span style={{ fontSize: 9, fontWeight: 600, color: "#64748b" }}>{SHIFTS[sk].short}</span>
                      </div>
                    ))}
                  </div>

                  {/* Indicator rows */}
                  {Object.entries(THRESHOLDS).map(([key, th], rowIdx) => (
                    <div key={key} style={{
                      display: "grid", gridTemplateColumns: "1fr 62px 62px 62px",
                      padding: "5px 10px", alignItems: "center",
                      background: rowIdx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                      borderBottom: rowIdx < Object.keys(THRESHOLDS).length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ fontSize: 11 }}>{th.icon}</span>
                        <div>
                          <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500, lineHeight: 1.2 }}>{th.label}</div>
                          <div style={{ fontSize: 8, color: "#3f3f46" }}>
                            ok≤{th.unit === "€" ? "€" : ""}{th.ok}{th.unit === "%" ? "%" : ""} · crit≤{th.unit === "€" ? "€" : ""}{th.crit}{th.unit === "%" ? "%" : ""}
                          </div>
                        </div>
                      </div>
                      {detail.shifts.map((shift, sIdx) => {
                        const ind = shift.breakdown[key];
                        const ic = indicatorColor(ind.score);
                        const isWorst = detail.shifts.every((s, i) => i === sIdx || s.breakdown[key].score <= ind.score) && ind.score > 25;
                        return (
                          <div key={sIdx} style={{ textAlign: "center", position: "relative" }}>
                            <span style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 12, fontWeight: 700, color: ic,
                            }}>
                              {th.unit === "€" ? `€${ind.raw}` : th.unit === "%" ? `${ind.raw}%` : ind.raw}
                            </span>
                            {isWorst && (
                              <div style={{
                                position: "absolute", top: -2, right: 2,
                                width: 5, height: 5, borderRadius: "50%",
                                background: "#ef4444",
                              }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* ── Compact methodology ── */}
                <div style={{ marginTop: 10, fontSize: 10, color: "#3f3f46", lineHeight: 1.4, padding: "0 2px" }}>
                  Health Score = 100 − media ponderada (Caja 30%, Anul. 25%, Dto. 20%, Apert. 15%, Ticket 10%). <span style={{ color: "#475569" }}>Punto rojo = peor turno en ese indicador.</span>
                </div>
              </div>
            ) : (
              <div style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 14, padding: "40px 24px", textAlign: "center", position: "sticky", top: 20,
              }}>
                <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>🏥</div>
                <div style={{ fontSize: 14, color: "#64748b", fontWeight: 500, marginBottom: 6 }}>Explora la salud operativa</div>
                <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
                  Pasa el ratón sobre cualquier celda para ver el desglose de indicadores por turno: descuadre de caja, anulaciones, descuentos no autorizados, aperturas sin venta y desviación de ticket medio.
                </div>
                <div style={{ marginTop: 16, padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 8, fontSize: 11, color: "#475569", lineHeight: 1.6, textAlign: "left" }}>
                  <strong style={{ color: "#94a3b8" }}>Sin caja negra:</strong> Cada score se explica por 5 indicadores con umbrales visibles. Si el restaurador pregunta "¿por qué un 42?", la respuesta está a un click.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ──── THRESHOLDS REFERENCE ──── */}
      <div style={{ padding: "0 28px 20px" }}>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 12, padding: "14px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
            Umbrales de referencia (configurables por cliente)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
            {Object.entries(THRESHOLDS).map(([key, th]) => (
              <div key={key} style={{ fontSize: 11, color: "#475569" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 12 }}>{th.icon}</span>
                  <span style={{ fontWeight: 600, color: "#94a3b8" }}>{th.label}</span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{ color: "#22c55e" }}>≤{th.unit === "€" ? "€" : ""}{th.ok}{th.unit === "%" ? "%" : ""}</span>
                  <span style={{ color: "#fbbf24" }}>≤{th.unit === "€" ? "€" : ""}{th.warn}{th.unit === "%" ? "%" : ""}</span>
                  <span style={{ color: "#ef4444" }}>≤{th.unit === "€" ? "€" : ""}{th.crit}{th.unit === "%" ? "%" : ""}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ──── FOOTER ──── */}
      <div style={{ padding: "16px 28px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#475569" }}>
        <div>Health Score = 100 − media ponderada de indicadores · Basado en reglas de negocio configurables, sin caja negra</div>
        <div>Fuente: POS · Datos del cierre de turno</div>
      </div>
    </div>
  );
}
