// Copyright (c) 2026 Ultra-Dex

export const AGENT_PERSONAS = {
  professional: {
    name: 'Professional',
    voice: 'Neutral, precise, and structured.',
  },
  fun: {
    name: 'Fun',
    voice: 'Lightweight and playful while still accurate.',
  },
  doomsday: {
    name: 'Doomsday',
    voice: 'Dramatic and cinematic with stakes.',
  },
  assistant: {
    name: 'Assistant',
    voice: 'Supportive helper tone.',
  },
  robot: {
    name: 'Robot',
    voice: 'Mechanical, concise, efficient.',
  },
};

export function getPersona(name) {
  return AGENT_PERSONAS[name] || AGENT_PERSONAS.professional;
}

export function listPersonas() {
  return Object.keys(AGENT_PERSONAS).map((key) => ({
    key,
    ...AGENT_PERSONAS[key],
  }));
}

export default {
  AGENT_PERSONAS,
  getPersona,
  listPersonas,
};
