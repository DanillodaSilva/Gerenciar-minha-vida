const { test } = require('node:test');
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const D = require('../arvore-desenho.js');

const folhaDe = (svg, i) => { const m = svg.match(new RegExp(`<g class="arv-folha" data-i="${i}"[^>]*>`)); return m && m[0]; };
const contar = (svg, re) => (svg.match(re) || []).length;
const tufos = svg => [...svg.matchAll(/<g class="arv-folhas-t">([\s\S]*?)<\/g><\/g><\/g><\/g>/g)].map(m => m[1]);

test('mesma entrada gera o mesmo SVG', () => {
  const o = { folhas: 87, estagio: 4, periodo: 'tarde', tema: 'claro' };
  assert.equal(D.gerarArvore(o).svg, D.gerarArvore({ ...o }).svg);
});

test('folha i tem o mesmo desenho com 50 e com 51 folhas', () => {
  const a = D.gerarArvore({ folhas: 50, estagio: 3 }).svg, b = D.gerarArvore({ folhas: 51, estagio: 3 }).svg;
  for (const i of [0, 7, 23, 49]) assert.equal(folhaDe(a, i), folhaDe(b, i));
  assert.equal(folhaDe(a, 50), null);
  assert.ok(folhaDe(b, 50));
});

test('em cada tufo, o SVG com n folhas é prefixo do SVG com n + 1', () => {
  const a = tufos(D.gerarArvore({ folhas: 100, estagio: 4 }).svg), b = tufos(D.gerarArvore({ folhas: 101, estagio: 4 }).svg);
  assert.equal(a.length, b.length);
  a.forEach((t, k) => assert.ok(b[k].startsWith(t), 'tufo ' + k));
});

test('folhas desenhadas = min(folhas, 160)', () => {
  for (const [f, e] of [[0, 0], [3, 0], [12, 1], [120, 4], [160, 6], [499, 7], [5000, 9]]) {
    const r = D.gerarArvore({ folhas: f, estagio: e });
    assert.equal(contar(r.svg, /class="arv-folha"/g), Math.min(f, 160), f + ' folhas');
    assert.equal(r.desenhadas, Math.min(f, 160));
  }
});

test('flores só a partir do estágio 7 e frutos só a partir do 8', () => {
  for (let e = 0; e <= 9; e++) {
    const svg = D.gerarArvore({ folhas: [2, 9, 24, 52, 104, 194, 324, 499, 799, 1200][e], estagio: e }).svg;
    assert.equal(contar(svg, /class="arv-flor"/g) > 0, e >= 7, 'flor ' + e);
    assert.equal(contar(svg, /class="arv-fruto"/g) > 0, e >= 8, 'fruto ' + e);
  }
  const f7 = contar(D.gerarArvore({ folhas: 400, estagio: 7 }).svg, /class="arv-flor"/g), f9 = contar(D.gerarArvore({ folhas: 2000, estagio: 9 }).svg, /class="arv-flor"/g);
  assert.ok(f7 >= 8 && f9 <= 24);
  const fr8 = contar(D.gerarArvore({ folhas: 600, estagio: 8 }).svg, /class="arv-fruto"/g), fr9 = contar(D.gerarArvore({ folhas: 2000, estagio: 9 }).svg, /class="arv-fruto"/g);
  assert.ok(fr8 >= 6 && fr9 <= 18);
});

test('no máximo 14 grupos animados', () => {
  for (let e = 0; e <= 9; e++) {
    const r = D.gerarArvore({ folhas: 1000, estagio: e });
    assert.ok(r.grupos.length <= 14);
    assert.equal(contar(r.svg, /class="arv-tufo"/g), r.grupos.length);
  }
});

test('céu: manhã, tarde, noite e tema escuro', () => {
  assert.match(D.gerarArvore({ folhas: 10, estagio: 1, periodo: 'manha' }).svg, /--ceu-manha-1/);
  assert.match(D.gerarArvore({ folhas: 10, estagio: 1, periodo: 'tarde' }).svg, /--ceu-tarde-1/);
  const noite = D.gerarArvore({ folhas: 10, estagio: 2, periodo: 'noite' });
  assert.ok(noite.noite);
  assert.equal(contar(noite.svg, /--ceu-estrela/g), 12);
  assert.ok(D.gerarArvore({ folhas: 10, estagio: 2, periodo: 'manha', tema: 'escuro' }).noite);
  assert.doesNotMatch(D.gerarArvore({ folhas: 10, estagio: 2, tamanho: 'mini' }).svg, /arv-ceu/);
});

test('SVG com 160 folhas em menos de 8 ms', () => {
  D.gerarArvore({ folhas: 160, estagio: 6, prefixo: 'aquece' });
  const tempos = [];
  for (let k = 0; k < 9; k++) { const t0 = performance.now(); D.gerarArvore({ folhas: 160, estagio: 6, prefixo: 'p' + k }); tempos.push(performance.now() - t0); }
  tempos.sort((a, b) => a - b);
  console.log(`desenho com 160 folhas: mediana ${tempos[4].toFixed(2)} ms`);
  assert.ok(tempos[4] < 8);
});

test('sem NaN nem undefined no texto', () => {
  for (let e = 0; e <= 9; e++) for (const f of [0, 1, 160, 1000, 5000]) for (const periodo of ['manha', 'tarde', 'noite']) for (const tamanho of ['cena', 'mini']) {
    const svg = D.gerarArvore({ folhas: f, estagio: e, periodo, tamanho }).svg;
    assert.doesNotMatch(svg, /NaN|undefined|Infinity/, `${f} folhas, estágio ${e}, ${periodo}, ${tamanho}`);
  }
});

test('rótulo acessível quando pedido', () => {
  assert.match(D.gerarArvore({ folhas: 5, estagio: 1, rotulo: 'Sua árvore: Broto, 5 folhas' }).svg, /role="img" aria-label="Sua árvore: Broto, 5 folhas"/);
  assert.match(D.gerarArvore({ folhas: 5, estagio: 1 }).svg, /aria-hidden="true"/);
});
