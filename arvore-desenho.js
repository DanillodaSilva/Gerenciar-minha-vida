(function (raiz) {
  const SEMENTE = 20261120, MAX_FOLHAS = 160, TETO = [5, 15, 35, 70, 140, 250, 400, 600, 1000, 2000], LARG = 320, ALT = 360, BX = 160, BY = 287;
  function mulberry32(a) {
    return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  const sorte = (i, sal) => mulberry32(SEMENTE + i * 7919 + sal * 104729)();
  const n = v => String(Math.round(v * 10) / 10);
  const CFG = [
    { h: 0, base: 0, prof: 0, tufos: 1, raio: 7, folha: 0.62, zoom: 2.6, limite: 1 },
    { h: 46, base: 3.2, prof: 0, tufos: 1, raio: 12, folha: 0.72, zoom: 2, limite: 1 },
    { h: 84, base: 5.5, prof: 2, tufos: 3, raio: 17, folha: 0.82, zoom: 1.5, limite: 1.05 },
    { h: 116, base: 9, prof: 3, tufos: 5, raio: 23, folha: 0.9, zoom: 1.2, limite: 1.05 },
    { h: 142, base: 13, prof: 3, tufos: 7, raio: 27, folha: 0.95, zoom: 1.05, limite: 1.1 },
    { h: 160, base: 17, prof: 4, tufos: 9, raio: 29, folha: 1, zoom: 1, limite: 1.15 },
    { h: 172, base: 21, prof: 4, tufos: 11, raio: 31, folha: 1, zoom: 1, limite: 1.2 },
    { h: 176, base: 23, prof: 5, tufos: 12, raio: 32, folha: 1, zoom: 1, limite: 1.25 },
    { h: 178, base: 25, prof: 5, tufos: 13, raio: 33, folha: 1, zoom: 1, limite: 1.25 },
    { h: 180, base: 30, prof: 6, tufos: 14, raio: 34, folha: 1, zoom: 1, limite: 1.3 },
  ];
  const CEUS = { manha: ['--ceu-manha-1', '--ceu-manha-2'], tarde: ['--ceu-tarde-1', '--ceu-tarde-2'], noite: ['--ceu-noite-1', '--ceu-noite-2'] };
  const v = nome => `var(${nome})`;
  const yColina = x => { const t = x / LARG; return (1 - t) * (1 - t) * 300 + 2 * (1 - t) * t * 270 + t * t * 300; };

  function segmento(s) {
    const dx = s.x1 - s.x0, dy = s.y1 - s.y0, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
    const a0 = s.w0 / 2, a1 = s.w1 / 2, am = (a0 + a1) / 2;
    return `M${n(s.x0 + nx * a0)} ${n(s.y0 + ny * a0)}Q${n(s.cx + nx * am)} ${n(s.cy + ny * am)} ${n(s.x1 + nx * a1)} ${n(s.y1 + ny * a1)}A${n(a1)} ${n(a1)} 0 0 0 ${n(s.x1 - nx * a1)} ${n(s.y1 - ny * a1)}Q${n(s.cx - nx * am)} ${n(s.cy - ny * am)} ${n(s.x0 - nx * a0)} ${n(s.y0 - ny * a0)}Z`;
  }

  function estrutura(estagio) {
    const c = CFG[estagio], rnd = mulberry32(SEMENTE + estagio * 31), segs = [], pontas = [];
    if (estagio === 0) return { segs, pontas: [{ x: BX, y: BY - 9, ang: 0 }], c };
    const alturaTronco = estagio <= 1 ? c.h : c.h * (estagio <= 2 ? 0.5 : 0.42);
    const topo = { x: BX + (rnd() - 0.5) * 4, y: BY - alturaTronco };
    const curva = (rnd() < 0.5 ? -1 : 1) * Math.min(10, alturaTronco * 0.12);
    segs.push({ x0: BX, y0: BY + 2, x1: topo.x, y1: topo.y, cx: BX + curva, cy: BY - alturaTronco * 0.55, w0: c.base, w1: c.base * (estagio <= 2 ? 0.6 : 0.68), tronco: true });
    if (estagio === 1) return { segs, pontas: [{ x: topo.x, y: topo.y, ang: 0 }], c };
    const resto = c.h - alturaTronco, fator = 0.74;
    const l0 = resto * (1 - fator) / (1 - Math.pow(fator, c.prof)) / 0.86;
    function ramo(x, y, ang, len, w, d, lado) {
      const x1 = x + len * Math.sin(ang), y1 = y - len * Math.cos(ang);
      const torcer = (rnd() - 0.5) * len * 0.22, mx = (x + x1) / 2, my = (y + y1) / 2;
      const cx = mx + Math.cos(ang) * torcer, cy = my + Math.sin(ang) * torcer;
      const w1 = d === 0 ? Math.max(c.base * 0.15, 1) : w * 0.7;
      segs.push({ x0: x, y0: y, x1, y1, cx, cy, w0: w, w1 });
      if (d === 0) { pontas.push({ x: x1, y: y1, ang }); return; }
      const filhos = d >= 3 && rnd() < 0.3 ? 3 : 2;
      const abre = (18 + rnd() * 20) * Math.PI / 180, outro = (18 + rnd() * 20) * Math.PI / 180;
      const angs = filhos === 3 ? [ang - abre, ang + (rnd() - 0.5) * 0.2, ang + outro] : lado > 0 ? [ang - abre * 0.8, ang + outro * 1.15] : [ang - abre * 1.15, ang + outro * 0.8];
      angs.forEach((a, k) => {
        const lim = Math.max(-c.limite, Math.min(c.limite, a));
        ramo(x1, y1, lim, len * (fator + (rnd() - 0.5) * 0.12), w1 * (filhos === 3 && k === 1 ? 0.85 : 1), d - 1, -lado);
      });
    }
    const n0 = estagio >= 4 ? 3 : 2, abertura = estagio >= 6 ? 0.62 : estagio >= 4 ? 0.5 : 0.42;
    for (let k = 0; k < n0; k++) {
      const a = n0 === 3 ? [-abertura, (rnd() - 0.5) * 0.14, abertura][k] : [-abertura * 0.8, abertura * 0.8][k];
      ramo(topo.x, topo.y, a + (rnd() - 0.5) * 0.12, l0 * (n0 === 3 && k === 1 ? 1.08 : 1), c.base * 0.66 * (n0 === 3 && k === 1 ? 0.9 : 0.82), c.prof - 1, k % 2 ? 1 : -1);
    }
    return { segs, pontas, c };
  }

  function escolherTufos(est, estagio) {
    const { pontas, c } = est, T = c.tufos;
    if (pontas.length <= T) return pontas.map(p => ({ ...p }));
    const cx = pontas.reduce((s, p) => s + p.x, 0) / pontas.length, cy = Math.max(...pontas.map(p => p.y)) + 20;
    const ord = pontas.map(p => ({ ...p, a: Math.atan2(p.x - cx, cy - p.y) })).sort((a, b) => a.a - b.a);
    const res = [];
    for (let k = 0; k < T; k++) res.push(ord[Math.round(k * (ord.length - 1) / (T - 1))]);
    return res;
  }

  function folhaSvg(i, t, k, cap, tufo, c, fundo, pre) {
    const ang = k * 2.39996 + t * 1.3, r = c.raio * Math.sqrt((k + 0.5) / cap) * 0.92;
    const x = tufo.x + Math.cos(ang) * r, y = tufo.y + Math.sin(ang) * r * 0.86;
    const rot = ang * 180 / Math.PI + 90 + (sorte(i, 1) - 0.5) * 50;
    const esc = c.folha * (0.85 + sorte(i, 2) * 0.3);
    const luz = !fundo && x - tufo.x < -c.raio * 0.15 && y - tufo.y < c.raio * 0.2;
    const cor = fundo ? (sorte(i, 3) < 0.6 ? '--arvore-folha-fundo' : '--arvore-folha-1') : ['--arvore-folha-1', '--arvore-folha-2', '--arvore-folha-3'][Math.floor(sorte(i, 3) * 3)];
    return `<g class="arv-folha" data-i="${i}" transform="translate(${n(x)} ${n(y)}) rotate(${Math.round(rot)}) scale(${n(esc * 100) / 100})" fill="${v(cor)}"><use href="#${pre}-${luz ? 'fl' : 'f'}"/></g>`;
  }

  function massa(tufo, c, qtd, cap, fundo, pre, t) {
    if (qtd === 0) return '';
    const cheio = Math.sqrt(Math.min(1, qtd / cap)), r = c.raio * (0.25 + 0.5 * cheio);
    const bolas = [[0, 0, 1], [-0.62, 0.22, 0.72], [0.6, 0.18, 0.76], [-0.25, -0.5, 0.7], [0.3, -0.46, 0.66]];
    const fill = fundo ? v('--arvore-folha-fundo') : `url(#${pre}-copa)`;
    return bolas.map(([dx, dy, e], k) => `<circle cx="${n(tufo.x + dx * r)}" cy="${n(tufo.y + dy * r)}" r="${n(r * e * (0.9 + sorte(t * 5 + k, 4) * 0.2))}" fill="${fill}"/>`).join('');
  }

  function ceu(periodo, escuro, pre, rnd) {
    const noite = escuro || periodo === 'noite', [c1, c2] = CEUS[noite ? 'noite' : periodo] || CEUS.manha, p = [];
    p.push(`<rect class="arv-ceu" width="${LARG}" height="${ALT}" fill="url(#${pre}-ceu)"/>`);
    if (noite) {
      for (let k = 0; k < 12; k++) p.push(`<circle cx="${n(14 + rnd() * 292)}" cy="${n(12 + rnd() * 150)}" r="${n(0.7 + rnd() * 0.9)}" fill="${v('--ceu-estrela')}" opacity="${n(0.55 + rnd() * 0.45)}"/>`);
      p.push(`<circle cx="262" cy="56" r="26" fill="${v('--ceu-lua')}" opacity=".12"/><path d="M262 40A16 16 0 1 0 262 72A12.5 16 0 1 1 262 40Z" fill="${v('--ceu-lua')}"/>`);
    } else {
      const sx = periodo === 'tarde' ? 62 : 258, sy = periodo === 'tarde' ? 92 : 54;
      p.push(`<circle cx="${sx}" cy="${sy}" r="34" fill="${v('--ceu-sol')}" opacity=".35"/><circle cx="${sx}" cy="${sy}" r="17" fill="${v('--ceu-sol')}" opacity=".9"/>`);
      [[92, 70, 1], [218, 118, 0.8]].forEach(([x, y, e]) => p.push(`<g fill="${v('--ceu-nuvem')}" opacity=".8"><ellipse cx="${x}" cy="${y}" rx="${n(26 * e)}" ry="${n(9 * e)}"/><ellipse cx="${n(x - 10 * e)}" cy="${n(y - 6 * e)}" rx="${n(12 * e)}" ry="${n(9 * e)}"/><ellipse cx="${n(x + 8 * e)}" cy="${n(y - 8 * e)}" rx="${n(14 * e)}" ry="${n(11 * e)}"/></g>`));
    }
    return { svg: p.join(''), noite, c1, c2 };
  }

  function colina(estagio, rnd, pre) {
    const p = [`<path d="M0 286Q84 252 186 280T320 268V360H0Z" fill="${v('--arvore-colina')}" opacity=".45"/>`, `<path d="M0 300Q160 270 320 300V360H0Z" fill="url(#${pre}-colina)"/>`, `<path d="M0 300Q160 270 320 300" fill="none" stroke="${v('--arvore-colina-luz')}" stroke-width="3" opacity=".9"/>`];
    const fundo = [], frente = [];
    const tufos = 6 + Math.min(6, estagio);
    for (let k = 0; k < tufos; k++) {
      const x = 16 + (k + rnd() * 0.8) * (288 / tufos), base = yColina(x) + 2 + rnd() * 10, alt = 6 + rnd() * 6, cor = rnd() < 0.5 ? '--arvore-folha-2' : '--arvore-folha-3';
      const folhas = [-1, 0, 1].map(d => `M${n(x + d * 3 - 1.2)} ${n(base)}Q${n(x + d * 4)} ${n(base - alt * 0.6)} ${n(x + d * 5.5)} ${n(base - alt * (d ? 0.8 : 1))}Q${n(x + d * 3 + 0.6)} ${n(base - alt * 0.4)} ${n(x + d * 3 + 1.2)} ${n(base)}Z`).join('');
      (base > 302 ? frente : fundo).push(`<path d="${folhas}" fill="${v(cor)}"/>`);
    }
    if (estagio >= 4) for (let k = 0; k < Math.min(5, estagio - 2); k++) {
      const x = 30 + rnd() * 260, y = yColina(x) + 8 + rnd() * 16;
      if (Math.abs(x - BX) < 40) continue;
      frente.push(`<path d="M${n(x)} ${n(y)}V${n(y - 7)}" stroke="${v('--arvore-folha-2')}" stroke-width="1.2"/><g fill="${v(k % 2 ? '--arvore-flor' : '--arvore-flor-chao')}">${[0, 72, 144, 216, 288].map(a => `<circle cx="${n(x + Math.cos(a * Math.PI / 180) * 2)}" cy="${n(y - 8 + Math.sin(a * Math.PI / 180) * 2)}" r="1.7"/>`).join('')}</g><circle cx="${n(x)}" cy="${n(y - 8)}" r="1.2" fill="${v('--arvore-flor-miolo')}"/>`);
    }
    if (estagio >= 6) for (let k = 0; k < (estagio >= 8 ? 2 : 1); k++) {
      const x = k ? 236 : 84, y = yColina(x) + 12;
      frente.push(`<ellipse cx="${x}" cy="${n(y)}" rx="${8 - k * 2}" ry="${5 - k}" fill="${v('--arvore-pedra')}"/><ellipse cx="${x - 2}" cy="${n(y - 2)}" rx="${4 - k}" ry="2" fill="${v('--arvore-pedra-luz')}"/>`);
    }
    return { fundo: p.join('') + fundo.join(''), frente: frente.join('') };
  }

  function troncoSvg(est, estagio, rnd) {
    const { segs, c } = est, p = [];
    if (estagio >= 5) {
      [[-1, 0.9], [1, 1], [-1, 0.55], [1, 0.5]].slice(0, estagio >= 8 ? 4 : 3).forEach(([lado, e]) => {
        const comp = c.base * 1.6 * e;
        p.push(`<path d="${segmento({ x0: BX + lado * c.base * 0.2, y0: BY - 4, x1: BX + lado * (c.base * 0.5 + comp), y1: BY + 4 + e * 3, cx: BX + lado * (c.base * 0.5 + comp * 0.4), cy: BY - 1, w0: c.base * 0.42 * e, w1: 1.4 })}" fill="url(#${est.pre}-casca)"/>`);
      });
    }
    segs.forEach(s => p.push(`<path d="${segmento(s)}" fill="url(#${est.pre}-casca)"/>`));
    const t = segs[0];
    if (t && estagio >= 3) {
      const marcas = Math.min(6, estagio);
      for (let k = 0; k < marcas; k++) {
        const f = 0.15 + k * 0.6 / marcas + rnd() * 0.06, x = t.x0 + (t.x1 - t.x0) * f + (rnd() - 0.5) * t.w0 * 0.4, y = t.y0 + (t.y1 - t.y0) * f;
        p.push(`<path d="M${n(x)} ${n(y)}q${n((rnd() - 0.5) * 3)} -${n(4 + rnd() * 4)} ${n((rnd() - 0.5) * 2)} -${n(8 + rnd() * 5)}" fill="none" stroke="${v('--arvore-tronco-sombra')}" stroke-width="1.3" stroke-linecap="round" opacity=".55"/>`);
      }
    }
    if (estagio === 9) p.push(`<g fill="${v('--arvore-folha-2')}" opacity=".75"><ellipse cx="${BX - 9}" cy="${BY - 6}" rx="6" ry="3"/><ellipse cx="${BX - 5}" cy="${BY - 14}" rx="3.5" ry="2"/><ellipse cx="${BX + 8}" cy="${BY - 4}" rx="4" ry="2.2"/></g>`);
    if (estagio <= 1) p.unshift(`<ellipse cx="${BX}" cy="${BY + 3}" rx="${estagio ? 9 : 14}" ry="${estagio ? 3 : 4.5}" fill="${v('--arvore-terra')}"/>`);
    if (estagio === 0) p.push(`<ellipse cx="${BX}" cy="${BY + 4}" rx="9" ry="6.5" transform="rotate(-18 ${BX} ${BY + 4})" fill="url(#${est.pre}-casca)"/><path d="M${BX - 4} ${BY + 2}q4 -3 8 0" fill="none" stroke="${v('--arvore-tronco-luz')}" stroke-width="1.2" stroke-linecap="round" opacity=".8"/>`);
    return p.join('');
  }

  function enfeites(festa, tufos, c, noite, zoom) {
    if (!festa || !tufos.length) return { arvore: '', ceu: '', chao: '' };
    const xs = tufos.map(t => t.x), ys = tufos.map(t => t.y), esq = Math.min(...xs) - c.raio * 0.6, dir = Math.max(...xs) + c.raio * 0.6, topo = Math.min(...ys) - c.raio * 0.8, baixo = Math.max(...ys) + c.raio * 0.4;
    const meio = (esq + dir) / 2, f = k => v(`--festa-${k}`), alto = tufos.reduce((a, b) => (b.y < a.y ? b : a)), lado = tufos.reduce((a, b) => (b.x > a.x ? b : a));
    const r = { arvore: '', ceu: '', chao: '' };
    if (festa === 'natal') {
      const qtd = Math.max(8, Math.min(14, 6 + c.tufos)), pts = [];
      for (let k = 0; k < qtd; k++) { const t = k / (qtd - 1), x = esq + (dir - esq) * t, onda = Math.sin(t * Math.PI * 3) * 8; pts.push([x, baixo - (baixo - topo) * 0.35 + onda + Math.sin(t * Math.PI) * -10]); }
      const fio = 'M' + pts.map(([x, y]) => `${n(x)} ${n(y)}`).join('L');
      const grupos = '<g class="arv-luzes">' + [1, 2, 3].map(g => `<g fill="${f(g)}">${pts.filter((_, k) => k % 3 === g - 1).map(([x, y]) => `<circle cx="${n(x)}" cy="${n(y + 3)}" r="3.2"/>`).join('')}</g>`).join('') + '</g>';
      const sx = alto.x, sy = topo - 4, est = [0, 1, 2, 3, 4].map(k => { const a1 = -Math.PI / 2 + k * Math.PI * 2 / 5, a2 = a1 + Math.PI / 5; return `${n(sx + Math.cos(a1) * 11)} ${n(sy + Math.sin(a1) * 11)} ${n(sx + Math.cos(a2) * 4.6)} ${n(sy + Math.sin(a2) * 4.6)}`; }).join(' ');
      r.arvore = `<g class="arv-enfeite arv-natal"><path d="${fio}" fill="none" stroke="${v('--arvore-tronco-sombra')}" stroke-width="1.2" opacity=".7"/>${grupos}<polygon points="${est}" fill="${v('--arvore-flor-miolo')}" stroke="${v('--arvore-tronco-sombra')}" stroke-width=".8"/></g>`;
    } else if (festa === 'ano-novo') {
      r.ceu = `<g class="arv-enfeite" stroke="${v('--arvore-flor-miolo')}" stroke-width="1.6" stroke-linecap="round">${[[56, 62, 14], [150, 34, 10], [296, 150, 9]].map(([x, y, s]) => Array.from({ length: 8 }, (_, k) => { const a = k * Math.PI / 4; return `<path d="M${n(x + Math.cos(a) * s * 0.4)} ${n(y + Math.sin(a) * s * 0.4)}L${n(x + Math.cos(a) * s)} ${n(y + Math.sin(a) * s)}"/>`; }).join('')).join('')}</g>`;
    } else if (festa === 'carnaval') {
      const x = lado.x, y = lado.y + c.raio * 0.5;
      r.arvore = `<g class="arv-enfeite" fill="none" stroke-width="2.6" stroke-linecap="round"><path d="M${n(x)} ${n(y)}c6 10 -6 16 2 26s-8 14 0 24" stroke="${f(1)}"/><path d="M${n(x - 6)} ${n(y + 2)}c-6 9 6 15 -2 24s6 12 -1 20" stroke="${f(2)}"/></g>`;
    } else if (festa === 'pascoa') {
      const x = BX + 40, y = BY + 4;
      r.chao = `<g class="arv-enfeite"><ellipse cx="${n(x)}" cy="${n(y)}" rx="7" ry="9" fill="${f(1)}"/><path d="M${n(x - 7)} ${n(y)}l2.4 -2.4l2.4 2.4l2.4 -2.4l2.4 2.4l2.4 -2.4l2.4 2.4" fill="none" stroke="${f(2)}" stroke-width="1.6"/><circle cx="${n(x - 2)}" cy="${n(y - 4)}" r="1.2" fill="${f(3)}"/><circle cx="${n(x + 2.5)}" cy="${n(y + 4)}" r="1.2" fill="${f(3)}"/></g>`;
    } else if (festa === 'namorados') {
      const x = BX + 1, y = BY - Math.max(18, c.h * 0.22);
      r.arvore = `<path class="arv-enfeite" d="M${n(x)} ${n(y + 5)}C${n(x - 7)} ${n(y)} ${n(x - 4.5)} ${n(y - 6)} ${n(x)} ${n(y - 2.5)}C${n(x + 4.5)} ${n(y - 6)} ${n(x + 7)} ${n(y)} ${n(x)} ${n(y + 5)}Z" fill="${f(1)}" stroke="${v('--arvore-tronco-sombra')}" stroke-width="1.2" opacity=".9"/>`;
    } else if (festa === 'junina') {
      const ord = tufos.slice().sort((a, b) => a.x - b.x), t1 = ord[0], t2 = ord[ord.length - 1], y1 = t1.y + c.raio * 0.6, y2 = t2.y + c.raio * 0.6, mx = (t1.x + t2.x) / 2, my = Math.max(y1, y2) + 16;
      const bandeiras = Array.from({ length: 7 }, (_, k) => { const t = (k + 0.5) / 7, u = 1 - t, x = u * u * t1.x + 2 * u * t * mx + t * t * t2.x, y = u * u * y1 + 2 * u * t * my + t * t * y2; return `<path d="M${n(x - 4)} ${n(y)}h8l-4 8z" fill="${f((k % 3) + 1)}"/>`; }).join('');
      r.arvore = `<g class="arv-enfeite"><path d="M${n(t1.x)} ${n(y1)}Q${n(mx)} ${n(my)} ${n(t2.x)} ${n(y2)}" fill="none" stroke="${v('--arvore-tronco-sombra')}" stroke-width=".9"/>${bandeiras}</g>`;
    } else if (festa === 'halloween') {
      const x = BX - 42, y = BY + 3;
      r.chao = `<g class="arv-enfeite"><ellipse cx="${n(x)}" cy="${n(y)}" rx="10" ry="7.5" fill="${v('--arvore-fruto')}"/><path d="M${n(x - 4)} ${n(y - 7)}q-2 7 0 14M${n(x + 4)} ${n(y - 7)}q2 7 0 14" fill="none" stroke="${v('--arvore-tronco-sombra')}" stroke-width=".9" opacity=".5"/><path d="M${n(x)} ${n(y - 7)}q1 -4 4 -5" fill="none" stroke="${v('--arvore-folha-1')}" stroke-width="1.8" stroke-linecap="round"/></g>`;
      if (noite) r.ceu = `<path class="arv-enfeite" d="M200 92q6 -6 12 -2q2 -4 4 0q2 -4 4 0q6 -4 12 2q-6 -1 -9 4q-2 -2 -5 0q-3 -2 -5 0q-3 -5 -9 -4z" fill="${v('--arvore-olho')}"/>`;
    } else if (festa === 'aniversario') {
      const x = lado.x - c.raio * 0.2, y = lado.y - c.raio * 0.3;
      r.arvore = `<g class="arv-enfeite">${[[f(1), -6, -34], [f(2), 8, -42]].map(([cor, dx, dy]) => `<path d="M${n(x)} ${n(y)}Q${n(x + dx * 0.4)} ${n(y + dy * 0.5)} ${n(x + dx)} ${n(y + dy + 9)}" fill="none" stroke="${v('--arvore-tronco-sombra')}" stroke-width=".8"/><ellipse cx="${n(x + dx)}" cy="${n(y + dy)}" rx="6.5" ry="8" fill="${cor}"/><ellipse cx="${n(x + dx - 2)}" cy="${n(y + dy - 3)}" rx="1.6" ry="2.4" fill="${v('--arvore-brilho')}" opacity=".6"/>`).join('')}</g>`;
    }
    return r;
  }
  function gerarArvore(o) {
    const folhas = Math.max(0, Math.floor(o.folhas || 0)), estagio = Math.max(0, Math.min(9, o.estagio || 0));
    const festa = typeof o.festa === 'string' ? o.festa : null, periodo = CEUS[o.periodo] ? o.periodo : 'manha', escuro = o.tema === 'escuro', mini = o.tamanho === 'mini', pre = o.prefixo || 'av';
    const rnd = mulberry32(SEMENTE + 7), est = estrutura(estagio), c = est.c;
    est.pre = pre;
    const tufos = escolherTufos(est, estagio), T = tufos.length, cap = Math.ceil(Math.min(MAX_FOLHAS, TETO[estagio] - 1) / T), desenhadas = Math.min(folhas, MAX_FOLHAS);
    const escala = folhas > MAX_FOLHAS ? 1 + 0.25 * Math.min(1, (folhas - MAX_FOLHAS) / 840) : 1;
    const fundoDe = t => T >= 5 && t % 3 === 1;
    const porTufo = tufos.map(() => []);
    for (let i = 0; i < desenhadas; i++) { const t = i % T; porTufo[t].push(folhaSvg(i, t, Math.floor(i / T), cap, tufos[t], c, fundoDe(t), pre)); }
    const grupos = [], tras = [], frente = [];
    tufos.forEach((tf, t) => {
      const ox = tf.x - Math.sin(tf.ang) * c.raio * 0.9, oy = tf.y + Math.cos(tf.ang) * c.raio * 0.9;
      const amp = 1.5 + sorte(t, 5) * 1.5, dur = 3.2 + sorte(t, 6) * 2.3, atraso = -sorte(t, 7) * dur;
      grupos.push({ t, x: Math.round(ox), y: Math.round(oy), amp: Math.round(amp * 10) / 10, dur: Math.round(dur * 10) / 10 });
      const esc = escala !== 1 ? ` transform="translate(${n(tf.x)} ${n(tf.y)}) scale(${n(escala * 100) / 100}) translate(${n(-tf.x)} ${n(-tf.y)})"` : '';
      const g = `<g class="arv-tufo" data-t="${t}" style="--amp:${n(amp)}deg;--dur:${n(dur)}s;--atraso:${n(atraso)}s"><g class="arv-rajada"><g${esc}><g class="arv-massa">${massa(tf, c, porTufo[t].length, cap, fundoDe(t), pre, t)}</g><g class="arv-folhas-t">${porTufo[t].join('')}</g></g></g></g>`;
      (fundoDe(t) ? tras : frente).push(g);
    });
    let fundoCopa = '';
    if (estagio >= 3 && desenhadas > 0) {
      const cheio = Math.min(1, desenhadas / (cap * T)), r = c.raio * (0.55 + 0.4 * Math.sqrt(cheio)) * escala;
      const xs = tufos.map(t => t.x), ys = tufos.map(t => t.y), mx = (Math.min(...xs) + Math.max(...xs)) / 2, my = ys.reduce((a, b) => a + b, 0) / T + c.raio * 0.3;
      fundoCopa = `<g class="arv-copa-fundo" fill="${v('--arvore-folha-fundo')}">${tufos.map(t => `<circle cx="${n(t.x)}" cy="${n(t.y + c.raio * 0.15)}" r="${n(r)}"/>`).join('')}<ellipse cx="${n(mx)}" cy="${n(my)}" rx="${n((Math.max(...xs) - Math.min(...xs)) / 2 * 0.85)}" ry="${n(Math.max(r, (Math.max(...ys) - Math.min(...ys)) / 2) * 0.9)}"/></g>`;
    }
    const extras = [];
    const ft = tufos.filter((_, t) => !fundoDe(t));
    if (estagio >= 7) {
      const base = estagio === 7 ? 8 : estagio === 8 ? 14 : 20, faixa = estagio === 9 ? 4 : 6, ini = [400, 600, 1000][estagio - 7], fim = [600, 1000, 2000][estagio - 7];
      const qtd = base + Math.round(faixa * Math.min(1, Math.max(0, (folhas - ini) / (fim - ini))));
      for (let k = 0; k < qtd; k++) {
        const tf = ft[k % ft.length], a = sorte(k, 8) * Math.PI * 2, r = c.raio * (0.35 + sorte(k, 9) * 0.55) * escala, x = tf.x + Math.cos(a) * r, y = tf.y + Math.sin(a) * r * 0.86;
        extras.push(`<g class="arv-flor"><g fill="${v('--arvore-flor')}">${[0, 72, 144, 216, 288].map(g => `<circle cx="${n(x + Math.cos((g + k * 17) * Math.PI / 180) * 2.6)}" cy="${n(y + Math.sin((g + k * 17) * Math.PI / 180) * 2.6)}" r="2.3"/>`).join('')}</g><circle cx="${n(x)}" cy="${n(y)}" r="1.5" fill="${v('--arvore-flor-miolo')}"/></g>`);
      }
    }
    if (estagio >= 8) {
      const qtd = estagio === 8 ? 6 + Math.round(6 * Math.min(1, Math.max(0, (folhas - 600) / 400))) : 12 + Math.round(6 * Math.min(1, Math.max(0, (folhas - 1000) / 1000)));
      for (let k = 0; k < qtd; k++) {
        const tf = ft[(k * 5 + 2) % ft.length], a = Math.PI * (0.15 + sorte(k, 10) * 0.7), r = c.raio * (0.45 + sorte(k, 11) * 0.4) * escala, x = tf.x + Math.cos(a) * r, y = tf.y + Math.sin(a) * r * 0.86;
        extras.push(`<g class="arv-fruto"><path d="M${n(x)} ${n(y - 3.6)}l1 -2.4" stroke="${v('--arvore-tronco')}" stroke-width="1"/><circle cx="${n(x)}" cy="${n(y)}" r="4" fill="${v('--arvore-fruto')}"/><circle cx="${n(x - 1.4)}" cy="${n(y - 1.4)}" r="1.2" fill="${v('--arvore-brilho')}" opacity=".7"/></g>`);
      }
    }
    if (estagio === 1) extras.unshift(`<g fill="${v('--arvore-folha-2')}"><path d="M${n(tufos[0].x)} ${n(tufos[0].y + 10)}c-6 -1 -12 -6 -12 -12c6 0 11 5 12 12z"/><path d="M${n(tufos[0].x)} ${n(tufos[0].y + 10)}c6 -1 12 -6 12 -12c-6 0 -11 5 -12 12z" fill="${v('--arvore-folha-3')}"/></g>`);
    const larguraCopa = estagio === 0 ? 14 : Math.max(18, (Math.max(...tufos.map(t => t.x)) - Math.min(...tufos.map(t => t.x))) / 2 + c.raio);
    const sombra = `<ellipse class="arv-sombra" cx="${BX + 8}" cy="${BY + 3}" rx="${n(larguraCopa * 0.9 * (mini ? 1 : c.zoom))}" ry="${n(4 + estagio * 0.6)}" fill="${v('--arvore-sombra-chao')}" opacity=".18"/>`;
    const sk = mini ? null : ceu(periodo, escuro, pre, rnd);
    const enf = enfeites(festa, tufos, c, sk ? sk.noite : false, 1);
    const col = colina(estagio, rnd, pre);
    const seres = [];
    if (!mini && sk) {
      if (!sk.noite && estagio >= 3) seres.push(`<g class="arv-borboleta" opacity="0"><g class="arv-asa arv-asa-e"><path d="M0 0C-7 -9 -12 -3 -9 2C-7 5 -2 4 0 0Z" fill="${v('--arvore-borboleta')}"/><path d="M0 0C-5 2 -7 7 -3 7C-1 6 0 3 0 0Z" fill="${v('--arvore-borboleta-2')}"/></g><g class="arv-asa arv-asa-d"><path d="M0 0C7 -9 12 -3 9 2C7 5 2 4 0 0Z" fill="${v('--arvore-borboleta')}"/><path d="M0 0C5 2 7 7 3 7C1 6 0 3 0 0Z" fill="${v('--arvore-borboleta-2')}"/></g><ellipse rx="1" ry="4" cy="1.5" fill="${v('--arvore-tronco-sombra')}"/></g>`);
      if (!sk.noite && estagio >= 5) seres.push(`<g class="arv-passaro" opacity="0"><g class="arv-passaro-corpo"><ellipse cx="0" cy="0" rx="7" ry="5.4" fill="${v('--arvore-passaro')}"/><circle cx="5" cy="-4" r="3.8" fill="${v('--arvore-passaro')}"/><path d="M8.4 -4.4l3.4 1l-3.4 1z" fill="${v('--arvore-flor-miolo')}"/><circle cx="6" cy="-4.8" r=".9" fill="${v('--arvore-olho')}"/><path d="M-6 -1q-5 -1 -8 2q4 1 7 0z" fill="${v('--arvore-passaro-asa')}"/><path d="M-2 -1q3 4 -2 5q-4 -2 2 -5z" fill="${v('--arvore-passaro-asa')}"/></g></g>`);
      if (sk.noite && estagio >= 2) {
        const qtd = Math.max(4, Math.min(8, 20 - T - 1 - (festa === 'natal' ? 1 : 0)));
        for (let k = 0; k < qtd; k++) {
          const a = sorte(k, 12) * Math.PI * 2, x = BX + Math.cos(a) * (larguraCopa + 10 + sorte(k, 13) * 18), y = Math.min(270, BY - c.h * 0.6 + Math.sin(a) * c.h * 0.4);
          seres.push(`<g class="arv-vagalume" data-k="${k}" style="--dur:${n(2 + sorte(k, 14) * 2)}s;--atraso:${n(-sorte(k, 15) * 3)}s"><circle cx="${n(x)}" cy="${n(y)}" r="5" fill="${v('--arvore-vagalume')}" opacity=".25"/><circle cx="${n(x)}" cy="${n(y)}" r="1.6" fill="${v('--arvore-vagalume')}"/></g>`);
        }
      }
    }
    const defs = `<defs>${sk ? `<linearGradient id="${pre}-ceu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${v(sk.c1)}"/><stop offset="1" style="stop-color:${v(sk.c2)}"/></linearGradient><clipPath id="${pre}-clip"><rect width="${LARG}" height="${ALT}" rx="20"/></clipPath>` : ''}<linearGradient id="${pre}-casca" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:${v('--arvore-tronco-luz')}"/><stop offset=".45" style="stop-color:${v('--arvore-tronco')}"/><stop offset="1" style="stop-color:${v('--arvore-tronco-sombra')}"/></linearGradient><radialGradient id="${pre}-copa" cx=".34" cy=".3" r=".78"><stop offset="0" style="stop-color:${v('--arvore-folha-3')}"/><stop offset=".5" style="stop-color:${v('--arvore-folha-2')}"/><stop offset="1" style="stop-color:${v('--arvore-folha-1')}"/></radialGradient><linearGradient id="${pre}-colina" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${v('--arvore-colina-luz')}"/><stop offset=".35" style="stop-color:${v('--arvore-colina')}"/></linearGradient><g id="${pre}-f"><path d="M0 0C-4 -2.6 -4.6 -8.4 0 -13C4.6 -8.4 4 -2.6 0 0Z"/><path d="M0 -1.6V-10.4" fill="none" stroke="${v('--arvore-nervura')}" stroke-width=".9" stroke-linecap="round"/></g><g id="${pre}-fl"><use href="#${pre}-f"/><path d="M-1.3 -3C-3.1 -5 -3.2 -8.4 -1 -10.8" fill="none" stroke="${v('--arvore-folha-luz')}" stroke-width="1.3" stroke-linecap="round"/></g></defs>`;
    const zoom = mini ? 1 : c.zoom, arvore = `<g class="arv-tronco-g"${zoom !== 1 ? ` transform="translate(${BX} ${BY}) scale(${zoom}) translate(${-BX} ${-BY})"` : ''}>${fundoCopa}${tras.join('')}${troncoSvg(est, estagio, rnd)}${frente.join('')}<g class="arv-extras">${extras.join('')}</g>${enf.arvore}</g>`;
    let vb = `0 0 ${LARG} ${ALT}`;
    if (mini) {
      const topo = estagio === 0 ? BY - 26 : BY - c.h - c.raio * escala - 4, lado = Math.max(BY + 16 - topo, larguraCopa * 2 + 16);
      vb = `${n(BX - lado / 2)} ${n(BY + 16 - lado)} ${n(lado)} ${n(lado)}`;
    }
    const rotulo = o.rotulo ? `role="img" aria-label="${o.rotulo}"` : 'aria-hidden="true"';
    const corpo = mini
      ? `<ellipse cx="${BX}" cy="${BY + 6}" rx="${n(larguraCopa + 10)}" ry="10" fill="${v('--arvore-colina')}"/>${sombra}${arvore}${enf.chao}`
      : `<g clip-path="url(#${pre}-clip)">${sk.svg}${enf.ceu}${col.fundo}${sombra}${arvore}${enf.chao}${col.frente}${sk.noite && !escuro ? `<rect class="arv-noite" width="${LARG}" height="${ALT}" fill="${v('--ceu-noite-1')}" opacity=".32"/>` : ''}<g class="arv-seres">${seres.join('')}</g></g>`;
    const svg = `<svg class="arvore-viva${mini ? ' mini' : ''}" viewBox="${vb}" ${rotulo} focusable="false" data-estagio="${estagio}" data-folhas="${desenhadas}">${defs}${corpo}</svg>`;
    const pouso = ft.length ? { x: Math.round(ft[ft.length >> 1].x), y: Math.round(ft[ft.length >> 1].y - c.raio * 0.7) } : null;
    return { svg, grupos, pouso, desenhadas, noite: sk ? sk.noite : false };
  }

  const ArvoreDesenho = { gerarArvore, mulberry32, MAX_FOLHAS };
  if (typeof module !== 'undefined' && module.exports) module.exports = ArvoreDesenho;
  else raiz.ArvoreDesenho = ArvoreDesenho;
})(typeof globalThis !== 'undefined' ? globalThis : this);
