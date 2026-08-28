import type { Participant } from '../types'

export const participants: Participant[] = [
  {
    id: 'agent_mara_voss_itmgr3',
    initials: 'MV',
    name: 'Mara Voss',
    role: 'IT Manager III',
    team: 'Integration & Delivery',
    voice_id: 'cedar',
    voice_label: 'Cedar',
    lifecycle: 'active',
    authority_boundary: 'Final technical operating priority within delegated authority.',
    boundaries: ['Cannot alter product scope.'],
    traits: ['Methodical', 'Risk-aware'],
    journal: [],
    ai_disclosure: 'AI role simulation — not a human participant.',
  },
  {
    id: 'agent_elias_ward_pm',
    initials: 'EW',
    name: 'Elias Ward',
    role: 'Project Management Lead',
    team: 'Project Management',
    voice_id: 'marin',
    voice_label: 'Marin',
    lifecycle: 'active',
    authority_boundary: 'Recommends portfolio order and capacity.',
    boundaries: ['Cannot approve technical integration.'],
    traits: ['Structured', 'Concise'],
    journal: [],
    ai_disclosure: 'AI role simulation — not a human participant.',
  },
]
