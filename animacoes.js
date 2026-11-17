(function (raiz) {
  const MOV = {
    toque: 100, rapida: 160, base: 240, lenta: 340, comemoracao: 1100, onda: 400, contagem: 400,
    saida: 'cubic-bezier(0.22, 1, 0.36, 1)',
    entrada: 'cubic-bezier(0.4, 0, 1, 1)',
    movimento: 'cubic-bezier(0.65, 0, 0.35, 1)',
    mola: 'linear(0, 0.051 4.2%, 0.166 8.3%, 0.309 12.5%, 0.456 16.7%, 0.591 20.8%, 0.708 25%, 0.803 29.2%, 0.877 33.3%, 0.932 37.5%, 0.970 41.7%, 0.996 45.8%, 1.011 50%, 1.019 54.2%, 1.022 58.3%, 1.022 62.5%, 1.020 66.7%, 1.017 70.8%, 1.013 75%, 1.010 79.2%, 1.008 83.3%, 1.005 87.5%, 1.003 91.7%, 1.002 95.8%, 1)',
    reduzida: 120, esperaConcluidas: 350, dicaAtraso: 800, dicaDuracao: 700, dicaDistancia: 28, brilho: 500, cartao: 2500, confetes: 80, cascata: 30, cascataMax: 8,
  };

  const GESTO = { trava: 8, limite: 0.4, minimoVeloz: 0.15, velocidade: 0.5, elastico: 0.6, resistencia: 0.3 };
  function decidirGesto({ dx, dy = 0, largura, velocidade = 0 }) {
    if (Math.abs(dy) > Math.abs(dx)) return 'rolar';
    const fracao = Math.abs(dx) / largura;
    const rapido = fracao >= GESTO.minimoVeloz && Math.sign(dx) * velocidade > GESTO.velocidade;
    if (fracao >= GESTO.limite || rapido) return dx > 0 ? 'marcar' : 'excluir';
    return 'voltar';
  }
  function elastico(dx, largura) {
    const limite = largura * GESTO.elastico;
    if (Math.abs(dx) <= limite) return dx;
    return Math.sign(dx) * (limite + (Math.abs(dx) - limite) * GESTO.resistencia);
  }

  const temDom = typeof document !== 'undefined';
  function reduzido() {
    if (!temDom) return true;
    return document.documentElement.getAttribute('data-animacoes') === 'reduzidas'
      || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  const curvaMola = () => (temDom && typeof CSS !== 'undefined' && CSS.supports && CSS.supports('transition-timing-function', 'linear(0, 1)')) ? MOV.mola : MOV.saida;

  const chave = n => (n.nodeType === 1 ? (n.getAttribute('data-id') || n.getAttribute('data-chave')) : null);
  const mesmoTipo = (a, b) => a.nodeType === b.nodeType && (a.nodeType !== 1 || (a.tagName === b.tagName && !chave(a) && !chave(b)));

  function sincronizarAtributos(antigo, novo) {
    for (const a of Array.from(antigo.attributes)) if (!novo.hasAttribute(a.name)) antigo.removeAttribute(a.name);
    for (const a of Array.from(novo.attributes)) if (antigo.getAttribute(a.name) !== a.value) antigo.setAttribute(a.name, a.value);
  }
  function mesclarFilhos(pai, novoPai) {
    const novos = Array.from(novoPai.childNodes);
    const chavesNovas = new Set(novos.map(chave).filter(Boolean));
    const porChave = new Map();
    Array.from(pai.childNodes).forEach(n => {
      const k = chave(n);
      if (!k) return;
      if (chavesNovas.has(k) && !porChave.has(k)) porChave.set(k, n); else pai.removeChild(n);
    });
    novos.forEach((nn, i) => {
      const k = chave(nn);
      const atual = pai.childNodes[i] || null;
      let alvo = null;
      if (k) alvo = porChave.get(k) || null;
      else if (atual && mesmoTipo(atual, nn)) alvo = atual;
      if (!alvo) { pai.insertBefore(nn, atual); return; }
      if (alvo !== atual) pai.insertBefore(alvo, atual);
      if (alvo.nodeType === 1) mesclar(alvo, nn);
      else if (alvo.nodeValue !== nn.nodeValue) alvo.nodeValue = nn.nodeValue;
    });
    while (pai.childNodes.length > novos.length) pai.removeChild(pai.lastChild);
  }
  function mesclar(antigo, novo) {
    sincronizarAtributos(antigo, novo);
    if (antigo === document.activeElement && (antigo.tagName === 'INPUT' || antigo.tagName === 'TEXTAREA')) return;
    mesclarFilhos(antigo, novo);
  }
  function mesclarHtml(container, html) {
    const t = document.createElement('template');
    t.innerHTML = html;
    mesclarFilhos(container, t.content);
  }

  const SELETOR_FLIP = '[data-id],[data-chave]';
  function flip(container, mudar) {
    if (reduzido()) { mudar(); return; }
    const antes = new Map();
    container.querySelectorAll(SELETOR_FLIP).forEach(el => antes.set(el, el.getBoundingClientRect()));
    mudar();
    const deltas = new Map();
    container.querySelectorAll(SELETOR_FLIP).forEach(el => {
      const a = antes.get(el);
      if (!a) {
        if (!el.parentElement.closest(SELETOR_FLIP) || antes.has(el.parentElement.closest(SELETOR_FLIP))) {
          el.animate([{ opacity: 0, transform: 'scale(0.96)' }, { opacity: 1, transform: 'none' }], { duration: MOV.base, easing: MOV.saida });
        }
        return;
      }
      const b = el.getBoundingClientRect();
      const pai = el.parentElement.closest(SELETOR_FLIP);
      const dp = (pai && deltas.get(pai)) || { x: 0, y: 0 };
      const d = { x: a.left - b.left, y: a.top - b.top };
      deltas.set(el, d);
      const x = d.x - dp.x, y = d.y - dp.y;
      if (Math.abs(x) < 0.5 && Math.abs(y) < 0.5) return;
      el.animate([{ transform: `translate(${x}px, ${y}px)` }, { transform: 'none' }], { duration: MOV.lenta, easing: MOV.movimento });
    });
  }

  function contar(el) {
    const para = Number(el.getAttribute('data-contar'));
    const sufixo = el.getAttribute('data-sufixo') || '';
    const de = typeof el._mostrado === 'number' ? el._mostrado : para;
    cancelAnimationFrame(el._quadro);
    el._mostrado = para;
    if (de === para || reduzido()) { el.textContent = para + sufixo; return; }
    const t0 = performance.now();
    const passo = agora => {
      const p = Math.min(1, (agora - t0) / MOV.contagem);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(de + (para - de) * e) + sufixo;
      if (p < 1) el._quadro = requestAnimationFrame(passo);
    };
    el.textContent = de + sufixo;
    el._quadro = requestAnimationFrame(passo);
  }

  function confete(x, y, cores) {
    if (reduzido()) return;
    const c = document.createElement('canvas');
    c.className = 'confete';
    c.setAttribute('aria-hidden', 'true');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    document.body.appendChild(c);
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);
    const ps = Array.from({ length: MOV.confetes }, (_, i) => {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
      const vel = 0.35 + Math.random() * 0.55;
      return { x, y, vx: Math.cos(ang) * vel, vy: Math.sin(ang) * vel, r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.02, w: 5 + Math.random() * 4, h: 8 + Math.random() * 6, cor: cores[i % cores.length] };
    });
    const t0 = performance.now();
    let antes = t0;
    const g = 0.0012;
    const passo = agora => {
      const dt = Math.min(32, agora - antes); antes = agora;
      const p = (agora - t0) / MOV.comemoracao;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ctx.globalAlpha = p > 0.75 ? Math.max(0, (1 - p) / 0.25) : 1;
      for (const q of ps) {
        q.vy += g * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.r += q.vr * dt;
        ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.r); ctx.fillStyle = q.cor; ctx.fillRect(-q.w / 2, -q.h / 2, q.w, q.h); ctx.restore();
      }
      if (p < 1) requestAnimationFrame(passo); else c.remove();
    };
    requestAnimationFrame(passo);
  }

  function sair(el, depois) {
    if (!el || reduzido()) { depois(); return; }
    const a = el.animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(0.98)' }], { duration: MOV.rapida, easing: MOV.entrada, fill: 'forwards' });
    a.onfinish = depois;
    a.oncancel = depois;
  }

  const Animacoes = { MOV, GESTO, decidirGesto, elastico, reduzido, curvaMola, mesclar, mesclarHtml, flip, sair, contar, confete };
  if (typeof module !== 'undefined' && module.exports) module.exports = Animacoes;
  else raiz.Animacoes = Animacoes;
})(typeof globalThis !== 'undefined' ? globalThis : this);
