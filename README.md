# 🚀 RockstarData — Visor de Prototipos de Fraude

## Ejecución rápida (2 comandos)

```bash
npm install
npm run dev
```

Abre **http://localhost:3333** en tu navegador.

## Qué contiene

Proyecto Next.js standalone con **7 prototipos interactivos**:

| Tab | Componente | Descripción |
|-----|-----------|-------------|
| 🛡️ Fraud Radar | `FraudRadarChart` | Radar de riesgo por local con 6 dimensiones |
| 👻 Ghost Employees | `GhostEmployeeDetection` | Detección de empleados fantasma (nómina vs fichaje vs POS) |
| 💊 Health Score Grid | `HealthScoreGrid` | Grid de salud por local × día × turno |
| 📦 Inventory Deviations | `InventoryDeviations` | Desviaciones de inventario con drill-down por categoría |
| 👤 Manager Correlation | `ManagerCorrelationTimeline` | Timeline de correlación gerente-anomalías |
| 🔥 Performance Heatmap | `PerformanceHeatmap` | Heatmap de rendimiento por local/día/métrica |
| ↩️ Void Bubble Chart | `VoidBubbleChart` | Bubble chart de anulaciones por operador |

## Documentación incluida

- `fraud-radar-business-logic.md` — Lógica de negocio completa del radar
- `analisis-salud-operacional.md` — Auditoría UX del panel
- `catalogo-fraude-hosteleria.md` — Catálogo de patrones de fraude

## Stack

- Next.js 14 (Pages Router)
- React 18
- Recharts (para gráficos radar, barras, líneas)
- Sin Tailwind — todos los estilos son inline (prototipos autocontenidos)

## Notas

- Los componentes usan `dynamic import` con `ssr: false` para evitar problemas con recharts en servidor.
- Todos los datos son mock/demo hardcodeados en cada componente.
- Este proyecto es **solo para visualización** de prototipos, no depende del proyecto principal.
