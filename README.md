# 🚀 RockstarData — Visor de Prototipos

## Ejecución rápida

```bash
npm install
npm run dev
```

Abre **http://localhost:3333**

## Componentes incluidos (11 total)

### Detección de Fraude (5)

| Componente | Archivo original | Descripción |
|-----------|-----------------|-------------|
| 🛡️ Fraud Radar | `fraud-radar-chart.jsx` | Radar 6 dimensiones por local con comparación |
| 👻 Empleados Fantasma | `ghost-employee-detection.jsx` | Cruce nómina × fichaje × POS |
| ↩️ Anulaciones Bubble | `void-bubble-chart.jsx` | Bubble chart anulaciones por operador |
| 👤 Correlación Gerente | `manager-correlation-timeline.jsx` | Timeline 30 días gerente-anomalías |
| 📦 Desviaciones Inventario | `inventory-deviations.jsx` | Barras con drill-down por categoría |

### Salud Operacional (6)

| Componente | Archivo original | Descripción |
|-----------|-----------------|-------------|
| 💰 KPIs Caja | `kpi-cards-caja.jsx` | Cards resumen ejecutivo Caja y Ventas |
| 💊 Health Score Grid | `health-score-grid.jsx` | Grid local × día × turno con indicadores |
| 🔥 Health Heatmap Caja | `health-score-heatmap.jsx` | Heatmap salud caja y ventas |
| 🛒 Health Heatmap Compras | `compras-health-heatmap.jsx` | Heatmap salud compras |
| 📊 Performance Heatmap | `performance-heatmap.jsx` | Heatmap rendimiento multi-métrica |
| 👥 Anomalías Personal | `personnel-anomaly-grid.jsx` | Grid anomalías HR por turno |

## Stack

- Next.js 14 · React 18 · Recharts
- Estilos inline (prototipos autocontenidos)
- Todos los datos son mock
