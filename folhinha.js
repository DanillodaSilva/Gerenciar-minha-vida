(function (raiz) {
  const v = n => `var(--folhinha-${n})`;
  const PUP = v('pupila'), BOCA = v('boca');
  function svg(pre = 'fo') {
    const olho = (x, s) => `<ellipse class="fo-esclera" cx="${x}" cy="64" rx="8.5" ry="9.5" fill="${v('olho')}"/>`;
    const pupila = x => `<circle cx="${x + 1}" cy="65" r="5.4" fill="${PUP}"/><circle cx="${x + 3.2}" cy="62.4" r="2" fill="${v('olho')}"/><circle cx="${x - 0.8}" cy="67.4" r="1" fill="${v('olho')}"/>`;
    const faiscas = [[24, 34], [96, 30], [16, 62], [104, 60], [34, 14], [88, 12]].map(([x, y], k) => `<path class="fo-faisca" style="--k:${k}" d="M${x} ${y - 5}L${x + 1.4} ${y - 1.4}L${x + 5} ${y}L${x + 1.4} ${y + 1.4}L${x} ${y + 5}L${x - 1.4} ${y + 1.4}L${x - 5} ${y}L${x - 1.4} ${y - 1.4}Z" fill="var(--arvore-flor-miolo)"/>`).join('');
    const coracao = (x, y, k) => `<path class="fo-coracao" style="--k:${k}" d="M${x} ${y + 4}C${x - 7} ${y - 1} ${x - 4} ${y - 7} ${x} ${y - 3}C${x + 4} ${y - 7} ${x + 7} ${y - 1} ${x} ${y + 4}Z" fill="var(--primary)"/>`;
    const z = (x, y, s, k) => `<path class="fo-z" style="--k:${k}" d="M${x} ${y}h${s}l-${s} ${s}h${s}" fill="none" stroke="${v('contorno')}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;
    return `<svg class="fo-svg" viewBox="0 0 120 128" aria-hidden="true" focusable="false"><defs><radialGradient id="${pre}-corpo" cx=".3" cy=".24" r=".9"><stop offset="0" style="stop-color:${v('luz')}"/><stop offset=".5" style="stop-color:${v('meio')}"/><stop offset="1" style="stop-color:${v('base')}"/></radialGradient></defs>
<ellipse class="fo-sombra" cx="60" cy="121" rx="22" ry="4.5" fill="${v('sombra')}"/>
<g class="fo-ser"><g transform="rotate(8 60 68)"><path d="M60 21C59 13 63 7 69 7C74 7 76 12 72 15C69 17 66 14 68 11" fill="none" stroke="${v('base')}" stroke-width="3.2" stroke-linecap="round"/><path d="M60 20C74 32 92 50 92 74C92 95 78 108 60 108C42 108 28 95 28 74C28 50 46 32 60 20Z" fill="url(#${pre}-corpo)" stroke="${v('contorno')}" stroke-width="2"/><g fill="none" stroke="${v('nervura')}" stroke-width="1.6" stroke-linecap="round" opacity=".35"><path d="M60 26C61 50 61 80 60 102"/><path d="M61 44C68 41 75 41 81 44"/><path d="M61 92C70 89 78 85 84 78"/><path d="M60 98C51 96 42 92 36 86"/></g><path d="M41 47C43 39 49 32 56 28C52 34 48 41 47 49C46 53 40 52 41 47Z" fill="#fff" opacity=".45"/></g><g class="fo-braco fo-braco-e"><path d="M35 76C27 70 18 71 13 77C19 83 28 82 35 78Z" fill="${v('meio')}" stroke="${v('contorno')}" stroke-width="1.6" stroke-linejoin="round"/><path d="M33 77Q24 76 16 77" stroke="${v('nervura')}" stroke-width="1" opacity=".5" fill="none"/></g><g class="fo-braco fo-braco-d"><path d="M85 76C93 70 102 71 107 77C101 83 92 82 85 78Z" fill="${v('meio')}" stroke="${v('contorno')}" stroke-width="1.6" stroke-linejoin="round"/><path d="M87 77Q96 76 104 77" stroke="${v('nervura')}" stroke-width="1" opacity=".5" fill="none"/></g>
<g class="fo-rosto" transform="rotate(4 60 70)"><ellipse cx="38" cy="78" rx="6.5" ry="3.8" fill="#fff" opacity=".55"/><ellipse cx="82" cy="78" rx="6.5" ry="3.8" fill="#fff" opacity=".55"/><ellipse cx="38" cy="78" rx="6.5" ry="3.8" fill="${v('bochecha')}" opacity=".55"/><ellipse cx="82" cy="78" rx="6.5" ry="3.8" fill="${v('bochecha')}" opacity=".55"/>
<g class="fo-olhos"><g class="fo-olho">${olho(48)}<g class="fo-pupilas">${pupila(48)}</g><ellipse class="fo-palpebra" cx="48" cy="64" rx="9.2" ry="10.2" fill="${v('meio')}"/></g><g class="fo-olho">${olho(72)}<g class="fo-pupilas">${pupila(72)}</g><ellipse class="fo-palpebra" cx="72" cy="64" rx="9.2" ry="10.2" fill="${v('meio')}"/></g></g>
<g class="fo-felizes" fill="none" stroke="${PUP}" stroke-width="3" stroke-linecap="round"><path d="M41 67Q48 57 55 67"/><path d="M65 67Q72 57 79 67"/></g><g class="fo-fechados" fill="none" stroke="${PUP}" stroke-width="2.6" stroke-linecap="round"><path d="M41 64Q48 70 55 64"/><path d="M65 64Q72 70 79 64"/></g>
<g fill="none" stroke="${PUP}" stroke-width="2.6" stroke-linecap="round"><path class="fo-b fo-b-sorriso" d="M52 81Q60 89 68 81"/><path class="fo-b fo-b-triste" d="M53 88Q60 81 67 88"/><path class="fo-b fo-b-linha" d="M54 85H66"/></g>
<g class="fo-b fo-b-aberta"><path d="M51 80Q60 81 69 80Q67 92 60 92Q53 92 51 80Z" fill="${BOCA}"/><path d="M55 88Q60 85 65 88Q63 91.5 60 91.5Q57 91.5 55 88Z" fill="${v('lingua')}"/></g><ellipse class="fo-b fo-b-o" cx="60" cy="85" rx="3.6" ry="4.4" fill="${BOCA}"/><g class="fo-b fo-b-risada"><path d="M49 79Q60 81 71 79Q69 96 60 96Q51 96 49 79Z" fill="${BOCA}"/><path d="M53 90Q60 86 67 90Q64 95.5 60 95.5Q56 95.5 53 90Z" fill="${v('lingua')}"/></g></g>
<g class="fo-queixo"><path d="M66 97C62 90 64 83 70 80C73 86 72 93 66 97Z" fill="${v('meio')}" stroke="${v('contorno')}" stroke-width="1.6" stroke-linejoin="round"/></g><g class="fo-extras">${faiscas}${coracao(92, 24, 0)}${coracao(102, 40, 1)}${z(84, 30, 6, 0)}${z(92, 18, 8, 1)}${z(102, 4, 10, 2)}</g></g></svg>`;
  }
  const CSS = `.folhinha{--olhar-x:0px;--olhar-y:0px}
.fo-svg{width:100%;height:100%;display:block;overflow:visible}
.fo-ser,.fo-sombra,.fo-braco,.fo-pupilas,.fo-palpebra,.fo-esclera,.fo-faisca,.fo-coracao,.fo-z,.fo-olho{transform-box:fill-box}
.fo-ser{transform-origin:50% 100%;animation:fo-flutua 3.2s cubic-bezier(.65,0,.35,1) infinite alternate}
.fo-sombra{transform-origin:center;animation:fo-sombra 3.2s cubic-bezier(.65,0,.35,1) infinite alternate}
@keyframes fo-flutua{from{transform:translateY(0) scale(1)}to{transform:translateY(-3px) scale(1.02)}}
@keyframes fo-sombra{from{transform:scale(1);opacity:1}to{transform:scale(.88);opacity:.75}}
.fo-braco-e{transform-origin:100% 40%}.fo-braco-d{transform-origin:0 40%}
.fo-braco,.fo-pupilas,.fo-esclera,.fo-palpebra{transition:transform .24s cubic-bezier(.22,1,.36,1)}
.fo-pupilas{transform-origin:center;transform:translate(var(--olhar-x),var(--olhar-y))}
.fo-esclera{transform-origin:center}
.fo-palpebra{transform-origin:50% 0;transform:scaleY(0)}
.folhinha.piscando .fo-palpebra{transform:scaleY(1);transition-duration:.07s}
.fo-felizes,.fo-fechados,.fo-b,.fo-extras>*,.fo-queixo{opacity:0}
.folhinha[data-estado="pensando"] .fo-queixo{opacity:1}
.fo-b{transition:opacity .08s linear}
.folhinha:not([data-boca]) .fo-b-sorriso,.folhinha[data-boca="sorriso"] .fo-b-sorriso,.folhinha[data-boca="aberta"] .fo-b-aberta,.folhinha[data-boca="o"] .fo-b-o{opacity:1}
.folhinha:not([data-boca])[data-estado="falando"] .fo-b-sorriso{opacity:1}
.folhinha:not([data-boca]):is([data-estado="acenando"]) .fo-b-sorriso,.folhinha:not([data-boca]):is([data-estado="comemorando"],[data-estado="triste"],[data-estado="pensando"],[data-estado="surpresa"],[data-estado="dormindo"]) .fo-b-sorriso{opacity:0}
.folhinha:not([data-boca])[data-estado="acenando"] .fo-b-aberta,.folhinha:not([data-boca])[data-estado="comemorando"] .fo-b-risada,.folhinha:not([data-boca])[data-estado="triste"] .fo-b-triste,.folhinha:not([data-boca]):is([data-estado="pensando"],[data-estado="dormindo"]) .fo-b-linha,.folhinha:not([data-boca])[data-estado="surpresa"] .fo-b-o{opacity:1}
.folhinha:is([data-estado="acenando"],[data-estado="comemorando"],[data-estado="carinho"]) .fo-felizes{opacity:1}
.folhinha:is([data-estado="acenando"],[data-estado="comemorando"],[data-estado="carinho"]) .fo-olho{opacity:0}
.folhinha[data-estado="dormindo"] .fo-fechados{opacity:1}
.folhinha[data-estado="dormindo"] .fo-olho{opacity:0}
.folhinha[data-estado="falando"] .fo-ser{rotate:4deg}
.folhinha[data-estado="acenando"] .fo-braco-d{animation:fo-acena .42s cubic-bezier(.65,0,.35,1) 3 alternate}
@keyframes fo-acena{from{transform:rotate(-20deg)}to{transform:rotate(-62deg)}}
.folhinha[data-estado="comemorando"] .fo-braco-e{transform:rotate(58deg)}
.folhinha[data-estado="comemorando"] .fo-braco-d{transform:rotate(-58deg)}
.folhinha[data-estado="comemorando"] .fo-ser{animation:fo-pulo .7s cubic-bezier(.22,1,.36,1) 2}
@keyframes fo-pulo{0%,100%{transform:translateY(0)}35%{transform:translateY(-14px) scale(1.03)}70%{transform:translateY(0) scale(1.04,.96)}}
.folhinha:not(.sem-faisca)[data-estado="comemorando"] .fo-faisca{animation:fo-faisca .9s cubic-bezier(.22,1,.36,1) calc(var(--k) * 60ms) 2 both;transform-origin:center}
@keyframes fo-faisca{0%{opacity:0;transform:scale(.4)}40%{opacity:1;transform:scale(1.15)}100%{opacity:0;transform:scale(.6) rotate(45deg)}}
.folhinha[data-estado="triste"] .fo-ser{animation:none;transform:scale(.96)}
.folhinha[data-estado="triste"] .fo-pupilas{transform:translate(0,2.4px)}
.folhinha[data-estado="triste"] .fo-palpebra{transform:scaleY(.42)}
.folhinha[data-estado="triste"] .fo-braco-e{transform:rotate(-28deg)}
.folhinha[data-estado="triste"] .fo-braco-d{transform:rotate(28deg)}
.folhinha[data-estado="pensando"] .fo-pupilas{transform:translate(2.2px,-2.6px)}
.folhinha[data-estado="pensando"] .fo-braco-d{opacity:0}
.folhinha[data-estado="surpresa"] .fo-esclera{transform:scale(1.14)}
.folhinha[data-estado="surpresa"] .fo-pupilas{transform:scale(.72)}
.folhinha[data-estado="surpresa"] .fo-ser{animation:fo-susto .4s cubic-bezier(.22,1,.36,1)}
@keyframes fo-susto{40%{transform:translate(-4px,-6px)}}
.folhinha[data-estado="dormindo"] .fo-ser{animation-duration:4s}
.folhinha[data-estado="dormindo"] .fo-braco-e{transform:rotate(-14deg)}
.folhinha[data-estado="dormindo"] .fo-braco-d{transform:rotate(14deg)}
.folhinha[data-estado="dormindo"] .fo-z{animation:fo-z 3s linear calc(var(--k) * 1s) infinite;transform-origin:center}
@keyframes fo-z{0%{opacity:0;transform:translate(0,4px) scale(.7)}25%{opacity:1}100%{opacity:0;transform:translate(6px,-12px) scale(1.1)}}
.folhinha[data-estado="carinho"] .fo-ser{animation:fo-balanca .5s cubic-bezier(.65,0,.35,1) 3 alternate}
@keyframes fo-balanca{from{transform:rotate(-6deg)}to{transform:rotate(6deg)}}
.folhinha[data-estado="carinho"] .fo-coracao{animation:fo-coracao 1.4s cubic-bezier(.22,1,.36,1) calc(var(--k) * 200ms) 2 both;transform-origin:center}
@keyframes fo-coracao{0%{opacity:0;transform:translateY(6px) scale(.6)}30%{opacity:1}100%{opacity:0;transform:translateY(-14px) scale(1.1)}}
.folhinha.espreguica .fo-braco-e{transform:rotate(70deg)}.folhinha.espreguica .fo-braco-d{transform:rotate(-70deg)}
html.oculto .fo-ser,html.oculto .fo-sombra,html.oculto .fo-z{animation-play-state:paused}
:root[data-animacoes="reduzidas"] :is(.fo-ser,.fo-sombra,.fo-braco){animation:none!important}
:root[data-animacoes="reduzidas"] :is(.fo-faisca,.fo-z,.fo-coracao){animation:none!important;opacity:0!important}
@media (prefers-reduced-motion: reduce){:is(.fo-ser,.fo-sombra,.fo-braco){animation:none!important}:is(.fo-faisca,.fo-z,.fo-coracao){animation:none!important;opacity:0!important}}`;
  function injetarCss(doc) {
    if (!doc || doc.getElementById('folhinha-css')) return;
    const s = doc.createElement('style');
    s.id = 'folhinha-css'; s.textContent = CSS;
    doc.head.append(s);
  }
  const ESTADOS = ['parada', 'falando', 'acenando', 'comemorando', 'triste', 'pensando', 'surpresa', 'dormindo', 'carinho'];
  const BOCAS = ['aberta', 'o', 'sorriso'];
  const reduzido = () => !!(raiz.Animacoes && raiz.Animacoes.reduzido());
  const Folhinha = {
    el: null, balao: null, aoTocar: null, texto: '', estadoFinal: 'parada', ultimoToque: Date.now(), t: {},
    hora: () => new Date().getHours(),
    montar() {
      if (this.el || typeof document === 'undefined') return;
      injetarCss(document);
      const b = document.createElement('button');
      b.id = 'folhinha'; b.type = 'button'; b.className = 'folhinha'; b.dataset.estado = 'parada';
      b.setAttribute('aria-label', 'Folhinha: toque para ver uma dica. Setas mudam o canto');
      b.innerHTML = svg('fo');
      b.addEventListener('click', () => { if (this.arrastou) return; this.clicar(); });
      b.addEventListener('pointerdown', e => this.arrastar(e));
      b.addEventListener('keydown', e => { const m = { ArrowLeft: 'esquerda', ArrowRight: 'direita' }[e.key]; if (m) { e.preventDefault(); this.mover(e.shiftKey ? 'espiando-' + m : m); } });
      const balao = document.createElement('div');
      balao.id = 'balao-fo'; balao.className = 'balao-fo'; balao.hidden = true;
      balao.innerHTML = '<svg class="balao-folha" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2 14C2 6 7 2 14 2C14 9 9 14 2 14Z"/><path d="M3 13L11 5" fill="none"/></svg><p class="balao-texto" aria-hidden="true"></p><p class="sr" role="status" id="balao-sr"></p><div class="balao-acoes"></div>';
      balao.querySelector('.balao-texto').addEventListener('click', () => this.completar());
      document.body.append(b, balao);
      this.el = b; this.balao = balao;
      this.posicionar(this.posicao);
      this.aoToque = e => this.toque(e);
      document.addEventListener('pointerdown', this.aoToque, true);
      this.piscar();
      this.t.sono = setInterval(() => this.vigiarSono(), 5000);
    },
    posicao: 'esquerda', aoMover: null, ultimoClique: 0,
    posicionar(pos) {
      this.posicao = pos;
      if (!this.el) return;
      const dir = pos.endsWith('direita');
      this.el.classList.toggle('pos-direita', dir);
      this.el.classList.toggle('espiando', pos.startsWith('espiando'));
      this.balao.classList.toggle('dir', dir);
    },
    clicar() {
      const agora = Date.now(), duplo = agora - this.ultimoClique < 320;
      this.ultimoClique = agora;
      if (duplo) { this.fechar(); this.dancar(); return; }
      if (this.posicao.startsWith('espiando')) { this.mover(this.posicao.endsWith('direita') ? 'direita' : 'esquerda'); return; }
      if (this.balao && !this.balao.hidden) return this.fechar();
      if (this.aoTocar) this.aoTocar();
    },
    dancar() {
      if (!this.el) return;
      this.el.classList.add('sem-faisca');
      this.reagir('comemorando', 1000);
      setTimeout(() => this.el && this.el.classList.remove('sem-faisca'), 1000);
    },
    mover(pos, de) {
      const el = this.el; if (!el) return;
      const antes = de || el.getBoundingClientRect();
      el.getAnimations().filter(a => a.id === 'fo-mover').forEach(a => a.cancel());
      el.style.transform = '';
      this.posicionar(pos);
      if (this.aoMover) this.aoMover(pos);
      if (reduzido()) return;
      const depois = el.getBoundingClientRect(), dx = antes.left - depois.left, dy = antes.top - depois.top;
      if (!dx && !dy) return;
      const curva = raiz.Animacoes ? raiz.Animacoes.curvaMola() : 'cubic-bezier(.22,1,.36,1)';
      const a = el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 480, easing: curva });
      a.id = 'fo-mover';
    },
    arrastar(e) {
      const el = this.el;
      if (!el || e.button > 0) return;
      const anim = el.getAnimations().find(a => a.id === 'fo-mover');
      const r0 = el.getBoundingClientRect();
      if (anim) { anim.cancel(); el.style.transform = ''; const base = el.getBoundingClientRect(); el.style.transform = `translate(${r0.left - base.left}px, ${r0.top - base.top}px)`; }
      const base = el.getBoundingClientRect(), off = { x: r0.left - base.left, y: r0.top - base.top };
      const x0 = e.clientX, y0 = e.clientY;
      let ativo = false;
      el.setPointerCapture(e.pointerId);
      const mover = ev => {
        const dx = ev.clientX - x0, dy = ev.clientY - y0;
        if (!ativo && Math.hypot(dx, dy) < 6) return;
        if (!ativo) { ativo = true; this.arrastou = true; this.fechar(); el.classList.add('arrastando'); }
        el.style.transform = `translate(${off.x + dx}px, ${off.y + dy}px)`;
      };
      const soltar = ev => {
        el.removeEventListener('pointermove', mover); el.removeEventListener('pointerup', soltar); el.removeEventListener('pointercancel', soltar);
        el.classList.remove('arrastando');
        if (!ativo) { if (anim) this.mover(this.posicao, r0); return; }
        const r = el.getBoundingClientRect(), centro = r.left + r.width / 2, dir = centro > innerWidth / 2;
        const borda = dir ? innerWidth - r.right : r.left;
        this.mover((borda < 24 ? 'espiando-' : '') + (dir ? 'direita' : 'esquerda'), r);
        setTimeout(() => { this.arrastou = false; }, 0);
      };
      el.addEventListener('pointermove', mover); el.addEventListener('pointerup', soltar); el.addEventListener('pointercancel', soltar);
    },
    estado() { return this.el ? this.el.dataset.estado : null; },
    definir(estado) { if (this.el) this.el.dataset.estado = estado; },
    piscar() {
      clearTimeout(this.t.piscar);
      this.t.piscar = setTimeout(() => {
        if (this.el && !document.hidden && this.estado() !== 'dormindo') { this.el.classList.add('piscando'); setTimeout(() => this.el && this.el.classList.remove('piscando'), 140); }
        this.piscar();
      }, 3000 + Math.random() * 4000);
    },
    olhar(x, y, ms = 1200) {
      if (!this.el) return;
      const r = this.el.getBoundingClientRect(), dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height * 0.45), d = Math.hypot(dx, dy) || 1;
      this.el.style.setProperty('--olhar-x', (dx / d * 2).toFixed(2) + 'px');
      this.el.style.setProperty('--olhar-y', (dy / d * 2).toFixed(2) + 'px');
      clearTimeout(this.t.olhar);
      if (ms) this.t.olhar = setTimeout(() => this.olharFrente(), ms);
    },
    olharFrente() { if (!this.el) return; this.el.style.removeProperty('--olhar-x'); this.el.style.removeProperty('--olhar-y'); },
    toque(e) {
      this.ultimoToque = Date.now();
      if (!this.el) return;
      if (this.estado() === 'dormindo') { this.acordar(); return; }
      if (!this.el.contains(e.target) && this.balao.hidden) this.olhar(e.clientX, e.clientY);
    },
    vigiarSono() {
      if (!this.el || document.hidden) return;
      const h = this.hora(), noite = h >= 22 || h < 6;
      if (noite && Date.now() - this.ultimoToque > 20000 && this.estado() === 'parada' && this.balao.hidden) this.definir('dormindo');
    },
    acordar() {
      this.definir('surpresa');
      clearTimeout(this.t.acordar);
      this.t.acordar = setTimeout(() => { if (this.estado() === 'surpresa') this.definir('parada'); }, 900);
    },
    espreguicar() {
      if (!this.el) return;
      this.el.classList.add('espreguica');
      setTimeout(() => { if (!this.el) return; this.el.classList.remove('espreguica'); this.definir('acenando'); setTimeout(() => this.estado() === 'acenando' && this.balao.hidden && this.definir('parada'), 1600); }, 800);
    },
    reagir(estado, ms = 1600) {
      if (!this.el) return;
      this.definir(estado);
      clearTimeout(this.t.reagir);
      this.t.reagir = setTimeout(() => { if (this.estado() === estado && this.balao.hidden) this.definir('parada'); }, ms);
    },
    falar(texto, { estado = 'parada', fixo = false, botoes = null } = {}) {
      this.montar();
      if (!this.el) return;
      this.pararFala(); clearTimeout(this.t.fechar);
      const p = this.balao.querySelector('.balao-texto'), sr = this.balao.querySelector('#balao-sr'), acoes = this.balao.querySelector('.balao-acoes');
      this.balao.hidden = false; this.texto = texto; this.estadoFinal = estado;
      acoes.innerHTML = '';
      (botoes && botoes.length ? botoes : [{ rotulo: 'Entendi' }]).slice(0, 2).forEach(o => {
        const btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'btn text'; btn.textContent = o.rotulo;
        btn.addEventListener('click', () => { this.fechar(); if (o.acao) o.acao(); });
        acoes.append(btn);
      });
      sr.textContent = ''; setTimeout(() => { sr.textContent = texto; }, 30);
      const letras = Array.from(texto), total = Math.min(900, letras.length * 20);
      if (reduzido()) { p.textContent = texto; this.terminar(); }
      else {
        this.definir('falando');
        this.el.style.setProperty('--olhar-x', '1.4px'); this.el.style.setProperty('--olhar-y', '-1.6px');
        p.textContent = '';
        const t0 = performance.now();
        let b = 0;
        this.t.boca = setInterval(() => { this.el.dataset.boca = BOCAS[b++ % BOCAS.length]; }, 110);
        this.t.fala = setInterval(() => { const k = Math.min(letras.length, Math.ceil((performance.now() - t0) / total * letras.length)); p.textContent = letras.slice(0, k).join(''); if (k >= letras.length) this.terminar(); }, 30);
        this.balao.animate([{ opacity: 0, transform: 'translateY(6px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.22,1,.36,1)' });
      }
      if (!fixo) this.t.fechar = setTimeout(() => this.fechar(), 7000 + total);
    },
    pararFala() { clearInterval(this.t.fala); clearInterval(this.t.boca); if (this.el) delete this.el.dataset.boca; },
    completar() { if (!this.balao || this.balao.hidden) return; this.balao.querySelector('.balao-texto').textContent = this.texto; this.terminar(); },
    terminar() { this.pararFala(); this.olharFrente(); this.definir(this.estadoFinal); },
    fechar() {
      this.pararFala(); clearTimeout(this.t.fechar);
      if (!this.balao || this.balao.hidden) return;
      this.balao.hidden = true;
      this.olharFrente();
      if (this.el && this.estado() !== 'triste' && this.estado() !== 'dormindo') this.definir('parada');
    },
    remover() {
      if (!this.el) return;
      this.fechar(); clearTimeout(this.t.piscar); clearInterval(this.t.sono);
      document.removeEventListener('pointerdown', this.aoToque, true);
      this.el.remove(); this.balao.remove(); this.el = this.balao = null;
    },
  };
  const FolhinhaDesenho = { svg, CSS, injetarCss, ESTADOS };
  if (typeof module !== 'undefined' && module.exports) module.exports = FolhinhaDesenho;
  else { raiz.FolhinhaDesenho = FolhinhaDesenho; raiz.Folhinha = Folhinha; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
