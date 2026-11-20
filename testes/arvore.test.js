process.env.TZ = 'America/Sao_Paulo';
const test = require('node:test');
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const A = require('../arvore.js');
const R = require('../regras.js');

const ids = Array.from({ length: 10 }, (_, k) => 'i' + k);

function montarCom(criadoEm, feitos) {
  const itens = ids.map(id => ({ id, nome: 'I', criadoEm }));
  return R.migrar(JSON.stringify({ schemaVersion: 4, secoes: [{ id: 's', nome: 'X', itens }], feitos, tarefas: [] })).dados;
}

function montar(percs, inicio = '2026-03-01') {
  const feitos = {};
  let dia = inicio;
  percs.forEach(p => {
    if (p > 0) feitos[dia] = ids.slice(0, p / 10);
    dia = R.somaDias(dia, 1);
  });
  return { dados: montarCom(inicio, feitos), hoje: dia };
}

const folhasDe = percs => {
  const { dados, hoje } = montar(percs);
  return A.calcularArvore(dados, hoje);
};

test('100,100,100 gera 15 folhas e Muda', () => {
  const r = folhasDe([100, 100, 100]);
  assert.equal(r.folhas, 15);
  assert.equal(r.nomeEstagio, 'Muda');
});

test('100,40,100 gera 12 folhas e Broto', () => {
  const r = folhasDe([100, 40, 100]);
  assert.equal(r.folhas, 12);
  assert.equal(r.nomeEstagio, 'Broto');
});

test('0,0,100 gera 5 folhas por causa do piso', () => {
  assert.equal(folhasDe([0, 0, 100]).folhas, 5);
});

test('60% vale 3 folhas', () => {
  assert.equal(folhasDe([100, 100, 60]).folhas, 13);
});

test('7 dias a 100% e mais um em branco', () => {
  const sete = folhasDe(Array(7).fill(100));
  assert.equal(sete.folhas, 38);
  assert.equal(sete.nomeEstagio, 'Arvoreta');
  const depois = folhasDe([...Array(6).fill(100), 20, 0]);
  assert.equal(depois.folhas, 32);
  assert.equal(depois.nomeEstagio, 'Muda');
  const ontem = R.somaDias(depois.hoje, -1);
  assert.deepEqual(
    A.eventosDesde({ folhasVistas: 35, estagioVisto: 3, diaFaixa: ontem }, depois),
    [{ tipo: 'perdeu', n: 2 }, { tipo: 'voltouEstagio', nome: 'Muda' }]
  );
});

test('dia sem itens previstos nao muda', () => {
  const dados = montarCom('2026-03-03', { '2026-03-01': ids.slice(0, 1) });
  const r = A.calcularArvore(dados, '2026-03-10');
  assert.equal(A.variacaoDia(dados, '2026-03-02'), 0);
  assert.equal(r.folhas, 0);
});

test('hoje completo soma 5', () => {
  const { dados, hoje } = montar([100, 100]);
  dados.feitos[hoje] = ids.slice();
  const r = A.calcularArvore(dados, hoje);
  assert.equal(r.folhas, 15);
  assert.equal(r.folhasAteOntem, 10);
});

test('hoje a 30% soma 2', () => {
  const { dados, hoje } = montar([100, 100]);
  dados.feitos[hoje] = ids.slice(0, 3);
  assert.equal(A.calcularArvore(dados, hoje).folhas, 12);
});

test('desmarcar hoje de 100% para 90% troca +5 por +4', () => {
  const { dados, hoje } = montar([100, 100]);
  dados.feitos[hoje] = ids.slice();
  assert.equal(A.calcularArvore(dados, hoje).folhas, 15);
  dados.feitos[hoje] = ids.slice(0, 9);
  assert.equal(A.calcularArvore(dados, hoje).folhas, 14);
});

test('limites dos estagios', () => {
  assert.equal(A.NOMES[A.estagioDe(69)], 'Arvoreta');
  assert.equal(A.NOMES[A.estagioDe(70)], 'Árvore jovem');
  assert.deepEqual(A.LIMITES, [0, 5, 15, 35, 70, 140, 250, 400, 600, 1000]);
});

test('proximo e faltam', () => {
  assert.deepEqual(folhasDe([100, 100, 100]).proximo, { nome: 'Arvoreta', faltam: 20 });
  const { dados, hoje } = montar(Array(200).fill(100));
  const r = A.calcularArvore(dados, hoje);
  assert.equal(r.estagio, 9);
  assert.equal(r.proximo, null);
});

test('dias antes do primeiro dia com dados nao contam', () => {
  const feitos = {};
  ['2026-03-10', '2026-03-11', '2026-03-12', '2026-03-13', '2026-03-14'].forEach(d => { feitos[d] = ids.slice(); });
  const dados = montarCom('2026-03-10', feitos);
  assert.equal(A.primeiroDia(dados), '2026-03-10');
  const r = A.calcularArvore(dados, '2026-03-15');
  assert.equal(r.folhas, 25);
  assert.equal(r.historico.find(h => h.data === '2026-03-09').variacao, 0);
});

test('historico tem 30 entradas, termina em hoje e e crescente', () => {
  const { dados, hoje } = montar([100, 40, 100, 100]);
  const h = A.calcularArvore(dados, hoje).historico;
  assert.equal(h.length, 30);
  assert.equal(h[29].data, hoje);
  for (let k = 1; k < h.length; k++) assert.ok(h[k].data > h[k - 1].data);
});

test('eventos ao subir de faixa e de estagio', () => {
  const atual = { hoje: '2026-03-10', folhas: 35, estagio: 3, feitasHoje: 10, totalHoje: 10, bonusHoje: 0, historico: [] };
  assert.deepEqual(
    A.eventosDesde({ folhasVistas: 34, estagioVisto: 2, diaFaixa: '2026-03-10', faixaVista: 4 }, atual),
    [{ tipo: 'faixaSubiu', faixa: 'Dia completo', folhas: 5, primeira: false }, { tipo: 'subiuEstagio', nome: 'Arvoreta' }]
  );
});

test('eventos com folhasVistas nulo devolvem lista vazia', () => {
  assert.deepEqual(A.eventosDesde({ folhasVistas: null, estagioVisto: null }, { folhas: 5, estagio: 2 }), []);
});

test('ganhas e perdidas respeitam o piso', () => {
  const r = folhasDe([10, 0, 0]);
  assert.equal(r.ganhas, 1);
  assert.equal(r.perdidas, 1);
  assert.equal(r.folhas, 0);
});

test('memo: marcar hoje completo soma 5 e iguala o resultado sem memo', () => {
  const { dados, hoje } = montar([100, 100, 100]);
  const memo = {};
  const antes = A.calcularArvore(dados, hoje, memo);
  dados.feitos[hoje] = ids.slice();
  const depois = A.calcularArvore(dados, hoje, memo);
  assert.equal(depois.folhas, antes.folhas + 5);
  assert.deepEqual(depois, A.calcularArvore(dados, hoje));
});

test('memo: mudar um dia passado iguala o resultado sem memo', () => {
  const { dados, hoje } = montar([100, 100, 100, 100]);
  const memo = {};
  A.calcularArvore(dados, hoje, memo);
  dados.feitos['2026-03-02'] = ids.slice(0, 2);
  const com = A.calcularArvore(dados, hoje, memo);
  assert.deepEqual(com, A.calcularArvore(dados, hoje));
  assert.equal(com.folhas, 16);
});

test('desempenho com 3 anos de dados', () => {
  const inicio = '2023-11-18';
  const feitos = {};
  let d = inicio, k = 0;
  while (d < '2026-11-18') {
    feitos[d] = ids.slice(0, (k * 7) % 11);
    d = R.somaDias(d, 1);
    k++;
  }
  const dados = montarCom(inicio, feitos);
  const hoje = '2026-11-18';
  const memo = {};
  const t0 = performance.now();
  const sem = A.calcularArvore(dados, hoje);
  const t1 = performance.now();
  const com1 = A.calcularArvore(dados, hoje, memo);
  const t2 = performance.now();
  const com2 = A.calcularArvore(dados, hoje, memo);
  const t3 = performance.now();
  console.log(`tempos: sem memo ${(t1 - t0).toFixed(2)} ms, memo frio ${(t2 - t1).toFixed(2)} ms, memo quente ${(t3 - t2).toFixed(2)} ms`);
  assert.deepEqual(com1, sem);
  assert.deepEqual(com2, sem);
  assert.ok(t1 - t0 < 60);
  assert.ok(t3 - t2 < 30);
});
