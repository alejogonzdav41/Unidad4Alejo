const statusFor = (sync) => {
  if (sync < 0.38) return 'desorden';
  if (sync < 0.76) return 'organización parcial';
  return 'organización estable';
};

/** Construye el panel DOM; el lienzo p5 se mantiene independiente del interfaz. */
export function createLabPanel(container, callbacks) {
  container.innerHTML = `
    <div class="panel-glow"></div>
    <div class="panel-content">
      <div class="panel-heading"><span>01 / CONTROLES</span><span class="audio-dot">● sonido</span></div>
      <label>Acoplamiento <output data-output="coupling">1.20</output>
        <input data-control="coupling" type="range" min="0" max="3" step="0.01" value="1.2" />
      </label>
      <label>Ritmo natural <output data-output="naturalFrequency">0.42</output>
        <input data-control="naturalFrequency" type="range" min="0.08" max="1.2" step="0.01" value="0.42" />
      </label>
      <label>Diferencia de ritmos <output data-output="frequencySpread">0.16</output>
        <input data-control="frequencySpread" type="range" min="0" max="0.5" step="0.01" value="0.16" />
      </label>
      <div class="actions"><button data-action="chaos">Provocar caos</button><button class="primary" data-action="harmony">Armonía total</button></div>
      <div class="readout"><span>COHERENCIA GLOBAL</span><strong data-sync>0%</strong><div class="meter"><i data-meter></i></div><p data-status>desorden</p></div>
      <p class="hint">Haz clic sobre un dragón para desplazar su fase.</p>
    </div>`;

  container.querySelectorAll('[data-control]').forEach((input) => {
    input.addEventListener('input', () => {
      container.querySelector(`[data-output="${input.dataset.control}"]`).value = Number(input.value).toFixed(2);
      callbacks.change(input.dataset.control, input.value);
    });
  });
  container.querySelector('[data-action="chaos"]').addEventListener('click', callbacks.chaos);
  container.querySelector('[data-action="harmony"]').addEventListener('click', callbacks.harmony);

  return {
    update(sync, coupling) {
      container.querySelector('[data-sync]').textContent = `${Math.round(sync * 100)}%`;
      container.querySelector('[data-meter]').style.width = `${sync * 100}%`;
      container.querySelector('[data-status]').textContent = statusFor(sync);
      container.querySelector('[data-control="coupling"]').value = coupling;
      container.querySelector('[data-output="coupling"]').value = Number(coupling).toFixed(2);
    }
  };
}
