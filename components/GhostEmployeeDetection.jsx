import { useState, useMemo } from "react";

// ═══════════════════════════════════════════════════════
// DATA — Employees across 3 data sources
// ═══════════════════════════════════════════════════════

const LOCATIONS = ["Pamplona", "Bilbao", "Burgos", "San Sebastián", "Vitoria", "Zaragoza"];

const EMPLOYEES = [
  // ── PAMPLONA ──
  // Ghost employee: on payroll, zero clocks, zero POS
  {
    id: "e01", name: "Marcos Ruiz P.", location: "Pamplona", contract: "Tiempo completo", role: "Camarero",
    grossPay: 1680, netPay: 1340, contractHours: 160, payrollActive: true,
    clockIns: 0, clockedHours: 0, avgEntryTime: null, avgExitTime: null,
    posTransactions: 0, posSales: 0, posHoursActive: 0, lastPosActivity: null,
    manager: "Roberto G.", hiredDate: "2025-09-15", lastPayroll: "2026-02-01",
    notes: "Alta en nómina sept 2025. Sin registro en fichaje ni POS desde entonces.",
  },
  // Buddy punching suspect: clocks in but zero POS activity
  {
    id: "e02", name: "Adrián Sanz M.", location: "Pamplona", contract: "Tiempo parcial", role: "Ayudante cocina",
    grossPay: 920, netPay: 735, contractHours: 80, payrollActive: true,
    clockIns: 14, clockedHours: 68, avgEntryTime: "22:15", avgExitTime: "03:45",
    posTransactions: 0, posSales: 0, posHoursActive: 0, lastPosActivity: null,
    manager: "Roberto G.", hiredDate: "2025-11-01", lastPayroll: "2026-02-01",
    notes: "Ficha regularmente en turno noche pero 0 transacciones en POS. Puesto de cocina — verificar si rol requiere acceso a POS.",
  },
  // Anomalous hours: clocks significantly more than contract
  {
    id: "e03", name: "Laura Vega S.", location: "Pamplona", contract: "Tiempo parcial", role: "Camarera",
    grossPay: 1450, netPay: 1160, contractHours: 80, payrollActive: true,
    clockIns: 22, clockedHours: 142, avgEntryTime: "17:30", avgExitTime: "01:15",
    posTransactions: 89, posSales: 2840, posHoursActive: 78, lastPosActivity: "2026-02-25",
    manager: "Roberto G.", hiredDate: "2025-06-20", lastPayroll: "2026-02-01",
    notes: "Contrato 80h pero ficha 142h. Horas complementarias 77.5% sobre contrato (límite legal 60%).",
  },
  // Normal employee
  {
    id: "e04", name: "María López D.", location: "Pamplona", contract: "Tiempo completo", role: "Camarera",
    grossPay: 1720, netPay: 1375, contractHours: 160, payrollActive: true,
    clockIns: 22, clockedHours: 164, avgEntryTime: "09:00", avgExitTime: "17:15",
    posTransactions: 480, posSales: 13200, posHoursActive: 158, lastPosActivity: "2026-02-26",
    manager: "Patricia E.", hiredDate: "2024-03-10", lastPayroll: "2026-02-01",
    notes: "",
  },
  // Normal employee
  {
    id: "e05", name: "Carlos Mendoza R.", location: "Pamplona", contract: "Tiempo completo", role: "Camarero",
    grossPay: 1680, netPay: 1340, contractHours: 160, payrollActive: true,
    clockIns: 21, clockedHours: 158, avgEntryTime: "16:00", avgExitTime: "00:15",
    posTransactions: 390, posSales: 11700, posHoursActive: 152, lastPosActivity: "2026-02-26",
    manager: "Patricia E.", hiredDate: "2024-08-05", lastPayroll: "2026-02-01",
    notes: "",
  },

  // ── BILBAO ──
  // Normal employees
  {
    id: "e06", name: "Iñaki Gorostiza A.", location: "Bilbao", contract: "Tiempo completo", role: "Camarero",
    grossPay: 1720, netPay: 1375, contractHours: 160, payrollActive: true,
    clockIns: 22, clockedHours: 162, avgEntryTime: "15:45", avgExitTime: "00:00",
    posTransactions: 470, posSales: 12850, posHoursActive: 156, lastPosActivity: "2026-02-26",
    manager: "Leire S.", hiredDate: "2023-11-15", lastPayroll: "2026-02-01",
    notes: "",
  },
  {
    id: "e07", name: "Leire Santamaría B.", location: "Bilbao", contract: "Tiempo completo", role: "Encargada",
    grossPay: 2100, netPay: 1680, contractHours: 160, payrollActive: true,
    clockIns: 23, clockedHours: 170, avgEntryTime: "17:00", avgExitTime: "01:30",
    posTransactions: 520, posSales: 15600, posHoursActive: 165, lastPosActivity: "2026-02-26",
    manager: null, hiredDate: "2022-04-20", lastPayroll: "2026-02-01",
    notes: "",
  },
  {
    id: "e08", name: "Mikel Aguirre Z.", location: "Bilbao", contract: "Tiempo completo", role: "Camarero",
    grossPay: 1680, netPay: 1340, contractHours: 160, payrollActive: true,
    clockIns: 20, clockedHours: 148, avgEntryTime: "08:30", avgExitTime: "16:30",
    posTransactions: 410, posSales: 10250, posHoursActive: 142, lastPosActivity: "2026-02-25",
    manager: "Leire S.", hiredDate: "2024-01-10", lastPayroll: "2026-02-01",
    notes: "",
  },

  // ── BURGOS ──
  // Suspect: on payroll, sporadic clock-ins, minimal POS
  {
    id: "e09", name: "Óscar Nieto L.", location: "Burgos", contract: "Tiempo parcial", role: "Camarero",
    grossPay: 840, netPay: 672, contractHours: 80, payrollActive: true,
    clockIns: 4, clockedHours: 18, avgEntryTime: "21:00", avgExitTime: "02:30",
    posTransactions: 12, posSales: 340, posHoursActive: 8, lastPosActivity: "2026-02-14",
    manager: "Sara T.", hiredDate: "2025-10-01", lastPayroll: "2026-02-01",
    notes: "Contrato 80h, ficha solo 18h, POS activo 8h. Cobra nómina completa. Último fichaje hace 12 días.",
  },
  // Normal
  {
    id: "e10", name: "Diego Fernández Q.", location: "Burgos", contract: "Tiempo completo", role: "Camarero",
    grossPay: 1680, netPay: 1340, contractHours: 160, payrollActive: true,
    clockIns: 22, clockedHours: 168, avgEntryTime: "20:00", avgExitTime: "04:00",
    posTransactions: 360, posSales: 10800, posHoursActive: 160, lastPosActivity: "2026-02-26",
    manager: "Sara T.", hiredDate: "2024-05-15", lastPayroll: "2026-02-01",
    notes: "",
  },
  {
    id: "e11", name: "Lucía Vargas C.", location: "Burgos", contract: "Tiempo completo", role: "Camarera",
    grossPay: 1720, netPay: 1375, contractHours: 160, payrollActive: true,
    clockIns: 21, clockedHours: 155, avgEntryTime: "14:00", avgExitTime: "22:15",
    posTransactions: 490, posSales: 13700, posHoursActive: 150, lastPosActivity: "2026-02-26",
    manager: "Sara T.", hiredDate: "2023-09-01", lastPayroll: "2026-02-01",
    notes: "",
  },

  // ── VITORIA ──
  // Payroll but recently terminated — still getting paid
  {
    id: "e12", name: "Álvaro Díaz J.", location: "Vitoria", contract: "Tiempo completo", role: "Camarero",
    grossPay: 1680, netPay: 1340, contractHours: 160, payrollActive: true,
    clockIns: 0, clockedHours: 0, avgEntryTime: null, avgExitTime: null,
    posTransactions: 0, posSales: 0, posHoursActive: 0, lastPosActivity: "2025-12-18",
    manager: "Gorka E.", hiredDate: "2024-02-01", lastPayroll: "2026-02-01",
    notes: "Último fichaje y última actividad POS en dic 2025. Sigue en nómina feb 2026. ¿Baja no tramitada o empleado fantasma?",
  },
  // Normal
  {
    id: "e13", name: "Aitor Domínguez F.", location: "Vitoria", contract: "Tiempo completo", role: "Camarero",
    grossPay: 1720, netPay: 1375, contractHours: 160, payrollActive: true,
    clockIns: 22, clockedHours: 160, avgEntryTime: "15:30", avgExitTime: "23:45",
    posTransactions: 420, posSales: 11760, posHoursActive: 155, lastPosActivity: "2026-02-26",
    manager: "Gorka E.", hiredDate: "2023-12-01", lastPayroll: "2026-02-01",
    notes: "",
  },
  {
    id: "e14", name: "Marta Herrero K.", location: "Vitoria", contract: "Tiempo completo", role: "Camarera",
    grossPay: 1680, netPay: 1340, contractHours: 160, payrollActive: true,
    clockIns: 21, clockedHours: 156, avgEntryTime: "19:00", avgExitTime: "03:00",
    posTransactions: 450, posSales: 12600, posHoursActive: 150, lastPosActivity: "2026-02-26",
    manager: "Gorka E.", hiredDate: "2024-06-15", lastPayroll: "2026-02-01",
    notes: "",
  },

  // ── ZARAGOZA ──
  // Normal employees
  {
    id: "e15", name: "Raúl Campos T.", location: "Zaragoza", contract: "Tiempo completo", role: "Camarero",
    grossPay: 1680, netPay: 1340, contractHours: 160, payrollActive: true,
    clockIns: 22, clockedHours: 162, avgEntryTime: "14:30", avgExitTime: "22:45",
    posTransactions: 460, posSales: 12200, posHoursActive: 158, lastPosActivity: "2026-02-26",
    manager: "Tomás W.", hiredDate: "2024-04-01", lastPayroll: "2026-02-01",
    notes: "",
  },
  {
    id: "e16", name: "Elena Jiménez V.", location: "Zaragoza", contract: "Tiempo parcial", role: "Camarera",
    grossPay: 890, netPay: 712, contractHours: 80, payrollActive: true,
    clockIns: 12, clockedHours: 76, avgEntryTime: "08:00", avgExitTime: "14:00",
    posTransactions: 280, posSales: 5600, posHoursActive: 72, lastPosActivity: "2026-02-26",
    manager: "Tomás W.", hiredDate: "2025-01-15", lastPayroll: "2026-02-01",
    notes: "",
  },
];

// ═══════════════════════════════════════════════════════
// DETECTION ENGINE
// ═══════════════════════════════════════════════════════
function detectFlags(emp) {
  const flags = [];
  const costPerMonth = emp.grossPay;

  // GHOST: On payroll, zero clocks, zero POS
  if (emp.payrollActive && emp.clockIns === 0 && emp.posTransactions === 0) {
    flags.push({
      type: "ghost",
      severity: "critical",
      icon: "👻",
      title: "Posible empleado fantasma",
      detail: `En nómina (€${costPerMonth}/mes) sin fichajes ni actividad POS en los últimos 30 días.`,
      sources: ["Nómina", "Fichaje", "POS"],
      annualCost: costPerMonth * 12,
    });
  }

  // BUDDY PUNCHING: Clocks in, zero POS (non-kitchen roles)
  if (emp.clockIns > 5 && emp.posTransactions === 0 && !emp.role.toLowerCase().includes("cocina") && !emp.role.toLowerCase().includes("ayudante")) {
    flags.push({
      type: "buddy",
      severity: "critical",
      icon: "🤝",
      title: "Buddy punching sospechado",
      detail: `${emp.clockIns} fichajes registrados pero 0 transacciones en POS. Alguien ficha por esta persona.`,
      sources: ["Fichaje", "POS"],
      annualCost: costPerMonth * 12,
    });
  }

  // BUDDY PUNCHING: Kitchen role — informational only
  if (emp.clockIns > 5 && emp.posTransactions === 0 && (emp.role.toLowerCase().includes("cocina") || emp.role.toLowerCase().includes("ayudante"))) {
    flags.push({
      type: "kitchen_no_pos",
      severity: "info",
      icon: "🍳",
      title: "Sin POS — Rol de cocina",
      detail: `Ficha pero sin actividad POS. Normal para rol de cocina. Verificar presencia física con encargado.`,
      sources: ["Fichaje", "POS"],
      annualCost: 0,
    });
  }

  // SPORADIC: Very few clock-ins relative to contract
  if (emp.payrollActive && emp.clockIns > 0 && emp.clockIns < 10 && emp.clockedHours < emp.contractHours * 0.4) {
    flags.push({
      type: "sporadic",
      severity: "elevated",
      icon: "📉",
      title: "Asistencia esporádica",
      detail: `Solo ${emp.clockIns} fichajes (${emp.clockedHours}h de ${emp.contractHours}h contratadas). Cobra nómina completa.`,
      sources: ["Nómina", "Fichaje"],
      annualCost: Math.round((1 - emp.clockedHours / emp.contractHours) * costPerMonth * 12),
    });
  }

  // OVERTIME ABUSE: Hours significantly above contract (partial contracts)
  if (emp.contract === "Tiempo parcial" && emp.clockedHours > emp.contractHours * 1.6) {
    const overPct = Math.round(((emp.clockedHours - emp.contractHours) / emp.contractHours) * 100);
    flags.push({
      type: "overtime",
      severity: "elevated",
      icon: "⏰",
      title: "Horas complementarias excesivas",
      detail: `${emp.clockedHours}h fichadas sobre ${emp.contractHours}h contratadas (+${overPct}%). Límite legal 60% con pacto.`,
      sources: ["Nómina", "Fichaje"],
      annualCost: 0,
    });
  }

  // STALE: Last POS activity long ago but still on payroll
  if (emp.payrollActive && emp.lastPosActivity && emp.lastPosActivity < "2026-01-01" && emp.clockIns === 0) {
    flags.push({
      type: "stale",
      severity: "critical",
      icon: "📅",
      title: "Inactivo desde " + emp.lastPosActivity.split("-").reverse().join("/"),
      detail: `Última actividad hace más de 60 días. Sigue en nómina. ¿Baja no tramitada?`,
      sources: ["Nómina", "POS"],
      annualCost: costPerMonth * 12,
    });
  }

  // POS-HOURS GAP: Clocked hours >> POS active hours (non-kitchen)
  if (emp.clockedHours > 40 && emp.posHoursActive > 0 && emp.posHoursActive < emp.clockedHours * 0.6 && !emp.role.toLowerCase().includes("cocina")) {
    flags.push({
      type: "pos_gap",
      severity: "moderate",
      icon: "🕳️",
      title: "Brecha fichaje vs actividad POS",
      detail: `Ficha ${emp.clockedHours}h pero solo ${emp.posHoursActive}h de actividad en POS (${Math.round((emp.posHoursActive / emp.clockedHours) * 100)}%).`,
      sources: ["Fichaje", "POS"],
      annualCost: 0,
    });
  }

  return flags;
}

const SEVERITY_ORDER = { critical: 0, elevated: 1, moderate: 2, info: 3 };
const SEVERITY_CONFIG = {
  critical: { label: "Crítico", color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)" },
  elevated: { label: "Elevado", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)" },
  moderate: { label: "Moderado", color: "#3b82f6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.15)" },
  info: { label: "Info", color: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.15)" },
};

// ═══════════════════════════════════════════════════════
// SOURCE INDICATOR
// ═══════════════════════════════════════════════════════
function SourceDot({ hasData, label, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }} title={`${label}: ${hasData ? "Datos encontrados" : "Sin datos"}`}>
      <div style={{
        width: 7, height: 7, borderRadius: "50%",
        background: hasData ? color : "transparent",
        border: hasData ? "none" : `1.5px solid rgba(255,255,255,0.15)`,
      }} />
      <span style={{ fontSize: 10, color: hasData ? color : "#475569", fontWeight: 500 }}>{label}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// ACTIVITY BAR — visual comparison of expected vs actual
// ═══════════════════════════════════════════════════════
function ActivityBar({ contract, clocked, posActive, width = 180 }) {
  const max = Math.max(contract, clocked, posActive, 1);
  const scale = (v) => (v / max) * width;
  return (
    <div style={{ position: "relative", height: 28, width }}>
      {/* Contract baseline */}
      <div style={{ position: "absolute", top: 0, left: 0, width: scale(contract), height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 3 }} />
      {/* Clocked hours */}
      <div style={{ position: "absolute", top: 10, left: 0, width: scale(clocked), height: 8, background: clocked > contract * 1.1 ? "rgba(245,158,11,0.5)" : "rgba(34,197,94,0.4)", borderRadius: 3 }} />
      {/* POS active */}
      <div style={{ position: "absolute", top: 20, left: 0, width: scale(posActive), height: 8, background: posActive < clocked * 0.5 && clocked > 20 ? "rgba(239,68,68,0.5)" : "rgba(59,130,246,0.4)", borderRadius: 3 }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════
export default function GhostEmployeeDetection() {
  const [filterLoc, setFilterLoc] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [showClean, setShowClean] = useState(false);
  const [sortBy, setSortBy] = useState("severity");

  const enriched = useMemo(() => {
    return EMPLOYEES.map((emp) => ({
      ...emp,
      flags: detectFlags(emp),
      maxSeverity: (() => {
        const f = detectFlags(emp);
        if (f.length === 0) return "clean";
        return f.reduce((worst, flag) => SEVERITY_ORDER[flag.severity] < SEVERITY_ORDER[worst] ? flag.severity : worst, f[0].severity);
      })(),
    }));
  }, []);

  const filtered = useMemo(() => {
    let result = enriched;
    if (filterLoc !== "all") result = result.filter((e) => e.location === filterLoc);
    if (filterSeverity !== "all") result = result.filter((e) => e.maxSeverity === filterSeverity);
    if (!showClean) result = result.filter((e) => e.flags.length > 0);

    if (sortBy === "severity") {
      const order = { critical: 0, elevated: 1, moderate: 2, info: 3, clean: 4 };
      result.sort((a, b) => order[a.maxSeverity] - order[b.maxSeverity]);
    } else if (sortBy === "cost") {
      result.sort((a, b) => {
        const costA = a.flags.reduce((s, f) => s + (f.annualCost || 0), 0);
        const costB = b.flags.reduce((s, f) => s + (f.annualCost || 0), 0);
        return costB - costA;
      });
    } else if (sortBy === "location") {
      result.sort((a, b) => a.location.localeCompare(b.location));
    }

    return result;
  }, [enriched, filterLoc, filterSeverity, showClean, sortBy]);

  // Summary stats
  const flagged = enriched.filter((e) => e.flags.length > 0);
  const criticalCount = enriched.filter((e) => e.maxSeverity === "critical").length;
  const estimatedAnnualCost = enriched.reduce((s, e) => s + e.flags.reduce((fs, f) => fs + (f.annualCost || 0), 0), 0);
  const ghostCount = enriched.filter((e) => e.flags.some((f) => f.type === "ghost" || f.type === "stale")).length;

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: "#0c0c1d", minHeight: "100vh", color: "#e2e8f0", padding: 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* ──── HEADER ──── */}
      <div style={{ background: "linear-gradient(180deg, #12122a 0%, #0c0c1d 100%)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: "0 4px 16px rgba(239,68,68,0.25)" }}>
              👻
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>Detección de Empleados Fantasma</h1>
          </div>
          <p style={{ fontSize: 12, color: "#64748b", marginTop: 4, marginLeft: 42 }}>
            Cruce Nómina × Fichaje × POS · Todos los locales · Últimos 30 días
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {criticalCount > 0 && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "#ef4444", fontWeight: 600 }}>
              {criticalCount} caso{criticalCount > 1 ? "s" : ""} crítico{criticalCount > 1 ? "s" : ""}
            </div>
          )}
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "#94a3b8" }}>
            Feb 2026
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 28px" }}>
        {/* ──── SUMMARY CARDS ──── */}
        <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
          {[
            { label: "Empleados analizados", value: EMPLOYEES.length, icon: "👥", color: "#94a3b8" },
            { label: "Con anomalías", value: flagged.length, icon: "⚠️", color: flagged.length > 0 ? "#f59e0b" : "#22c55e" },
            { label: "Posibles fantasmas", value: ghostCount, icon: "👻", color: ghostCount > 0 ? "#ef4444" : "#22c55e" },
            { label: "Coste anual estimado", value: `€${estimatedAnnualCost.toLocaleString()}`, icon: "💸", color: estimatedAnnualCost > 0 ? "#ef4444" : "#22c55e", sub: "si no se actúa" },
          ].map((s) => (
            <div key={s.label} style={{ flex: 1, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 24 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                {s.sub && <div style={{ fontSize: 10, color: "#475569", marginTop: 1 }}>{s.sub}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* ──── FILTERS ──── */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>Local:</span>
            {["all", ...LOCATIONS].map((loc) => (
              <button key={loc} onClick={() => setFilterLoc(loc)} style={{
                padding: "4px 12px", borderRadius: 16, fontSize: 11, fontWeight: 500, cursor: "pointer",
                border: `1px solid ${filterLoc === loc ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)"}`,
                background: filterLoc === loc ? "rgba(255,255,255,0.08)" : "transparent",
                color: filterLoc === loc ? "#e2e8f0" : "#64748b",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {loc === "all" ? "Todos" : loc}
              </button>
            ))}
          </div>

          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.06)" }} />

          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>Severidad:</span>
            {["all", "critical", "elevated", "moderate"].map((sev) => (
              <button key={sev} onClick={() => setFilterSeverity(sev)} style={{
                padding: "4px 12px", borderRadius: 16, fontSize: 11, fontWeight: 500, cursor: "pointer",
                border: `1px solid ${filterSeverity === sev ? (sev !== "all" ? SEVERITY_CONFIG[sev]?.border : "rgba(255,255,255,0.2)") : "rgba(255,255,255,0.06)"}`,
                background: filterSeverity === sev ? (sev !== "all" ? SEVERITY_CONFIG[sev]?.bg : "rgba(255,255,255,0.08)") : "transparent",
                color: filterSeverity === sev ? (sev !== "all" ? SEVERITY_CONFIG[sev]?.color : "#e2e8f0") : "#64748b",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {sev === "all" ? "Todas" : SEVERITY_CONFIG[sev]?.label}
              </button>
            ))}
          </div>

          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.06)" }} />

          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>Ordenar:</span>
            {[
              { key: "severity", label: "Severidad" },
              { key: "cost", label: "Coste" },
              { key: "location", label: "Local" },
            ].map((s) => (
              <button key={s.key} onClick={() => setSortBy(s.key)} style={{
                padding: "4px 12px", borderRadius: 16, fontSize: 11, fontWeight: 500, cursor: "pointer",
                border: `1px solid ${sortBy === s.key ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)"}`,
                background: sortBy === s.key ? "rgba(255,255,255,0.08)" : "transparent",
                color: sortBy === s.key ? "#e2e8f0" : "#64748b",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {s.label}
              </button>
            ))}
          </div>

          <div style={{ marginLeft: "auto" }}>
            <button onClick={() => setShowClean(!showClean)} style={{
              padding: "4px 14px", borderRadius: 16, fontSize: 11, fontWeight: 500, cursor: "pointer",
              border: `1px solid ${showClean ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.06)"}`,
              background: showClean ? "rgba(34,197,94,0.08)" : "transparent",
              color: showClean ? "#22c55e" : "#64748b",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {showClean ? "✓ " : ""}Mostrar sin anomalías
            </button>
          </div>
        </div>

        {/* ──── EMPLOYEE TABLE ──── */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, overflow: "hidden" }}>
          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "44px 1fr 120px 90px 190px 140px 100px",
            gap: 0,
            padding: "10px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            fontSize: 10,
            fontWeight: 700,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}>
            <div></div>
            <div>Empleado</div>
            <div>Fuentes</div>
            <div style={{ textAlign: "right" }}>Nómina</div>
            <div style={{ textAlign: "center" }}>Horas: contrato / fichaje / POS</div>
            <div style={{ textAlign: "right" }}>Actividad POS</div>
            <div style={{ textAlign: "center" }}>Señales</div>
          </div>

          {/* Rows */}
          {filtered.map((emp) => {
            const isExpanded = expandedId === emp.id;
            const worstSev = emp.maxSeverity;
            const sevConf = SEVERITY_CONFIG[worstSev] || { color: "#22c55e", bg: "rgba(34,197,94,0.05)", border: "rgba(34,197,94,0.1)" };

            return (
              <div key={emp.id}>
                <div
                  onClick={() => setExpandedId(isExpanded ? null : emp.id)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "44px 1fr 120px 90px 190px 140px 100px",
                    gap: 0,
                    padding: "12px 18px",
                    borderBottom: `1px solid ${isExpanded ? sevConf.border : "rgba(255,255,255,0.03)"}`,
                    background: isExpanded ? sevConf.bg : "transparent",
                    cursor: "pointer",
                    transition: "background 0.15s",
                    alignItems: "center",
                  }}
                  onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                  onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = "transparent"; }}
                >
                  {/* Severity indicator */}
                  <div>
                    {emp.flags.length > 0 ? (
                      <div style={{
                        width: 26, height: 26, borderRadius: 7,
                        background: sevConf.bg, border: `1px solid ${sevConf.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14,
                      }}>
                        {emp.flags[0].icon}
                      </div>
                    ) : (
                      <div style={{
                        width: 26, height: 26, borderRadius: 7,
                        background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, color: "#22c55e",
                      }}>
                        ✓
                      </div>
                    )}
                  </div>

                  {/* Name + meta */}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{emp.name}</div>
                    <div style={{ fontSize: 11, color: "#64748b", display: "flex", gap: 8 }}>
                      <span>{emp.location}</span>
                      <span>·</span>
                      <span>{emp.role}</span>
                      <span>·</span>
                      <span>{emp.contract}</span>
                    </div>
                  </div>

                  {/* Source dots */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <SourceDot hasData={emp.payrollActive} label="Nóm" color="#a855f7" />
                    <SourceDot hasData={emp.clockIns > 0} label="Fich" color="#f59e0b" />
                    <SourceDot hasData={emp.posTransactions > 0} label="POS" color="#22c55e" />
                  </div>

                  {/* Payroll */}
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: emp.flags.some((f) => f.type === "ghost" || f.type === "stale") ? "#ef4444" : "#e2e8f0" }}>
                      €{emp.grossPay.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 10, color: "#475569" }}>bruto/mes</div>
                  </div>

                  {/* Activity bars */}
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <ActivityBar contract={emp.contractHours} clocked={emp.clockedHours} posActive={emp.posHoursActive} width={170} />
                  </div>

                  {/* POS activity */}
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: emp.posTransactions === 0 ? (emp.clockIns > 0 || emp.payrollActive ? "#ef4444" : "#475569") : "#e2e8f0" }}>
                      {emp.posTransactions > 0 ? `${emp.posTransactions} txns` : "0"}
                    </div>
                    <div style={{ fontSize: 10, color: "#475569" }}>
                      {emp.posTransactions > 0 ? `€${emp.posSales.toLocaleString()}` : emp.role.toLowerCase().includes("cocina") || emp.role.toLowerCase().includes("ayudante") ? "rol cocina" : "sin actividad"}
                    </div>
                  </div>

                  {/* Flags count */}
                  <div style={{ textAlign: "center" }}>
                    {emp.flags.length > 0 ? (
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700,
                        color: sevConf.color, background: sevConf.bg,
                        padding: "3px 10px", borderRadius: 6, border: `1px solid ${sevConf.border}`,
                      }}>
                        {emp.flags.length}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: "#22c55e" }}>Limpio</span>
                    )}
                  </div>
                </div>

                {/* ──── EXPANDED DETAIL ──── */}
                {isExpanded && (
                  <div style={{
                    padding: "16px 18px 16px 62px",
                    background: sevConf.bg,
                    borderBottom: `1px solid ${sevConf.border}`,
                    animation: "slideDown 0.2s ease",
                  }}>
                    <style>{`@keyframes slideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 500px; } }`}</style>

                    <div style={{ display: "flex", gap: 20 }}>
                      {/* Flags */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                          Señales detectadas
                        </div>
                        {emp.flags.map((flag, i) => {
                          const fc = SEVERITY_CONFIG[flag.severity];
                          return (
                            <div key={i} style={{
                              display: "flex", alignItems: "flex-start", gap: 12,
                              padding: "10px 14px", borderRadius: 10, marginBottom: 6,
                              background: "rgba(0,0,0,0.2)", border: `1px solid ${fc.border}`,
                            }}>
                              <span style={{ fontSize: 18, marginTop: 1 }}>{flag.icon}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                                  <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{flag.title}</span>
                                  <span style={{ fontSize: 10, fontWeight: 600, color: fc.color, background: fc.bg, padding: "2px 8px", borderRadius: 4 }}>
                                    {fc.label}
                                  </span>
                                </div>
                                <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{flag.detail}</div>
                                <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 11 }}>
                                  <div style={{ color: "#64748b" }}>
                                    Cruza: {flag.sources.map((s, j) => (
                                      <span key={j} style={{ color: "#94a3b8", fontWeight: 500 }}>{j > 0 ? " × " : ""}{s}</span>
                                    ))}
                                  </div>
                                  {flag.annualCost > 0 && (
                                    <div style={{ color: "#ef4444", fontWeight: 600 }}>
                                      Coste anual: €{flag.annualCost.toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Employee detail card */}
                      <div style={{ width: 260, flexShrink: 0 }}>
                        <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                            Ficha del empleado
                          </div>
                          {[
                            { label: "Responsable", value: emp.manager || "—" },
                            { label: "Alta", value: emp.hiredDate.split("-").reverse().join("/") },
                            { label: "Última nómina", value: emp.lastPayroll.split("-").reverse().join("/") },
                            { label: "Horario fichaje", value: emp.avgEntryTime ? `${emp.avgEntryTime}–${emp.avgExitTime}` : "Sin fichajes" },
                            { label: "Última actividad POS", value: emp.lastPosActivity ? emp.lastPosActivity.split("-").reverse().join("/") : "Nunca" },
                          ].map((row) => (
                            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
                              <span style={{ color: "#64748b" }}>{row.label}</span>
                              <span style={{ color: "#cbd5e1", fontWeight: 500, fontFamily: row.value.includes("€") || row.value.includes("/") ? "'JetBrains Mono', monospace" : "inherit" }}>
                                {row.value}
                              </span>
                            </div>
                          ))}

                          {/* Activity bar legend */}
                          <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 10 }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Horas (30 días)</div>
                            <ActivityBar contract={emp.contractHours} clocked={emp.clockedHours} posActive={emp.posHoursActive} width={220} />
                            <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 10 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <div style={{ width: 10, height: 4, borderRadius: 1, background: "rgba(255,255,255,0.08)" }} />
                                <span style={{ color: "#64748b" }}>Contrato {emp.contractHours}h</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <div style={{ width: 10, height: 4, borderRadius: 1, background: emp.clockedHours > emp.contractHours * 1.1 ? "rgba(245,158,11,0.5)" : "rgba(34,197,94,0.4)" }} />
                                <span style={{ color: "#64748b" }}>Fichaje {emp.clockedHours}h</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <div style={{ width: 10, height: 4, borderRadius: 1, background: "rgba(59,130,246,0.4)" }} />
                                <span style={{ color: "#64748b" }}>POS {emp.posHoursActive}h</span>
                              </div>
                            </div>
                          </div>

                          {emp.notes && (
                            <div style={{ marginTop: 12, padding: "8px 10px", background: "rgba(239,68,68,0.06)", borderRadius: 6, border: "1px solid rgba(239,68,68,0.1)", fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>
                              {emp.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div style={{ padding: "40px 24px", textAlign: "center", color: "#64748b", fontSize: 13 }}>
              No se encontraron empleados con los filtros seleccionados.
            </div>
          )}
        </div>

        {/* ──── METHODOLOGY NOTE ──── */}
        <div style={{ marginTop: 20, padding: "14px 20px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 12, display: "flex", gap: 14, alignItems: "flex-start" }}>
          <span style={{ fontSize: 16, marginTop: 1 }}>ℹ️</span>
          <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>
            <strong style={{ color: "#94a3b8" }}>Metodología del cruce:</strong> Para cada empleado en nómina activa, se verifican tres fuentes: registro en nómina (PayFit/Sage), fichajes en sistema de control horario (Skello), y actividad de operador en POS (transacciones, ventas, cierres). Una anomalía aparece cuando hay inconsistencia entre fuentes — por ejemplo, nómina activa pero cero fichajes, o fichajes sin actividad en POS. Los roles de cocina sin acceso a POS se marcan como informativos, no como alertas.
          </div>
        </div>
      </div>

      {/* ──── FOOTER ──── */}
      <div style={{ padding: "16px 28px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#475569" }}>
        <div>Las anomalías son señales para investigar, no acusaciones. Verificar siempre con el responsable del local.</div>
        <div>Fuentes: Nómina (PayFit/Sage) · Fichaje (Skello) · POS (CEGID/Agora/GLOP)</div>
      </div>
    </div>
  );
}
