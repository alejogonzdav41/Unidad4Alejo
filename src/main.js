import p5 from 'p5';
import './styles.css';
import { createSimulation } from './simulation/createSimulation.js';
import { createLabPanel } from './ui/labPanel.js';

// p5.sound fue escrito para la versión global de p5. Vite usa módulos, así
// que exponemos esa misma instancia antes de importar el complemento.
window.p5 = p5;
await import('p5/lib/addons/p5.sound');

const simulation = createSimulation();
let panel;
let audioReady = false;
const PENTATONIC_SCALE = [0, 2, 4, 7, 9, 12];
const midiToFrequency = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

function startAudio(p) {
  if (audioReady) return;
  p.userStartAudio();
  simulation.state.agents.forEach((agent) => {
    agent.oscillator = new p5.Oscillator(agent.personality.wave);
    agent.oscillator.freq(agent.personality.note);
    // El filtro redondea los armónicos y evita el brillo agresivo de un synth.
    agent.filter = new p5.LowPass();
    agent.filter.freq(agent.personality.filterHz);
    agent.filter.res(1.2);
    agent.oscillator.disconnect();
    agent.oscillator.connect(agent.filter);
    agent.oscillator.pan((agent.id - 3.5) / 5);
    // Envolvente corta: el oscilador se oye como una nota, no como un drone.
    agent.envelope = new p5.Envelope();
    agent.envelope.setADSR(0.018, 0.14, 0.18, 0.5);
    agent.envelope.setRange(0.045, 0);
    agent.oscillator.amp(agent.envelope);
    agent.oscillator.start();
  });
  audioReady = true;
}

panel = createLabPanel(document.querySelector('#lab-panel'), {
  change: (name, value) => simulation.setParameter(name, value),
  chaos: () => { simulation.chaos(); },
  harmony: () => { simulation.harmony(); }
});

new p5((p) => {
  p.setup = () => {
    const wrap = document.querySelector('.canvas-wrap');
    const canvas = p.createCanvas(wrap.clientWidth, wrap.clientHeight);
    canvas.parent(wrap);
    p.pixelDensity(Math.min(window.devicePixelRatio, 2));
  };

  p.draw = () => {
    const sync = simulation.step(Math.min(p.deltaTime / 1000, 0.05));
    simulation.draw(p);
    simulation.state.agents.forEach((agent) => {
      if (agent.shouldPlay) {
        if (agent.oscillator) {
          // Escala pentatónica original: notas consonantes, sin reproducir la referencia.
          const degree = (Math.floor((Math.sin(agent.phase) + 1) * 2.6) + agent.id) % PENTATONIC_SCALE.length;
          const baseMidi = Math.round(69 + 12 * Math.log2(agent.personality.note / 440));
          const octave = agent.id % 2 === 0 ? 0 : 12;
          agent.oscillator.freq(midiToFrequency(baseMidi + PENTATONIC_SCALE[degree] + octave), 0.03);
          agent.filter.freq(agent.personality.filterHz * (0.88 + sync * 0.18), 0.08);
          agent.envelope.play(agent.oscillator);
        }
        agent.shouldPlay = false;
      }
    });
    panel.update(sync, simulation.state.coupling);
  };

  p.mousePressed = () => {
    startAudio(p);
    const hit = simulation.state.agents.find((agent) => p.dist(p.mouseX, p.mouseY, agent.position.x, agent.position.y) < 46);
    if (hit) simulation.disrupt(hit);
  };

  p.windowResized = () => {
    const wrap = document.querySelector('.canvas-wrap');
    p.resizeCanvas(wrap.clientWidth, wrap.clientHeight);
  };
});
