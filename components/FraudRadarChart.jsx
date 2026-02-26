import { useState, useMemo } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

// ═══════════════════════════════════════════════════════
// DATA — 6 fraud dimensions per location
// Score 0-100 where higher = MORE risk detected
// ═══════════════════════════════════════════════════════
const LOCATIONS = [
  {
    id: "pam",
    name: "Pamplona",
    globalRisk: 72,
    trend: "up",
    alerts: 5,
    dimensions: {
      caja: 85,
      anulaciones: 62,
      descuentos: 45,
      inventario: 78,
      personal: 70,
      proveedores: 55,
    },
    details: {
      caja: { incidents: 12, amount: "€1.240", topIssue: "Descuadres en turno noche" },
      anulaciones: { incidents: 8, amount: "€680", topIssue: "3 operadores con ratio >5%" },
      descuentos: { incidents: 3, amount: "€420", topIssue: "Descuentos sin autorización" },
      inventario: { incidents: 6, amount: "€890", topIssue: "Merma cerveza +4.2%" },
      personal: { incidents: 4, amount: "€1.100", topIssue: "Horas extra no justificadas" },
      proveedores: { incidents: 2, amount: "€350", topIssue: "Precio +8% vs mercado en aceite" },
    },
  },
  {
    id: "bil",
    name: "Bilbao",
    globalRisk: 38,
    trend: "down",
    alerts: 1,
    dimensions: {
      caja: 25,
      anulaciones: 40,
      descuentos: 30,
      inventario: 52,
      personal: 35,
      proveedores: 28,
    },
    details: {
      caja: { incidents: 1, amount: "€85", topIssue: "Descuadre menor puntual" },
      anulaciones: { incidents: 3, amount: "€210", topIssue: "Ratio normal, 1 pico martes" },
      descuentos: { incidents: 0, amount: "€0", topIssue: "Sin anomalías" },
      inventario: { incidents: 2, amount: "€320", topIssue: "Merma fruta estacional" },
      personal: { incidents: 1, amount: "€180", topIssue: "1 fichaje tardío recurrente" },
      proveedores: { incidents: 0, amount: "€0", topIssue: "Sin anomalías" },
    },
  },
  {
    id: "bur",
    name: "Burgos",
    globalRisk: 56,
    trend: "stable",
    alerts: 3,
    dimensions: {
      caja: 60,
      anulaciones: 72,
      descuentos: 35,
      inventario: 40,
      personal: 65,
      proveedores: 48,
    },
    details: {
      caja: { incidents: 5, amount: "€530", topIssue: "Patrón viernes-sábado" },
      anulaciones: { incidents: 11, amount: "€920", topIssue: "1 operador: 68% de anulaciones" },
      descuentos: { incidents: 1, amount: "€90", topIssue: "Descuento empleado duplicado" },
      inventario: { incidents: 2, amount: "€180", topIssue: "Diferencia stock alcohol menor" },
      personal: { incidents: 3, amount: "€750", topIssue: "Buddy punching sospechado x2" },
      proveedores: { incidents: 1, amount: "€210", topIssue: "Factura sin albarán" },
    },
  },
  {
    id: "sss",
    name: "San Sebastián",
    globalRisk: 22,
    trend: "down",
    alerts: 0,
    dimensions: {
      caja: 15,
      anulaciones: 20,
      descuentos: 28,
      inventario: 30,
      personal: 18,
      proveedores: 22,
    },
    details: {
      caja: { incidents: 0, amount: "€0", topIssue: "Sin anomalías" },
      anulaciones: { incidents: 1, amount: "€45", topIssue: "Ratio <1%, normal" },
      descuentos: { incidents: 1, amount: "€60", topIssue: "Descuento promo aplicado 2x" },
      inventario: { incidents: 1, amount: "€95", topIssue: "Merma marginal" },
      personal: { incidents: 0, amount: "€0", topIssue: "Sin anomalías" },
      proveedores: { incidents: 0, amount: "€0", topIssue: "Sin anomalías" },
    },
  },
  {
    id: "vit",
    name: "Vitoria",
    globalRisk: 61,
    trend: "up",
    alerts: 4,
    dimensions: {
      caja: 70,
      anulaciones: 55,
      descuentos: 68,
      inventario: 58,
      personal: 42,
      proveedores: 65,
    },
    details: {
      caja: { incidents: 7, amount: "€780", topIssue: "Descuadres sistemáticos turno tarde" },
      anulaciones: { incidents: 5, amount: "€430", topIssue: "Anulaciones post-cierre" },
      descuentos: { incidents: 6, amount: "€590", topIssue: "Descuentos manuales sin código" },
      inventario: { incidents: 3, amount: "€410", topIssue: "Diferencia vinos +3.8%" },
      personal: { incidents: 2, amount: "€290", topIssue: "Overtime moderado" },
      proveedores: { incidents: 4, amount: "€720", topIssue: "Concentración 82% en 1 proveedor" },
    },
  },
  {
    id: "zar",
    name: "Zaragoza",
    globalRisk: 44,
    trend: "stable",
    alerts: 2,
    dimensions: {
      caja: 35,
      anulaciones: 48,
      descuentos: 50,
      inventario: 42,
      personal: 55,
      proveedores: 30,
    },
    details: {
      caja: { incidents: 2, amount: "€190", topIssue: "Descuadres menores" },
      anulaciones: { incidents: 4, amount: "€350", topIssue: "Ratio 3.2%, ligeramente alto" },
      descuentos: { incidents: 3, amount: "€280", topIssue: "Dto empleado en horas punta" },
      inventario: { incidents: 2, amount: "€250", topIssue: "Merma pan/bollería" },
      personal: { incidents: 3, amount: "€620", topIssue: "Horas complementarias elevadas" },
      proveedores: { incidents: 1, amount: "€150", topIssue: "Precio ligeramente alto en lácteos" },
    },
  },
];

const DIMENSION_LABELS = {
  caja: "Caja",
  anulaciones: "Anulaciones",
  descuentos: "Descuentos",
  inventario: "Inventario",
  personal: "Personal",
  proveedores: "Proveedores",
};

const DIMENSION_ICONS = {
  caja: "💰",
  anulaciones: "↩️",
  descuentos: "🏷️",
  inventario: "📦",
  personal: "👥",
  proveedores: "🚚",
};

const DIMENSION_DESCRIPTIONS = {
  caja: "Descuadres de caja, faltantes, movimientos no justificados",
  anulaciones: "Anulaciones, cancelaciones y devoluciones sospechosas",
  descuentos: "Descuentos no autorizados, sin código, o excesivos",
  inventario: "Mermas anómalas, diferencias de stock, consumos internos",
  personal: "Fichajes irregulares, horas fantasma, buddy punching",
  proveedores: "Sobrecostes, facturas sin albarán, concentración excesiva",
};

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════
function riskColor(score) {
  if (score >= 70) return "#ef4444";
  if (score >= 50) return "#f59e0b";
  if (score >= 30) return "#3b82f6";
  return "#22c55e";
}

function riskLabel(score) {
  if (score >= 70) return "Crítico";
  if (score >= 50) return "Elevado";
  if (score >= 30) return "Moderado";
  return "Bajo";
}

function riskBg(score) {
  if (score >= 70) return "rgba(239,68,68,0.12)";
  if (score >= 50) return "rgba(245,158,11,0.12)";
  if (score >= 30) return "rgba(59,130,246,0.08)";
  return "rgba(34,197,94,0.08)";
}

function trendIcon(t) {
  if (t === "up") return "↗";
  if (t === "down") return "↘";
  return "→";
}

function trendColor(t) {
  if (t === "up") return "#ef4444";
  if (t === "down") return "#22c55e";
  return "#6b7280";
}

// ═══════════════════════════════════════════════════════
// CUSTOM TOOLTIP FOR RADAR
// ═══════════════════════════════════════════════════════
function CustomRadarTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const key = d.key;
  const score = d.value;
  return (
    <div
      style={{
        background: "#1a1a2e",
        border: `1px solid ${riskColor(score)}33`,
        borderRadius: 10,
        padding: "12px 16px",
        minWidth: 200,
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${riskColor(score)}22`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 16 }}>{DIMENSION_ICONS[key]}</span>
        <span style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 14 }}>
          {DIMENSION_LABELS[key]}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
        <span style={{ color: riskColor(score), fontWeight: 700, fontSize: 22, fontFamily: "'JetBrains Mono', monospace" }}>
          {score}
        </span>
        <span style={{ color: riskColor(score), fontSize: 12, fontWeight: 500 }}>
          {riskLabel(score)}
        </span>
      </div>
      <div style={{ color: "#94a3b8", fontSize: 11, lineHeight: 1.4 }}>
        {DIMENSION_DESCRIPTIONS[key]}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════
export default function FraudRadarDashboard() {
  const [selectedId, setSelectedId] = useState("pam");
  const [hoveredDim, setHoveredDim] = useState(null);
  const [compareId, setCompareId] = useState(null);

  const selected = LOCATIONS.find((l) => l.id === selectedId);
  const compared = compareId ? LOCATIONS.find((l) => l.id === compareId) : null;

  const radarData = useMemo(() => {
    return Object.keys(DIMENSION_LABELS).map((key) => ({
      key,
      dimension: DIMENSION_LABELS[key],
      value: selected.dimensions[key],
      compare: compared ? compared.dimensions[key] : null,
      fullMark: 100,
    }));
  }, [selected, compared]);

  const sorted = useMemo(
    () => [...LOCATIONS].sort((a, b) => b.globalRisk - a.globalRisk),
    []
  );

  return (
    <div
      style={{
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        background: "#0c0c1d",
        minHeight: "100vh",
        color: "#e2e8f0",
        padding: 0,
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* ──── HEADER ──── */}
      <div
        style={{
          background: "linear-gradient(180deg, #12122a 0%, #0c0c1d 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "20px 28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 700,
                color: "#0c0c1d",
                boxShadow: "0 4px 16px rgba(239,68,68,0.25)",
              }}
            >
              🛡
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>
              Detección de Fraude
            </h1>
          </div>
          <p style={{ fontSize: 12, color: "#64748b", marginTop: 4, marginLeft: 42 }}>
            Radar de riesgo por local · 6 dimensiones · Últimos 30 días
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 12,
              color: "#ef4444",
              fontWeight: 600,
            }}
          >
            {LOCATIONS.reduce((s, l) => s + l.alerts, 0)} alertas activas
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 12,
              color: "#94a3b8",
            }}
          >
            Feb 2026
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 28px", display: "flex", gap: 24 }}>
        {/* ──── LEFT: RANKING + SELECTOR ──── */}
        <div style={{ width: 260, flexShrink: 0 }}>
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 1.2,
              color: "#64748b",
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            Ranking de riesgo
          </div>

          {sorted.map((loc) => {
            const isSelected = loc.id === selectedId;
            const isCompared = loc.id === compareId;
            return (
              <div
                key={loc.id}
                onClick={() => {
                  if (isSelected) return;
                  setSelectedId(loc.id);
                  if (compareId === loc.id) setCompareId(null);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  borderRadius: 10,
                  marginBottom: 4,
                  cursor: isSelected ? "default" : "pointer",
                  background: isSelected
                    ? "rgba(255,255,255,0.06)"
                    : isCompared
                    ? "rgba(139,92,246,0.08)"
                    : "transparent",
                  border: isSelected
                    ? `1px solid ${riskColor(loc.globalRisk)}33`
                    : isCompared
                    ? "1px solid rgba(139,92,246,0.2)"
                    : "1px solid transparent",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected && !isCompared) e.currentTarget.style.background = "transparent";
                  else if (isCompared) e.currentTarget.style.background = "rgba(139,92,246,0.08)";
                }}
              >
                {/* Risk score pill */}
                <div
                  style={{
                    width: 40,
                    height: 28,
                    borderRadius: 6,
                    background: riskBg(loc.globalRisk),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    fontSize: 13,
                    color: riskColor(loc.globalRisk),
                  }}
                >
                  {loc.globalRisk}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: isSelected ? 600 : 400,
                      color: isSelected ? "#f1f5f9" : "#cbd5e1",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {loc.name}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ color: trendColor(loc.trend) }}>{trendIcon(loc.trend)}</span>
                    {loc.alerts > 0 && (
                      <span style={{ color: "#ef4444" }}>
                        {loc.alerts} alerta{loc.alerts > 1 ? "s" : ""}
                      </span>
                    )}
                    {loc.alerts === 0 && <span style={{ color: "#22c55e" }}>sin alertas</span>}
                  </div>
                </div>

                {/* Compare toggle */}
                {!isSelected && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setCompareId(compareId === loc.id ? null : loc.id);
                    }}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 5,
                      border: isCompared
                        ? "2px solid #8b5cf6"
                        : "1px solid rgba(255,255,255,0.12)",
                      background: isCompared ? "rgba(139,92,246,0.2)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      cursor: "pointer",
                      color: isCompared ? "#a78bfa" : "#64748b",
                      transition: "all 0.15s",
                    }}
                    title={isCompared ? "Quitar comparación" : "Comparar con seleccionado"}
                  >
                    {isCompared ? "✓" : "⇄"}
                  </div>
                )}
              </div>
            );
          })}

          {/* Legend */}
          <div
            style={{
              marginTop: 20,
              padding: "14px 16px",
              background: "rgba(255,255,255,0.02)",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", marginBottom: 10 }}>
              Escala de riesgo
            </div>
            {[
              { min: 70, label: "Crítico", desc: "Acción inmediata" },
              { min: 50, label: "Elevado", desc: "Investigar esta semana" },
              { min: 30, label: "Moderado", desc: "Monitorizar" },
              { min: 0, label: "Bajo", desc: "Normal" },
            ].map((tier) => (
              <div
                key={tier.min}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    background: riskColor(tier.min),
                    opacity: 0.9,
                  }}
                />
                <span style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 500, minWidth: 55 }}>
                  {tier.label}
                </span>
                <span style={{ fontSize: 11, color: "#64748b" }}>{tier.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ──── CENTER: RADAR CHART ──── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Location header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>
                  {selected.name}
                </h2>
                <div
                  style={{
                    background: riskBg(selected.globalRisk),
                    border: `1px solid ${riskColor(selected.globalRisk)}33`,
                    borderRadius: 8,
                    padding: "4px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      fontSize: 16,
                      color: riskColor(selected.globalRisk),
                    }}
                  >
                    {selected.globalRisk}
                  </span>
                  <span style={{ fontSize: 12, color: riskColor(selected.globalRisk), fontWeight: 500 }}>
                    {riskLabel(selected.globalRisk)}
                  </span>
                  <span
                    style={{
                      color: trendColor(selected.trend),
                      fontSize: 14,
                      marginLeft: 2,
                    }}
                  >
                    {trendIcon(selected.trend)}
                  </span>
                </div>
              </div>
              {compared && (
                <div style={{ fontSize: 12, color: "#8b5cf6", marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#8b5cf6" }} />
                  Comparando con {compared.name} (riesgo {compared.globalRisk})
                </div>
              )}
            </div>
          </div>

          {/* Radar */}
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 16,
              padding: "20px 10px",
              position: "relative",
            }}
          >
            <ResponsiveContainer width="100%" height={380}>
              <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
                <PolarGrid
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="3 3"
                />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={({ x, y, payload }) => {
                    const key = radarData.find((d) => d.dimension === payload.value)?.key;
                    const score = selected.dimensions[key];
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text
                          textAnchor="middle"
                          dy={-8}
                          style={{
                            fontSize: 18,
                            cursor: "default",
                          }}
                        >
                          {DIMENSION_ICONS[key]}
                        </text>
                        <text
                          textAnchor="middle"
                          dy={10}
                          style={{
                            fontSize: 12,
                            fontWeight: hoveredDim === key ? 700 : 500,
                            fill: hoveredDim === key ? riskColor(score) : "#94a3b8",
                            transition: "all 0.2s",
                          }}
                        >
                          {payload.value}
                        </text>
                      </g>
                    );
                  }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomRadarTooltip />} />

                {/* Compare layer (behind) */}
                {compared && (
                  <Radar
                    name={compared.name}
                    dataKey="compare"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.08}
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={{ r: 3, fill: "#8b5cf6", strokeWidth: 0 }}
                  />
                )}

                {/* Main layer */}
                <Radar
                  name={selected.name}
                  dataKey="value"
                  stroke={riskColor(selected.globalRisk)}
                  fill={riskColor(selected.globalRisk)}
                  fillOpacity={0.12}
                  strokeWidth={2}
                  dot={{
                    r: 4,
                    fill: riskColor(selected.globalRisk),
                    strokeWidth: 2,
                    stroke: "#0c0c1d",
                  }}
                  activeDot={{
                    r: 6,
                    fill: riskColor(selected.globalRisk),
                    stroke: "#0c0c1d",
                    strokeWidth: 2,
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* ──── DIMENSION DETAIL CARDS ──── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
            }}
          >
            {Object.keys(DIMENSION_LABELS).map((key) => {
              const score = selected.dimensions[key];
              const detail = selected.details[key];
              const compScore = compared?.dimensions[key];
              return (
                <div
                  key={key}
                  onMouseEnter={() => setHoveredDim(key)}
                  onMouseLeave={() => setHoveredDim(null)}
                  style={{
                    background:
                      hoveredDim === key
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(255,255,255,0.02)",
                    border: `1px solid ${
                      hoveredDim === key
                        ? `${riskColor(score)}33`
                        : "rgba(255,255,255,0.05)"
                    }`,
                    borderRadius: 12,
                    padding: "16px 18px",
                    transition: "all 0.2s",
                    cursor: "default",
                  }}
                >
                  {/* Header */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{DIMENSION_ICONS[key]}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>
                        {DIMENSION_LABELS[key]}
                      </span>
                    </div>
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                        fontSize: 18,
                        color: riskColor(score),
                      }}
                    >
                      {score}
                    </div>
                  </div>

                  {/* Risk bar */}
                  <div
                    style={{
                      height: 4,
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: 2,
                      marginBottom: 12,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        height: "100%",
                        width: `${score}%`,
                        background: `linear-gradient(90deg, ${riskColor(score)}88, ${riskColor(score)})`,
                        borderRadius: 2,
                        transition: "width 0.5s ease",
                      }}
                    />
                    {compScore != null && (
                      <div
                        style={{
                          position: "absolute",
                          left: `${compScore}%`,
                          top: -2,
                          width: 2,
                          height: 8,
                          background: "#8b5cf6",
                          borderRadius: 1,
                        }}
                        title={`${compared.name}: ${compScore}`}
                      />
                    )}
                  </div>

                  {/* Detail rows */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                      <span style={{ color: "#64748b" }}>Incidencias</span>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 600,
                          color: detail.incidents > 5 ? "#ef4444" : detail.incidents > 2 ? "#f59e0b" : "#94a3b8",
                        }}
                      >
                        {detail.incidents}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                      <span style={{ color: "#64748b" }}>Importe</span>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 600,
                          color: "#cbd5e1",
                        }}
                      >
                        {detail.amount}
                      </span>
                    </div>
                  </div>

                  {/* Top issue */}
                  <div
                    style={{
                      marginTop: 10,
                      padding: "8px 10px",
                      background: `${riskColor(score)}0a`,
                      borderRadius: 6,
                      border: `1px solid ${riskColor(score)}15`,
                    }}
                  >
                    <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Principal hallazgo
                    </div>
                    <div style={{ fontSize: 11, color: "#cbd5e1", lineHeight: 1.4 }}>
                      {detail.topIssue}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ──── FOOTER ──── */}
      <div
        style={{
          padding: "16px 28px",
          borderTop: "1px solid rgba(255,255,255,0.04)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 11,
          color: "#475569",
        }}
      >
        <div>
          Score = media ponderada de reglas de negocio por dimensión · Transparente, sin caja negra
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <span>Fuentes: POS · Fichaje · Inventario · Nómina · Contabilidad</span>
        </div>
      </div>
    </div>
  );
}
