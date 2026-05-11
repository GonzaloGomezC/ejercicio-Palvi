# Dashboard Ejecutivo Palvi 📊

Un dashboard ejecutivo de ventas B2B SaaS diseñado para que jefes de ventas tomen decisiones en 5 minutos sin analizar números crudos.

---

## 📋 Resumen Ejecutivo

**Palvi** es una aplicación web moderna que transforma 11 métricas de ventas en 5 visualizaciones accionables:

### Valor principal
- **Sales Health Score**: Un número 0-100 que resume la salud operacional instantáneamente
- **Alertas automáticas**: Identifica qué está mal y por qué importa en negocio
- **KPIs de ayer**: Contexto de un vistazo con deltas vs. mes anterior
- **Funnel de conversión**: Visualiza dónde se pierden prospectos en el pipeline
- **Tendencias**: Sparklines de 4 semanas para entender si los problemas son nuevos o históricos

### Público objetivo
Jefes de ventas B2B SaaS que necesitan:
- Identificar focos de atención rápidamente
- Entender el contexto de cada métrica sin interpretación manual
- Monitorear tendencias en tiempo real

### Características clave
✅ **Sistema de scoring inteligente** con pesos por área (Pipeline, Cierre, Velocidad, Soporte, Higiene)  
✅ **Alertas contextuales** que disparan por delta de 7d vs 30d O por score de área bajo  
✅ **Gestión de nulls** robusta — no divide por cero, interpola linealmente, excluye valores inválidos  
✅ **Múltiples datasets** para pruebas A/B/C/D sin cambiar código  
✅ **Diseño responsivo** que es legible en desktop y mobile

---

## 🚀 Cómo levantar el proyecto

### Requisitos previos
- **Node.js** 16.x o superior
- **npm** 7.x o superior
- **Git**

### Instalación

```bash
# 1. Clonar el repositorio
git clone <repository-url>
cd ejercicio-Palvi

# 2. Instalar dependencias
npm install

# 3. Copiar datos de prueba
# El archivo metrics.json debe estar en /public
# (se incluye en el repositorio)

# 4. Levantar el servidor de desarrollo
npm run dev
```

### Acceder a la aplicación
```
http://localhost:5173
```

---

## 📦 Stack tecnológico

| Herramienta | Versión | Propósito |
|------------|---------|----------|
| **React** | 18.x | Framework UI |
| **TypeScript** | 5.x | Tipado estático |
| **Vite** | 5.x | Build tool / Dev server |
| **Recharts** | 2.x | Gráficos (sparklines, funnel) |
| **Tailwind CSS** | 3.x | Estilos utilitarios |

---

## 📁 Estructura del proyecto

```
ejercicio-Palvi/
├── src/
│   ├── App.tsx                    # Componente raíz, estado dataset activo
│   ├── components/
│   │   ├── ScoreHeader.tsx        # Sales Health Score + pills de área
│   │   ├── AlertPanel.tsx         # Panel de alertas máx 3
│   │   ├── KpiStrip.tsx           # 6 KPIs de ayer con delta
│   │   ├── FunnelChart.tsx        # Funnel de conversión 30d
│   │   └── SparklineGrid.tsx      # Grid 7 sparklines, 28 días
│   ├── lib/
│   │   ├── compute.ts            # Funciones puras de cálculo
│   │   │   ├── computeAvg()
│   │   │   ├── computeMetricScore()
│   │   │   ├── computeAreaScores()
│   │   │   ├── computeGeneralScore()
│   │   │   └── computeAlerts()
│   │   └── types.ts              # Tipos TypeScript compartidos
│   └── styles/
│       └── globals.css           # Configuración Tailwind
├── public/
│   └── metrics.json              # Dataset de prueba (A, B, C, D)
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── package.json
```

---

## 🎯 Especificación de funcionalidades

### HU-001: Selección de dataset (A/B/C/D)
Al cargar, el dataset **A** es activo por defecto. Cambiar dataset recalcula **todas** las métricas derivadas al instante.

### HU-002: Sistema de scoring + Alertas
**Sales Health Score** (0-100) = suma ponderada de 5 scores de área:
- 🎯 **Pipeline** (25%): leads creados, leads calificados, deals creados
- 💰 **Cierre** (30%): deals ganados, deals perdidos, win rate
- ⚡ **Velocidad** (25%): tiempo promedio respuesta, duración promedio ciclo
- 🔧 **Soporte** (10%): tickets abiertos, horas promedio resolución
- 🧹 **Higiene** (10%): deals estancados

**Alertas**: Una métrica alerta si **CUALQUIERA** es verdad:
- Promedio 7d diverge >20% de promedio 30d en dirección negativa
- Score de su área es <50

### HU-003: KPI Strip
6 métricas de **ayer** (= último día del dataset) con delta vs promedio 30d:
1. Leads creados
2. Deals ganados
3. Win rate (calculado: sum(won) / sum(won+lost) últimos 7d)
4. Tiempo promedio respuesta
5. Deals estancados
6. Tickets de soporte

### HU-004: Funnel de conversión
Etapas: Tráfico → Leads → Calificados → Deals → Ganados (últimos 30d)
Resalta el cuello de botella (tasa más baja entre etapas).

### HU-005: Sparklines
7 gráficos de tendencia (últimas 4 semanas):
- Mismas 6 del KPI strip + avg_deal_cycle_days
- Nulls interpolados linealmente
- Color verde/rojo según tendencia (últimos 7d vs primeros 7d)

---

## 🛠️ Comandos disponibles

```bash
# Desarrollo
npm run dev              # Levanta servidor a http://localhost:5173

# Build
npm run build           # Optimiza para producción (dist/)
npm run preview         # Previsualiza build local

# Linting
npm run lint            # Revisa TypeScript + ESLint
npm run format          # Formatea código (Prettier)
```

---

## 📊 Formato del dataset (metrics.json)

```json
{
  "A": {
    "metadata": {
      "metrics": [
        {
          "key": "leads_created",
          "label": "Leads creados",
          "unit": "leads",
          "direction": "higher_is_better",
          "description": "Nuevos leads generados por día"
        },
        ...
      ]
    },
    "days": [
      {
        "date": "2025-11-01",
        "metrics": {
          "leads_created": 42,
          "avg_response_time_min": 15.5,
          "stale_deals": null,
          ...
        }
      },
      ...
    ]
  },
  "B": { ... },
  "C": { ... },
  "D": { ... }
}
```

---

## ⚙️ Reglas clave de cálculo

### Promedios
```typescript
computeAvg(days: DayEntry[], key: string, from: number, to: number): number | null
// Excluye nulls, no coerciona a cero
```

### Colores de delta (dirección-aware)
- `higher_is_better`: ↑ verde (sube) / ↓ rojo (baja)
- `lower_is_better`: ↓ verde (baja) / ↑ rojo (sube)

### Score métrica
```
delta = (avg7d - avg30d) / avg30d × 100  [ajustado por direction]
score = clamp(50 + delta × 0.5, 0, 100)
```

### Semáforo score general
- 🟢 **75-100**: Operación saludable
- 🟡 **50-74**: Atención requerida
- 🔴 **0-49**: Acción urgente

---

## 🐛 Depuración

Habilita logs en consola:
```typescript
// En src/lib/compute.ts
const DEBUG = true;  // Cambia a true para ver cálculos intermedios
```

---

## 📄 Documentación de especificación

La especificación técnica y de negocio está en:
- **[historias-de-usuario-palvi.md](./historias-de-usuario-palvi.md)** — 5 HUs completas con acceptance criteria y edge cases
- **CLAUDE.md** — Instrucciones arquitectónicas para desarrolladores

---

## 📞 Soporte

Para reportar bugs o sugerencias, abre un issue en el repositorio:
- Incluye el dataset (A/B/C/D) donde ocurre el problema
- Adjunta screenshot del estado visual
- Copia de consola (F12) si hay errores

---

## 📝 Notas de desarrollo

- **Cálculos en el cliente**: Todos los KPIs, scores y alertas se calculan en JavaScript (< 50ms), sin backend. El dataset se carga una sola vez al boot.
- **Sin estado global**: Usa `useState` en App.tsx para el dataset activo. Pasa como prop a hijos. Sin Context, Redux o Zustand.
- **Nulls son normales**: Los datos reales tienen gaps. La app maneja valores null a lo largo de toda la cadena.
- **28 días para sparklines**: Recharts necesita >= 2 puntos; si hay menos de 28 días válidos, interpola y renderiza lo disponible.

---

**Versión**: 1.0  
**Última actualización**: Mayo 2026  
**Mantenedor**: Equipo Palvi
