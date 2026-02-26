import { useState, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════
// PROTOTYPE #5 — Grid de Anomalías de Personal por Turno
// Personnel anomaly detection: HR × POS cross-reference
// ═══════════════════════════════════════════════════════════════

const LOCATIONS = ["Pamplona", "Bilbao", "Burgos", "San Sebastián", "Vitoria", "Zaragoza"];
const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DAYS_SHORT = ["L", "M", "X", "J", "V", "S", "D"];
const DATES = ["17", "18", "19", "20", "21", "22", "23"];

const SHIFTS = {
  morning:   { label: "Mañana", short: "M", hours: "8–16h", color: "#fbbf24" },
  afternoon: { label: "Tarde",  short: "T", hours: "16–00h", color: "#60a5fa" },
  night:     { label: "Noche",  short: "N", hours: "00–8h",  color: "#a78bfa" },
};

// ─── ANOMALY TYPES ──────────────────────────────────────────

const ANOMALY_TYPES = {
  no_show:       { icon: "🚫", label: "No-show",           color: "#ef4444", severity: 3, desc: "Empleado planificado que no fichó" },
  late_arrival:  { icon: "⏰", label: "Llegada tardía",     color: "#fb923c", severity: 2, desc: "Fichaje >15min después del inicio de turno" },
  early_exit:    { icon: "🚪", label: "Salida anticipada",  color: "#fb923c", severity: 2, desc: "Fichaje de salida >30min antes del fin de turno" },
  overtime:      { icon: "⏱️", label: "Horas extra",        color: "#fbbf24", severity: 1, desc: "Turno >2h sobre las horas contratadas" },
  understaffed:  { icon: "📉", label: "Infradotación",      color: "#ef4444", severity: 3, desc: "Plantilla real < plantilla mínima planificada" },
  overstaffed:   { icon: "📈", label: "Sobredotación",      color: "#60a5fa", severity: 1, desc: "Plantilla real > plantilla máxima + 20%" },
  low_productivity: { icon: "📊", label: "Baja productividad", color: "#fb923c", severity: 2, desc: "€/h empleado <80% de la media del local" },
  unplanned:     { icon: "❓", label: "No planificado",      color: "#a78bfa", severity: 1, desc: "Empleado fichó sin turno asignado en planificación" },
};

// ─── SHIFT DATA GENERATOR ───────────────────────────────────

function mkShift(planned, actual, posActive, revenue, transactions, anomalies, manager) {
  const hoursPlanned = planned * 8;
  const hoursActual = actual * 8;
  const productivity = actual > 0 ? +(revenue / hoursActual).toFixed(1) : 0;
  return { planned, actual, posActive, revenue, transactions, anomalies, manager, hoursPlanned, hoursActual, productivity };
}

// anomalies: array of { type, employee?, minutes?, detail? }

const DATA = {
  Pamplona: [
    // Day 0 Mon: M, T, N
    [
      mkShift(5, 5, 5, 1260, 42, [], "Fernando D."),
      mkShift(7, 7, 7, 2040, 68, [{ type: "late_arrival", employee: "Ana R.", minutes: 22 }], "Patricia E."),
      mkShift(4, 3, 3, 900, 35, [
        { type: "no_show", employee: "Lucía M.", detail: "Sin aviso previo" },
        { type: "understaffed", detail: "3 de 4 mínimo" },
        { type: "overtime", employee: "Roberto G.", minutes: 145 },
      ], "Roberto G."),
    ],
    // Day 1 Tue
    [
      mkShift(5, 5, 5, 1140, 38, [], "Fernando D."),
      mkShift(7, 6, 6, 1860, 62, [{ type: "early_exit", employee: "Carlos V.", minutes: 45 }], "Patricia E."),
      mkShift(4, 3, 2, 800, 32, [
        { type: "no_show", employee: "Lucía M.", detail: "2° día consecutivo" },
        { type: "understaffed", detail: "3 de 4 mínimo" },
        { type: "low_productivity", employee: "David S.", detail: "€12.5/h vs media €18.7/h" },
      ], "Roberto G."),
    ],
    // Day 2 Wed
    [
      mkShift(5, 5, 5, 1350, 45, [], "Fernando D."),
      mkShift(7, 7, 7, 2160, 72, [], "Patricia E."),
      mkShift(4, 4, 3, 990, 38, [{ type: "low_productivity", employee: "David S.", detail: "€11.8/h vs media €18.7/h" }], "Roberto G."),
    ],
    // Day 3 Thu
    [
      mkShift(5, 5, 5, 1440, 48, [], "Fernando D."),
      mkShift(7, 7, 7, 2340, 78, [{ type: "late_arrival", employee: "Ana R.", minutes: 18 }], "Patricia E."),
      mkShift(4, 3, 3, 1120, 40, [
        { type: "no_show", employee: "Marcos T.", detail: "Baja no comunicada" },
        { type: "understaffed", detail: "3 de 4 mínimo" },
        { type: "overtime", employee: "Roberto G.", minutes: 180 },
      ], "Roberto G."),
    ],
    // Day 4 Fri
    [
      mkShift(6, 6, 6, 1925, 55, [], "Fernando D."),
      mkShift(9, 9, 9, 3325, 95, [{ type: "overtime", employee: "Elena P.", minutes: 95 }], "Patricia E."),
      mkShift(5, 4, 4, 1560, 52, [
        { type: "no_show", employee: "Lucía M.", detail: "3er no-show esta semana" },
        { type: "understaffed", detail: "4 de 5 mínimo" },
      ], "Roberto G."),
    ],
    // Day 5 Sat
    [
      mkShift(7, 7, 7, 2170, 62, [{ type: "overtime", employee: "Miguel A.", minutes: 60 }], "Fernando D."),
      mkShift(10, 10, 9, 3780, 108, [{ type: "low_productivity", employee: "Nuevo1", detail: "€14.2/h vs media €22.1/h — 2° semana" }], "Patricia E."),
      mkShift(6, 4, 4, 1740, 58, [
        { type: "no_show", employee: "Lucía M." },
        { type: "no_show", employee: "Marcos T." },
        { type: "understaffed", detail: "4 de 6 mínimo" },
        { type: "overtime", employee: "Roberto G.", minutes: 210 },
      ], "Roberto G."),
    ],
    // Day 6 Sun
    [
      mkShift(6, 6, 6, 1750, 50, [], "Fernando D."),
      mkShift(8, 8, 8, 2870, 82, [], "Patricia E."),
      mkShift(4, 4, 3, 1176, 42, [{ type: "low_productivity", employee: "David S.", detail: "€11.0/h vs media €18.7/h" }], "Roberto G."),
    ],
  ],
  Bilbao: [
    [mkShift(5,5,5,1200,40,[],                                            "Mikel A."),mkShift(7,7,7,1950,65,[],                                                 "Leire S."),mkShift(3,3,3,870,30,[],                                                     "Mikel A.")],
    [mkShift(5,5,5,1260,42,[],                                            "Mikel A."),mkShift(7,7,7,1800,60,[],                                                 "Leire S."),mkShift(3,3,3,812,28,[],                                                     "Mikel A.")],
    [mkShift(5,5,5,1140,38,[],                                            "Mikel A."),mkShift(7,7,7,2040,68,[],                                                 "Leire S."),mkShift(3,3,3,928,32,[],                                                     "Mikel A.")],
    [mkShift(5,5,5,1350,45,[],                                            "Mikel A."),mkShift(7,7,7,2160,72,[{type:"late_arrival",employee:"Iker Z.",minutes:16}],"Leire S."),mkShift(3,3,3,1015,35,[],                                                    "Mikel A.")],
    [mkShift(6,6,6,1820,52,[],                                            "Mikel A."),mkShift(9,9,9,3080,88,[],                                                 "Leire S."),mkShift(4,4,4,1160,40,[],                                                    "Mikel A.")],
    [mkShift(6,6,6,2030,58,[{type:"overtime",employee:"Mikel A.",minutes:70}],"Mikel A."),mkShift(10,10,10,3430,98,[],                                            "Leire S."),mkShift(4,4,4,1305,45,[],                                                    "Mikel A.")],
    [mkShift(5,5,5,1680,48,[],                                            "Mikel A."),mkShift(8,8,8,2625,75,[],                                                 "Leire S."),mkShift(3,3,3,1102,38,[],                                                    "Mikel A.")],
  ],
  Burgos: [
    [mkShift(4,4,4,1050,35,[],                                            "Pablo N."),mkShift(6,6,6,1650,55,[{type:"late_arrival",employee:"Marta L.",minutes:25}],"Sara T."),mkShift(3,3,3,784,28,[{type:"overtime",employee:"Diego F.",minutes:120},{type:"low_productivity",employee:"Iván C.",detail:"€10.2/h vs €16.3/h"}],"Diego F.")],
    [mkShift(4,4,4,960,32,[],                                             "Pablo N."),mkShift(6,5,5,1440,48,[{type:"no_show",employee:"Marta L.",detail:"Sin aviso"}],"Sara T."),mkShift(3,3,2,700,25,[{type:"low_productivity",employee:"Iván C.",detail:"€9.7/h vs €16.3/h"},{type:"understaffed",detail:"Iván sin actividad POS relevante"}],"Diego F.")],
    [mkShift(4,4,4,1140,38,[],                                            "Pablo N."),mkShift(6,6,6,1740,58,[],                                                 "Sara T."),mkShift(3,3,3,840,30,[],                                                      "Diego F.")],
    [mkShift(4,4,4,1200,40,[],                                            "Pablo N."),mkShift(6,6,6,1860,62,[],                                                 "Sara T."),mkShift(3,3,3,896,32,[{type:"overtime",employee:"Diego F.",minutes:100}],     "Diego F.")],
    [mkShift(5,5,5,1680,48,[],                                            "Pablo N."),mkShift(8,8,8,2870,82,[{type:"overtime",employee:"Sara T.",minutes:80}],    "Sara T."),mkShift(4,3,3,1260,42,[{type:"no_show",employee:"Iván C."},{type:"understaffed",detail:"3 de 4 mín"}],"Diego F.")],
    [mkShift(6,6,6,1925,55,[],                                            "Pablo N."),mkShift(9,9,9,3325,95,[{type:"overtime",employee:"Sara T.",minutes:95}],    "Sara T."),mkShift(5,4,4,1440,48,[{type:"no_show",employee:"Iván C."},{type:"understaffed",detail:"4 de 5 mín"},{type:"overtime",employee:"Diego F.",minutes:150}],"Diego F.")],
    [mkShift(5,5,5,1470,42,[],                                            "Pablo N."),mkShift(7,7,7,2450,70,[],                                                 "Sara T."),mkShift(3,3,3,980,35,[],                                                      "Diego F.")],
  ],
  "San Sebastián": [
    [mkShift(5,5,5,1540,44,[],  "Jon B."),mkShift(7,7,7,2520,72,[],  "Nerea K."),mkShift(3,3,3,924,28,[],   "Jon B.")],
    [mkShift(5,5,5,1470,42,[],  "Jon B."),mkShift(7,7,7,2380,68,[],  "Nerea K."),mkShift(3,3,3,825,25,[],   "Jon B.")],
    [mkShift(5,5,5,1680,48,[],  "Jon B."),mkShift(7,7,7,2625,75,[],  "Nerea K."),mkShift(3,3,3,990,30,[],   "Jon B.")],
    [mkShift(5,5,5,1750,50,[],  "Jon B."),mkShift(8,8,8,2800,80,[],  "Nerea K."),mkShift(3,3,3,1056,32,[], "Jon B.")],
    [mkShift(6,6,6,2320,58,[],  "Jon B."),mkShift(9,9,9,3920,98,[],  "Nerea K."),mkShift(4,4,4,1320,40,[], "Jon B.")],
    [mkShift(7,7,7,2600,65,[],  "Jon B."),mkShift(10,10,10,4480,112,[],"Nerea K."),mkShift(4,4,4,1485,45,[],"Jon B.")],
    [mkShift(5,5,5,2080,52,[],  "Jon B."),mkShift(8,8,8,3400,85,[],  "Nerea K."),mkShift(3,3,3,1155,35,[], "Jon B.")],
  ],
  Vitoria: [
    [mkShift(4,4,4,960,32,[],   "Gorka E."),mkShift(6,6,6,1650,55,[{type:"late_arrival",employee:"Aitor D.",minutes:20}],"Aitor D."),mkShift(3,3,3,784,28,[{type:"overtime",employee:"Gorka E.",minutes:90}],"Gorka E.")],
    [mkShift(4,4,4,840,28,[],   "Gorka E."),mkShift(6,5,5,1500,50,[{type:"no_show",employee:"Javier R."}],"Aitor D."),mkShift(3,3,3,700,25,[{type:"overtime",employee:"Gorka E.",minutes:110}],"Gorka E.")],
    [mkShift(4,4,4,1050,35,[],  "Gorka E."),mkShift(6,6,6,1740,58,[],                                     "Aitor D."),mkShift(3,3,3,840,30,[],                                           "Gorka E.")],
    [mkShift(4,4,4,1140,38,[],  "Gorka E."),mkShift(6,6,6,1860,62,[],                                     "Aitor D."),mkShift(3,3,3,896,32,[{type:"overtime",employee:"Gorka E.",minutes:80}],"Gorka E.")],
    [mkShift(5,5,5,1575,45,[{type:"unplanned",employee:"Temp1"}],"Gorka E."),mkShift(8,8,7,2730,78,[{type:"early_exit",employee:"Javier R.",minutes:40}],"Aitor D."),mkShift(4,3,3,1064,38,[{type:"no_show",employee:"Temp2"},{type:"understaffed",detail:"3 de 4"}],"Gorka E.")],
    [mkShift(6,6,6,1820,52,[{type:"overtime",employee:"Gorka E.",minutes:100}],"Gorka E."),mkShift(9,9,8,3080,88,[{type:"low_productivity",employee:"Javier R.",detail:"€12.8/h vs €19.2/h"}],"Aitor D."),mkShift(4,4,4,1176,42,[{type:"overtime",employee:"Gorka E.",minutes:130}],"Gorka E.")],
    [mkShift(5,5,5,1400,40,[],  "Gorka E."),mkShift(7,7,7,2275,65,[],                                     "Aitor D."),mkShift(3,3,3,896,32,[],                                           "Gorka E.")],
  ],
  Zaragoza: [
    [mkShift(5,5,5,1200,40,[],  "Tomás W."),mkShift(7,7,7,1950,65,[],  "Raúl C."),mkShift(3,3,3,870,30,[],   "Tomás W.")],
    [mkShift(5,5,5,1140,38,[],  "Tomás W."),mkShift(7,7,7,1800,60,[],  "Raúl C."),mkShift(3,3,3,812,28,[],   "Tomás W.")],
    [mkShift(5,5,5,1260,42,[],  "Tomás W."),mkShift(7,7,7,2040,68,[],  "Raúl C."),mkShift(3,3,3,928,32,[],   "Tomás W.")],
    [mkShift(5,5,5,1350,45,[],  "Tomás W."),mkShift(7,7,7,2160,72,[],  "Raúl C."),mkShift(3,3,3,1015,35,[], "Tomás W.")],
    [mkShift(6,6,6,1925,55,[{type:"late_arrival",employee:"Nuevo2",minutes:30}],"Tomás W."),mkShift(9,9,9,3150,90,[],                                       "Raúl C."),mkShift(4,4,4,1218,42,[],"Tomás W.")],
    [mkShift(6,6,6,2100,60,[],  "Tomás W."),mkShift(10,10,10,3570,102,[],"Raúl C."),mkShift(4,4,4,1392,48,[], "Tomás W.")],
    [mkShift(5,5,5,1680,48,[],  "Tomás W."),mkShift(7,7,7,2730,78,[],  "Raúl C."),mkShift(3,3,3,1015,35,[], "Tomás W.")],
  ],
};

// ─── COMPUTATION ────────────────────────────────────────────

function computeAll() {
  const result = {};
  LOCATIONS.forEach((loc) => {
    result[loc] = DATA[loc].map((dayShifts) => {
      return dayShifts.map((shift) => {
        const anomalyCount = shift.anomalies.length;
        const maxSeverity = anomalyCount > 0
          ? Math.max(...shift.anomalies.map((a) => ANOMALY_TYPES[a.type].severity))
          : 0;
        const staffDelta = shift.actual - shift.planned;
        return { ...shift, anomalyCount, maxSeverity, staffDelta };
      });
    });
  });
  return result;
}

function cellSeverity(dayShifts) {
  const total = dayShifts.reduce((s, sh) => s + sh.anomalyCount, 0);
  const maxSev = Math.max(...dayShifts.map((sh) => sh.maxSeverity), 0);
  return { total, maxSev };
}

function severityStyle(maxSev) {
  if (maxSev >= 3) return { bg: "#7f1d1d", text: "#f87171", ring: "#dc2626" };
  if (maxSev >= 2) return { bg: "#7c2d12", text: "#fb923c", ring: "#ea580c" };
  if (maxSev >= 1) return { bg: "#422006", text: "#fbbf24", ring: "#d97706" };
  return { bg: "#064e3b", text: "#34d399", ring: "#059669" };
}

// ─── MAIN COMPONENT ─────────────────────────────────────────

export default function PersonnelAnomalyGrid() {
  const [selectedCell, setSelectedCell] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [viewMode, setViewMode] = useState("day"); // "day" | "shift"
  const [filterSeverity, setFilterSeverity] = useState(0); // 0=all, 1=warn+, 2=alert+, 3=critical

  const allData = useMemo(() => computeAll(), []);

  // Summary stats
  const stats = useMemo(() => {
    let totalAnomalies = 0, noShows = 0, understaffed = 0, overtime = 0, lateArrivals = 0;
    let cleanShifts = 0, totalShifts = 0;
    const locAnomalies = {};

    LOCATIONS.forEach((loc) => {
      locAnomalies[loc] = 0;
      allData[loc].forEach((dayShifts) => {
        dayShifts.forEach((shift) => {
          totalShifts++;
          if (shift.anomalyCount === 0) cleanShifts++;
          totalAnomalies += shift.anomalyCount;
          locAnomalies[loc] += shift.anomalyCount;
          shift.anomalies.forEach((a) => {
            if (a.type === "no_show") noShows++;
            if (a.type === "understaffed") understaffed++;
            if (a.type === "overtime") overtime++;
            if (a.type === "late_arrival") lateArrivals++;
          });
        });
      });
    });

    const worstLoc = Object.entries(locAnomalies).sort((a, b) => b[1] - a[1])[0];
    return { totalAnomalies, noShows, understaffed, overtime, lateArrivals, cleanShifts, totalShifts, worstLoc, locAnomalies };
  }, [allData]);

  // Sort locations by anomaly count (worst first)
  const sortedLocs = useMemo(() => {
    return [...LOCATIONS].sort((a, b) => stats.locAnomalies[b] - stats.locAnomalies[a]);
  }, [stats]);

  // Detail panel
  const detail = useMemo(() => {
    const c = selectedCell || hoveredCell;
    if (!c) return null;
    const dayShifts = allData[c.loc][c.day];
    return { loc: c.loc, dayIdx: c.day, dayName: DAYS[c.day], date: DATES[c.day], shifts: dayShifts };
  }, [selectedCell, hoveredCell, allData]);

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: "#0c0c1d", minHeight: "100vh", color: "#e2e8f0", padding: 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* ──── HEADER ──── */}
      <div style={{ background: "linear-gradient(180deg, #12122a 0%, #0c0c1d 100%)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #E85A24 0%, #fb923c 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: "0 4px 16px rgba(232,90,36,0.25)" }}>
              👥
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>Salud Operacional — Personal</h1>
          </div>
          <p style={{ fontSize: 12, color: "#64748b", marginTop: 4, marginLeft: 42 }}>
            Anomalías de personal por turno · Semana 17–23 Feb 2026 · HR × POS
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
            {[{ key: "day", label: "Por día" }, { key: "shift", label: "Por turno" }].map((v) => (
              <button key={v.key} onClick={() => setViewMode(v.key)} style={{
                padding: "6px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer",
                background: viewMode === v.key ? "rgba(255,255,255,0.08)" : "transparent",
                color: viewMode === v.key ? "#e2e8f0" : "#64748b",
                border: "none", fontFamily: "'DM Sans', sans-serif",
              }}>{v.label}</button>
            ))}
          </div>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
            {[{ key: 0, label: "Todos" }, { key: 2, label: "⚠ Alerta+" }, { key: 3, label: "🔴 Crítico" }].map((v) => (
              <button key={v.key} onClick={() => setFilterSeverity(v.key)} style={{
                padding: "6px 12px", fontSize: 11, fontWeight: 500, cursor: "pointer",
                background: filterSeverity === v.key ? "rgba(255,255,255,0.08)" : "transparent",
                color: filterSeverity === v.key ? "#e2e8f0" : "#64748b",
                border: "none", fontFamily: "'DM Sans', sans-serif",
              }}>{v.label}</button>
            ))}
          </div>
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "#94a3b8" }}>
            Feb 2026
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 28px" }}>
        {/* ──── SUMMARY STRIP ──── */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          {[
            { icon: "⚠️", label: "Total anomalías", value: stats.totalAnomalies, color: stats.totalAnomalies > 20 ? "#fb923c" : "#fbbf24", sub: `en ${stats.totalShifts} turnos` },
            { icon: "🚫", label: "No-shows", value: stats.noShows, color: stats.noShows > 5 ? "#ef4444" : "#fbbf24", sub: stats.noShows > 0 ? "Investigar" : "Ninguno" },
            { icon: "📉", label: "Turnos infradotados", value: stats.understaffed, color: stats.understaffed > 3 ? "#ef4444" : "#fbbf24", sub: `de ${stats.totalShifts}` },
            { icon: "⏱️", label: "Alertas horas extra", value: stats.overtime, color: stats.overtime > 5 ? "#fb923c" : "#fbbf24" },
            { icon: "✅", label: "Turnos limpios", value: stats.cleanShifts, color: "#22c55e", sub: `${Math.round(stats.cleanShifts / stats.totalShifts * 100)}%` },
          ].map((s) => (
            <div key={s.label} style={{ flex: 1, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 9, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</span>
                  {s.sub && <span style={{ fontSize: 10, color: "#64748b" }}>{s.sub}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 20 }}>
          {/* ──── GRID ──── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, overflow: "hidden" }}>
              {/* Header row */}
              <div style={{ display: "grid", gridTemplateColumns: "160px repeat(7, 1fr) 60px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Local</div>
                {DAYS.map((d, i) => (
                  <div key={d} style={{ padding: "10px 4px", textAlign: "center" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: i >= 5 ? "#94a3b8" : "#475569" }}>{DAYS_SHORT[i]}</div>
                    <div style={{ fontSize: 9, color: "#3f3f46" }}>{DATES[i]}</div>
                  </div>
                ))}
                <div style={{ padding: "10px 4px", textAlign: "center", fontSize: 10, fontWeight: 700, color: "#64748b" }}>Sem</div>
              </div>

              {/* Location rows */}
              {sortedLocs.map((loc) => {
                const weekTotal = stats.locAnomalies[loc];
                const weekColor = weekTotal === 0 ? "#22c55e" : weekTotal <= 3 ? "#fbbf24" : weekTotal <= 8 ? "#fb923c" : "#ef4444";

                return (
                  <div key={loc} style={{ display: "grid", gridTemplateColumns: "160px repeat(7, 1fr) 60px", borderBottom: "1px solid rgba(255,255,255,0.03)", alignItems: "center" }}>
                    {/* Location name */}
                    <div style={{ padding: "10px 16px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{loc}</div>
                      <div style={{ fontSize: 10, color: weekTotal === 0 ? "#22c55e" : "#475569" }}>
                        {weekTotal === 0 ? "Sin anomalías" : `${weekTotal} anomalía${weekTotal > 1 ? "s" : ""}`}
                      </div>
                    </div>

                    {/* Day cells */}
                    {DAYS.map((_, dayIdx) => {
                      const dayShifts = allData[loc][dayIdx];
                      const { total, maxSev } = cellSeverity(dayShifts);
                      const sty = severityStyle(maxSev);
                      const isSel = selectedCell?.loc === loc && selectedCell?.day === dayIdx;
                      const isHov = hoveredCell?.loc === loc && hoveredCell?.day === dayIdx;

                      // Filter
                      const visible = maxSev >= filterSeverity;

                      if (viewMode === "day") {
                        return (
                          <div key={dayIdx}
                            onClick={() => setSelectedCell(isSel ? null : { loc, day: dayIdx })}
                            onMouseEnter={() => setHoveredCell({ loc, day: dayIdx })}
                            onMouseLeave={() => setHoveredCell(null)}
                            style={{
                              margin: "3px 2px", padding: "6px 4px", borderRadius: 8,
                              textAlign: "center",
                              background: total > 0 && visible ? sty.bg : "rgba(255,255,255,0.015)",
                              cursor: "pointer",
                              border: isSel ? `2px solid ${sty.text}` : isHov ? `1px solid ${sty.text}44` : "1px solid transparent",
                              transition: "all 0.15s",
                              opacity: visible || total === 0 ? 1 : 0.25,
                            }}
                          >
                            {total > 0 ? (
                              <>
                                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, color: sty.text }}>{total}</div>
                                <div style={{ fontSize: 8, color: sty.text, opacity: 0.7, marginTop: 1 }}>
                                  {maxSev >= 3 ? "crítico" : maxSev >= 2 ? "alerta" : "aviso"}
                                </div>
                              </>
                            ) : (
                              <>
                                <div style={{ fontSize: 14, opacity: 0.4 }}>✓</div>
                                <div style={{ fontSize: 8, color: "#22c55e", opacity: 0.5 }}>OK</div>
                              </>
                            )}
                          </div>
                        );
                      }

                      // Shift view: 3 mini cells stacked
                      return (
                        <div key={dayIdx}
                          onClick={() => setSelectedCell(isSel ? null : { loc, day: dayIdx })}
                          onMouseEnter={() => setHoveredCell({ loc, day: dayIdx })}
                          onMouseLeave={() => setHoveredCell(null)}
                          style={{
                            margin: "3px 2px", display: "flex", flexDirection: "column", gap: 1,
                            cursor: "pointer", borderRadius: 8, padding: 2,
                            border: isSel ? "2px solid rgba(255,255,255,0.2)" : isHov ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
                            opacity: visible || total === 0 ? 1 : 0.25,
                          }}
                        >
                          {dayShifts.map((shift, sIdx) => {
                            const ss = severityStyle(shift.maxSeverity);
                            const shiftKey = ["morning", "afternoon", "night"][sIdx];
                            return (
                              <div key={sIdx} style={{
                                background: shift.anomalyCount > 0 ? ss.bg : "rgba(255,255,255,0.015)",
                                borderRadius: 3, padding: "2px 2px", textAlign: "center",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
                              }} title={`${SHIFTS[shiftKey].label}: ${shift.anomalyCount} anomalías`}>
                                <div style={{ width: 4, height: 4, borderRadius: "50%", background: SHIFTS[shiftKey].color, opacity: 0.6, flexShrink: 0 }} />
                                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: shift.anomalyCount > 0 ? ss.text : "#22c55e" }}>
                                  {shift.anomalyCount > 0 ? shift.anomalyCount : "✓"}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}

                    {/* Week total */}
                    <div style={{ padding: "8px 4px", textAlign: "center" }}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, color: weekColor }}>{weekTotal}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, padding: "0 4px" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                {[
                  { bg: "#064e3b", label: "0 · Limpio" },
                  { bg: "#422006", label: "1-2 · Aviso" },
                  { bg: "#7c2d12", label: "3-4 · Alerta" },
                  { bg: "#7f1d1d", label: "5+ · Crítico" },
                ].map((item) => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 14, height: 10, borderRadius: 2, background: item.bg }} />
                    <span style={{ fontSize: 10, color: "#475569" }}>{item.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {Object.entries(ANOMALY_TYPES).slice(0, 4).map(([key, at]) => (
                  <span key={key} style={{ fontSize: 10, color: "#3f3f46" }}>{at.icon} {at.label}</span>
                ))}
              </div>
            </div>
          </div>

          {/* ──── DETAIL PANEL ──── */}
          <div style={{ width: 370, flexShrink: 0 }}>
            {detail ? (
              <div style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 14, padding: "16px 18px", position: "sticky", top: 20,
                animation: "fadeIn 0.15s ease",
              }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
                  <div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{detail.loc}</span>
                    <span style={{ fontSize: 12, color: "#64748b", marginLeft: 8 }}>{detail.dayName} {detail.date} Feb</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#475569" }}>
                    {detail.shifts.reduce((s, sh) => s + sh.anomalyCount, 0)} anomalías
                  </div>
                </div>

                {/* Shift strips */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 14 }}>
                  {detail.shifts.map((shift, sIdx) => {
                    const shiftKey = ["morning", "afternoon", "night"][sIdx];
                    const ss = severityStyle(shift.maxSeverity);
                    return (
                      <div key={sIdx} style={{
                        background: shift.anomalyCount > 0 ? ss.bg : "rgba(255,255,255,0.03)",
                        borderRadius: 8, padding: "8px 8px", textAlign: "center",
                        border: `1px solid ${shift.anomalyCount > 0 ? ss.text + "22" : "rgba(255,255,255,0.04)"}`,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 4 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: SHIFTS[shiftKey].color }} />
                          <span style={{ fontSize: 10, fontWeight: 600, color: "#cbd5e1" }}>{SHIFTS[shiftKey].label}</span>
                        </div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: shift.anomalyCount > 0 ? ss.text : "#22c55e", lineHeight: 1 }}>
                          {shift.anomalyCount > 0 ? shift.anomalyCount : "✓"}
                        </div>
                        <div style={{ fontSize: 9, color: "#64748b", marginTop: 3 }}>
                          👤 {shift.manager.split(" ").slice(0, 2).join(" ")}
                        </div>
                        <div style={{ fontSize: 8, color: "#475569", fontFamily: "'JetBrains Mono', monospace", marginTop: 1 }}>
                          {shift.planned}→{shift.actual} pers · €{shift.productivity}/h
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Anomaly list per shift */}
                {detail.shifts.map((shift, sIdx) => {
                  if (shift.anomalyCount === 0) return null;
                  const shiftKey = ["morning", "afternoon", "night"][sIdx];

                  return (
                    <div key={sIdx} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: SHIFTS[shiftKey].color }} />
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8" }}>{SHIFTS[shiftKey].label} ({SHIFTS[shiftKey].hours})</span>
                      </div>
                      {shift.anomalies.map((anomaly, aIdx) => {
                        const at = ANOMALY_TYPES[anomaly.type];
                        return (
                          <div key={aIdx} style={{
                            display: "flex", alignItems: "flex-start", gap: 8,
                            padding: "6px 10px", marginBottom: 3,
                            background: `${at.color}08`, borderRadius: 6,
                            borderLeft: `3px solid ${at.color}`,
                          }}>
                            <span style={{ fontSize: 12, marginTop: 1, flexShrink: 0 }}>{at.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 11, fontWeight: 600, color: at.color }}>{at.label}</span>
                                {anomaly.employee && (
                                  <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500 }}>{anomaly.employee}</span>
                                )}
                              </div>
                              <div style={{ fontSize: 10, color: "#475569", marginTop: 1 }}>
                                {anomaly.detail || at.desc}
                                {anomaly.minutes && ` · ${anomaly.minutes}min`}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}

                {/* No anomalies case */}
                {detail.shifts.every((s) => s.anomalyCount === 0) && (
                  <div style={{ textAlign: "center", padding: "16px 0" }}>
                    <div style={{ fontSize: 24, marginBottom: 6, opacity: 0.5 }}>✅</div>
                    <div style={{ fontSize: 12, color: "#22c55e", fontWeight: 500 }}>Día limpio</div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>Sin anomalías de personal en ningún turno</div>
                  </div>
                )}

                {/* Staffing summary table */}
                <div style={{ marginTop: 8, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 52px 52px 52px", background: "rgba(255,255,255,0.03)", padding: "5px 10px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 }}>Dotación</div>
                    {["morning", "afternoon", "night"].map((sk) => (
                      <div key={sk} style={{ textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: SHIFTS[sk].color }} />
                        <span style={{ fontSize: 9, fontWeight: 600, color: "#64748b" }}>{SHIFTS[sk].short}</span>
                      </div>
                    ))}
                  </div>
                  {[
                    { label: "Planificado", key: "planned" },
                    { label: "Real", key: "actual" },
                    { label: "Activo POS", key: "posActive" },
                    { label: "€/hora", key: "productivity" },
                  ].map((row, rIdx) => (
                    <div key={row.key} style={{
                      display: "grid", gridTemplateColumns: "1fr 52px 52px 52px",
                      padding: "4px 10px", background: rIdx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                      borderBottom: rIdx < 3 ? "1px solid rgba(255,255,255,0.03)" : "none",
                    }}>
                      <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500 }}>{row.label}</div>
                      {detail.shifts.map((shift, sIdx) => {
                        const val = shift[row.key];
                        let color = "#cbd5e1";
                        if (row.key === "actual" && val < shift.planned) color = "#ef4444";
                        if (row.key === "posActive" && val < shift.actual) color = "#fb923c";
                        if (row.key === "productivity") color = val < 15 ? "#fb923c" : "#22c55e";
                        return (
                          <div key={sIdx} style={{ textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color }}>
                            {row.key === "productivity" ? `€${val}` : val}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Methodology */}
                <div style={{ marginTop: 8, fontSize: 10, color: "#3f3f46", lineHeight: 1.4, padding: "0 2px" }}>
                  Cruza planificación (Skello/PayFit) × fichajes × actividad POS. Rojo en "Real" = menos personas que planificadas. Naranja en "Activo POS" = presentes pero sin actividad registrada.
                </div>
              </div>
            ) : (
              <div style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 14, padding: "40px 24px", textAlign: "center", position: "sticky", top: 20,
              }}>
                <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>👥</div>
                <div style={{ fontSize: 14, color: "#64748b", fontWeight: 500, marginBottom: 6 }}>Anomalías de personal</div>
                <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
                  Pasa el ratón sobre cualquier celda para ver las anomalías detectadas: no-shows, llegadas tardías, infradotación, horas extra, y baja productividad.
                </div>
                <div style={{ marginTop: 16, padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 8, fontSize: 11, color: "#475569", lineHeight: 1.6, textAlign: "left" }}>
                  <strong style={{ color: "#94a3b8" }}>3 fuentes cruzadas:</strong> Planificación de turnos (Skello), fichajes reales (PayFit), y actividad en POS (CEGID/Agora/GLOP). Si un empleado ficha pero no tiene actividad POS, aparece como anomalía.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ──── ANOMALY TYPE REFERENCE ──── */}
      <div style={{ padding: "0 28px 20px" }}>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 12, padding: "14px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
            Tipos de anomalía detectados
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {Object.entries(ANOMALY_TYPES).map(([key, at]) => (
              <div key={key} style={{ fontSize: 11, color: "#475569" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
                  <span style={{ fontSize: 13 }}>{at.icon}</span>
                  <span style={{ fontWeight: 600, color: at.color }}>{at.label}</span>
                  <span style={{
                    fontSize: 8, padding: "1px 4px", borderRadius: 3,
                    background: at.severity >= 3 ? "#7f1d1d" : at.severity >= 2 ? "#7c2d12" : "#422006",
                    color: at.severity >= 3 ? "#f87171" : at.severity >= 2 ? "#fb923c" : "#fbbf24",
                    fontWeight: 700,
                  }}>
                    S{at.severity}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: "#3f3f46", lineHeight: 1.4 }}>{at.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ──── FOOTER ──── */}
      <div style={{ padding: "16px 28px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#475569" }}>
        <div>Cruza 3 fuentes: Planificación (Skello) × Fichajes (PayFit) × Actividad POS · Sin caja negra</div>
        <div>Fuente: HR + POS · Actualización diaria al cierre de turno</div>
      </div>
    </div>
  );
}
