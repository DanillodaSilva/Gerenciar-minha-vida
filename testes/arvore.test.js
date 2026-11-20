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
  const amostras = [];
  let sem;
  for (let k = 0; k < 5; k++) { const t = performance.now(); sem = A.calcularArvore(dados, hoje); amostras.push(performance.now() - t); }
  amostras.sort((a, b) => a - b);
  const t0 = 0, t1 = amostras[2];
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

const sem = x => { const { real, ...resto } = x; return resto; };

test('faixas de um dia encerrado com 10 itens', () => {
  const esperado = [-2, 1, 1, 2, 2, 3, 3, 4, 4, 5];
  [0, 1, 2, 3, 4, 5, 7, 8, 9, 10].forEach((k, n) => assert.equal(A.faixaDia(k, 10, true).folhas, esperado[n], k + ' de 10'));
  assert.equal(A.faixaDia(0, 10, true).faixa, 'Em branco');
  assert.equal(A.faixaDia(5, 10, true).faixa, 'Bom dia');
});

test('faixas sem arredondar', () => {
  assert.equal(A.faixaDia(3, 12, true).folhas, 2);
  assert.equal(A.faixaDia(1, 3, true).folhas, 2);
  assert.equal(A.faixaDia(2, 3, true).folhas, 3);
  assert.deepEqual(A.faixaDia(0, 0, true), { folhas: 0, faixa: null });
});

test('piso: um dia em branco começando em 0 fica em 0', () => {
  const r = folhasDe([0]);
  assert.equal(r.folhas, 0);
  assert.equal(sem(r.historico[28]).variacao, -2);
});

test('bônus a cada 7 dias tentados', () => {
  assert.equal(folhasDe(Array(7).fill(10)).folhas, 10);
  assert.equal(folhasDe(Array(14).fill(10)).folhas, 20);
});

test('dia em branco recomeça a corrente', () => {
  const r = folhasDe([10, 10, 10, 10, 0, ...Array(7).fill(10)]);
  assert.equal(r.folhas, 12);
  assert.equal(r.tentativasAteOntem, 7);
});

test('dia sem itens não quebra a corrente', () => {
  const inicio = '2026-03-01', dias = Array.from({ length: 8 }, (_, k) => R.somaDias(inicio, k));
  const livre = R.diaSemana(dias[3]);
  const itens = ids.map(id => ({ id, nome: 'I', criadoEm: inicio, dias: [1, 2, 3, 4, 5, 6, 7].filter(d => d !== livre) }));
  const feitos = {};
  dias.forEach((d, k) => { if (k !== 3) feitos[d] = ['i0']; });
  const dados = R.migrar(JSON.stringify({ schemaVersion: 4, secoes: [{ id: 's', nome: 'X', itens }], feitos, tarefas: [] })).dados;
  assert.equal(A.calcularArvore(dados, R.somaDias(inicio, 8)).folhas, 10);
});

test('hoje nunca perde folha e muda na hora', () => {
  const { dados, hoje } = montar([10, 10]);
  let r = A.calcularArvore(dados, hoje);
  assert.equal(r.folhasHoje, 0);
  assert.equal(r.faixaHoje, null);
  assert.equal(r.folhas, 2);
  dados.feitos[hoje] = ids.slice(0, 5);
  r = A.calcularArvore(dados, hoje);
  assert.equal(r.folhasHoje, 3);
  assert.equal(r.faixaHoje, 'Bom dia');
  assert.equal(r.folhas, 5);
});

test('7.º dia tentado: bônus entra no primeiro item e sai ao desmarcar', () => {
  const { dados, hoje } = montar(Array(6).fill(10));
  const memo = {};
  assert.equal(A.calcularArvore(dados, hoje, memo).folhas, 6);
  dados.feitos[hoje] = ['i0'];
  const r = A.calcularArvore(dados, hoje, memo);
  assert.equal(r.bonusHoje, 3);
  assert.equal(r.folhasHoje, 4);
  assert.equal(r.folhas, 10);
  assert.equal(r.tentativasSeguidas, 7);
  dados.feitos[hoje] = [];
  const d = A.calcularArvore(dados, hoje, memo);
  assert.equal(d.folhas, 6);
  assert.equal(d.bonusHoje, 0);
  assert.equal(d.tentativasSeguidas, 6);
});

test('próxima faixa', () => {
  assert.deepEqual(A.proximaFaixa(4, 10), { faltamItens: 1, folhas: 3 });
  assert.deepEqual(A.proximaFaixa(9, 10), { faltamItens: 1, folhas: 5 });
  assert.equal(A.proximaFaixa(10, 10), null);
  assert.deepEqual(A.proximaFaixa(0, 3), { faltamItens: 1, folhas: 2 });
  const { dados, hoje } = montar([10]);
  dados.feitos[hoje] = ids.slice(0, 4);
  assert.deepEqual(A.calcularArvore(dados, hoje).proximaFaixa, { faltamItens: 1, folhas: 3 });
});

test('estágios novos', () => {
  assert.equal(A.NOMES[A.estagioDe(4)], 'Semente');
  assert.equal(A.NOMES[A.estagioDe(5)], 'Broto');
  assert.equal(A.NOMES[A.estagioDe(999)], 'Árvore com frutos');
  assert.equal(A.NOMES[A.estagioDe(1000)], 'Árvore anciã');
});

test('histórico traz faixa e bônus', () => {
  const r = folhasDe(Array(7).fill(10));
  const ultimo = r.historico[28];
  assert.deepEqual(sem(ultimo), { data: ultimo.data, variacao: 4, faixa: 'Começou', bonus: 3 });
});

test('transição da regra 1 para a 2: sem eventos e a fala uma vez', () => {
  const { dados, hoje } = montar(Array.from({ length: 30 }, (_, k) => [100, 60, 30, 0, 100][k % 5]));
  const atual = A.calcularArvore(dados, hoje);
  const anterior = R.normalizarAjustes({ arvore: { folhasVistas: 7, estagioVisto: 3 } }, true).arvore;
  assert.equal(anterior.regra, 1);
  const t = A.transicaoRegra(anterior, atual);
  assert.equal(t.arvore.regra, 2);
  assert.equal(t.arvore.folhasVistas, atual.folhas);
  assert.equal(t.arvore.estagioVisto, atual.estagio);
  assert.deepEqual(A.eventosDesde(t.arvore, atual), []);
  assert.equal(t.fala, `Mudei a regra: agora todo esforço conta! Cada item feito ajuda sua árvore. Ela foi recalculada e está com ${atual.folhas} folhas.`);
  assert.equal(A.transicaoRegra(t.arvore, atual), null);
  assert.equal(A.transicaoRegra(R.normalizarAjustes({}, false).arvore, atual).fala, null);
});

test('evento: de 4 para 5 de 10 sobe para Bom dia', () => {
  const { dados, hoje } = montar([100, 100, 100, 100]);
  dados.feitos[hoje] = ids.slice(0, 4);
  const antes = A.calcularArvore(dados, hoje);
  const visto = A.registrarVisto({ folhasVistas: 0, estagioVisto: 0, diaFaixa: hoje }, antes);
  dados.feitos[hoje] = ids.slice(0, 5);
  const ev = A.eventosDesde(visto, A.calcularArvore(dados, hoje));
  assert.deepEqual(ev.map(e => ({ tipo: e.tipo, faixa: e.faixa, folhas: e.folhas })), [{ tipo: 'faixaSubiu', faixa: 'Bom dia', folhas: 3 }]);
  dados.feitos[hoje] = ids.slice(0, 4);
  assert.deepEqual(A.eventosDesde(A.registrarVisto(visto, A.calcularArvore(dados, hoje)), A.calcularArvore(dados, hoje)), []);
});

test('evento: 7.º dia tentado dá bônus', () => {
  const { dados, hoje } = montar(Array(6).fill(10));
  const visto = A.registrarVisto({ folhasVistas: 0, estagioVisto: 0 }, A.calcularArvore(dados, hoje));
  dados.feitos[hoje] = ['i0'];
  const ev = A.eventosDesde(visto, A.calcularArvore(dados, hoje));
  assert.deepEqual(ev.find(e => e.tipo === 'bonus'), { tipo: 'bonus', dias: 7 });
  assert.deepEqual(ev.find(e => e.tipo === 'faixaSubiu'), { tipo: 'faixaSubiu', faixa: 'Começou', folhas: 1, primeira: true });
});

test('evento: 34 para 35 folhas vira Arvoreta', () => {
  const ev = A.eventosDesde({ folhasVistas: 34, estagioVisto: 2, diaFaixa: '2026-03-10', faixaVista: 1 }, { hoje: '2026-03-10', folhas: 35, estagio: 3, feitasHoje: 1, totalHoje: 10, bonusHoje: 0, historico: [] });
  assert.deepEqual(ev, [{ tipo: 'subiuEstagio', nome: 'Arvoreta' }]);
});

test('desempenho da regra nova: 3 anos em menos de 30 ms e marcação com memo em menos de 2 ms', () => {
  const inicio = '2023-11-18', feitos = {};
  for (let d = inicio, k = 0; d < '2026-11-18'; d = R.somaDias(d, 1), k++) feitos[d] = ids.slice(0, (k * 7) % 11);
  const dados = montarCom(inicio, feitos), hoje = '2026-11-18', memo = {};
  const frios = [];
  for (let k = 0; k < 5; k++) { const t = performance.now(); A.calcularArvore(dados, hoje); frios.push(performance.now() - t); }
  frios.sort((a, b) => a - b);
  const t0 = 0, t1 = frios[2];
  A.calcularArvore(dados, hoje, memo);
  const tempos = [];
  for (let k = 0; k < 11; k++) {
    dados.feitos[hoje] = ids.slice(0, k % 10);
    const a = performance.now();
    A.calcularArvore(dados, hoje, memo);
    tempos.push(performance.now() - a);
  }
  tempos.sort((a, b) => a - b);
  console.log(`regra nova: 3 anos ${(t1 - t0).toFixed(2)} ms, marcação com memo mediana ${tempos[5].toFixed(2)} ms (pior ${tempos[10].toFixed(2)} ms)`);
  assert.ok(t1 - t0 < 30);
  assert.ok(tempos[5] < 2);
});
