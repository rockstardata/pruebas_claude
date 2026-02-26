import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
} from "recharts";

// ═══════════════════════════════════════════════════════
// DATA — Product families with theoretical vs actual stock
// ═══════════════════════════════════════════════════════

const CATEGORIES = [
  {
    id: "alcohol",
    name: "Alcohol",
    icon: "🍷",
    theoretical: 8420,
    actual: 7680,
    items: 34,
    topSupplier: "Distribuciones Navarra",
    supplierConcentration: 72,
    products: [
      { name: "Gin Hendrick's", unit: "bot", theoQty: 24, actualQty: 18, unitCost: 22.5, lastCount: "2026-02-23" },
      { name: "Vodka Absolut", unit: "bot", theoQty: 30, actualQty: 27, unitCost: 14.8, lastCount: "2026-02-23" },
      { name: "Ron Diplomático", unit: "bot", theoQty: 18, actualQty: 12, unitCost: 28.0, lastCount: "2026-02-23" },
      { name: "Vino Rioja Crianza", unit: "bot", theoQty: 48, actualQty: 45, unitCost: 8.5, lastCount: "2026-02-23" },
      { name: "Cerveza Estrella Galicia", unit: "barril", theoQty: 12, actualQty: 10, unitCost: 85.0, lastCount: "2026-02-23" },
      { name: "Whisky JB", unit: "bot", theoQty: 15, actualQty: 14, unitCost: 16.0, lastCount: "2026-02-23" },
      { name: "Cava Freixenet", unit: "bot", theoQty: 36, actualQty: 38, unitCost: 6.5, lastCount: "2026-02-23" },
    ],
  },
  {
    id: "proteinas",
    name: "Proteínas",
    icon: "🥩",
    theoretical: 12650,
    actual: 11890,
    items: 28,
    topSupplier: "Cárnicas del Norte",
    supplierConcentration: 65,
    products: [
      { name: "Solomillo de ternera", unit: "kg", theoQty: 45, actualQty: 40, unitCost: 32.0, lastCount: "2026-02-22" },
      { name: "Pechuga de pollo", unit: "kg", theoQty: 80, actualQty: 76, unitCost: 7.5, lastCount: "2026-02-22" },
      { name: "Salmón fresco", unit: "kg", theoQty: 30, actualQty: 25, unitCost: 18.5, lastCount: "2026-02-22" },
      { name: "Merluza", unit: "kg", theoQty: 25, actualQty: 23, unitCost: 14.0, lastCount: "2026-02-22" },
      { name: "Jamón ibérico", unit: "kg", theoQty: 12, actualQty: 10, unitCost: 65.0, lastCount: "2026-02-22" },
      { name: "Langostinos", unit: "kg", theoQty: 15, actualQty: 16, unitCost: 22.0, lastCount: "2026-02-22" },
    ],
  },
  {
    id: "lacteos",
    name: "Lácteos",
    icon: "🧀",
    theoretical: 3240,
    actual: 3050,
    items: 18,
    topSupplier: "Lácteas Pamplona",
    supplierConcentration: 58,
    products: [
      { name: "Queso manchego curado", unit: "kg", theoQty: 20, actualQty: 17, unitCost: 16.5, lastCount: "2026-02-24" },
      { name: "Nata para cocinar", unit: "L", theoQty: 40, actualQty: 38, unitCost: 3.2, lastCount: "2026-02-24" },
      { name: "Mantequilla", unit: "kg", theoQty: 15, actualQty: 14, unitCost: 8.5, lastCount: "2026-02-24" },
      { name: "Leche entera", unit: "L", theoQty: 120, actualQty: 118, unitCost: 0.95, lastCount: "2026-02-24" },
      { name: "Mozzarella fresca", unit: "kg", theoQty: 18, actualQty: 16, unitCost: 12.0, lastCount: "2026-02-24" },
    ],
  },
  {
    id: "verduras",
    name: "Verduras y frutas",
    icon: "🥬",
    theoretical: 4180,
    actual: 3720,
    items: 42,
    topSupplier: "Huertas del Ebro",
    supplierConcentration: 48,
    products: [
      { name: "Tomate pera", unit: "kg", theoQty: 60, actualQty: 48, unitCost: 2.8, lastCount: "2026-02-25" },
      { name: "Lechuga", unit: "ud", theoQty: 80, actualQty: 62, unitCost: 1.2, lastCount: "2026-02-25" },
      { name: "Patata", unit: "kg", theoQty: 100, actualQty: 92, unitCost: 1.5, lastCount: "2026-02-25" },
      { name: "Cebolla", unit: "kg", theoQty: 50, actualQty: 46, unitCost: 1.8, lastCount: "2026-02-25" },
      { name: "Aguacate", unit: "kg", theoQty: 25, actualQty: 18, unitCost: 5.5, lastCount: "2026-02-25" },
      { name: "Limón", unit: "kg", theoQty: 30, actualQty: 28, unitCost: 2.2, lastCount: "2026-02-25" },
      { name: "Pimiento rojo", unit: "kg", theoQty: 35, actualQty: 30, unitCost: 3.5, lastCount: "2026-02-25" },
    ],
  },
  {
    id: "panaderia",
    name: "Panadería",
    icon: "🍞",
    theoretical: 1850,
    actual: 1540,
    items: 12,
    topSupplier: "Panificadora Iruña",
    supplierConcentration: 82,
    products: [
      { name: "Pan de hogaza", unit: "ud", theoQty: 150, actualQty: 118, unitCost: 1.8, lastCount: "2026-02-25" },
      { name: "Baguette", unit: "ud", theoQty: 90, actualQty: 72, unitCost: 1.2, lastCount: "2026-02-25" },
      { name: "Pan de hamburguesa", unit: "ud", theoQty: 200, actualQty: 185, unitCost: 0.85, lastCount: "2026-02-25" },
      { name: "Croissant", unit: "ud", theoQty: 120, actualQty: 95, unitCost: 0.9, lastCount: "2026-02-25" },
    ],
  },
  {
    id: "bebidas",
    name: "Bebidas sin alcohol",
    icon: "🥤",
    theoretical: 2890,
    actual: 2810,
    items: 22,
    topSupplier: "Coca-Cola EP",
    supplierConcentration: 55,
    products: [
      { name: "Coca-Cola 33cl", unit: "ud", theoQty: 240, actualQty: 235, unitCost: 0.65, lastCount: "2026-02-24" },
      { name: "Agua mineral 50cl", unit: "ud", theoQty: 360, actualQty: 350, unitCost: 0.35, lastCount: "2026-02-24" },
      { name: "Zumo naranja", unit: "L", theoQty: 50, actualQty: 48, unitCost: 3.2, lastCount: "2026-02-24" },
      { name: "Tónica Fever-Tree", unit: "ud", theoQty: 120, actualQty: 118, unitCost: 1.4, lastCount: "2026-02-24" },
      { name: "Café en grano", unit: "kg", theoQty: 20, actualQty: 18, unitCost: 18.0, lastCount: "2026-02-24" },
    ],
  },
  {
    id: "secos",
    name: "Secos y conservas",
    icon: "🫒",
    theoretical: 2430,
    actual: 2380,
    items: 35,
    topSupplier: "Makro",
    supplierConcentration: 40,
    products: [
      { name: "Aceite oliva virgen extra", unit: "L", theoQty: 40, actualQty: 38, unitCost: 8.5, lastCount: "2026-02-20" },
      { name: "Arroz bomba", unit: "kg", theoQty: 30, actualQty: 29, unitCost: 4.2, lastCount: "2026-02-20" },
      { name: "Pasta seca", unit: "kg", theoQty: 25, actualQty: 24, unitCost: 2.8, lastCount: "2026-02-20" },
      { name: "Tomate triturado", unit: "L", theoQty: 60, actualQty: 58, unitCost: 1.5, lastCount: "2026-02-20" },
    ],
  },
];

// Historical deviation by week (last 8 weeks)
const WEEKLY_HISTORY = [
  { week: "S1 Ene", deviation: -2.1, amount: -680 },
  { week: "S2 Ene", deviation: -2.5, amount: -820 },
  { week: "S3 Ene", deviation: -1.8, amount: -590 },
  { week: "S4 Ene", deviation: -3.2, amount: -1050 },
  { week: "S1 Feb", deviation: -2.9, amount: -940 },
  { week: "S2 Feb", deviation: -3.5, amount: -1140 },
  { week: "S3 Feb", deviation: -3.8, amount: -1240 },
  { week: "S4 Feb", deviation: -4.1, amount: -1340 },
];

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════
function devPct(theo, actual) {
  if (theo === 0) return 0;
  return (((actual - theo) / theo) * 100).toFixed(1);
}

function devAmount(theo, actual) {
  return actual - theo;
}

function devColor(pct) {
  const p = parseFloat(pct);
  if (p <= -8) return "#ef4444";
  if (p <= -4) return "#f59e0b";
  if (p <= -1) return "#3b82f6";
  if (p < 1) return "#22c55e";
  return "#06b6d4"; // surplus
}

function devLabel(pct) {
  const p = parseFloat(pct);
  if (p <= -8) return "Merma crítica";
  if (p <= -4) return "Merma elevada";
  if (p <= -1) return "Merma normal";
  if (p < 1) return "OK";
  return "Sobrante";
}

function devSeverity(pct) {
  const p = parseFloat(pct);
  if (p <= -8) return "critical";
  if (p <= -4) return "elevated";
  if (p <= -1) return "normal";
  return "ok";
}

function productDev(p) {
  const theoCost = p.theoQty * p.unitCost;
  const actualCost = p.actualQty * p.unitCost;
  const qtyDiff = p.actualQty - p.theoQty;
  const costDiff = actualCost - theoCost;
  const pct = p.theoQty > 0 ? ((qtyDiff / p.theoQty) * 100).toFixed(1) : 0;
  return { ...p, theoCost, actualCost, qtyDiff, costDiff, pct };
}

// Custom tooltip
function DeviationTooltip({ active, payload }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", minWidth: 180, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 4 }}>{d.name}</div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 2 }}>
        <span style={{ color: "#64748b" }}>Desviación</span>
        <span style={{ color: devColor(d.pct), fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{d.pct > 0 ? "+" : ""}{d.pct}%</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
        <span style={{ color: "#64748b" }}>Importe</span>
        <span style={{ color: "#cbd5e1", fontFamily: "'JetBrains Mono', monospace" }}>€{Math.abs(d.devAmount).toLocaleString()}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// CATEGORY BLOCK — replaces paired bars
// ═══════════════════════════════════════════════════════
function CategoryBlock({ cat, isExpanded, onToggle, isSelected, onSelect }) {
  const pct = devPct(cat.theoretical, cat.actual);
  const diff = devAmount(cat.theoretical, cat.actual);
  const color = devColor(pct);
  const severity = devSeverity(pct);
  const barWidth = Math.min(Math.abs(parseFloat(pct)) * 8, 100);

  return (
    <div
      onClick={onSelect}
      style={{
        background: isSelected ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${isSelected ? color + "33" : "rgba(255,255,255,0.05)"}`,
        borderRadius: 12,
        padding: "14px 18px",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
    >
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>{cat.icon}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#f1f5f9" }}>{cat.name}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>{cat.items} productos</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color, lineHeight: 1 }}>
            {pct > 0 ? "+" : ""}{pct}%
          </div>
          <div style={{ fontSize: 11, color: "#64748b", fontFamily: "'JetBrains Mono', monospace" }}>
            €{Math.abs(diff).toLocaleString()} {parseFloat(pct) < 0 ? "merma" : "sobrante"}
          </div>
        </div>
      </div>

      {/* Diverging bar — deviation from zero */}
      <div style={{ position: "relative", height: 8, background: "rgba(255,255,255,0.04)", borderRadius: 4, overflow: "hidden" }}>
        {/* Center line */}
        <div style={{ position: "absolute", left: "50%", top: 0, width: 1, height: "100%", background: "rgba(255,255,255,0.1)" }} />
        {/* Deviation bar */}
        <div style={{
          position: "absolute",
          top: 0,
          height: "100%",
          borderRadius: 4,
          background: color,
          opacity: 0.6,
          transition: "width 0.5s ease",
          ...(parseFloat(pct) < 0
            ? { right: "50%", width: `${barWidth / 2}%` }
            : { left: "50%", width: `${barWidth / 2}%` }
          ),
        }} />
      </div>

      {/* Bottom row: amounts */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11 }}>
        <div style={{ display: "flex", gap: 14 }}>
          <div>
            <span style={{ color: "#475569" }}>Teórico: </span>
            <span style={{ color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>€{cat.theoretical.toLocaleString()}</span>
          </div>
          <div>
            <span style={{ color: "#475569" }}>Real: </span>
            <span style={{ color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>€{cat.actual.toLocaleString()}</span>
          </div>
        </div>
        <div>
          <span style={{ color: "#475569" }}>Proveedor principal: </span>
          <span style={{ color: cat.supplierConcentration > 70 ? "#f59e0b" : "#94a3b8", fontWeight: 500 }}>
            {cat.topSupplier} ({cat.supplierConcentration}%)
          </span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════
export default function InventoryDeviations() {
  const [selectedCat, setSelectedCat] = useState("alcohol");
  const [sortProducts, setSortProducts] = useState("deviation");
  const [viewMode, setViewMode] = useState("categories");

  const totalTheo = CATEGORIES.reduce((s, c) => s + c.theoretical, 0);
  const totalActual = CATEGORIES.reduce((s, c) => s + c.actual, 0);
  const totalDev = devPct(totalTheo, totalActual);
  const totalDiff = totalActual - totalTheo;
  const totalItems = CATEGORIES.reduce((s, c) => s + c.items, 0);
  const criticalCats = CATEGORIES.filter((c) => devSeverity(devPct(c.theoretical, c.actual)) === "critical").length;

  const selectedCatData = CATEGORIES.find((c) => c.id === selectedCat);

  const enrichedProducts = useMemo(() => {
    if (!selectedCatData) return [];
    return selectedCatData.products.map(productDev).sort((a, b) => {
      if (sortProducts === "deviation") return a.pct - b.pct;
      if (sortProducts === "cost") return a.costDiff - b.costDiff;
      return a.name.localeCompare(b.name);
    });
  }, [selectedCatData, sortProducts]);

  // Chart data for diverging bar
  const chartData = useMemo(() => {
    return CATEGORIES.map((c) => {
      const pct = parseFloat(devPct(c.theoretical, c.actual));
      return {
        name: c.name,
        icon: c.icon,
        pct,
        devAmount: Math.abs(devAmount(c.theoretical, c.actual)),
        fill: devColor(pct),
      };
    }).sort((a, b) => a.pct - b.pct);
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: "#0c0c1d", minHeight: "100vh", color: "#e2e8f0", padding: 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* ──── HEADER ──── */}
      <div style={{ background: "linear-gradient(180deg, #12122a 0%, #0c0c1d 100%)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: "0 4px 16px rgba(59,130,246,0.25)" }}>
              📦
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>Desviaciones de Inventario</h1>
          </div>
          <p style={{ fontSize: 12, color: "#64748b", marginTop: 4, marginLeft: 42 }}>
            Pamplona · Stock teórico vs real · Por familia de producto · Últimos 30 días
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {criticalCats > 0 && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "#ef4444", fontWeight: 600 }}>
              {criticalCats} familia{criticalCats > 1 ? "s" : ""} con merma crítica
            </div>
          )}
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "#94a3b8" }}>
            Feb 2026
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 28px" }}>
        {/* ──── SUMMARY ──── */}
        <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
          {[
            { label: "Desviación global", value: `${totalDev}%`, icon: "📊", color: devColor(totalDev) },
            { label: "Merma total (€)", value: `€${Math.abs(totalDiff).toLocaleString()}`, icon: "💸", color: "#ef4444" },
            { label: "Productos controlados", value: totalItems, icon: "📦", color: "#94a3b8" },
            { label: "Familias analizadas", value: CATEGORIES.length, icon: "📋", color: "#94a3b8" },
          ].map((s) => (
            <div key={s.label} style={{ flex: 1, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 22 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 20 }}>
          {/* ──── LEFT: Category overview + Diverging chart ──── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Diverging bar chart */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>Desviación por familia (%)</div>
                <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#475569" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: "#ef4444" }} />
                    Merma crítica
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: "#f59e0b" }} />
                    Merma elevada
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: "#3b82f6" }} />
                    Normal
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: "#22c55e" }} />
                    OK
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[-20, 5]}
                    tickFormatter={(v) => `${v}%`}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}
                    width={130}
                  />
                  <Tooltip content={<DeviationTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                  {/* Reference line at 0 */}
                  <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.1)" horizontalPoints={[]} verticalPoints={[0]} />
                  <Bar dataKey="pct" radius={[4, 4, 4, 4]} barSize={18}>
                    {chartData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} fillOpacity={0.7} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Trend chart */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>Evolución de la merma global</div>
                <div style={{ fontSize: 11, color: WEEKLY_HISTORY[WEEKLY_HISTORY.length - 1].deviation < WEEKLY_HISTORY[0].deviation ? "#ef4444" : "#22c55e", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  <span>↗ Tendencia creciente</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={WEEKLY_HISTORY} margin={{ left: 0, right: 10, top: 5, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} />
                  <YAxis
                    domain={[-5, 0]}
                    tickFormatter={(v) => `${v}%`}
                    axisLine={false} tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
                    width={42}
                  />
                  <Tooltip
                    contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                    formatter={(v) => [`${v}%`, "Desviación"]}
                    labelStyle={{ color: "#94a3b8" }}
                  />
                  <Line type="monotone" dataKey="deviation" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: "#ef4444", stroke: "#0c0c1d", strokeWidth: 2 }} activeDot={{ r: 5 }} />
                  {/* Threshold line at -3% */}
                  <Line type="monotone" dataKey={() => -3} stroke="rgba(245,158,11,0.3)" strokeDasharray="6 4" strokeWidth={1} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", justifyContent: "flex-end", fontSize: 10, color: "#475569", marginTop: 4 }}>
                <span>--- Umbral de atención: -3%</span>
              </div>
            </div>
          </div>

          {/* ──── RIGHT: Category cards + Product detail ──── */}
          <div style={{ width: 440, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Category cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...CATEGORIES]
                .sort((a, b) => parseFloat(devPct(a.theoretical, a.actual)) - parseFloat(devPct(b.theoretical, b.actual)))
                .map((cat) => (
                  <CategoryBlock
                    key={cat.id}
                    cat={cat}
                    isExpanded={false}
                    onToggle={() => {}}
                    isSelected={selectedCat === cat.id}
                    onSelect={() => setSelectedCat(cat.id)}
                  />
                ))}
            </div>
          </div>
        </div>

        {/* ──── PRODUCT DETAIL TABLE ──── */}
        {selectedCatData && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{selectedCatData.icon}</span>
                <div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{selectedCatData.name}</span>
                  <span style={{ fontSize: 12, color: "#64748b", marginLeft: 10 }}>Detalle por producto</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { key: "deviation", label: "Desviación" },
                  { key: "cost", label: "Coste" },
                  { key: "name", label: "Nombre" },
                ].map((s) => (
                  <button key={s.key} onClick={() => setSortProducts(s.key)} style={{
                    padding: "4px 12px", borderRadius: 16, fontSize: 11, fontWeight: 500, cursor: "pointer",
                    border: `1px solid ${sortProducts === s.key ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)"}`,
                    background: sortProducts === s.key ? "rgba(255,255,255,0.08)" : "transparent",
                    color: sortProducts === s.key ? "#e2e8f0" : "#64748b",
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, overflow: "hidden" }}>
              {/* Table header */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 90px 90px 80px 100px 130px 90px",
                padding: "10px 18px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5,
              }}>
                <div>Producto</div>
                <div style={{ textAlign: "right" }}>Teórico</div>
                <div style={{ textAlign: "right" }}>Real</div>
                <div style={{ textAlign: "right" }}>Dif.</div>
                <div style={{ textAlign: "center" }}>Desviación</div>
                <div style={{ textAlign: "right" }}>Coste desviación</div>
                <div style={{ textAlign: "right" }}>Último conteo</div>
              </div>

              {enrichedProducts.map((p) => {
                const color = devColor(p.pct);
                const barW = Math.min(Math.abs(parseFloat(p.pct)) * 3, 100);
                return (
                  <div key={p.name} style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 90px 90px 80px 100px 130px 90px",
                    padding: "10px 18px",
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                    alignItems: "center",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#e2e8f0" }}>{p.name}</span>
                    </div>
                    <div style={{ textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#94a3b8" }}>
                      {p.theoQty} {p.unit}
                    </div>
                    <div style={{ textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#e2e8f0", fontWeight: 600 }}>
                      {p.actualQty} {p.unit}
                    </div>
                    <div style={{ textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color }}>
                      {p.qtyDiff > 0 ? "+" : ""}{p.qtyDiff}
                    </div>
                    {/* Mini deviation bar */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <div style={{ width: 50, height: 6, background: "rgba(255,255,255,0.04)", borderRadius: 3, position: "relative", overflow: "hidden" }}>
                        <div style={{
                          position: "absolute", top: 0, height: "100%", borderRadius: 3, background: color, opacity: 0.7,
                          ...(parseFloat(p.pct) < 0
                            ? { right: "50%", width: `${barW / 2}%` }
                            : { left: "50%", width: `${barW / 2}%` }
                          ),
                        }} />
                        <div style={{ position: "absolute", left: "50%", top: 0, width: 1, height: "100%", background: "rgba(255,255,255,0.15)" }} />
                      </div>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color, minWidth: 36, textAlign: "right" }}>
                        {p.pct > 0 ? "+" : ""}{p.pct}%
                      </span>
                    </div>
                    <div style={{ textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: parseFloat(p.pct) < -4 ? "#ef4444" : "#94a3b8" }}>
                      {p.costDiff > 0 ? "+" : ""}€{Math.abs(p.costDiff).toFixed(0)}
                    </div>
                    <div style={{ textAlign: "right", fontSize: 11, color: "#475569" }}>
                      {p.lastCount.split("-").reverse().join("/")}
                    </div>
                  </div>
                );
              })}

              {/* Category totals */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 90px 90px 80px 100px 130px 90px",
                padding: "10px 18px",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.02)",
                fontSize: 12, fontWeight: 700,
              }}>
                <div style={{ color: "#94a3b8" }}>Total {selectedCatData.name}</div>
                <div style={{ textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: "#94a3b8" }}>
                  €{selectedCatData.theoretical.toLocaleString()}
                </div>
                <div style={{ textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: "#e2e8f0" }}>
                  €{selectedCatData.actual.toLocaleString()}
                </div>
                <div></div>
                <div style={{ textAlign: "center", fontFamily: "'JetBrains Mono', monospace", color: devColor(devPct(selectedCatData.theoretical, selectedCatData.actual)) }}>
                  {devPct(selectedCatData.theoretical, selectedCatData.actual)}%
                </div>
                <div style={{ textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: "#ef4444" }}>
                  €{Math.abs(selectedCatData.actual - selectedCatData.theoretical).toLocaleString()}
                </div>
                <div></div>
              </div>
            </div>
          </div>
        )}

        {/* ──── METHODOLOGY ──── */}
        <div style={{ marginTop: 20, padding: "14px 20px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 12, display: "flex", gap: 14, alignItems: "flex-start" }}>
          <span style={{ fontSize: 16, marginTop: 1 }}>ℹ️</span>
          <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>
            <strong style={{ color: "#94a3b8" }}>Stock teórico</strong> = Inventario inicial + Compras recibidas − Ventas registradas en POS − Consumo interno registrado.
            <strong style={{ color: "#94a3b8" }}> Stock real</strong> = Último conteo físico del sistema de inventario (TspoonLab/Gstock).
            <strong style={{ color: "#94a3b8" }}> Desviación</strong> = (Real − Teórico) / Teórico × 100. Valores negativos = merma. Incluye roturas, caducidades, consumo no registrado y posible robo.
            Umbral normal: hasta −3%. Elevado: −4% a −8%. Crítico: por debajo de −8%.
          </div>
        </div>
      </div>

      {/* ──── FOOTER ──── */}
      <div style={{ padding: "16px 28px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#475569" }}>
        <div>Desviación = (Stock real − Stock teórico) / Stock teórico · Negativo = merma · Positivo = sobrante</div>
        <div>Fuentes: POS (ventas) · Inventario (TspoonLab/Gstock) · Contabilidad (compras)</div>
      </div>
    </div>
  );
}
