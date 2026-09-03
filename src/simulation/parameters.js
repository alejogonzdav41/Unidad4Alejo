export const DRAGON_COUNT = 8;

// Cada personalidad comparte timbre, color y una desviación rítmica particular.
export const PERSONALITIES = [
  // Timbres sintéticos suaves, inspirados en instrumentos acústicos.
  { name: 'Brasa', instrument: 'cuerdas cálidas', color: '#ff7657', accent: '#ffd166', wave: 'triangle', note: 146.83, filterHz: 620, vibrato: 0.012, offset: -0.11 },
  { name: 'Niebla', instrument: 'flauta de aire', color: '#8f9dff', accent: '#dce3ff', wave: 'sine', note: 220.0, filterHz: 1250, vibrato: 0.009, offset: -0.035 },
  { name: 'Aurora', instrument: 'marimba suave', color: '#a7e66e', accent: '#ecffc9', wave: 'triangle', note: 293.66, filterHz: 920, vibrato: 0.016, offset: 0.04 },
  { name: 'Éter', instrument: 'pad celestial', color: '#d88cf5', accent: '#ffe2ff', wave: 'sine', note: 369.99, filterHz: 780, vibrato: 0.007, offset: 0.115 }
];

export const DEFAULTS = {
  coupling: 1.2,
  naturalFrequency: 0.42,
  frequencySpread: 0.16
};

// Estado inicial centralizado del modelo. createSimulation crea una copia para
// que el motor conserve una única fuente de verdad durante la experiencia.
export const MODEL_PARAMETERS = { ...DEFAULTS };
