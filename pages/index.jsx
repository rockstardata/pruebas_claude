import { useState } from "react";
import dynamic from "next/dynamic";

// Dynamic imports — ssr:false evita errores de recharts y refs en servidor
const FraudRadarChart = dynamic(() => import("../components/FraudRadarChart"), { ssr: false });
const GhostEmployeeDetection = dynamic(() => import("../components/GhostEmployeeDetection"), { ssr: false });
const HealthScoreGrid = dynamic(() => import("../components/HealthScoreGrid"), { ssr: false });
const HealthScoreHeatmap = dynamic(() => import("../components/HealthScoreHeatmap"), { ssr: false });
const InventoryDeviations = dynamic(() => import("../components/InventoryDeviations"), { ssr: false });
const KPICardsCaja = dynamic(() => import("../components/KPICardsCaja"), { ssr: false });
const ManagerCorrelationTimeline = dynamic(() => import("../components/ManagerCorrelationTimeline"), { ssr: false });
const PerformanceHeatmap = dynamic(() => import("../components/PerformanceHeatmap"), { ssr: false });
const PersonnelAnomalyGrid = dynamic(() => import("../components/PersonnelAnomalyGrid"), { ssr: false });
const VoidBubbleChart = dynamic(() => import("../components/VoidBubbleChart"), { ssr: false });
const ComprasHealthHeatmap = dynamic(() => import("../components/ComprasHealthHeatmap"), { ssr: false });

const TABS = [
  // ── Fraude ──
  { id: "radar", label: "🛡️ Fraud Radar", component: FraudRadarChart, group: "Detección de Fraude" },
  { id: "ghost", label: "👻 Empleados Fantasma", component: GhostEmployeeDetection, group: "Detección de Fraude" },
  { id: "voids", label: "↩️ Anulaciones (Bubble)", component: VoidBubbleChart, group: "Detección de Fraude" },
  { id: "manager", label: "👤 Correlación Gerente", component: ManagerCorrelationTimeline, group: "Detección de Fraude" },
  { id: "inventory", label: "📦 Desviaciones Inventario", component: InventoryDeviations, group: "Detección de Fraude" },
  // ── Salud Operacional ──
  { id: "kpi-caja", label: "💰 KPIs Caja", component: KPICardsCaja, group: "Salud Operacional" },
  { id: "health-grid", label: "💊 Health Score Grid", component: HealthScoreGrid, group: "Salud Operacional" },
  { id: "health-heatmap", label: "🔥 Health Heatmap Caja", component: HealthScoreHeatmap, group: "Salud Operacional" },
  { id: "compras-heatmap", label: "🛒 Health Heatmap Compras", component: ComprasHealthHeatmap, group: "Salud Operacional" },
  { id: "heatmap", label: "📊 Performance Heatmap", component: PerformanceHeatmap, group: "Salud Operacional" },
  { id: "personnel", label: "👥 Anomalías Personal", component: PersonnelAnomalyGrid, group: "Salud Operacional" },
];

const GROUPS = [...new Set(TABS.map((t) => t.group))];

export default function Home() {
  const [activeTab, setActiveTab] = useState("radar");
  const ActiveComponent = TABS.find((t) => t.id === activeTab)?.component;
  const activeGroup = TABS.find((t) => t.id === activeTab)?.group;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a1a", color: "#e2e8f0" }}>
      {/* ──── HEADER ──── */}
      <div
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.02)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, marginBottom: 2 }}>
            🚀 RockstarData — Prototipos Dashboard
          </h1>
          <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
            {TABS.length} componentes · Febrero 2026
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            fontSize: 11,
            color: "#475569",
          }}
        >
          <span style={{
            padding: "4px 10px",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 6,
            color: "#f87171",
          }}>
            {TABS.filter((t) => t.group === "Detección de Fraude").length} Fraude
          </span>
          <span style={{
            padding: "4px 10px",
            background: "rgba(59,130,246,0.1)",
            border: "1px solid rgba(59,130,246,0.2)",
            borderRadius: 6,
            color: "#60a5fa",
          }}>
            {TABS.filter((t) => t.group === "Salud Operacional").length} Salud Op.
          </span>
        </div>
      </div>

      {/* ──── TAB NAVIGATION ──── */}
      <div
        style={{
          padding: "12px 24px 0",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {GROUPS.map((group) => (
          <div key={group} style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 1,
                color: "#475569",
                marginBottom: 6,
              }}
            >
              {group}
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {TABS.filter((t) => t.group === group).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 8,
                    border:
                      activeTab === tab.id
                        ? "1px solid rgba(139,92,246,0.4)"
                        : "1px solid rgba(255,255,255,0.08)",
                    background:
                      activeTab === tab.id
                        ? "rgba(139,92,246,0.15)"
                        : "rgba(255,255,255,0.03)",
                    color: activeTab === tab.id ? "#c4b5fd" : "#94a3b8",
                    fontSize: 12,
                    fontWeight: activeTab === tab.id ? 600 : 400,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ──── ACTIVE COMPONENT ──── */}
      <div style={{ padding: 24 }}>
        {ActiveComponent ? (
          <ActiveComponent />
        ) : (
          <div style={{ color: "#64748b", textAlign: "center", padding: 40 }}>
            Selecciona un prototipo
          </div>
        )}
      </div>

      {/* ──── FOOTER ──── */}
      <div
        style={{
          padding: "12px 24px",
          borderTop: "1px solid rgba(255,255,255,0.04)",
          fontSize: 11,
          color: "#334155",
          textAlign: "center",
        }}
      >
        Prototipos de visualización · Datos demo · RockstarData 2026
      </div>
    </div>
  );
}
