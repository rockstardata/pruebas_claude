import { useState, useMemo } from "react";

// ═══════════════════════════════════════════════════════
// DATA — 30 days of shifts + anomalies for one location
// ═══════════════════════════════════════════════════════

const DAYS = Array.from({ length: 30 }, (_, i) => i + 1);
const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];
function dayOfWeek(d) { return WEEKDAYS[(d + 2) % 7]; } // Feb 2026 starts Sunday
function isWeekend(d) { const dw = (d + 2) % 7; return dw === 5 || dw === 6; }

const SHIFTS = {
  morning: { label: "Mañana", hours: "8:00–16:00", color: "#fbbf24" },
  afternoon: { label: "Tarde", hours: "16:00–00:00", color: "#60a5fa" },
  night: { label: "Noche", hours: "00:00–8:00", color: "#a78bfa" },
};

const MANAGERS = [
  { id: "mgr1", name: "Roberto G.", role: "Gerente", location: "Pamplona", photo: "🧑‍💼" },
  { id: "mgr2", name: "Patricia E.", role: "Encargada", location: "Pamplona", photo: "👩‍💼" },
  { id: "mgr3", name: "Fernando D.", role: "Encargado", location: "Pamplona", photo: "🧑‍💼" },
];

// Schedule: which manager works which shift each day
// Roberto: mostly night, Patricia: mostly afternoon, Fernando: mostly morning
const SCHEDULE = {};
DAYS.forEach((d) => {
  const dayOff1 = d % 7 === 1; // Roberto's day off
  const dayOff2 = d % 7 === 3; // Patricia's day off
  const dayOff3 = d % 7 === 5; // Fernando's day off

  SCHEDULE[d] = {
    morning: dayOff3 ? "mgr2" : "mgr3",
    afternoon: dayOff2 ? (dayOff3 ? "mgr1" : "mgr3") : "mgr2",
    night: dayOff1 ? "mgr2" : "mgr1",
  };
});

// Anomaly dimensions
const DIMENSIONS = {
  caja: { label: "Caja", icon: "💰", color: "#ef4444" },
  anulaciones: { label: "Anulaciones", icon: "↩️", color: "#f59e0b" },
  descuentos: { label: "Descuentos", icon: "🏷️", color: "#a855f7" },
  inventario: { label: "Inventario", icon: "📦", color: "#3b82f6" },
  personal: { label: "Personal", icon: "👥", color: "#06b6d4" },
};

// Anomaly events: day, shift, dimension, severity (1-3), amount, description
const ANOMALIES = [
  // Pattern: Roberto's night shifts have clusters of cash + void anomalies
  { day: 2, shift: "night", dim: "caja", severity: 2, amount: 85, desc: "Descuadre €85 en cierre" },
  { day: 3, shift: "night", dim: "anulaciones", severity: 2, amount: 120, desc: "6 anulaciones, 4 sin supervisor" },
  { day: 5, shift: "night", dim: "caja", severity: 3, amount: 140, desc: "Descuadre €140, faltante no justificado" },
  { day: 5, shift: "night", dim: "anulaciones", severity: 2, amount: 95, desc: "Anulación de €95 post-cierre" },
  { day: 7, shift: "night", dim: "inventario", severity: 1, amount: 60, desc: "Merma cerveza premium -2 unidades" },
  { day: 9, shift: "night", dim: "caja", severity: 2, amount: 92, desc: "Descuadre €92 en efectivo" },
  { day: 9, shift: "night", dim: "descuentos", severity: 1, amount: 45, desc: "Descuento manual sin código" },
  { day: 12, shift: "night", dim: "caja", severity: 3, amount: 165, desc: "Mayor descuadre del mes" },
  { day: 12, shift: "night", dim: "anulaciones", severity: 3, amount: 180, desc: "8 anulaciones, importe total €180" },
  { day: 12, shift: "night", dim: "inventario", severity: 2, amount: 90, desc: "Merma alcohol premium 4 unidades" },
  { day: 14, shift: "night", dim: "caja", severity: 1, amount: 55, desc: "Descuadre menor €55" },
  { day: 16, shift: "night", dim: "anulaciones", severity: 2, amount: 110, desc: "5 anulaciones concentradas 23:00-00:00" },
  { day: 16, shift: "night", dim: "descuentos", severity: 2, amount: 78, desc: "3 descuentos empleado fuera de horario" },
  { day: 19, shift: "night", dim: "caja", severity: 2, amount: 105, desc: "Descuadre €105, patrón sábado noche" },
  { day: 19, shift: "night", dim: "inventario", severity: 1, amount: 40, desc: "Merma gin premium -1 botella" },
  { day: 21, shift: "night", dim: "caja", severity: 2, amount: 88, desc: "Descuadre €88 en cierre" },
  { day: 23, shift: "night", dim: "anulaciones", severity: 3, amount: 210, desc: "9 anulaciones, máximo del mes" },
  { day: 23, shift: "night", dim: "caja", severity: 2, amount: 130, desc: "Descuadre €130 coincide con pico anulaciones" },
  { day: 26, shift: "night", dim: "caja", severity: 1, amount: 62, desc: "Descuadre menor" },
  { day: 26, shift: "night", dim: "descuentos", severity: 1, amount: 35, desc: "Descuento sin justificación" },
  { day: 28, shift: "night", dim: "caja", severity: 2, amount: 98, desc: "Descuadre €98" },
  { day: 28, shift: "night", dim: "anulaciones", severity: 2, amount: 145, desc: "7 anulaciones, 5 post-cierre" },

  // Scattered anomalies in other shifts (much fewer, normal operational noise)
  { day: 4, shift: "afternoon", dim: "anulaciones", severity: 1, amount: 30, desc: "2 anulaciones por cambio de plato" },
  { day: 8, shift: "morning", dim: "caja", severity: 1, amount: 25, desc: "Descuadre menor €25, cambio" },
  { day: 11, shift: "afternoon", dim: "descuentos", severity: 1, amount: 20, desc: "Descuento promo aplicado 2x" },
  { day: 15, shift: "morning", dim: "inventario", severity: 1, amount: 30, desc: "Merma fruta por caducidad" },
  { day: 18, shift: "afternoon", dim: "anulaciones", severity: 1, amount: 40, desc: "3 anulaciones, todas con supervisor" },
  { day: 22, shift: "morning", dim: "caja", severity: 1, amount: 18, desc: "Descuadre mínimo €18" },
  { day: 25, shift: "afternoon", dim: "personal", severity: 1, amount: 0, desc: "Fichaje tardío 12 min" },
  { day: 27, shift: "morning", dim: "descuentos", severity: 1, amount: 15, desc: "Descuento empleado en horario" },
];

// ═══════════════════════════════════════════════════════
// COMPUTE CORRELATION SCORES
// ═══════════════════════════════════════════════════════
function computeManagerStats(mgrId, anomalies, schedule, dims) {
  let totalShifts = 0;
  let shiftsWithAnomalies = 0;
  let totalAnomalies = 0;
  let totalAmount = 0;
  let severitySum = 0;
  const dimBreakdown = {};
  const dailyAnomalies = [];

  Object.keys(DIMENSIONS).forEach((d) => { dimBreakdown[d] = { count: 0, amount: 0 }; });

  DAYS.forEach((day) => {
    Object.entries(schedule[day]).forEach(([shift, assignedMgr]) => {
      if (assignedMgr === mgrId) {
        totalShifts++;
        const shiftAnomalies = anomalies.filter(
          (a) => a.day === day && a.shift === shift && dims.has(a.dim)
        );
        if (shiftAnomalies.length > 0) {
          shiftsWithAnomalies++;
          shiftAnomalies.forEach((a) => {
            totalAnomalies++;
            totalAmount += a.amount;
            severitySum += a.severity;
            dimBreakdown[a.dim].count++;
            dimBreakdown[a.dim].amount += a.amount;
          });
        }
        dailyAnomalies.push({ day, shift, count: shiftAnomalies.length, amount: shiftAnomalies.reduce((s, a) => s + a.amount, 0) });
      }
    });
  });

  const anomalyRate = totalShifts > 0 ? shiftsWithAnomalies / totalShifts : 0;
  const avgSeverity = totalAnomalies > 0 ? severitySum / totalAnomalies : 0;

  // Correlation score: 0-100, weighted by anomaly rate, severity, and multi-dimension clustering
  const multiDimDays = new Set();
  DAYS.forEach((day) => {
    Object.entries(schedule[day]).forEach(([shift, assignedMgr]) => {
      if (assignedMgr === mgrId) {
        const dayDims = new Set(anomalies.filter((a) => a.day === day && a.shift === shift && dims.has(a.dim)).map((a) => a.dim));
        if (dayDims.size >= 2) multiDimDays.add(day);
      }
    });
  });

  const clusterBonus = multiDimDays.size * 5;
  const rawScore = Math.min(100, Math.round(anomalyRate * 60 + avgSeverity * 12 + clusterBonus));

  return {
    totalShifts,
    shiftsWithAnomalies,
    totalAnomalies,
    totalAmount,
    avgSeverity,
    anomalyRate,
    dimBreakdown,
    dailyAnomalies,
    multiDimDays: multiDimDays.size,
    correlationScore: rawScore,
  };
}

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════
function corrColor(score) {
  if (score >= 65) return "#ef4444";
  if (score >= 40) return "#f59e0b";
  if (score >= 20) return "#3b82f6";
  return "#22c55e";
}
function corrLabel(score) {
  if (score >= 65) return "Correlación fuerte";
  if (score >= 40) return "Correlación moderada";
  if (score >= 20) return "Correlación débil";
  return "Sin correlación";
}

// ═══════════════════════════════════════════════════════
// TIMELINE COMPONENT
// ═══════════════════════════════════════════════════════
function Timeline({ manager, stats, anomalies, schedule, activeDims, selectedDay, onSelectDay }) {
  const mgrId = manager.id;
  const cellW = 28;
  const cellH = 52;
  const leftPad = 0;
  const topPad = 28;
  const totalW = leftPad + DAYS.length * cellW + 16;

  return (
    <div style={{ overflowX: "auto", overflowY: "visible" }}>
      <svg width={totalW} height={topPad + 3 * cellH + 24} style={{ display: "block" }}>
        {/* Day headers */}
        {DAYS.map((d) => {
          const x = leftPad + (d - 1) * cellW;
          const wkend = isWeekend(d);
          const hasSel = selectedDay === d;
          return (
            <g key={`dh-${d}`}>
              {wkend && (
                <rect x={x} y={topPad} width={cellW} height={3 * cellH} fill="rgba(255,255,255,0.015)" />
              )}
              {hasSel && (
                <rect x={x} y={0} width={cellW} height={topPad + 3 * cellH + 20} fill="rgba(255,255,255,0.04)" rx={3} />
              )}
              <text x={x + cellW / 2} y={10} textAnchor="middle" fontSize={9} fill={wkend ? "#94a3b8" : "#475569"} fontFamily="'JetBrains Mono', monospace" fontWeight={500}>
                {dayOfWeek(d)}
              </text>
              <text x={x + cellW / 2} y={22} textAnchor="middle" fontSize={10} fill={wkend ? "#cbd5e1" : "#64748b"} fontFamily="'JetBrains Mono', monospace" fontWeight={600}>
                {d}
              </text>
            </g>
          );
        })}

        {/* Shift rows */}
        {Object.entries(SHIFTS).map(([shiftKey, shift], rowIdx) => {
          const y = topPad + rowIdx * cellH;

          return (
            <g key={shiftKey}>
              {/* Row separator */}
              <line x1={0} y1={y} x2={totalW} y2={y} stroke="rgba(255,255,255,0.04)" />

              {/* Cells */}
              {DAYS.map((d) => {
                const x = leftPad + (d - 1) * cellW;
                const assignedMgr = schedule[d]?.[shiftKey];
                const isMgr = assignedMgr === mgrId;
                const dayAnomalies = anomalies.filter(
                  (a) => a.day === d && a.shift === shiftKey && activeDims.has(a.dim)
                );
                const maxSev = dayAnomalies.length > 0 ? Math.max(...dayAnomalies.map((a) => a.severity)) : 0;
                const dims = [...new Set(dayAnomalies.map((a) => a.dim))];

                return (
                  <g
                    key={`${shiftKey}-${d}`}
                    onClick={() => onSelectDay(selectedDay === d ? null : d)}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Manager shift background */}
                    {isMgr && (
                      <rect
                        x={x + 1}
                        y={y + 2}
                        width={cellW - 2}
                        height={cellH - 4}
                        rx={4}
                        fill={
                          dayAnomalies.length > 0 && isMgr
                            ? maxSev >= 3
                              ? "rgba(239,68,68,0.18)"
                              : maxSev >= 2
                              ? "rgba(245,158,11,0.14)"
                              : "rgba(59,130,246,0.08)"
                            : "rgba(255,255,255,0.03)"
                        }
                        stroke={
                          dayAnomalies.length > 0 && isMgr
                            ? maxSev >= 3
                              ? "rgba(239,68,68,0.35)"
                              : maxSev >= 2
                              ? "rgba(245,158,11,0.3)"
                              : "rgba(59,130,246,0.2)"
                            : "rgba(255,255,255,0.05)"
                        }
                        strokeWidth={1}
                      />
                    )}

                    {/* Non-manager shift: dimmed marker */}
                    {!isMgr && (
                      <rect
                        x={x + 4}
                        y={y + cellH / 2 - 2}
                        width={cellW - 8}
                        height={4}
                        rx={2}
                        fill="rgba(255,255,255,0.03)"
                      />
                    )}

                    {/* Anomaly dots */}
                    {isMgr && dims.length > 0 && (
                      <g>
                        {dims.length === 1 && (
                          <circle
                            cx={x + cellW / 2}
                            cy={y + cellH / 2}
                            r={maxSev >= 3 ? 7 : maxSev >= 2 ? 6 : 5}
                            fill={DIMENSIONS[dims[0]].color}
                            fillOpacity={0.85}
                          >
                            {maxSev >= 3 && (
                              <animate attributeName="r" values="7;9;7" dur="2s" repeatCount="indefinite" />
                            )}
                          </circle>
                        )}
                        {dims.length === 2 && (
                          <>
                            <circle cx={x + cellW / 2 - 6} cy={y + cellH / 2} r={5} fill={DIMENSIONS[dims[0]].color} fillOpacity={0.85} />
                            <circle cx={x + cellW / 2 + 6} cy={y + cellH / 2} r={5} fill={DIMENSIONS[dims[1]].color} fillOpacity={0.85} />
                          </>
                        )}
                        {dims.length >= 3 && (
                          <>
                            <circle cx={x + cellW / 2 - 7} cy={y + cellH / 2 - 4} r={4.5} fill={DIMENSIONS[dims[0]].color} fillOpacity={0.85} />
                            <circle cx={x + cellW / 2 + 7} cy={y + cellH / 2 - 4} r={4.5} fill={DIMENSIONS[dims[1]].color} fillOpacity={0.85} />
                            <circle cx={x + cellW / 2} cy={y + cellH / 2 + 6} r={4.5} fill={DIMENSIONS[dims[2]].color} fillOpacity={0.85} />
                          </>
                        )}
                        {/* Count badge for multi-anomaly */}
                        {dayAnomalies.length > 1 && (
                          <g>
                            <rect x={x + cellW - 13} y={y + 3} width={12} height={12} rx={3} fill="rgba(0,0,0,0.6)" />
                            <text x={x + cellW - 7} y={y + 12} textAnchor="middle" fontSize={8} fill="#f1f5f9" fontFamily="'JetBrains Mono', monospace" fontWeight={700}>
                              {dayAnomalies.length}
                            </text>
                          </g>
                        )}
                      </g>
                    )}

                    {/* Non-manager anomaly: small indicator */}
                    {!isMgr && dayAnomalies.length > 0 && (
                      <circle
                        cx={x + cellW / 2}
                        cy={y + cellH / 2}
                        r={3}
                        fill={DIMENSIONS[dayAnomalies[0].dim].color}
                        fillOpacity={0.4}
                      />
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Shift labels on right */}
        {Object.entries(SHIFTS).map(([shiftKey, shift], rowIdx) => {
          const y = topPad + rowIdx * cellH + cellH / 2;
          return (
            <text key={`sl-${shiftKey}`} x={totalW - 4} y={y + 4} textAnchor="end" fontSize={10} fill={shift.color} fontWeight={600} fontFamily="'DM Sans', sans-serif" opacity={0.7}>
              {shift.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════
export default function ManagerCorrelationTimeline() {
  const [selectedMgr, setSelectedMgr] = useState("mgr1");
  const [activeDims, setActiveDims] = useState(new Set(Object.keys(DIMENSIONS)));
  const [selectedDay, setSelectedDay] = useState(null);

  const toggleDim = (dim) => {
    setActiveDims((prev) => {
      const next = new Set(prev);
      if (next.has(dim)) { if (next.size > 1) next.delete(dim); }
      else next.add(dim);
      return next;
    });
  };

  const allStats = useMemo(() => {
    return MANAGERS.map((m) => ({
      ...m,
      stats: computeManagerStats(m.id, ANOMALIES, SCHEDULE, activeDims),
    }));
  }, [activeDims]);

  const selectedMgrData = allStats.find((m) => m.id === selectedMgr);

  const dayDetail = useMemo(() => {
    if (!selectedDay || !selectedMgr) return null;
    const dayAnomalies = ANOMALIES.filter((a) => a.day === selectedDay && activeDims.has(a.dim));
    const mgrShifts = Object.entries(SCHEDULE[selectedDay])
      .filter(([, mgr]) => mgr === selectedMgr)
      .map(([shift]) => shift);
    const mgrAnomalies = dayAnomalies.filter((a) => mgrShifts.includes(a.shift));
    const otherAnomalies = dayAnomalies.filter((a) => !mgrShifts.includes(a.shift));
    return { day: selectedDay, mgrShifts, mgrAnomalies, otherAnomalies, allAnomalies: dayAnomalies };
  }, [selectedDay, selectedMgr, activeDims]);

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: "#0c0c1d", minHeight: "100vh", color: "#e2e8f0", padding: 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* ──── HEADER ──── */}
      <div style={{ background: "linear-gradient(180deg, #12122a 0%, #0c0c1d 100%)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: "0 4px 16px rgba(239,68,68,0.25)" }}>
              📅
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>Correlación Gerente–Anomalías</h1>
          </div>
          <p style={{ fontSize: 12, color: "#64748b", marginTop: 4, marginLeft: 42 }}>
            Pamplona · Febrero 2026 · Cruce de turnos de responsable con incidencias por dimensión
          </p>
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "#94a3b8" }}>
          Feb 2026
        </div>
      </div>

      <div style={{ padding: "20px 28px" }}>
        {/* ──── MANAGER SELECTOR + SCORES ──── */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          {allStats
            .sort((a, b) => b.stats.correlationScore - a.stats.correlationScore)
            .map((m) => {
              const isSelected = m.id === selectedMgr;
              const sc = m.stats.correlationScore;
              const col = corrColor(sc);
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMgr(m.id)}
                  style={{
                    flex: 1,
                    padding: "16px 20px",
                    borderRadius: 14,
                    cursor: "pointer",
                    background: isSelected ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${isSelected ? col + "44" : "rgba(255,255,255,0.05)"}`,
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 24 }}>{m.photo}</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: isSelected ? "#f1f5f9" : "#cbd5e1" }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{m.role}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 700, color: col, lineHeight: 1 }}>
                        {sc}
                      </div>
                      <div style={{ fontSize: 10, color: col, fontWeight: 500, marginTop: 2 }}>{corrLabel(sc)}</div>
                    </div>
                  </div>

                  {/* Mini stats */}
                  <div style={{ display: "flex", gap: 16, fontSize: 11 }}>
                    <div>
                      <span style={{ color: "#64748b" }}>Turnos: </span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: "#94a3b8" }}>{m.stats.totalShifts}</span>
                    </div>
                    <div>
                      <span style={{ color: "#64748b" }}>Con incidencia: </span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: m.stats.anomalyRate > 0.4 ? "#ef4444" : "#94a3b8" }}>
                        {m.stats.shiftsWithAnomalies} ({Math.round(m.stats.anomalyRate * 100)}%)
                      </span>
                    </div>
                    <div>
                      <span style={{ color: "#64748b" }}>Importe: </span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: "#94a3b8" }}>€{m.stats.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* ──── DIMENSION FILTERS ──── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500, marginRight: 4 }}>Dimensiones:</span>
          {Object.entries(DIMENSIONS).map(([key, dim]) => {
            const active = activeDims.has(key);
            const count = selectedMgrData?.stats.dimBreakdown[key]?.count || 0;
            return (
              <button
                key={key}
                onClick={() => toggleDim(key)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "5px 12px", borderRadius: 20,
                  border: `1px solid ${active ? dim.color + "44" : "rgba(255,255,255,0.08)"}`,
                  background: active ? dim.color + "15" : "transparent",
                  color: active ? "#e2e8f0" : "#64748b",
                  fontSize: 12, fontWeight: 500, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 13 }}>{dim.icon}</span>
                {dim.label}
                {active && count > 0 && (
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: dim.color, background: dim.color + "20", padding: "1px 5px", borderRadius: 4 }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ──── TIMELINE ──── */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "16px 20px", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>
              Turnos de <span style={{ color: "#f1f5f9" }}>{selectedMgrData?.name}</span> × Anomalías detectadas
            </div>
            <div style={{ display: "flex", gap: 14, fontSize: 11, color: "#475569" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 16, height: 10, borderRadius: 3, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
                Turno del gerente
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
                Anomalía en su turno
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(239,68,68,0.4)" }} />
                Anomalía en otro turno
              </div>
            </div>
          </div>

          <Timeline
            manager={selectedMgrData}
            stats={selectedMgrData?.stats}
            anomalies={ANOMALIES}
            schedule={SCHEDULE}
            activeDims={activeDims}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
          />
        </div>

        {/* ──── BOTTOM ROW: Day detail + Dimension breakdown ──── */}
        <div style={{ display: "flex", gap: 20 }}>
          {/* Day detail */}
          <div style={{ flex: 1 }}>
            {dayDetail && dayDetail.allAnomalies.length > 0 ? (
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "18px 22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    Día {dayDetail.day} · {dayOfWeek(dayDetail.day)} · {dayDetail.allAnomalies.length} incidencia{dayDetail.allAnomalies.length > 1 ? "s" : ""}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>
                    {selectedMgrData?.name} en turno {dayDetail.mgrShifts.map((s) => SHIFTS[s].label).join(", ")}
                  </div>
                </div>

                {dayDetail.allAnomalies
                  .sort((a, b) => {
                    const shiftOrder = { morning: 0, afternoon: 1, night: 2 };
                    return shiftOrder[a.shift] - shiftOrder[b.shift] || b.severity - a.severity;
                  })
                  .map((a, i) => {
                    const isMgrShift = dayDetail.mgrShifts.includes(a.shift);
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "10px 14px", borderRadius: 8, marginBottom: 4,
                          background: isMgrShift ? "rgba(239,68,68,0.05)" : "transparent",
                          border: `1px solid ${isMgrShift ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.03)"}`,
                        }}
                      >
                        <span style={{ fontSize: 16 }}>{DIMENSIONS[a.dim].icon}</span>
                        <div style={{ width: 54 }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: SHIFTS[a.shift].color, padding: "2px 6px", background: SHIFTS[a.shift].color + "18", borderRadius: 3 }}>
                            {SHIFTS[a.shift].label}
                          </span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, color: "#e2e8f0" }}>{a.desc}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {a.amount > 0 && (
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: "#cbd5e1" }}>€{a.amount}</span>
                          )}
                          <div style={{ display: "flex", gap: 2 }}>
                            {[1, 2, 3].map((s) => (
                              <div key={s} style={{ width: 6, height: 6, borderRadius: 2, background: s <= a.severity ? (a.severity >= 3 ? "#ef4444" : a.severity >= 2 ? "#f59e0b" : "#3b82f6") : "rgba(255,255,255,0.06)" }} />
                            ))}
                          </div>
                          {isMgrShift && (
                            <span style={{ fontSize: 9, fontWeight: 700, color: "#ef4444", background: "rgba(239,68,68,0.15)", padding: "2px 5px", borderRadius: 3 }}>
                              EN SU TURNO
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "40px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>📅</div>
                <div style={{ fontSize: 14, color: "#64748b", fontWeight: 500, marginBottom: 6 }}>Selecciona un día</div>
                <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
                  Haz click en cualquier celda de la timeline para ver las incidencias de ese día, separadas por turno y marcando cuáles ocurrieron durante el turno del gerente seleccionado.
                </div>
              </div>
            )}
          </div>

          {/* Dimension breakdown */}
          <div style={{ width: 320, flexShrink: 0 }}>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "18px 22px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 14 }}>
                Desglose por dimensión · {selectedMgrData?.name}
              </div>

              {Object.entries(DIMENSIONS).map(([key, dim]) => {
                const d = selectedMgrData?.stats.dimBreakdown[key] || { count: 0, amount: 0 };
                const maxCount = Math.max(...Object.values(selectedMgrData?.stats.dimBreakdown || {}).map((v) => v.count), 1);
                const active = activeDims.has(key);
                return (
                  <div key={key} style={{ marginBottom: 12, opacity: active ? 1 : 0.3 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                        <span style={{ fontSize: 13 }}>{dim.icon}</span>
                        <span style={{ fontWeight: 500, color: "#cbd5e1" }}>{dim.label}</span>
                      </div>
                      <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: d.count > 5 ? dim.color : "#94a3b8" }}>
                          {d.count}
                        </span>
                        {d.amount > 0 && (
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#64748b" }}>
                            €{d.amount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ height: 4, background: "rgba(255,255,255,0.04)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(d.count / maxCount) * 100}%`, background: dim.color, borderRadius: 2, transition: "width 0.4s ease", opacity: 0.7 }} />
                    </div>
                  </div>
                );
              })}

              {/* Correlation insight */}
              {selectedMgrData && selectedMgrData.stats.correlationScore >= 40 && (
                <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)", borderRadius: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                    Patrón detectado
                  </div>
                  <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.5 }}>
                    {selectedMgrData.stats.multiDimDays > 0 && (
                      <>
                        En <strong>{selectedMgrData.stats.multiDimDays} días</strong> coincidieron anomalías de múltiples dimensiones durante sus turnos.{" "}
                      </>
                    )}
                    El <strong>{Math.round(selectedMgrData.stats.anomalyRate * 100)}%</strong> de sus turnos presentan incidencias,
                    con una severidad media de <strong>{selectedMgrData.stats.avgSeverity.toFixed(1)}/3</strong>.
                    {selectedMgrData.stats.anomalyRate > 0.5 && " Esto es significativamente superior al resto del equipo."}
                  </div>
                </div>
              )}

              {selectedMgrData && selectedMgrData.stats.correlationScore < 40 && (
                <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.1)", borderRadius: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#22c55e", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                    Sin patrón significativo
                  </div>
                  <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.5 }}>
                    Las incidencias durante los turnos de {selectedMgrData.name} están dentro de los rangos normales y no muestran concentración anómala.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ──── FOOTER ──── */}
      <div style={{ padding: "16px 28px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#475569" }}>
        <div>
          Correlación = f(% turnos con incidencia, severidad media, días con anomalías multi-dimensión) · No implica causalidad
        </div>
        <div>Fuentes: POS · Fichaje · Inventario · Contabilidad</div>
      </div>
    </div>
  );
}
