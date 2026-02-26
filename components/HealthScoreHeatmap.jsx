import { useState, useMemo } from "react";

// ============================================================
// HEALTH SCORE MODEL — RESTAURACIÓN — CAJA Y VENTAS
// ============================================================

const METRICS_CONFIG = {
  descuadre: {
    id: "descuadre",
    label: "Descuadre de Caja",
    unit: "€",
    description: "Diferencia entre ventas registradas en TPV y caja real",
    // Layer 1: Fixed thresholds (% of shift revenue)
    thresholds: {
      normal: { max: 0.015 },    // < 1.5% → green
      attention: { max: 0.035 }, // 1.5% - 3.5% → yellow
      // > 3.5% → red
    },
    // Layer 2: Statistical (std deviations from 8-week mean)
    statistical: {
      attention: 1.5, // > 1.5σ → yellow
      critical: 2.5,  // > 2.5σ → red
    },
    // Weight for combined assessment (higher = more important for fraud)
    weight: 3,
    icon: "💶",
    tooltip: "En restauración, un descuadre habitual es < 1.5% de la facturación del turno. Por encima del 3.5% requiere investigación inmediata.",
  },
  efectivo: {
    id: "efectivo",
    label: "Ratio Efectivo",
    unit: "%",
    description: "% de pagos en efectivo sobre total del turno",
    thresholds: {
      normal: { max: 25 },    // < 25% → green
      attention: { max: 38 }, // 25% - 38% → yellow
      // > 38% → red
    },
    statistical: { attention: 1.5, critical: 2.0 },
    weight: 2,
    icon: "💵",
    tooltip: "La media en restauración española es 18-22%. Ratios por encima del 35% son anómalos salvo en negocios de barrio con ticket bajo.",
  },
  descuentos: {
    id: "descuentos",
    label: "Descuentos / Invitaciones",
    unit: "%",
    description: "% de descuentos e invitaciones sobre facturación del turno",
    thresholds: {
      normal: { max: 5 },     // < 5% → green
      attention: { max: 10 }, // 5% - 10% → yellow
      // > 10% → red
    },
    statistical: { attention: 1.5, critical: 2.5 },
    weight: 2,
    icon: "🏷️",
    tooltip: "Descuentos e invitaciones por encima del 5% erosionan márgenes. Por encima del 10% sugiere falta de control o abuso de cortesías.",
  },
  ticketMedio: {
    id: "ticketMedio",
    label: "Ticket Medio",
    unit: "€",
    description: "Ticket medio del turno vs media histórica",
    // For ticket medio, we use deviation from historical mean (both directions)
    thresholds: {
      normal: { maxDeviation: 0.15 },    // within ±15% → green
      attention: { maxDeviation: 0.25 }, // ±15-25% → yellow
      // > ±25% → red
    },
    statistical: { attention: 1.5, critical: 2.5 },
    weight: 1,
    icon: "🎫",
    tooltip: "Un ticket medio que se desvía > 15% de su media histórica para ese turno requiere investigación. Puede indicar descuentos no registrados o ventas sin cobrar.",
  },
  anulaciones: {
    id: "anulaciones",
    label: "Anulaciones",
    unit: "%",
    description: "% de operaciones anuladas sobre total transacciones",
    thresholds: {
      normal: { max: 3 },    // < 3% → green
      attention: { max: 6 }, // 3% - 6% → yellow
      // > 6% → red
    },
    statistical: { attention: 1.5, critical: 2.0 },
    weight: 3,
    icon: "❌",
    tooltip: "Anulaciones por encima del 3% son inusuales. Por encima del 6%, especialmente concentradas en un empleado, son indicador clásico de fraude de caja.",
  },
  facturacion: {
    id: "facturacion",
    label: "Facturación",
    unit: "€",
    description: "Facturación total del turno (contexto, no alerta directa)",
    thresholds: {
      normal: { maxDeviation: 0.20 },    // within ±20% → green
      attention: { maxDeviation: 0.35 }, // ±20-35% → yellow
    },
    statistical: { attention: 2.0, critical: 3.0 },
    weight: 0, // Context metric, doesn't trigger alerts alone
    icon: "📊",
    tooltip: "La facturación da contexto a las demás métricas. No genera alertas por sí sola pero una caída > 35% sin causa conocida (festivo, reforma) merece atención.",
  },
};

const STATES = {
  normal: { label: "Normal", color: "#22c55e", bg: "#f0fdf4", textColor: "#166534", border: "#bbf7d0" },
  attention: { label: "Atención", color: "#f59e0b", bg: "#fffbeb", textColor: "#92400e", border: "#fde68a" },
  critical: { label: "Crítico", color: "#ef4444", bg: "#fef2f2", textColor: "#991b1b", border: "#fecaca" },
  noData: { label: "Sin datos", color: "#d1d5db", bg: "#f9fafb", textColor: "#9ca3af", border: "#e5e7eb" },
};

// ============================================================
// SIMULATED DATA — RESTAURACIÓN — 1 SEMANA
// ============================================================

const SHIFTS = ["Comida", "Cena"];
const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DAY_DATES = ["17", "18", "19", "20", "21", "22", "23"];

// Simulated data per shift per day
// Format: { descuadre, efectivo, descuentos, ticketMedio, anulaciones, facturacion }
// Plus historical means for comparison
const SHIFT_DATA = {
  Comida: {
    Lun: { descuadre: 18, efectivo: 20, descuentos: 3.2, ticketMedio: 22.5, anulaciones: 1.8, facturacion: 1850, historicalMean: { descuadre: 15, efectivo: 19, descuentos: 3.5, ticketMedio: 23, anulaciones: 2.0, facturacion: 1900 }, historicalStd: { descuadre: 8, efectivo: 3, descuentos: 1.2, ticketMedio: 2.5, anulaciones: 0.8, facturacion: 300 } },
    Mar: { descuadre: 22, efectivo: 21, descuentos: 4.1, ticketMedio: 21.8, anulaciones: 2.2, facturacion: 1920, historicalMean: { descuadre: 15, efectivo: 19, descuentos: 3.5, ticketMedio: 23, anulaciones: 2.0, facturacion: 1900 }, historicalStd: { descuadre: 8, efectivo: 3, descuentos: 1.2, ticketMedio: 2.5, anulaciones: 0.8, facturacion: 300 } },
    Mié: { descuadre: 45, efectivo: 28, descuentos: 4.8, ticketMedio: 20.1, anulaciones: 3.5, facturacion: 2100, historicalMean: { descuadre: 15, efectivo: 19, descuentos: 3.5, ticketMedio: 23, anulaciones: 2.0, facturacion: 2050 }, historicalStd: { descuadre: 8, efectivo: 3, descuentos: 1.2, ticketMedio: 2.5, anulaciones: 0.8, facturacion: 300 } },
    Jue: { descuadre: 12, efectivo: 18, descuentos: 2.9, ticketMedio: 23.5, anulaciones: 1.5, facturacion: 2200, historicalMean: { descuadre: 15, efectivo: 19, descuentos: 3.5, ticketMedio: 23, anulaciones: 2.0, facturacion: 2150 }, historicalStd: { descuadre: 8, efectivo: 3, descuentos: 1.2, ticketMedio: 2.5, anulaciones: 0.8, facturacion: 300 } },
    Vie: { descuadre: 35, efectivo: 22, descuentos: 6.2, ticketMedio: 25.0, anulaciones: 2.8, facturacion: 3100, historicalMean: { descuadre: 20, efectivo: 20, descuentos: 4.0, ticketMedio: 25, anulaciones: 2.2, facturacion: 3000 }, historicalStd: { descuadre: 10, efectivo: 3, descuentos: 1.5, ticketMedio: 3, anulaciones: 1.0, facturacion: 400 } },
    Sáb: { descuadre: 85, efectivo: 35, descuentos: 8.5, ticketMedio: 26.2, anulaciones: 5.8, facturacion: 3400, historicalMean: { descuadre: 25, efectivo: 21, descuentos: 4.5, ticketMedio: 26, anulaciones: 2.5, facturacion: 3300 }, historicalStd: { descuadre: 12, efectivo: 4, descuentos: 1.5, ticketMedio: 3, anulaciones: 1.0, facturacion: 400 } },
    Dom: { descuadre: 28, efectivo: 23, descuentos: 5.5, ticketMedio: 24.0, anulaciones: 2.0, facturacion: 2800, historicalMean: { descuadre: 20, efectivo: 20, descuentos: 4.0, ticketMedio: 24, anulaciones: 2.0, facturacion: 2700 }, historicalStd: { descuadre: 10, efectivo: 3, descuentos: 1.2, ticketMedio: 2.5, anulaciones: 0.8, facturacion: 350 } },
  },
  Cena: {
    Lun: { descuadre: 25, efectivo: 22, descuentos: 4.5, ticketMedio: 31.0, anulaciones: 2.5, facturacion: 2200, historicalMean: { descuadre: 20, efectivo: 21, descuentos: 4.0, ticketMedio: 32, anulaciones: 2.2, facturacion: 2300 }, historicalStd: { descuadre: 10, efectivo: 3, descuentos: 1.2, ticketMedio: 3, anulaciones: 0.8, facturacion: 350 } },
    Mar: { descuadre: 30, efectivo: 24, descuentos: 5.8, ticketMedio: 30.5, anulaciones: 3.0, facturacion: 2350, historicalMean: { descuadre: 20, efectivo: 21, descuentos: 4.0, ticketMedio: 32, anulaciones: 2.2, facturacion: 2300 }, historicalStd: { descuadre: 10, efectivo: 3, descuentos: 1.2, ticketMedio: 3, anulaciones: 0.8, facturacion: 350 } },
    Mié: { descuadre: 120, efectivo: 42, descuentos: 12.3, ticketMedio: 27.0, anulaciones: 7.2, facturacion: 2500, historicalMean: { descuadre: 22, efectivo: 22, descuentos: 4.5, ticketMedio: 32, anulaciones: 2.5, facturacion: 2400 }, historicalStd: { descuadre: 10, efectivo: 3, descuentos: 1.5, ticketMedio: 3, anulaciones: 1.0, facturacion: 350 } },
    Jue: { descuadre: 15, efectivo: 19, descuentos: 3.8, ticketMedio: 33.0, anulaciones: 1.8, facturacion: 2600, historicalMean: { descuadre: 22, efectivo: 22, descuentos: 4.5, ticketMedio: 32, anulaciones: 2.5, facturacion: 2500 }, historicalStd: { descuadre: 10, efectivo: 3, descuentos: 1.5, ticketMedio: 3, anulaciones: 1.0, facturacion: 350 } },
    Vie: { descuadre: 55, efectivo: 30, descuentos: 7.8, ticketMedio: 35.0, anulaciones: 4.2, facturacion: 4200, historicalMean: { descuadre: 28, efectivo: 23, descuentos: 5.0, ticketMedio: 34, anulaciones: 2.8, facturacion: 4000 }, historicalStd: { descuadre: 12, efectivo: 4, descuentos: 1.5, ticketMedio: 3.5, anulaciones: 1.0, facturacion: 500 } },
    Sáb: { descuadre: 180, efectivo: 45, descuentos: 14.5, ticketMedio: 28.0, anulaciones: 9.2, facturacion: 4800, historicalMean: { descuadre: 30, efectivo: 24, descuentos: 5.5, ticketMedio: 35, anulaciones: 3.0, facturacion: 4600 }, historicalStd: { descuadre: 14, efectivo: 4, descuentos: 1.8, ticketMedio: 3.5, anulaciones: 1.2, facturacion: 500 } },
    Dom: { descuadre: 40, efectivo: 26, descuentos: 6.0, ticketMedio: 32.5, anulaciones: 2.8, facturacion: 3500, historicalMean: { descuadre: 25, efectivo: 22, descuentos: 4.5, ticketMedio: 33, anulaciones: 2.5, facturacion: 3400 }, historicalStd: { descuadre: 10, efectivo: 3, descuentos: 1.2, ticketMedio: 3, anulaciones: 1.0, facturacion: 400 } },
  },
};

// ============================================================
// HEALTH SCORE CALCULATION ENGINE
// ============================================================

function evaluateMetric(metricKey, value, shiftData) {
  const config = METRICS_CONFIG[metricKey];
  const hist = shiftData.historicalMean[metricKey];
  const std = shiftData.historicalStd[metricKey];

  let fixedState = "normal";
  let statState = "normal";
  let reason = "";

  // Layer 1: Fixed thresholds
  if (config.thresholds.normal.max !== undefined) {
    // Absolute threshold (descuadre uses % of revenue)
    let compareValue = value;
    if (metricKey === "descuadre") {
      compareValue = (value / shiftData.facturacion) * 100;
    }
    const normalMax = metricKey === "descuadre"
      ? config.thresholds.normal.max * 100
      : config.thresholds.normal.max;
    const attentionMax = metricKey === "descuadre"
      ? config.thresholds.attention.max * 100
      : config.thresholds.attention.max;

    if (compareValue > attentionMax) {
      fixedState = "critical";
      reason = `${value}${config.unit} supera umbral crítico`;
    } else if (compareValue > normalMax) {
      fixedState = "attention";
      reason = `${value}${config.unit} por encima del umbral`;
    }
  } else if (config.thresholds.normal.maxDeviation !== undefined) {
    // Deviation-based (ticket medio, facturacion)
    const deviation = Math.abs(value - hist) / hist;
    if (deviation > config.thresholds.attention.maxDeviation) {
      fixedState = "critical";
      reason = `Desviación de ${(deviation * 100).toFixed(0)}% vs media`;
    } else if (deviation > config.thresholds.normal.maxDeviation) {
      fixedState = "attention";
      reason = `Desviación de ${(deviation * 100).toFixed(0)}% vs media`;
    }
  }

  // Layer 2: Statistical anomaly
  if (std > 0) {
    const zScore = Math.abs(value - hist) / std;
    if (zScore > config.statistical.critical) {
      statState = "critical";
      if (!reason) reason = `${zScore.toFixed(1)}σ de desviación estadística`;
    } else if (zScore > config.statistical.attention) {
      statState = "attention";
      if (!reason) reason = `${zScore.toFixed(1)}σ de desviación estadística`;
    }
  }

  // Final state = worst of both layers
  const stateOrder = { normal: 0, attention: 1, critical: 2 };
  const finalState = stateOrder[fixedState] >= stateOrder[statState] ? fixedState : statState;

  return { state: finalState, value, reason, metricKey, weight: config.weight };
}

function calculateShiftHealth(shiftData) {
  const evaluations = Object.keys(METRICS_CONFIG).map(key =>
    evaluateMetric(key, shiftData[key], shiftData)
  );

  // Shift state = worst state among weighted metrics (weight > 0)
  const weighted = evaluations.filter(e => METRICS_CONFIG[e.metricKey].weight > 0);
  const hasAnyCritical = weighted.some(e => e.state === "critical");
  const hasAnyAttention = weighted.some(e => e.state === "attention");

  let overallState = "normal";
  if (hasAnyCritical) overallState = "critical";
  else if (hasAnyAttention) overallState = "attention";

  // Get the primary reason (highest weight critical/attention metric)
  const alertMetrics = weighted
    .filter(e => e.state !== "normal")
    .sort((a, b) => b.weight - a.weight);

  const primaryReason = alertMetrics.length > 0
    ? `${METRICS_CONFIG[alertMetrics[0].metricKey].label}: ${alertMetrics[0].reason}`
    : "Todos los indicadores en rango normal";

  const secondaryReasons = alertMetrics.slice(1).map(e =>
    `${METRICS_CONFIG[e.metricKey].label}: ${e.reason}`
  );

  return { state: overallState, evaluations, primaryReason, secondaryReasons, alertCount: alertMetrics.length };
}

// ============================================================
// UI COMPONENTS
// ============================================================

function DrillDownPanel({ shift, day, dayDate, health, onClose }) {
  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0, width: 420,
      background: "#fff", boxShadow: "-8px 0 40px rgba(0,0,0,0.15)",
      zIndex: 1000, display: "flex", flexDirection: "column",
      fontFamily: "'DM Sans', sans-serif",
      animation: "slideIn 0.25s ease-out", overflowY: "auto",
    }}>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

      {/* Header */}
      <div style={{
        padding: "24px 24px 20px",
        background: STATES[health.state].bg,
        borderBottom: `2px solid ${STATES[health.state].border}`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
          <div>
            <div style={{ fontSize: 12, color: "#999", fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase" }}>
              {day} {dayDate} Feb · {shift}
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              marginTop: 10, padding: "6px 14px", borderRadius: 20,
              background: STATES[health.state].color,
              color: "#fff", fontSize: 13, fontWeight: 700,
            }}>
              <span style={{ fontSize: 10 }}>{health.state === "normal" ? "✓" : health.state === "attention" ? "⚠" : "✖"}</span>
              {STATES[health.state].label}
              {health.alertCount > 0 && <span style={{ opacity: 0.8 }}>· {health.alertCount} alerta{health.alertCount > 1 ? "s" : ""}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(0,0,0,0.05)", border: "none", borderRadius: "50%",
            width: 32, height: 32, cursor: "pointer", fontSize: 16,
            display: "flex", alignItems: "center", justifyContent: "center", color: "#666",
          }}>✕</button>
        </div>

        {/* Primary reason */}
        {health.state !== "normal" && (
          <div style={{
            marginTop: 14, padding: "12px 14px", borderRadius: 10,
            background: "rgba(255,255,255,0.7)", fontSize: 13,
            color: STATES[health.state].textColor, lineHeight: 1.5,
          }}>
            <strong>Motivo principal:</strong> {health.primaryReason}
            {health.secondaryReasons.length > 0 && (
              <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
                También: {health.secondaryReasons.join(" · ")}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Metric cards */}
      <div style={{ padding: "20px 24px" }}>
        <div style={{ fontSize: 11, color: "#999", fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 14 }}>
          Desglose por métrica
        </div>

        {health.evaluations.map(evaluation => {
          const config = METRICS_CONFIG[evaluation.metricKey];
          const metricState = STATES[evaluation.state];
          const data = SHIFT_DATA[shift][day];
          const hist = data.historicalMean[evaluation.metricKey];
          const deviation = hist > 0 ? ((evaluation.value - hist) / hist * 100).toFixed(1) : "—";

          return (
            <div key={evaluation.metricKey} style={{
              display: "flex", alignItems: "stretch", gap: 12,
              marginBottom: 8, borderRadius: 12, padding: "14px 16px",
              background: evaluation.state === "normal" ? "#fafafa" : metricState.bg,
              border: `1px solid ${evaluation.state === "normal" ? "#f0f0f0" : metricState.border}`,
              transition: "all 0.15s",
            }}>
              {/* State indicator bar */}
              <div style={{
                width: 4, borderRadius: 4, flexShrink: 0,
                background: metricState.color,
              }} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 12, color: "#666", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>{config.icon}</span>
                    {config.label}
                    {config.weight === 0 && <span style={{ fontSize: 10, color: "#bbb", fontWeight: 400 }}>(contexto)</span>}
                  </div>
                  <div style={{
                    fontSize: 16, fontWeight: 700,
                    color: evaluation.state === "normal" ? "#1a1a1a" : metricState.textColor,
                  }}>
                    {evaluation.value}{config.unit === "€" ? " €" : config.unit === "%" ? "%" : ""}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                  <div style={{ fontSize: 11, color: "#999" }}>
                    Media: {hist}{config.unit === "€" ? " €" : config.unit === "%" ? "%" : ""}
                  </div>
                  <div style={{
                    fontSize: 11, fontWeight: 600,
                    color: Math.abs(parseFloat(deviation)) > 15 ? metricState.textColor : "#999",
                  }}>
                    {deviation > 0 ? "+" : ""}{deviation}% vs media
                  </div>
                </div>

                {evaluation.state !== "normal" && evaluation.reason && (
                  <div style={{
                    marginTop: 8, fontSize: 11, color: metricState.textColor,
                    padding: "6px 10px", borderRadius: 6,
                    background: `${metricState.color}10`,
                  }}>
                    ⚡ {evaluation.reason}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Model transparency */}
      <div style={{
        margin: "0 24px 24px", padding: "16px",
        background: "#f8f9fa", borderRadius: 12,
        border: "1px solid #e9ecef",
      }}>
        <div style={{ fontSize: 11, color: "#999", fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>
          Cómo se calcula el estado
        </div>
        <div style={{ fontSize: 12, color: "#666", lineHeight: 1.6 }}>
          El estado del turno es el <strong>peor estado</strong> entre sus métricas ponderadas.
          Cada métrica se evalúa contra umbral fijo + desviación estadística (8 sem).
          Facturación es métrica de contexto y no genera alertas por sí sola.
        </div>
      </div>
    </div>
  );
}

function ModelPanel({ onClose }) {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, bottom: 0, width: 480,
      background: "#fff", boxShadow: "8px 0 40px rgba(0,0,0,0.15)",
      zIndex: 1000, display: "flex", flexDirection: "column",
      fontFamily: "'DM Sans', sans-serif",
      animation: "slideInLeft 0.25s ease-out", overflowY: "auto",
    }}>
      <style>{`@keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }`}</style>

      <div style={{ padding: "24px", borderBottom: "1px solid #eee" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, color: "#999", fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase" }}>
              Documentación
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", marginTop: 4 }}>
              Modelo Health Score
            </div>
            <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
              Restauración · Caja y Ventas
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "#f5f5f5", border: "none", borderRadius: "50%",
            width: 32, height: 32, cursor: "pointer", fontSize: 16,
            display: "flex", alignItems: "center", justifyContent: "center", color: "#666",
          }}>✕</button>
        </div>
      </div>

      <div style={{ padding: "20px 24px", flex: 1 }}>
        {/* Methodology */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 10 }}>
            Metodología: Peor estado gana
          </div>
          <div style={{ fontSize: 12, color: "#555", lineHeight: 1.7, marginBottom: 12 }}>
            Cada turno se evalúa en dos capas simultáneas. La Capa 1 compara contra umbrales fijos
            (configurables por cliente). La Capa 2 detecta anomalías estadísticas comparando contra
            la media de las últimas 8 semanas del mismo turno y día.
          </div>
          <div style={{ fontSize: 12, color: "#555", lineHeight: 1.7 }}>
            El estado final del turno es el <strong>peor estado</strong> entre todas las métricas con peso {'>'} 0.
            Esto es conservador por diseño: un solo indicador anómalo es suficiente para marcar el turno.
          </div>
        </div>

        {/* Thresholds table */}
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 12 }}>
          Umbrales Capa 1 (Fijos)
        </div>

        {Object.values(METRICS_CONFIG).map(metric => (
          <div key={metric.id} style={{
            marginBottom: 10, padding: "12px 14px", borderRadius: 10,
            background: "#fafafa", border: "1px solid #f0f0f0",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#333", display: "flex", alignItems: "center", gap: 6 }}>
                <span>{metric.icon}</span> {metric.label}
              </div>
              <div style={{
                fontSize: 10, padding: "2px 8px", borderRadius: 10,
                background: metric.weight === 0 ? "#f0f0f0" : metric.weight >= 3 ? "#fef2f2" : "#fffbeb",
                color: metric.weight === 0 ? "#999" : metric.weight >= 3 ? "#991b1b" : "#92400e",
                fontWeight: 600,
              }}>
                Peso: {metric.weight === 0 ? "Contexto" : metric.weight}
              </div>
            </div>

            <div style={{ display: "flex", gap: 6 }}>
              {metric.thresholds.normal.max !== undefined ? (
                <>
                  <div style={{ flex: 1, padding: "6px 8px", borderRadius: 6, background: "#f0fdf4", fontSize: 11, color: "#166534", textAlign: "center" }}>
                    ✓ {'<'} {metric.id === "descuadre" ? `${metric.thresholds.normal.max * 100}%` : `${metric.thresholds.normal.max}${metric.unit}`}
                  </div>
                  <div style={{ flex: 1, padding: "6px 8px", borderRadius: 6, background: "#fffbeb", fontSize: 11, color: "#92400e", textAlign: "center" }}>
                    ⚠ {metric.id === "descuadre" ? `${metric.thresholds.normal.max * 100}–${metric.thresholds.attention.max * 100}%` : `${metric.thresholds.normal.max}–${metric.thresholds.attention.max}${metric.unit}`}
                  </div>
                  <div style={{ flex: 1, padding: "6px 8px", borderRadius: 6, background: "#fef2f2", fontSize: 11, color: "#991b1b", textAlign: "center" }}>
                    ✖ {'>'} {metric.id === "descuadre" ? `${metric.thresholds.attention.max * 100}%` : `${metric.thresholds.attention.max}${metric.unit}`}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ flex: 1, padding: "6px 8px", borderRadius: 6, background: "#f0fdf4", fontSize: 11, color: "#166534", textAlign: "center" }}>
                    ✓ ±{metric.thresholds.normal.maxDeviation * 100}%
                  </div>
                  <div style={{ flex: 1, padding: "6px 8px", borderRadius: 6, background: "#fffbeb", fontSize: 11, color: "#92400e", textAlign: "center" }}>
                    ⚠ ±{metric.thresholds.normal.maxDeviation * 100}–{metric.thresholds.attention.maxDeviation * 100}%
                  </div>
                  <div style={{ flex: 1, padding: "6px 8px", borderRadius: 6, background: "#fef2f2", fontSize: 11, color: "#991b1b", textAlign: "center" }}>
                    ✖ {'>'} ±{metric.thresholds.attention.maxDeviation * 100}%
                  </div>
                </>
              )}
            </div>

            <div style={{ fontSize: 10, color: "#999", marginTop: 6, lineHeight: 1.4 }}>
              {metric.tooltip}
            </div>
          </div>
        ))}

        {/* Statistical layer */}
        <div style={{ marginTop: 20, fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 10 }}>
          Umbrales Capa 2 (Estadísticos)
        </div>
        <div style={{
          padding: "14px", borderRadius: 10, background: "#f8f9fa",
          border: "1px solid #e9ecef", fontSize: 12, color: "#555", lineHeight: 1.7,
        }}>
          Cada métrica se compara con la media de las últimas 8 semanas del <strong>mismo turno y día</strong>
          (ej: "Cena del sábado"). Se calcula el Z-score (desviaciones estándar).
          Generalmente: {'>'} 1.5σ = Atención, {'>'} 2.0-2.5σ = Crítico (varía por métrica).
          Esto detecta anomalías incluso cuando el valor está dentro del umbral fijo.
        </div>
      </div>
    </div>
  );
}

export default function HealthScoreHeatmap() {
  const [drillDown, setDrillDown] = useState(null);
  const [showModel, setShowModel] = useState(false);
  const [hoveredCell, setHoveredCell] = useState(null);

  // Calculate health for all cells
  const healthGrid = useMemo(() => {
    const grid = {};
    SHIFTS.forEach(shift => {
      grid[shift] = {};
      DAYS.forEach(day => {
        const data = SHIFT_DATA[shift]?.[day];
        if (data) {
          grid[shift][day] = calculateShiftHealth(data);
        } else {
          grid[shift][day] = { state: "noData", evaluations: [], primaryReason: "Sin datos", secondaryReasons: [], alertCount: 0 };
        }
      });
    });
    return grid;
  }, []);

  // Summary stats
  const totalCells = SHIFTS.length * DAYS.length;
  const criticalCount = SHIFTS.flatMap(s => DAYS.map(d => healthGrid[s][d])).filter(h => h.state === "critical").length;
  const attentionCount = SHIFTS.flatMap(s => DAYS.map(d => healthGrid[s][d])).filter(h => h.state === "attention").length;
  const normalCount = totalCells - criticalCount - attentionCount;

  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      background: "#f5f4f1",
      minHeight: "100vh",
      padding: "32px 40px",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 12, color: "#999", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
            Salud Operacional · Caja y Ventas
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
            <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#999", padding: 0 }}>‹</button>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>17 – 23 Feb</span>
            <span style={{ fontSize: 14, color: "#bbb", fontWeight: 500 }}>Semana 8 · 2026</span>
            <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#999", padding: 0 }}>›</button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* Week summary pills */}
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{
              padding: "8px 14px", borderRadius: 10, background: "#f0fdf4",
              border: "1px solid #bbf7d0", fontSize: 13, fontWeight: 600, color: "#166534",
            }}>
              ✓ {normalCount}
            </div>
            <div style={{
              padding: "8px 14px", borderRadius: 10, background: "#fffbeb",
              border: "1px solid #fde68a", fontSize: 13, fontWeight: 600, color: "#92400e",
            }}>
              ⚠ {attentionCount}
            </div>
            <div style={{
              padding: "8px 14px", borderRadius: 10, background: "#fef2f2",
              border: "1px solid #fecaca", fontSize: 13, fontWeight: 600, color: "#991b1b",
            }}>
              ✖ {criticalCount}
            </div>
          </div>

          <button
            onClick={() => setShowModel(true)}
            style={{
              padding: "8px 16px", borderRadius: 10, background: "#fff",
              border: "1px solid #e5e7eb", fontSize: 12, fontWeight: 600,
              color: "#666", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}
          >
            📐 Ver modelo
          </button>
        </div>
      </div>

      {/* Heatmap */}
      <div style={{
        background: "#fff", borderRadius: 20, padding: "28px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      }}>
        {/* Column headers */}
        <div style={{ display: "grid", gridTemplateColumns: "100px repeat(7, 1fr)", gap: 4 }}>
          <div />
          {DAYS.map((day, i) => (
            <div key={i} style={{ textAlign: "center", padding: "6px 0 14px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>{day}</div>
              <div style={{ fontSize: 11, color: "#bbb", marginTop: 2 }}>{DAY_DATES[i]}</div>
            </div>
          ))}
        </div>

        {/* Data rows */}
        {SHIFTS.map(shift => (
          <div key={shift} style={{
            display: "grid", gridTemplateColumns: "100px repeat(7, 1fr)", gap: 4,
            marginBottom: 4,
          }}>
            <div style={{
              display: "flex", alignItems: "center",
              fontSize: 13, fontWeight: 600, color: "#555",
            }}>
              {shift === "Comida" ? "🌅" : "🌙"} <span style={{ marginLeft: 6 }}>{shift}</span>
            </div>

            {DAYS.map((day, di) => {
              const health = healthGrid[shift][day];
              const stateStyle = STATES[health.state];
              const isHovered = hoveredCell?.shift === shift && hoveredCell?.day === day;

              return (
                <div
                  key={di}
                  onClick={() => setDrillDown({ shift, day, dayDate: DAY_DATES[di], health })}
                  onMouseEnter={() => setHoveredCell({ shift, day })}
                  onMouseLeave={() => setHoveredCell(null)}
                  style={{
                    background: stateStyle.bg,
                    border: `2px solid ${isHovered ? stateStyle.color : stateStyle.border}`,
                    borderRadius: 14,
                    padding: "18px 12px",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    transform: isHovered ? "scale(1.03)" : "scale(1)",
                    boxShadow: isHovered ? `0 4px 16px ${stateStyle.color}30` : "none",
                    position: "relative",
                    zIndex: isHovered ? 10 : 1,
                  }}
                >
                  {/* State dot */}
                  <div style={{
                    width: 14, height: 14, borderRadius: "50%",
                    background: stateStyle.color,
                    margin: "0 auto 8px",
                    boxShadow: health.state === "critical" ? `0 0 8px ${stateStyle.color}60` : "none",
                  }} />

                  {/* Alert count or check */}
                  <div style={{
                    fontSize: 11, fontWeight: 600,
                    color: stateStyle.textColor,
                  }}>
                    {health.state === "normal" ? "Todo OK" :
                     `${health.alertCount} alerta${health.alertCount > 1 ? "s" : ""}`}
                  </div>

                  {/* Hover tooltip preview */}
                  {isHovered && health.state !== "normal" && (
                    <div style={{
                      position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
                      transform: "translateX(-50%)", whiteSpace: "nowrap",
                      background: "#1a1a1a", color: "#fff", padding: "8px 14px",
                      borderRadius: 8, fontSize: 11, fontWeight: 500,
                      boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                      zIndex: 100, pointerEvents: "none",
                      maxWidth: 260, whiteSpace: "normal", textAlign: "left",
                    }}>
                      {health.primaryReason}
                      <div style={{
                        position: "absolute", top: "100%", left: "50%",
                        transform: "translateX(-50%)",
                        border: "5px solid transparent",
                        borderTopColor: "#1a1a1a",
                      }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        display: "flex", alignItems: "center", gap: 20, marginTop: 16, paddingLeft: 4,
      }}>
        {Object.entries(STATES).filter(([k]) => k !== "noData").map(([key, s]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color }} />
            <span style={{ fontSize: 12, color: "#888", fontWeight: 500 }}>{s.label}</span>
          </div>
        ))}
        <span style={{ fontSize: 11, color: "#ccc", marginLeft: 8 }}>
          Clica una celda para ver el desglose · Pasa el ratón para preview
        </span>
      </div>

      {/* Drill-down panel */}
      {drillDown && (
        <>
          <div onClick={() => setDrillDown(null)} style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.2)", zIndex: 999,
          }} />
          <DrillDownPanel
            shift={drillDown.shift}
            day={drillDown.day}
            dayDate={drillDown.dayDate}
            health={drillDown.health}
            onClose={() => setDrillDown(null)}
          />
        </>
      )}

      {/* Model documentation panel */}
      {showModel && (
        <>
          <div onClick={() => setShowModel(false)} style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.2)", zIndex: 999,
          }} />
          <ModelPanel onClose={() => setShowModel(false)} />
        </>
      )}
    </div>
  );
}
