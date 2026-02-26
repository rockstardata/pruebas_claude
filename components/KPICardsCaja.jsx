import { useState, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════
// PROTOTYPE #3 — KPI Cards Simplificadas de Caja
// Executive summary cards for Cash & Sales operational health
// ═══════════════════════════════════════════════════════════════

// ─── DATA: 6 locations × 7 days ─────────────────────────────
const LOCATIONS = ["Pamplona", "Bilbao", "Burgos", "San Sebastián", "Vitoria", "Zaragoza"];
const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DATES = ["17", "18", "19", "20", "21", "22", "23"];

// Revenue per location per day (3 shifts summed)
const REVENUE = {
  Pamplona:       [4200, 3800, 4500, 4900, 6810, 7690, 5796],
  Bilbao:         [4020, 3872, 4108, 4525, 6060, 6765, 5407],
  Burgos:         [3484, 3100, 3720, 3956, 5810, 6690, 4900],
  "San Sebastián":[4984, 4675, 5295, 5606, 7560, 8565, 6635],
  Vitoria:        [3394, 3040, 3630, 3896, 5369, 6076, 4571],
  Zaragoza:       [3820, 3752, 4228, 4525, 6293, 7062, 5425],
};

// Transactions per location per day
const TRANSACTIONS = {
  Pamplona:       [145, 132, 155, 166, 202, 228, 174],
  Bilbao:         [135, 130, 138, 152, 180, 201, 161],
  Burgos:         [118, 105, 126, 134, 172, 198, 147],
  "San Sebastián":[144, 135, 153, 162, 196, 222, 172],
  Vitoria:        [115, 103, 123, 132, 161, 182, 137],
  Zaragoza:       [135, 126, 142, 152, 187, 210, 161],
};

// Cash discrepancy (€) per location per day — THRESHOLD METRIC (lower = better)
const CASH_GAP = {
  Pamplona:       [108, 109, 83, 168, 142, 175, 108],
  Bilbao:         [33, 42, 36, 53, 42, 56, 31],
  Burgos:         [97, 95, 80, 82, 137, 163, 98],
  "San Sebastián":[25, 21, 33, 24, 41, 48, 27],
  Vitoria:        [70, 85, 65, 74, 105, 125, 73],
  Zaragoza:       [52, 39, 44, 46, 62, 72, 42],
};

// Void rate (%) per location per day — THRESHOLD METRIC
const VOID_RATE = {
  Pamplona:       [2.07, 1.80, 1.63, 2.77, 2.50, 2.87, 1.90],
  Bilbao:         [0.87, 1.07, 0.93, 1.33, 1.00, 1.40, 0.80],
  Burgos:         [1.87, 1.73, 1.73, 1.73, 2.77, 3.23, 1.97],
  "San Sebastián":[0.60, 0.53, 0.80, 0.63, 0.93, 1.10, 0.63],
  Vitoria:        [1.53, 1.67, 1.47, 1.53, 2.40, 2.80, 1.67],
  Zaragoza:       [1.07, 0.90, 1.10, 1.17, 1.57, 1.83, 1.00],
};

// Drawer opens without sale per location per day — THRESHOLD METRIC
const DRAWER_OPENS = {
  Pamplona:       [9, 8, 7, 11, 11, 15, 8],
  Bilbao:         [4, 4, 4, 6, 4, 6, 3],
  Burgos:         [9, 8, 7, 9, 12, 15, 8],
  "San Sebastián":[2, 2, 3, 2, 5, 5, 2],
  Vitoria:        [8, 9, 6, 7, 12, 14, 7],
  Zaragoza:       [5, 4, 5, 6, 7, 9, 4],
};

// Previous week totals for comparison
const PREV_WEEK = {
  revenue: 147200,
  transactions: 6180,
  avgTicket: 23.82,
  cashGap: 2890,
  voidRate: 1.68,
  drawerOpens: 285,
};

// Weekly objectives
const OBJECTIVES = {
  revenue: 165000,
  transactions: 6500,
  avgTicket: 25.00,
  cashGap: 1400, // threshold: max tolerated per week
  voidRate: 1.50, // threshold: max % tolerated
  drawerOpens: 210, // threshold: max tolerated per week
};

// ─── COMPUTATION ENGINE ─────────────────────────────────────

function computeMetrics() {
  const metrics = {};

  // Per-location weekly totals
  const locData = {};
  LOCATIONS.forEach((loc) => {
    const rev = REVENUE[loc].reduce((a, b) => a + b, 0);
    const txn = TRANSACTIONS[loc].reduce((a, b) => a + b, 0);
    const gap = CASH_GAP[loc].reduce((a, b) => a + b, 0);
    const vr = VOID_RATE[loc].reduce((a, b) => a + b, 0) / 7;
    const dr = DRAWER_OPENS[loc].reduce((a, b) => a + b, 0);
    locData[loc] = {
      revenue: rev,
      transactions: txn,
      avgTicket: +(rev / txn).toFixed(2),
      cashGap: gap,
      voidRate: +vr.toFixed(2),
      drawerOpens: dr,
    };
  });

  // Group totals
  const totalRev = Object.values(locData).reduce((s, l) => s + l.revenue, 0);
  const totalTxn = Object.values(locData).reduce((s, l) => s + l.transactions, 0);
  const totalGap = Object.values(locData).reduce((s, l) => s + l.cashGap, 0);
  const totalDr = Object.values(locData).reduce((s, l) => s + l.drawerOpens, 0);
  const avgVR = +(Object.values(locData).reduce((s, l) => s + l.voidRate, 0) / LOCATIONS.length).toFixed(2);
  const avgTicket = +(totalRev / totalTxn).toFixed(2);

  // Daily group totals for sparklines
  const dailyRevenue = DAYS.map((_, i) => LOCATIONS.reduce((s, loc) => s + REVENUE[loc][i], 0));
  const dailyTransactions = DAYS.map((_, i) => LOCATIONS.reduce((s, loc) => s + TRANSACTIONS[loc][i], 0));
  const dailyAvgTicket = DAYS.map((_, i) => {
    const r = LOCATIONS.reduce((s, loc) => s + REVENUE[loc][i], 0);
    const t = LOCATIONS.reduce((s, loc) => s + TRANSACTIONS[loc][i], 0);
    return +(r / t).toFixed(2);
  });
  const dailyCashGap = DAYS.map((_, i) => LOCATIONS.reduce((s, loc) => s + CASH_GAP[loc][i], 0));
  const dailyVoidRate = DAYS.map((_, i) => {
    const rates = LOCATIONS.map((loc) => VOID_RATE[loc][i]);
    return +(rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(2);
  });
  const dailyDrawerOpens = DAYS.map((_, i) => LOCATIONS.reduce((s, loc) => s + DRAWER_OPENS[loc][i], 0));

  return {
    group: { revenue: totalRev, transactions: totalTxn, avgTicket, cashGap: totalGap, voidRate: avgVR, drawerOpens: totalDr },
    locations: locData,
    daily: { revenue: dailyRevenue, transactions: dailyTransactions, avgTicket: dailyAvgTicket, cashGap: dailyCashGap, voidRate: dailyVoidRate, drawerOpens: dailyDrawerOpens },
  };
}

// ─── VISUAL HELPERS ─────────────────────────────────────────

// For "higher is better" metrics (revenue, transactions, ticket)
function objColor(actual, objective) {
  const pct = actual / objective;
  if (pct >= 1.0) return { text: "#34d399", bg: "#064e3b", label: "Cumplido" };
  if (pct >= 0.9) return { text: "#4ade80", bg: "#14532d", label: "Cerca" };
  if (pct >= 0.8) return { text: "#fbbf24", bg: "#422006", label: "Atención" };
  if (pct >= 0.7) return { text: "#fb923c", bg: "#7c2d12", label: "Riesgo" };
  return { text: "#f87171", bg: "#7f1d1d", label: "Crítico" };
}

// For "lower is better" threshold metrics (cash gap, void rate, drawer opens)
function thresholdColor(actual, threshold) {
  const ratio = actual / threshold;
  if (ratio <= 0.6) return { text: "#34d399", bg: "#064e3b", label: "Excelente" };
  if (ratio <= 0.85) return { text: "#4ade80", bg: "#14532d", label: "Bien" };
  if (ratio <= 1.0) return { text: "#fbbf24", bg: "#422006", label: "Límite" };
  if (ratio <= 1.3) return { text: "#fb923c", bg: "#7c2d12", label: "Excedido" };
  return { text: "#f87171", bg: "#7f1d1d", label: "Crítico" };
}

function formatEuro(v) {
  if (v >= 1000) return `€${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}K`;
  return `€${v.toLocaleString()}`;
}

function pctChange(current, previous) {
  if (!previous) return 0;
  return +((current - previous) / previous * 100).toFixed(1);
}

function pctOfObjective(current, objective) {
  return +((current / objective) * 100).toFixed(1);
}

// ─── SPARKLINE COMPONENT ────────────────────────────────────

function Sparkline({ data, width = 120, height = 36, color = "#7C3AED", threshold = null, inverted = false }) {
  const min = Math.min(...data) * 0.9;
  const max = Math.max(...data) * 1.1;
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  const fillPoints = `0,${height} ${points} ${width},${height}`;

  // Threshold line
  let thresholdY = null;
  if (threshold !== null) {
    thresholdY = height - ((threshold - min) / range) * height;
  }

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      {/* Fill */}
      <polygon points={fillPoints} fill={`${color}15`} />
      {/* Line */}
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* Threshold line */}
      {thresholdY !== null && (
        <line x1={0} y1={thresholdY} x2={width} y2={thresholdY}
          stroke={inverted ? "#ef4444" : "#22c55e"} strokeWidth={1} strokeDasharray="3,3" opacity={0.5} />
      )}
      {/* End dot */}
      <circle cx={width} cy={height - ((data[data.length - 1] - min) / range) * height}
        r={3} fill={color} stroke="#0c0c1d" strokeWidth={1.5} />
      {/* Day labels */}
      {data.map((_, i) => (
        <text key={i} x={(i / (data.length - 1)) * width} y={height + 10}
          textAnchor="middle" fontSize={7} fill="#3f3f46" fontFamily="'DM Sans', sans-serif">
          {DAYS[i]}
        </text>
      ))}
    </svg>
  );
}

// ─── LOCATION BAR COMPONENT ─────────────────────────────────

function LocationBars({ data, metric, inverted = false, unit = "€" }) {
  const values = LOCATIONS.map((loc) => ({ loc, value: data[loc][metric] }));
  const maxVal = Math.max(...values.map((v) => v.value));
  const sorted = [...values].sort((a, b) => inverted ? b.value - a.value : b.value - a.value);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {sorted.map(({ loc, value }) => {
        const pct = (value / maxVal) * 100;
        let barColor;
        if (inverted) {
          // For threshold metrics, worst = most red
          const rank = sorted.indexOf(sorted.find((s) => s.loc === loc));
          barColor = rank <= 1 ? "#ef4444" : rank <= 3 ? "#fb923c" : "#22c55e";
        } else {
          const rank = sorted.indexOf(sorted.find((s) => s.loc === loc));
          barColor = rank <= 1 ? "#22c55e" : rank <= 3 ? "#60a5fa" : "#fb923c";
        }

        return (
          <div key={loc} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 80, fontSize: 10, color: "#94a3b8", fontWeight: 500, textAlign: "right", flexShrink: 0 }}>
              {loc.length > 10 ? loc.slice(0, 10) + "…" : loc}
            </div>
            <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.04)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${pct}%`, background: barColor, borderRadius: 4,
                transition: "width 0.4s ease",
              }} />
            </div>
            <div style={{
              width: 52, fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 600, color: barColor, textAlign: "right",
            }}>
              {unit === "€" ? `€${value.toLocaleString()}` : unit === "%" ? `${value}%` : value.toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── KPI CARD DEFINITIONS ───────────────────────────────────

const KPI_CARDS = [
  {
    id: "revenue",
    icon: "💶",
    label: "Ventas Totales",
    sublabel: "Ingresos grupo · semana",
    metric: "revenue",
    unit: "€",
    inverted: false,
    format: (v) => formatEuro(v),
    objective: OBJECTIVES.revenue,
    prevWeek: PREV_WEEK.revenue,
    daily: "revenue",
    methodology: "Suma de ventas POS (netas de IVA) de todos los locales y turnos. Incluye sala, barra y delivery.",
  },
  {
    id: "avgTicket",
    icon: "🧾",
    label: "Ticket Medio",
    sublabel: "Media grupo · semana",
    metric: "avgTicket",
    unit: "€",
    inverted: false,
    format: (v) => `€${v.toFixed(2)}`,
    objective: OBJECTIVES.avgTicket,
    prevWeek: PREV_WEEK.avgTicket,
    daily: "avgTicket",
    methodology: "Ingresos Totales ÷ Transacciones Totales. Media ponderada por volumen, no media de medias.",
  },
  {
    id: "transactions",
    icon: "📋",
    label: "Transacciones",
    sublabel: "Tickets cerrados · semana",
    metric: "transactions",
    unit: "",
    inverted: false,
    format: (v) => v.toLocaleString(),
    objective: OBJECTIVES.transactions,
    prevWeek: PREV_WEEK.transactions,
    daily: "transactions",
    methodology: "Conteo de tickets cerrados en POS. Excluye tickets anulados y pre-cuentas no cobradas.",
  },
  {
    id: "cashGap",
    icon: "💰",
    label: "Descuadre de Caja",
    sublabel: "Acumulado grupo · semana",
    metric: "cashGap",
    unit: "€",
    inverted: true,
    format: (v) => `€${v.toLocaleString()}`,
    objective: OBJECTIVES.cashGap,
    prevWeek: PREV_WEEK.cashGap,
    daily: "cashGap",
    methodology: "Σ |Efectivo contado − Efectivo esperado| por turno. Umbral configurable. Menor = mejor.",
  },
  {
    id: "voidRate",
    icon: "↩️",
    label: "Ratio Anulaciones",
    sublabel: "Media grupo · semana",
    metric: "voidRate",
    unit: "%",
    inverted: true,
    format: (v) => `${v.toFixed(2)}%`,
    objective: OBJECTIVES.voidRate,
    prevWeek: PREV_WEEK.voidRate,
    daily: "voidRate",
    methodology: "Importe anulado ÷ Ventas brutas × 100. Media ponderada por facturación. Umbral: ≤1.5% OK.",
  },
  {
    id: "drawerOpens",
    icon: "🔓",
    label: "Aperturas sin Venta",
    sublabel: "Acumulado grupo · semana",
    metric: "drawerOpens",
    unit: "",
    inverted: true,
    format: (v) => v.toLocaleString(),
    objective: OBJECTIVES.drawerOpens,
    prevWeek: PREV_WEEK.drawerOpens,
    daily: "drawerOpens",
    methodology: "Apertura de cajón registradora sin ticket asociado. Indicador de riesgo operativo. Umbral configurable.",
  },
];

// ─── MAIN COMPONENT ─────────────────────────────────────────

export default function KPICardsCaja() {
  const [expandedCard, setExpandedCard] = useState(null);
  const data = useMemo(() => computeMetrics(), []);

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      background: "#0c0c1d",
      minHeight: "100vh",
      color: "#e2e8f0",
      padding: 0,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 400px; } }
      `}</style>

      {/* ──── HEADER ──── */}
      <div style={{
        background: "linear-gradient(180deg, #12122a 0%, #0c0c1d 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "20px 28px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg, #7C3AED 0%, #a78bfa 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, boxShadow: "0 4px 16px rgba(124,58,237,0.25)",
            }}>
              💶
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>
              Salud Operacional — Caja y Ventas
            </h1>
          </div>
          <p style={{ fontSize: 12, color: "#64748b", marginTop: 4, marginLeft: 42 }}>
            KPIs de operación de caja · Semana 17–23 Feb 2026 · 6 locales
          </p>
        </div>
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8,
          padding: "6px 14px",
          fontSize: 12, color: "#94a3b8",
        }}>
          Feb 2026
        </div>
      </div>

      {/* ──── CARDS GRID ──── */}
      <div style={{ padding: "24px 28px" }}>
        {/* Section separator: positive metrics */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: "#475569",
            textTransform: "uppercase", letterSpacing: 0.8,
          }}>
            Métricas de actividad
          </div>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
          <div style={{ fontSize: 10, color: "#3f3f46" }}>vs objetivo semanal</div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
          marginBottom: 24,
        }}>
          {KPI_CARDS.slice(0, 3).map((card) => (
            <KPICard key={card.id} card={card} data={data}
              expanded={expandedCard === card.id}
              onToggle={() => setExpandedCard(expandedCard === card.id ? null : card.id)}
            />
          ))}
        </div>

        {/* Section separator: threshold metrics */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: "#475569",
            textTransform: "uppercase", letterSpacing: 0.8,
          }}>
            Umbrales de control
          </div>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
          <div style={{ fontSize: 10, color: "#3f3f46" }}>menor = mejor · umbral máximo tolerable</div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
          marginBottom: 24,
        }}>
          {KPI_CARDS.slice(3, 6).map((card) => (
            <KPICard key={card.id} card={card} data={data}
              expanded={expandedCard === card.id}
              onToggle={() => setExpandedCard(expandedCard === card.id ? null : card.id)}
            />
          ))}
        </div>

        {/* ──── METHODOLOGY FOOTER ──── */}
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.04)",
          borderRadius: 12, padding: "14px 20px",
          display: "flex", gap: 24, alignItems: "flex-start",
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: "#64748b",
              textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6,
            }}>
              Cómo leer estas cards
            </div>
            <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.6 }}>
              <strong style={{ color: "#94a3b8" }}>Métricas de actividad</strong> (fila superior):
              verde = objetivo cumplido, rojo = por debajo del objetivo. Más alto = mejor.
            </div>
            <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.6, marginTop: 4 }}>
              <strong style={{ color: "#94a3b8" }}>Umbrales de control</strong> (fila inferior):
              verde = dentro del límite, rojo = excedido. Más bajo = mejor. Línea punteada = umbral máximo.
            </div>
          </div>
          <div style={{ width: 1, background: "rgba(255,255,255,0.06)", alignSelf: "stretch" }} />
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: "#64748b",
              textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6,
            }}>
              Fuente de datos
            </div>
            <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.6 }}>
              POS (CEGID, Agora, GLOP, Revo) · Datos del cierre de turno · Actualización diaria.
              Umbrales configurables por cliente en ajustes del dashboard.
            </div>
          </div>
        </div>
      </div>

      {/* ──── FOOTER ──── */}
      <div style={{
        padding: "16px 28px",
        borderTop: "1px solid rgba(255,255,255,0.04)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontSize: 11, color: "#475569",
      }}>
        <div>6 KPIs · 3 de actividad (↑ mejor) + 3 de umbral (↓ mejor) · Sin caja negra</div>
        <div>Click en cualquier card para ver desglose por local</div>
      </div>
    </div>
  );
}

// ─── INDIVIDUAL KPI CARD ────────────────────────────────────

function KPICard({ card, data, expanded, onToggle }) {
  const value = data.group[card.metric];
  const dailyData = data.daily[card.daily];
  const isThreshold = card.inverted;

  // Color logic
  const statusColor = isThreshold
    ? thresholdColor(value, card.objective)
    : objColor(value, card.objective);

  // Comparisons
  const vsPrev = pctChange(value, card.prevWeek);
  const vsObj = isThreshold
    ? +((value / card.objective) * 100).toFixed(1)
    : pctOfObjective(value, card.objective);

  // For threshold metrics, positive change (increase) is BAD
  const prevArrow = isThreshold
    ? (vsPrev > 0 ? "▲" : vsPrev < 0 ? "▼" : "—")
    : (vsPrev > 0 ? "▲" : vsPrev < 0 ? "▼" : "—");
  const prevColor = isThreshold
    ? (vsPrev > 0 ? "#ef4444" : vsPrev < 0 ? "#22c55e" : "#64748b")
    : (vsPrev > 0 ? "#22c55e" : vsPrev < 0 ? "#ef4444" : "#64748b");

  // Objective gauge
  const objLabel = isThreshold
    ? (vsObj <= 100 ? "Dentro" : "Excedido")
    : (vsObj >= 100 ? "Cumplido" : `${vsObj}%`);

  // Progress bar for objective
  const progressPct = isThreshold
    ? Math.min((value / card.objective) * 100, 150)
    : Math.min((value / card.objective) * 100, 150);

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div
        onClick={onToggle}
        style={{
          background: "rgba(255,255,255,0.02)",
          border: expanded ? `1px solid ${statusColor.text}44` : "1px solid rgba(255,255,255,0.06)",
          borderRadius: 14, padding: "18px 20px", cursor: "pointer",
          transition: "all 0.2s ease",
          borderBottomLeftRadius: expanded ? 0 : 14,
          borderBottomRightRadius: expanded ? 0 : 14,
        }}
      >
        {/* Row 1: Icon + Label + Status pill */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>{card.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", lineHeight: 1.2 }}>{card.label}</div>
              <div style={{ fontSize: 10, color: "#475569", marginTop: 1 }}>{card.sublabel}</div>
            </div>
          </div>
          <div style={{
            padding: "3px 8px", borderRadius: 6,
            background: statusColor.bg,
            fontSize: 10, fontWeight: 600, color: statusColor.text,
          }}>
            {statusColor.label}
          </div>
        </div>

        {/* Row 2: Big number + Sparkline */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
          <div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 28, fontWeight: 700, color: statusColor.text,
              lineHeight: 1,
            }}>
              {card.format(value)}
            </div>
            {/* Comparisons */}
            <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
              {/* vs previous week */}
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <span style={{ fontSize: 9, color: prevColor, fontWeight: 700 }}>{prevArrow}</span>
                <span style={{
                  fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600, color: prevColor,
                }}>
                  {Math.abs(vsPrev)}%
                </span>
                <span style={{ fontSize: 9, color: "#3f3f46" }}>vs sem ant</span>
              </div>
              {/* vs objective */}
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <span style={{
                  fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600, color: isThreshold ? (vsObj <= 100 ? "#22c55e" : "#ef4444") : (vsObj >= 100 ? "#22c55e" : "#fbbf24"),
                }}>
                  {isThreshold ? `${vsObj}%` : `${vsObj}%`}
                </span>
                <span style={{ fontSize: 9, color: "#3f3f46" }}>
                  {isThreshold ? "del umbral" : "del obj"}
                </span>
              </div>
            </div>
          </div>

          {/* Sparkline */}
          <div style={{ paddingBottom: 4 }}>
            <Sparkline
              data={dailyData}
              width={110}
              height={32}
              color={statusColor.text}
              threshold={isThreshold ? card.objective / 7 : null}
              inverted={isThreshold}
            />
          </div>
        </div>

        {/* Row 3: Objective progress bar */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 9, color: "#475569" }}>
              {isThreshold ? "Umbral máximo" : "Objetivo"}:
              {" "}{card.unit === "€" ? "€" : ""}{card.objective.toLocaleString()}{card.unit === "%" ? "%" : ""}
            </span>
            <span style={{
              fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 600, color: statusColor.text,
            }}>
              {objLabel}
            </span>
          </div>
          <div style={{ height: 6, background: "rgba(255,255,255,0.04)", borderRadius: 3, overflow: "hidden", position: "relative" }}>
            {isThreshold && (
              <div style={{
                position: "absolute", left: `${Math.min(100, (100 / 150) * 100)}%`,
                top: 0, width: 2, height: "100%", background: "#ef444466", zIndex: 2,
              }} />
            )}
            <div style={{
              height: "100%",
              width: `${Math.min(progressPct, 100) * (100 / 150)}%`,
              background: isThreshold
                ? `linear-gradient(90deg, #22c55e ${Math.min(60 / progressPct * 100, 100)}%, #fbbf24 ${Math.min(85 / progressPct * 100, 100)}%, #ef4444 100%)`
                : statusColor.text,
              borderRadius: 3,
              transition: "width 0.4s ease",
              opacity: 0.7,
            }} />
          </div>
        </div>
      </div>

      {/* ──── EXPANDED: Location Breakdown ──── */}
      {expanded && (
        <div style={{
          background: "rgba(255,255,255,0.015)",
          border: `1px solid ${statusColor.text}22`,
          borderTop: "none",
          borderBottomLeftRadius: 14,
          borderBottomRightRadius: 14,
          padding: "14px 20px",
          animation: "slideDown 0.25s ease",
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: "#64748b",
            textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10,
          }}>
            Desglose por local
          </div>
          <LocationBars data={data.locations} metric={card.metric} inverted={card.inverted} unit={card.unit} />
          <div style={{
            marginTop: 10, padding: "8px 10px",
            background: "rgba(255,255,255,0.025)", borderRadius: 8,
            fontSize: 10, color: "#3f3f46", lineHeight: 1.5,
          }}>
            <strong style={{ color: "#475569" }}>Metodología:</strong> {card.methodology}
          </div>
        </div>
      )}
    </div>
  );
}
