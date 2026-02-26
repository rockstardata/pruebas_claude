import { useState, useMemo } from "react";

// ============================================================
// HEALTH SCORE MODEL — RESTAURACIÓN — COMPRAS
// ============================================================

const METRICS_CONFIG = {
  foodcostDev: {
    id: "foodcostDev",
    label: "Desviación Foodcost",
    unit: "pp",
    description: "Puntos porcentuales de foodcost real por encima del teórico",
    thresholds: {
      normal: { max: 3 },      // < 3pp → green
      attention: { max: 6 },   // 3-6pp → yellow
    },
    statistical: { attention: 1.5, critical: 2.5 },
    weight: 2,
    icon: "📉",
    tooltip: "En restauración, una desviación < 3pp del foodcost teórico es operativa normal. Entre 3-6pp indica problemas de escandallos o pérdidas no registradas. Por encima de 6pp es crítico.",
    format: (v) => v === 0 ? "0" : `+${v.toFixed(1)}`,
  },
  mermas: {
    id: "mermas",
    label: "Mermas",
    unit: "%",
    description: "% de mermas sobre compras del período",
    thresholds: {
      normal: { max: 3 },
      attention: { max: 6 },
    },
    statistical: { attention: 1.5, critical: 2.5 },
    weight: 2,
    icon: "🗑️",
    tooltip: "Mermas por debajo del 3% son operativas. Entre 3-6% indica problemas de rotación FIFO o control de fechas. Por encima del 6% sugiere robo encubierto como desperdicio o falta grave de proceso.",
    format: (v) => `${v.toFixed(1)}`,
  },
  comprasUrgentes: {
    id: "comprasUrgentes",
    label: "Compras Urgentes",
    unit: "%",
    description: "% de compras urgentes (no planificadas) sobre total",
    thresholds: {
      normal: { max: 8 },
      attention: { max: 15 },
    },
    statistical: { attention: 1.5, critical: 2.0 },
    weight: 3,
    icon: "🚨",
    tooltip: "Las compras urgentes evitan procesos de aprobación y comparación de precios. Por debajo del 8% es normal operativo. Por encima del 15% indica mala planificación sistemática o posible fraude (kickbacks, precios inflados).",
    format: (v) => `${v.toFixed(1)}`,
  },
  rotacionStock: {
    id: "rotacionStock",
    label: "Rotación Stock",
    unit: "x",
    description: "Ratio de rotación vs objetivo, expresado como desviación",
    thresholds: {
      normal: { maxDeviation: 0.20 },
      attention: { maxDeviation: 0.40 },
    },
    statistical: { attention: 1.5, critical: 2.5 },
    weight: 1,
    icon: "🔄",
    tooltip: "Rotación baja acumula stock obsoleto y capital inmovilizado. Rotación excesiva puede indicar rotura de stock. Desviación dentro del ±20% del objetivo es aceptable.",
    format: (v) => `${v.toFixed(1)}`,
  },
};

const STATES = {
  normal: { label: "Normal", color: "#22c55e", bg: "#f0fdf4", textColor: "#166534", border: "#bbf7d0" },
  attention: { label: "Atención", color: "#f59e0b", bg: "#fffbeb", textColor: "#92400e", border: "#fde68a" },
  critical: { label: "Crítico", color: "#ef4444", bg: "#fef2f2", textColor: "#991b1b", border: "#fecaca" },
  noData: { label: "Sin datos", color: "#d1d5db", bg: "#f9fafb", textColor: "#9ca3af", border: "#e5e7eb" },
};

// ============================================================
// SIMULATED DATA — 6 LOCALES × 7 DÍAS
// ============================================================

const LOCATIONS = ["Gran Vía", "Malasaña", "Salamanca", "Chamberí", "La Latina", "Retiro"];
const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DAY_DATES = ["17", "18", "19", "20", "21", "22", "23"];

// Realistic patterns:
// - Gran Vía: well-managed, mostly green
// - Malasaña: good but occasional mermas spikes
// - Salamanca: premium, low urgentes but foodcost deviation
// - Chamberí: problematic - high urgentes, erratic stock
// - La Latina: mixed - weekend mermas issues
// - Retiro: new location, still calibrating

const generateHistorical = (baseMean, baseStd) => ({
  historicalMean: baseMean,
  historicalStd: baseStd,
});

const LOCATION_DATA = {
  "Gran Vía": {
    Lun: { foodcostDev: 1.2, mermas: 1.8, comprasUrgentes: 4, rotacionStock: 6.2, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 1.5, mermas: 2.0, comprasUrgentes: 5, rotacionStock: 6.5 }, { foodcostDev: 0.8, mermas: 0.6, comprasUrgentes: 2, rotacionStock: 0.8 }) },
    Mar: { foodcostDev: 1.8, mermas: 2.1, comprasUrgentes: 5, rotacionStock: 6.4, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 1.5, mermas: 2.0, comprasUrgentes: 5, rotacionStock: 6.5 }, { foodcostDev: 0.8, mermas: 0.6, comprasUrgentes: 2, rotacionStock: 0.8 }) },
    Mié: { foodcostDev: 2.0, mermas: 2.5, comprasUrgentes: 6, rotacionStock: 6.0, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 1.5, mermas: 2.0, comprasUrgentes: 5, rotacionStock: 6.5 }, { foodcostDev: 0.8, mermas: 0.6, comprasUrgentes: 2, rotacionStock: 0.8 }) },
    Jue: { foodcostDev: 1.0, mermas: 1.5, comprasUrgentes: 3, rotacionStock: 6.8, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 1.5, mermas: 2.0, comprasUrgentes: 5, rotacionStock: 6.5 }, { foodcostDev: 0.8, mermas: 0.6, comprasUrgentes: 2, rotacionStock: 0.8 }) },
    Vie: { foodcostDev: 2.2, mermas: 2.8, comprasUrgentes: 7, rotacionStock: 5.8, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 2.0, mermas: 2.5, comprasUrgentes: 6, rotacionStock: 6.0 }, { foodcostDev: 0.8, mermas: 0.8, comprasUrgentes: 2.5, rotacionStock: 0.8 }) },
    Sáb: { foodcostDev: 2.5, mermas: 3.2, comprasUrgentes: 5, rotacionStock: 5.5, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 2.0, mermas: 2.5, comprasUrgentes: 6, rotacionStock: 6.0 }, { foodcostDev: 0.8, mermas: 0.8, comprasUrgentes: 2.5, rotacionStock: 0.8 }) },
    Dom: { foodcostDev: 1.5, mermas: 2.0, comprasUrgentes: 4, rotacionStock: 6.5, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 2.0, mermas: 2.5, comprasUrgentes: 6, rotacionStock: 6.0 }, { foodcostDev: 0.8, mermas: 0.8, comprasUrgentes: 2.5, rotacionStock: 0.8 }) },
  },
  "Malasaña": {
    Lun: { foodcostDev: 2.0, mermas: 2.5, comprasUrgentes: 6, rotacionStock: 5.8, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 2.2, mermas: 2.8, comprasUrgentes: 7, rotacionStock: 5.5 }, { foodcostDev: 1.0, mermas: 0.8, comprasUrgentes: 2.5, rotacionStock: 1.0 }) },
    Mar: { foodcostDev: 2.5, mermas: 5.2, comprasUrgentes: 7, rotacionStock: 5.2, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 2.2, mermas: 2.8, comprasUrgentes: 7, rotacionStock: 5.5 }, { foodcostDev: 1.0, mermas: 0.8, comprasUrgentes: 2.5, rotacionStock: 1.0 }) },
    Mié: { foodcostDev: 2.8, mermas: 3.5, comprasUrgentes: 8, rotacionStock: 5.0, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 2.2, mermas: 2.8, comprasUrgentes: 7, rotacionStock: 5.5 }, { foodcostDev: 1.0, mermas: 0.8, comprasUrgentes: 2.5, rotacionStock: 1.0 }) },
    Jue: { foodcostDev: 1.8, mermas: 2.2, comprasUrgentes: 5, rotacionStock: 5.8, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 2.2, mermas: 2.8, comprasUrgentes: 7, rotacionStock: 5.5 }, { foodcostDev: 1.0, mermas: 0.8, comprasUrgentes: 2.5, rotacionStock: 1.0 }) },
    Vie: { foodcostDev: 3.5, mermas: 6.8, comprasUrgentes: 10, rotacionStock: 4.5, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 2.5, mermas: 3.0, comprasUrgentes: 8, rotacionStock: 5.2 }, { foodcostDev: 1.0, mermas: 1.0, comprasUrgentes: 3, rotacionStock: 1.0 }) },
    Sáb: { foodcostDev: 4.2, mermas: 7.5, comprasUrgentes: 12, rotacionStock: 4.0, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 2.5, mermas: 3.0, comprasUrgentes: 8, rotacionStock: 5.2 }, { foodcostDev: 1.0, mermas: 1.0, comprasUrgentes: 3, rotacionStock: 1.0 }) },
    Dom: { foodcostDev: 3.0, mermas: 4.8, comprasUrgentes: 9, rotacionStock: 4.8, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 2.5, mermas: 3.0, comprasUrgentes: 8, rotacionStock: 5.2 }, { foodcostDev: 1.0, mermas: 1.0, comprasUrgentes: 3, rotacionStock: 1.0 }) },
  },
  "Salamanca": {
    Lun: { foodcostDev: 4.5, mermas: 1.5, comprasUrgentes: 3, rotacionStock: 7.2, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 3.8, mermas: 1.8, comprasUrgentes: 4, rotacionStock: 7.0 }, { foodcostDev: 1.2, mermas: 0.5, comprasUrgentes: 1.5, rotacionStock: 0.6 }) },
    Mar: { foodcostDev: 5.0, mermas: 1.8, comprasUrgentes: 4, rotacionStock: 6.8, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 3.8, mermas: 1.8, comprasUrgentes: 4, rotacionStock: 7.0 }, { foodcostDev: 1.2, mermas: 0.5, comprasUrgentes: 1.5, rotacionStock: 0.6 }) },
    Mié: { foodcostDev: 5.8, mermas: 2.0, comprasUrgentes: 5, rotacionStock: 6.5, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 3.8, mermas: 1.8, comprasUrgentes: 4, rotacionStock: 7.0 }, { foodcostDev: 1.2, mermas: 0.5, comprasUrgentes: 1.5, rotacionStock: 0.6 }) },
    Jue: { foodcostDev: 4.0, mermas: 1.2, comprasUrgentes: 2, rotacionStock: 7.5, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 3.8, mermas: 1.8, comprasUrgentes: 4, rotacionStock: 7.0 }, { foodcostDev: 1.2, mermas: 0.5, comprasUrgentes: 1.5, rotacionStock: 0.6 }) },
    Vie: { foodcostDev: 6.5, mermas: 2.2, comprasUrgentes: 6, rotacionStock: 6.2, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 4.2, mermas: 2.0, comprasUrgentes: 5, rotacionStock: 6.8 }, { foodcostDev: 1.2, mermas: 0.6, comprasUrgentes: 2, rotacionStock: 0.8 }) },
    Sáb: { foodcostDev: 7.2, mermas: 2.8, comprasUrgentes: 4, rotacionStock: 6.0, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 4.2, mermas: 2.0, comprasUrgentes: 5, rotacionStock: 6.8 }, { foodcostDev: 1.2, mermas: 0.6, comprasUrgentes: 2, rotacionStock: 0.8 }) },
    Dom: { foodcostDev: 5.5, mermas: 2.5, comprasUrgentes: 3, rotacionStock: 6.5, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 4.2, mermas: 2.0, comprasUrgentes: 5, rotacionStock: 6.8 }, { foodcostDev: 1.2, mermas: 0.6, comprasUrgentes: 2, rotacionStock: 0.8 }) },
  },
  "Chamberí": {
    Lun: { foodcostDev: 3.5, mermas: 4.0, comprasUrgentes: 14, rotacionStock: 3.8, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 3.0, mermas: 3.5, comprasUrgentes: 12, rotacionStock: 4.2 }, { foodcostDev: 1.0, mermas: 1.0, comprasUrgentes: 3, rotacionStock: 1.0 }) },
    Mar: { foodcostDev: 4.2, mermas: 4.5, comprasUrgentes: 16, rotacionStock: 3.5, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 3.0, mermas: 3.5, comprasUrgentes: 12, rotacionStock: 4.2 }, { foodcostDev: 1.0, mermas: 1.0, comprasUrgentes: 3, rotacionStock: 1.0 }) },
    Mié: { foodcostDev: 5.0, mermas: 5.2, comprasUrgentes: 18, rotacionStock: 3.2, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 3.0, mermas: 3.5, comprasUrgentes: 12, rotacionStock: 4.2 }, { foodcostDev: 1.0, mermas: 1.0, comprasUrgentes: 3, rotacionStock: 1.0 }) },
    Jue: { foodcostDev: 3.8, mermas: 3.8, comprasUrgentes: 13, rotacionStock: 4.0, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 3.0, mermas: 3.5, comprasUrgentes: 12, rotacionStock: 4.2 }, { foodcostDev: 1.0, mermas: 1.0, comprasUrgentes: 3, rotacionStock: 1.0 }) },
    Vie: { foodcostDev: 6.8, mermas: 7.0, comprasUrgentes: 22, rotacionStock: 2.8, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 3.5, mermas: 4.0, comprasUrgentes: 14, rotacionStock: 3.8 }, { foodcostDev: 1.2, mermas: 1.2, comprasUrgentes: 4, rotacionStock: 1.0 }) },
    Sáb: { foodcostDev: 8.5, mermas: 9.2, comprasUrgentes: 28, rotacionStock: 2.5, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 3.5, mermas: 4.0, comprasUrgentes: 14, rotacionStock: 3.8 }, { foodcostDev: 1.2, mermas: 1.2, comprasUrgentes: 4, rotacionStock: 1.0 }) },
    Dom: { foodcostDev: 5.5, mermas: 6.0, comprasUrgentes: 20, rotacionStock: 3.0, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 3.5, mermas: 4.0, comprasUrgentes: 14, rotacionStock: 3.8 }, { foodcostDev: 1.2, mermas: 1.2, comprasUrgentes: 4, rotacionStock: 1.0 }) },
  },
  "La Latina": {
    Lun: { foodcostDev: 2.0, mermas: 2.2, comprasUrgentes: 6, rotacionStock: 5.5, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 2.0, mermas: 2.5, comprasUrgentes: 6, rotacionStock: 5.8 }, { foodcostDev: 0.8, mermas: 0.8, comprasUrgentes: 2, rotacionStock: 0.8 }) },
    Mar: { foodcostDev: 2.2, mermas: 2.8, comprasUrgentes: 7, rotacionStock: 5.2, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 2.0, mermas: 2.5, comprasUrgentes: 6, rotacionStock: 5.8 }, { foodcostDev: 0.8, mermas: 0.8, comprasUrgentes: 2, rotacionStock: 0.8 }) },
    Mié: { foodcostDev: 2.5, mermas: 3.0, comprasUrgentes: 8, rotacionStock: 5.0, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 2.0, mermas: 2.5, comprasUrgentes: 6, rotacionStock: 5.8 }, { foodcostDev: 0.8, mermas: 0.8, comprasUrgentes: 2, rotacionStock: 0.8 }) },
    Jue: { foodcostDev: 1.8, mermas: 2.0, comprasUrgentes: 5, rotacionStock: 5.8, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 2.0, mermas: 2.5, comprasUrgentes: 6, rotacionStock: 5.8 }, { foodcostDev: 0.8, mermas: 0.8, comprasUrgentes: 2, rotacionStock: 0.8 }) },
    Vie: { foodcostDev: 3.2, mermas: 5.5, comprasUrgentes: 9, rotacionStock: 4.5, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 2.5, mermas: 3.0, comprasUrgentes: 7, rotacionStock: 5.2 }, { foodcostDev: 1.0, mermas: 1.0, comprasUrgentes: 2.5, rotacionStock: 1.0 }) },
    Sáb: { foodcostDev: 3.8, mermas: 6.5, comprasUrgentes: 11, rotacionStock: 4.2, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 2.5, mermas: 3.0, comprasUrgentes: 7, rotacionStock: 5.2 }, { foodcostDev: 1.0, mermas: 1.0, comprasUrgentes: 2.5, rotacionStock: 1.0 }) },
    Dom: { foodcostDev: 3.5, mermas: 5.8, comprasUrgentes: 10, rotacionStock: 4.5, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 2.5, mermas: 3.0, comprasUrgentes: 7, rotacionStock: 5.2 }, { foodcostDev: 1.0, mermas: 1.0, comprasUrgentes: 2.5, rotacionStock: 1.0 }) },
  },
  "Retiro": {
    Lun: { foodcostDev: 2.8, mermas: 3.2, comprasUrgentes: 10, rotacionStock: 4.8, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 2.5, mermas: 3.0, comprasUrgentes: 9, rotacionStock: 5.0 }, { foodcostDev: 1.0, mermas: 1.0, comprasUrgentes: 3, rotacionStock: 1.0 }) },
    Mar: { foodcostDev: 3.0, mermas: 3.5, comprasUrgentes: 11, rotacionStock: 4.5, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 2.5, mermas: 3.0, comprasUrgentes: 9, rotacionStock: 5.0 }, { foodcostDev: 1.0, mermas: 1.0, comprasUrgentes: 3, rotacionStock: 1.0 }) },
    Mié: { foodcostDev: 3.5, mermas: 4.0, comprasUrgentes: 12, rotacionStock: 4.2, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 2.5, mermas: 3.0, comprasUrgentes: 9, rotacionStock: 5.0 }, { foodcostDev: 1.0, mermas: 1.0, comprasUrgentes: 3, rotacionStock: 1.0 }) },
    Jue: { foodcostDev: 2.2, mermas: 2.5, comprasUrgentes: 7, rotacionStock: 5.2, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 2.5, mermas: 3.0, comprasUrgentes: 9, rotacionStock: 5.0 }, { foodcostDev: 1.0, mermas: 1.0, comprasUrgentes: 3, rotacionStock: 1.0 }) },
    Vie: { foodcostDev: 4.5, mermas: 5.0, comprasUrgentes: 14, rotacionStock: 3.8, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 3.0, mermas: 3.5, comprasUrgentes: 10, rotacionStock: 4.5 }, { foodcostDev: 1.2, mermas: 1.0, comprasUrgentes: 3, rotacionStock: 1.0 }) },
    Sáb: { foodcostDev: 5.5, mermas: 6.0, comprasUrgentes: 18, rotacionStock: 3.5, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 3.0, mermas: 3.5, comprasUrgentes: 10, rotacionStock: 4.5 }, { foodcostDev: 1.2, mermas: 1.0, comprasUrgentes: 3, rotacionStock: 1.0 }) },
    Dom: { foodcostDev: 4.0, mermas: 4.5, comprasUrgentes: 13, rotacionStock: 4.0, rotacionTarget: 7, ...generateHistorical({ foodcostDev: 3.0, mermas: 3.5, comprasUrgentes: 10, rotacionStock: 4.5 }, { foodcostDev: 1.2, mermas: 1.0, comprasUrgentes: 3, rotacionStock: 1.0 }) },
  },
};

// ============================================================
// EVALUATION ENGINE (same philosophy as Caja y Ventas)
// ============================================================

function evaluateMetric(metricKey, value, data) {
  const config = METRICS_CONFIG[metricKey];
  const hist = data.historicalMean[metricKey];
  const std = data.historicalStd[metricKey];

  let fixedState = "normal";
  let statState = "normal";
  let reason = "";

  if (config.thresholds.normal.max !== undefined) {
    if (value > config.thresholds.attention.max) {
      fixedState = "critical";
      reason = `${config.format(value)}${config.unit} supera umbral crítico (>${config.thresholds.attention.max}${config.unit})`;
    } else if (value > config.thresholds.normal.max) {
      fixedState = "attention";
      reason = `${config.format(value)}${config.unit} por encima del umbral (>${config.thresholds.normal.max}${config.unit})`;
    }
  } else if (config.thresholds.normal.maxDeviation !== undefined) {
    const target = data.rotacionTarget || hist;
    const deviation = Math.abs(value - target) / target;
    if (deviation > config.thresholds.attention.maxDeviation) {
      fixedState = "critical";
      reason = `${value.toFixed(1)}x vs objetivo ${target}x (${(deviation * 100).toFixed(0)}% desviación)`;
    } else if (deviation > config.thresholds.normal.maxDeviation) {
      fixedState = "attention";
      reason = `${value.toFixed(1)}x vs objetivo ${target}x (${(deviation * 100).toFixed(0)}% desviación)`;
    }
  }

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

  const stateOrder = { normal: 0, attention: 1, critical: 2 };
  const finalState = stateOrder[fixedState] >= stateOrder[statState] ? fixedState : statState;

  return { state: finalState, value, reason, metricKey, weight: config.weight };
}

function calculateLocationHealth(data) {
  const evaluations = Object.keys(METRICS_CONFIG).map(key =>
    evaluateMetric(key, data[key], data)
  );

  const weighted = evaluations.filter(e => METRICS_CONFIG[e.metricKey].weight > 0);
  const hasAnyCritical = weighted.some(e => e.state === "critical");
  const hasAnyAttention = weighted.some(e => e.state === "attention");

  let overallState = "normal";
  if (hasAnyCritical) overallState = "critical";
  else if (hasAnyAttention) overallState = "attention";

  const alertMetrics = weighted
    .filter(e => e.state !== "normal")
    .sort((a, b) => b.weight - a.weight);

  const primaryReason = alertMetrics.length > 0
    ? `${METRICS_CONFIG[alertMetrics[0].metricKey].icon} ${METRICS_CONFIG[alertMetrics[0].metricKey].label}: ${alertMetrics[0].reason}`
    : "Todos los indicadores en rango normal";

  const secondaryReasons = alertMetrics.slice(1).map(e =>
    `${METRICS_CONFIG[e.metricKey].icon} ${METRICS_CONFIG[e.metricKey].label}: ${e.reason}`
  );

  return { state: overallState, evaluations, primaryReason, secondaryReasons, alertCount: alertMetrics.length };
}

// ============================================================
// DRILL-DOWN PANEL
// ============================================================

function DrillDownPanel({ location, day, dayDate, health, data, onClose }) {
  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0, width: 420,
      background: "#fff", boxShadow: "-8px 0 40px rgba(0,0,0,0.15)",
      zIndex: 1000, display: "flex", flexDirection: "column",
      fontFamily: "'DM Sans', sans-serif",
      animation: "slideIn 0.25s ease-out", overflowY: "auto",
    }}>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

      <div style={{
        padding: "24px 24px 20px",
        background: STATES[health.state].bg,
        borderBottom: `2px solid ${STATES[health.state].border}`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
          <div>
            <div style={{ fontSize: 12, color: "#999", fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase" }}>
              {day} {dayDate} Feb · Compras
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", marginTop: 4 }}>
              {location}
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

        {health.state !== "normal" && (
          <div style={{
            marginTop: 14, padding: "12px 14px", borderRadius: 10,
            background: "rgba(255,255,255,0.7)", fontSize: 13,
            color: STATES[health.state].textColor, lineHeight: 1.5,
          }}>
            <strong>Motivo principal:</strong> {health.primaryReason}
            {health.secondaryReasons.length > 0 && (
              <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
                {health.secondaryReasons.map((r, i) => <div key={i}>{r}</div>)}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ padding: "20px 24px" }}>
        <div style={{ fontSize: 11, color: "#999", fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 14 }}>
          Desglose por métrica
        </div>

        {health.evaluations.map(evaluation => {
          const config = METRICS_CONFIG[evaluation.metricKey];
          const metricState = STATES[evaluation.state];
          const hist = data.historicalMean[evaluation.metricKey];
          const deviation = hist > 0 ? ((evaluation.value - hist) / hist * 100).toFixed(1) : "—";

          return (
            <div key={evaluation.metricKey} style={{
              display: "flex", alignItems: "stretch", gap: 12,
              marginBottom: 8, borderRadius: 12, padding: "14px 16px",
              background: evaluation.state === "normal" ? "#fafafa" : metricState.bg,
              border: `1px solid ${evaluation.state === "normal" ? "#f0f0f0" : metricState.border}`,
            }}>
              <div style={{ width: 4, borderRadius: 4, flexShrink: 0, background: metricState.color }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 12, color: "#666", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>{config.icon}</span> {config.label}
                  </div>
                  <div style={{
                    fontSize: 16, fontWeight: 700,
                    color: evaluation.state === "normal" ? "#1a1a1a" : metricState.textColor,
                  }}>
                    {config.format(evaluation.value)}{config.unit}
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                  <div style={{ fontSize: 11, color: "#999" }}>
                    Media: {config.format(hist)}{config.unit}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#999" }}>
                    {deviation > 0 ? "+" : ""}{deviation}% vs media
                  </div>
                </div>
                {evaluation.state !== "normal" && evaluation.reason && (
                  <div style={{
                    marginTop: 8, fontSize: 11, color: metricState.textColor,
                    padding: "6px 10px", borderRadius: 6, background: `${metricState.color}10`,
                  }}>
                    ⚡ {evaluation.reason}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        margin: "0 24px 24px", padding: "16px",
        background: "#f8f9fa", borderRadius: 12, border: "1px solid #e9ecef",
      }}>
        <div style={{ fontSize: 11, color: "#999", fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>
          Cómo se calcula
        </div>
        <div style={{ fontSize: 12, color: "#666", lineHeight: 1.6 }}>
          Estado = peor entre las 4 métricas. Cada métrica se evalúa contra umbrales fijos
          + desviación estadística (8 sem). Compras urgentes tiene el mayor peso (3) porque
          es el indicador de fraude más fiable en compras.
        </div>
      </div>
    </div>
  );
}

// ============================================================
// WORST LOCATION RANKING SIDEBAR
// ============================================================

function WeeklyRanking({ healthGrid }) {
  const locationScores = LOCATIONS.map(loc => {
    let criticals = 0, attentions = 0;
    DAYS.forEach(day => {
      const h = healthGrid[loc][day];
      if (h.state === "critical") criticals++;
      else if (h.state === "attention") attentions++;
    });
    return { location: loc, criticals, attentions, score: criticals * 3 + attentions };
  }).sort((a, b) => b.score - a.score);

  return (
    <div style={{
      background: "#fff", borderRadius: 16, padding: "20px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.04)", minWidth: 220,
    }}>
      <div style={{ fontSize: 11, color: "#999", fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 14 }}>
        Ranking semanal
      </div>
      {locationScores.map((item, i) => (
        <div key={item.location} style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 0",
          borderBottom: i < locationScores.length - 1 ? "1px solid #f5f5f5" : "none",
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: 8, display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700,
            background: item.score === 0 ? "#f0fdf4" : item.criticals > 0 ? "#fef2f2" : "#fffbeb",
            color: item.score === 0 ? "#166534" : item.criticals > 0 ? "#991b1b" : "#92400e",
          }}>
            {i + 1}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{item.location}</div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {item.criticals > 0 && (
              <span style={{ fontSize: 11, fontWeight: 600, color: "#991b1b", background: "#fef2f2", padding: "2px 8px", borderRadius: 8 }}>
                {item.criticals}🔴
              </span>
            )}
            {item.attentions > 0 && (
              <span style={{ fontSize: 11, fontWeight: 600, color: "#92400e", background: "#fffbeb", padding: "2px 8px", borderRadius: 8 }}>
                {item.attentions}🟡
              </span>
            )}
            {item.score === 0 && (
              <span style={{ fontSize: 11, fontWeight: 600, color: "#166534", background: "#f0fdf4", padding: "2px 8px", borderRadius: 8 }}>
                ✓
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function ComprasHealthHeatmap() {
  const [drillDown, setDrillDown] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);

  const healthGrid = useMemo(() => {
    const grid = {};
    LOCATIONS.forEach(loc => {
      grid[loc] = {};
      DAYS.forEach(day => {
        const data = LOCATION_DATA[loc]?.[day];
        if (data) {
          grid[loc][day] = calculateLocationHealth(data);
        } else {
          grid[loc][day] = { state: "noData", evaluations: [], primaryReason: "Sin datos", secondaryReasons: [], alertCount: 0 };
        }
      });
    });
    return grid;
  }, []);

  const totalCells = LOCATIONS.length * DAYS.length;
  const criticalCount = LOCATIONS.flatMap(l => DAYS.map(d => healthGrid[l][d])).filter(h => h.state === "critical").length;
  const attentionCount = LOCATIONS.flatMap(l => DAYS.map(d => healthGrid[l][d])).filter(h => h.state === "attention").length;
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
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 12, color: "#999", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
              Salud Operacional
            </div>
            <div style={{ fontSize: 12, color: "#e8740e", fontWeight: 700, padding: "2px 10px", borderRadius: 6, background: "#FFF3E0", letterSpacing: 0.5 }}>
              COMPRAS
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
            <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#999", padding: 0 }}>‹</button>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>17 – 23 Feb</span>
            <span style={{ fontSize: 14, color: "#bbb", fontWeight: 500 }}>Semana 8 · 2026</span>
            <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#999", padding: 0 }}>›</button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ padding: "8px 14px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: 13, fontWeight: 600, color: "#166534" }}>
            ✓ {normalCount}
          </div>
          <div style={{ padding: "8px 14px", borderRadius: 10, background: "#fffbeb", border: "1px solid #fde68a", fontSize: 13, fontWeight: 600, color: "#92400e" }}>
            ⚠ {attentionCount}
          </div>
          <div style={{ padding: "8px 14px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", fontSize: 13, fontWeight: 600, color: "#991b1b" }}>
            ✖ {criticalCount}
          </div>
        </div>
      </div>

      {/* Main layout: Heatmap + Ranking */}
      <div style={{ display: "flex", gap: 20 }}>

        {/* Heatmap */}
        <div style={{
          flex: 1, background: "#fff", borderRadius: 20, padding: "28px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}>
          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "120px repeat(7, 1fr)", gap: 4 }}>
            <div />
            {DAYS.map((day, i) => (
              <div key={i} style={{ textAlign: "center", padding: "6px 0 14px" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>{day}</div>
                <div style={{ fontSize: 11, color: "#bbb", marginTop: 2 }}>{DAY_DATES[i]}</div>
              </div>
            ))}
          </div>

          {/* Location rows */}
          {LOCATIONS.map(location => (
            <div key={location} style={{
              display: "grid", gridTemplateColumns: "120px repeat(7, 1fr)", gap: 4,
              marginBottom: 4,
            }}>
              <div style={{
                display: "flex", alignItems: "center",
                fontSize: 13, fontWeight: 600, color: "#555",
                paddingRight: 8,
              }}>
                {location}
              </div>

              {DAYS.map((day, di) => {
                const health = healthGrid[location][day];
                const stateStyle = STATES[health.state];
                const isHovered = hoveredCell?.loc === location && hoveredCell?.day === day;

                return (
                  <div
                    key={di}
                    onClick={() => setDrillDown({ location, day, dayDate: DAY_DATES[di], health, data: LOCATION_DATA[location][day] })}
                    onMouseEnter={() => setHoveredCell({ loc: location, day })}
                    onMouseLeave={() => setHoveredCell(null)}
                    style={{
                      background: stateStyle.bg,
                      border: `2px solid ${isHovered ? stateStyle.color : stateStyle.border}`,
                      borderRadius: 12,
                      padding: "14px 8px",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      transform: isHovered ? "scale(1.04)" : "scale(1)",
                      boxShadow: isHovered ? `0 4px 16px ${stateStyle.color}30` : "none",
                      position: "relative",
                      zIndex: isHovered ? 10 : 1,
                    }}
                  >
                    <div style={{
                      width: 12, height: 12, borderRadius: "50%",
                      background: stateStyle.color,
                      margin: "0 auto 6px",
                      boxShadow: health.state === "critical" ? `0 0 8px ${stateStyle.color}60` : "none",
                    }} />
                    <div style={{ fontSize: 10, fontWeight: 600, color: stateStyle.textColor }}>
                      {health.state === "normal" ? "OK" : `${health.alertCount} alerta${health.alertCount > 1 ? "s" : ""}`}
                    </div>

                    {isHovered && health.state !== "normal" && (
                      <div style={{
                        position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
                        transform: "translateX(-50%)",
                        background: "#1a1a1a", color: "#fff", padding: "8px 14px",
                        borderRadius: 8, fontSize: 11, fontWeight: 500,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                        zIndex: 100, pointerEvents: "none",
                        maxWidth: 280, whiteSpace: "normal", textAlign: "left",
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

        {/* Weekly Ranking */}
        <WeeklyRanking healthGrid={healthGrid} />
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
        <div style={{ fontSize: 11, color: "#ccc", marginLeft: 8 }}>
          Clica una celda para ver el desglose · Datos actualizados semanalmente
        </div>
      </div>

      {/* Drill-down panel */}
      {drillDown && (
        <>
          <div onClick={() => setDrillDown(null)} style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.2)", zIndex: 999,
          }} />
          <DrillDownPanel
            location={drillDown.location}
            day={drillDown.day}
            dayDate={drillDown.dayDate}
            health={drillDown.health}
            data={drillDown.data}
            onClose={() => setDrillDown(null)}
          />
        </>
      )}
    </div>
  );
}
