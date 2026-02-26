import { useState } from "react";
import dynamic from "next/dynamic";

// Dynamic imports to avoid SSR issues with recharts
const FraudRadarChart = dynamic(() => import("../components/FraudRadarChart"), { ssr: false });
const GhostEmployeeDetection = dynamic(() => import("../components/GhostEmployeeDetection"), { ssr: false });
const HealthScoreGrid = dynamic(() => import("../components/HealthScoreGrid"), { ssr: false });
const InventoryDeviations = dynamic(() => import("../components/InventoryDeviations"), { ssr: false });
const ManagerCorrelationTimeline = dynamic(() => import("../components/ManagerCorrelationTimeline"), { ssr: false });
const PerformanceHeatmap = dynamic(() => import("../components/PerformanceHeatmap"), { ssr: false });
const VoidBubbleChart = dynamic(() => import("../components/VoidBubbleChart"), { ssr: false });

const TABS = [
  { id: "radar", label: "🛡️ Fraud Radar", component: FraudRadarChart },
  { id: "ghost", label: "👻 Ghost Employees", component: GhostEmployeeDetection },
  { id: "health", label: "💊 Health Score Grid", component: HealthScoreGrid },
  { id: "inventory", label: "📦 Inventory Deviations", component: InventoryDeviations },
  { id: "manager", label: "👤 Manager Correlation", component: ManagerCorrelationTimeline },
  { id: "heatmap", label: "🔥 Performance Heatmap", component: PerformanceHeatmap },
  { id: "voids", label: "↩️ Void Bubble Chart", component: VoidBubbleChart },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("radar");

  const ActiveComponent = TABS.find((t) => t.id === activeTab)?.component;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a1a", color: "#e2e8f0" }}>
      {/* Header */}
      <div
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, marginBottom: 4 }}>
          🚀 RockstarData — Prototipos Detección de Fraude
        </h1>
        <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
          Dashboard de visualización de prototipos · Febrero 2026
        </p>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          gap: 4,
          padding: "12px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          overflowX: "auto",
          flexWrap: "wrap",
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: activeTab === tab.id ? "1px solid rgba(139,92,246,0.4)" : "1px solid rgba(255,255,255,0.08)",
              background: activeTab === tab.id ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.03)",
              color: activeTab === tab.id ? "#c4b5fd" : "#94a3b8",
              fontSize: 13,
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

      {/* Active Component */}
      <div style={{ padding: "24px" }}>
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
}
