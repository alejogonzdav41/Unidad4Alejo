import { DRAGON_COUNT, MODEL_PARAMETERS, PERSONALITIES } from './parameters.js';

const wrap = (angle) => ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

/** Crea el sistema de osciladores acoplados de Kuramoto y expone sus controles. */
export function createSimulation() {
  const state = {
    ...MODEL_PARAMETERS,
    agents: [],
    synchronization: 0,
    collectivePhase: 0,
    elapsed: 0,
    turbulence: 0,
    harmonyPulse: 0
  };

  state.agents = Array.from({ length: DRAGON_COUNT }, (_, index) => {
    const personality = PERSONALITIES[Math.floor(index / 2)];
    return {
      id: index,
      personality,
      phase: Math.random() * Math.PI * 2,
      // El pequeño desvío hace posible observar la competencia entre ritmo y acoplamiento.
      variation: (Math.random() - 0.5) * 2,
      naturalFrequency: 0,
      position: { x: 0, y: 0 },
      oscillator: null,
      filter: null,
      envelope: null,
      shouldPlay: false,
      nextNoteAt: index * 0.22,
      trail: []
    };
  });

  function updateFrequencies() {
    state.agents.forEach((agent) => {
      agent.naturalFrequency = state.naturalFrequency + agent.personality.offset + agent.variation * state.frequencySpread;
    });
  }

  function calculateSynchronization() {
    const sum = state.agents.reduce(
      (total, agent) => ({ x: total.x + Math.cos(agent.phase), y: total.y + Math.sin(agent.phase) }),
      { x: 0, y: 0 }
    );
    state.synchronization = Math.hypot(sum.x, sum.y) / state.agents.length;
    state.collectivePhase = Math.atan2(sum.y, sum.x);
    return state.synchronization;
  }

  function step(deltaSeconds) {
    state.elapsed += deltaSeconds;
    state.turbulence = Math.max(0, state.turbulence - deltaSeconds * 0.12);
    state.harmonyPulse = Math.max(0, state.harmonyPulse - deltaSeconds * 0.1);
    const phases = state.agents.map((agent) => agent.phase);
    state.agents.forEach((agent, i) => {
      // dθᵢ/dt = ωᵢ + K/N Σ sin(θⱼ − θᵢ)
      const influence = phases.reduce((sum, phase) => sum + Math.sin(phase - phases[i]), 0) / phases.length;
      agent.phase = wrap(agent.phase + (agent.naturalFrequency + state.coupling * influence) * deltaSeconds);
    });
    const sync = calculateSynchronization();
    state.agents.forEach((agent) => {
      // El pulso se vuelve un poco más compacto al organizarse el colectivo.
      if (state.elapsed >= agent.nextNoteAt) {
        agent.shouldPlay = true;
        agent.nextNoteAt = state.elapsed + 1.65 - sync * 0.58 + (agent.id % 2) * 0.1;
      }
    });
    return sync;
  }

  function chaos() {
    state.agents.forEach((agent) => { agent.phase = Math.random() * Math.PI * 2; });
    state.coupling = 0.08;
    state.turbulence = 1;
    state.harmonyPulse = 0;
    return calculateSynchronization();
  }

  function harmony() {
    const sharedPhase = Math.random() * Math.PI * 2;
    state.agents.forEach((agent) => { agent.phase = sharedPhase; });
    state.coupling = Math.max(state.coupling, 2.4);
    state.harmonyPulse = 1;
    state.turbulence = 0;
    return calculateSynchronization();
  }

  function disrupt(agent) {
    agent.phase = wrap(agent.phase + Math.PI * (0.7 + Math.random() * 0.55));
    agent.shouldPlay = true;
  }

  function setParameter(name, value) {
    state[name] = Number(value);
    if (name === 'naturalFrequency' || name === 'frequencySpread') updateFrequencies();
  }

  /** Dibuja la manifestación visual de todos los osciladores/agentes. */
  function draw(p) {
    const sync = state.synchronization;
    const formation = p.constrain(p.map(sync, 0.34, 0.78, 0, 1), 0, 1);
    const centerX = p.width * 0.56;
    const centerY = p.height * 0.51;
    const background = p.lerpColor(p.color('#07101f'), p.color('#d9ecff'), formation);
    p.background(background);

    // En armonía surge una órbita luminosa común, como un único organismo.
    if (formation > 0.04) {
      p.push();
      p.translate(centerX, centerY);
      p.noFill();
      for (let ring = 0; ring < 4; ring += 1) {
        const radius = 95 + ring * 75 + Math.sin(state.elapsed * 1.5 + ring) * 7;
        p.stroke(255, 255, 255, 24 * formation + state.harmonyPulse * 20);
        p.strokeWeight(1);
        p.ellipse(0, 0, radius * 2, radius * 2);
      }
      p.noStroke();
      p.fill(255, 249, 217, 24 + state.harmonyPulse * 45);
      p.ellipse(0, 0, 170 + state.harmonyPulse * 100);
      p.pop();
    }

    state.agents.forEach((agent, index) => {
      const wildTime = state.elapsed * (1.2 + state.turbulence * 2.8);
      const chaosX = p.width * (0.1 + p.noise(index * 23.1, wildTime * 0.65) * 0.78)
        + Math.sin(wildTime * 5.6 + index * 2.1) * (14 + state.turbulence * 38);
      const chaosY = p.height * (0.15 + p.noise(80 + index * 17.4, wildTime * 0.7) * 0.7)
        + Math.cos(wildTime * 6.8 + index) * (10 + state.turbulence * 32);
      const ringAngle = (index / state.agents.length) * p.TWO_PI + state.collectivePhase * 0.7 + state.elapsed * 0.16;
      const ringRadius = 175 + (index % 2) * 38;
      const harmonyX = centerX + Math.cos(ringAngle) * ringRadius;
      const harmonyY = centerY + Math.sin(ringAngle) * ringRadius * 0.62;
      agent.position.x = p.lerp(chaosX, harmonyX, formation);
      agent.position.y = p.lerp(chaosY, harmonyY, formation);
      agent.trail.push({ x: agent.position.x, y: agent.position.y });
      if (agent.trail.length > 18) agent.trail.shift();
    });

    // Estelas: ásperas y nerviosas en caos; delicadas y enlazadas en armonía.
    state.agents.forEach((agent, index) => {
      p.noFill();
      p.stroke(agent.personality.color);
      p.strokeWeight(formation > 0.6 ? 1.2 : 2.2);
      p.beginShape();
      agent.trail.forEach((point, trailIndex) => {
        const alpha = p.map(trailIndex, 0, agent.trail.length, 0, formation > 0.6 ? 100 : 155);
        p.stroke(255, 255, 255, alpha);
        p.vertex(point.x, point.y);
      });
      p.endShape();
      if (formation > 0.64) {
        const next = state.agents[(index + 1) % state.agents.length].position;
        p.stroke(116, 155, 255, 80 * formation);
        p.line(agent.position.x, agent.position.y, next.x, next.y);
      }
    });

    state.agents.forEach((agent, index) => {

      const { x, y } = agent.position;
      const beat = (Math.sin(agent.phase) + 1) / 2;
      const size = 34 + beat * 15 + formation * 8;
      const flap = Math.sin(agent.phase * (1 + state.turbulence * 1.8)) * (0.26 + (1 - formation) * 0.72);
      p.push();
      p.translate(x, y);
      p.rotate(Math.sin(agent.phase * 0.5) * 0.14 + Math.sin(state.elapsed * 9 + index) * state.turbulence * 0.23);
      p.noStroke();
      p.fill(agent.personality.color);
      // Silueta: alas, cuerpo, cabeza y cola responden a la fase θᵢ.
      p.triangle(-size * 0.12, -size * 0.1, -size * 1.15, -size * (0.62 + flap), -size * 0.44, size * 0.38);
      p.triangle(size * 0.12, -size * 0.12, size * 1.02, -size * (0.58 - flap), size * 0.48, size * 0.34);
      p.ellipse(0, 0, size * 0.62, size * 1.12);
      p.ellipse(0, -size * 0.56, size * 0.42, size * 0.42);
      p.triangle(0, size * 0.38, -size * 0.18, size * 1.12, size * 0.2, size * 0.66);
      p.fill(agent.personality.accent);
      p.ellipse(size * 0.11, -size * 0.61, 4, 4);
      p.pop();
      p.push();
      p.textAlign(p.CENTER);
      p.textSize(10);
      p.fill(244, 246, 255, 115 + formation * 110);
      p.text(`${agent.personality.name} ${index % 2 === 0 ? 'I' : 'II'}`, x, y + size + 16);
      p.pop();
    });
  }

  updateFrequencies();
  calculateSynchronization();
  return { state, step, chaos, harmony, disrupt, setParameter, draw };
}
