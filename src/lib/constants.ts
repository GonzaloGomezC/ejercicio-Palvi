import type { Direction } from '../types'

export const AREA_KEYS = [
  'pipeline',
  'cierre',
  'velocidad',
  'soporte',
  'higiene',
] as const

export type AreaKey = (typeof AREA_KEYS)[number]

export const AREAS: Record<
  AreaKey,
  { label: string; icon: string; weight: number; metrics: string[] }
> = {
  pipeline: {
    label: 'Pipeline',
    icon: '🎯',
    weight: 0.25,
    metrics: ['leads_created', 'leads_qualified', 'deals_created'],
  },
  cierre: {
    label: 'Cierre',
    icon: '💰',
    weight: 0.30,
    metrics: ['deals_won', 'deals_lost', 'win_rate'],
  },
  velocidad: {
    label: 'Velocidad',
    icon: '⚡',
    weight: 0.25,
    metrics: ['avg_response_time_min', 'avg_deal_cycle_days'],
  },
  soporte: {
    label: 'Soporte',
    icon: '🔧',
    weight: 0.10,
    metrics: ['support_tickets_opened', 'support_avg_resolution_hours'],
  },
  higiene: {
    label: 'Higiene',
    icon: '🧹',
    weight: 0.10,
    metrics: ['stale_deals'],
  },
}

export const METRIC_DIRECTIONS: Record<string, Direction> = {
  leads_created: 'higher_is_better',
  leads_qualified: 'higher_is_better',
  deals_created: 'higher_is_better',
  deals_won: 'higher_is_better',
  deals_lost: 'lower_is_better',
  win_rate: 'higher_is_better',
  avg_response_time_min: 'lower_is_better',
  avg_deal_cycle_days: 'lower_is_better',
  support_tickets_opened: 'lower_is_better',
  support_avg_resolution_hours: 'lower_is_better',
  stale_deals: 'lower_is_better',
}

export const METRIC_LABELS: Record<string, string> = {
  leads_created: 'Leads created',
  leads_qualified: 'Leads qualified',
  deals_created: 'Deals created',
  deals_won: 'Deals won',
  deals_lost: 'Deals lost',
  win_rate: 'Win rate',
  avg_response_time_min: 'Average response time',
  avg_deal_cycle_days: 'Average deal cycle',
  support_tickets_opened: 'Support tickets opened',
  support_avg_resolution_hours: 'Average ticket resolution',
  stale_deals: 'Stale deals',
}

export const METRIC_DESCRIPTIONS: Record<string, string> = {
  leads_created: 'Nuevos leads capturados en el día.',
  leads_qualified: 'Leads marcados como calificados por ventas en el día.',
  deals_created: 'Oportunidades de venta abiertas en el día.',
  deals_won: 'Deals cerrados como ganados en el día.',
  deals_lost: 'Deals cerrados como perdidos en el día.',
  win_rate: 'Tasa de cierre: ganados / (ganados + perdidos).',
  avg_response_time_min: 'Tiempo promedio de primera respuesta de ventas a nuevos leads, en minutos.',
  avg_deal_cycle_days: 'Para deals cerrados hoy, días promedio desde que se abrieron.',
  support_tickets_opened: 'Tickets de soporte abiertos por clientes en el día.',
  support_avg_resolution_hours: 'Horas promedio para resolver un ticket de soporte.',
  stale_deals: 'Deals abiertos con más de 60 días de antigüedad al cierre del día.',
}

export const IMPACT_MESSAGES: Record<string, string> = {
  avg_response_time_min: 'Respuesta lenta reduce conversión de leads',
  avg_deal_cycle_days: 'Ciclos largos atan capacidad del equipo',
  stale_deals: 'Deals estancados bloquean el pipeline',
  deals_lost: 'Tasa de pérdida sobre umbral histórico',
  deals_won: 'Cierres por debajo del ritmo esperado',
  leads_created: 'Captación de leads por debajo del baseline',
  leads_qualified: 'Calificación baja afecta deals futuros',
  deals_created: 'Pocas oportunidades abiertas esta semana',
  support_tickets_opened: 'Volumen de soporte inusualmente alto',
  support_avg_resolution_hours: 'Resolución lenta afecta retención',
  win_rate: 'Tasa de cierre por debajo del umbral histórico',
}
