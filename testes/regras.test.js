process.env.TZ = 'America/Sao_Paulo';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const R = require('../regras.js');

const HOJE = '2026-11-17';
const item = (id, criadoEm = '2026-11-01', extra = {}) => ({ id, nome: 'Item ' + id, detalhe: '', criadoEm, ...extra });
const base = (itens, feitos = {}) => ({ secoes: [{ id: 's1', nome: 'Treino', emoji: '🏋️', cor: '#ff5c6c', rotuloNome: 'Exercício', rotuloDetalhe: 'Carga', itens }], feitos });

describe('datas', () => {
  test('"2026-11-17" lido no fuso de São Paulo continua sendo dia 17', () => {
    const d = R.parseDia('2026-11-17');
    assert.equal(d.getDate(), 17);
    assert.equal(R.fmt(d), '2026-11-17');
  });
  test('somaDias atravessa mês e ano', () => {
    assert.equal(R.somaDias('2026-11-30', 1), '2026-12-01');
    assert.equal(R.somaDias('2026-12-31', 1), '2027-01-01');
    assert.equal(R.somaDias('2028-03-01', -1), '2028-02-29');
  });
  test('virada de 23:59 para 00:00 muda o "hoje"', () => {
    assert.equal(R.fmt(new Date(2026, 10, 17, 23, 59)), '2026-11-17');
    assert.equal(R.fmt(new Date(2026, 10, 18, 0, 0)), '2026-11-18');
  });
  test('nomeDia usa Hoje e Ontem', () => {
    assert.equal(R.nomeDia(HOJE, HOJE), 'Hoje');
    assert.equal(R.nomeDia('2026-11-16', HOJE), 'Ontem');
  });
  test('curto mostra dia/mês', () => assert.equal(R.curto('2026-11-05'), '05/11'));
});

describe('constância (regra de 50%)', () => {
  test('resumoDia conta só itens criados até o dia', () => {
    const d = base([item('a'), item('b', '2026-11-17')], { '2026-11-16': ['a'] });
    assert.deepEqual(R.resumoDia(d, '2026-11-16'), { total: 1, feitas: 1, pct: 100 });
    assert.deepEqual(R.resumoDia(d, HOJE), { total: 2, feitas: 0, pct: 0 });
  });
  test('15 e 16 com pelo menos 50%, 17 pendente → 2 (hoje não quebra)', () => {
    const d = base([item('a'), item('b')], { '2026-11-15': ['a'], '2026-11-16': ['a', 'b'] });
    assert.equal(R.sequencia(d, HOJE), 2);
  });
  test('15 abaixo de 50%, 16 e 17 completos → 2', () => {
    const d = base([item('a'), item('b'), item('c')], { '2026-11-15': ['a'], '2026-11-16': ['a', 'b', 'c'], '2026-11-17': ['a', 'b'] });
    assert.equal(R.sequencia(d, HOJE), 2);
  });
  test('hoje completo conta a partir de hoje', () => {
    const d = base([item('a', '2026-11-16')], { '2026-11-16': ['a'], '2026-11-17': ['a'] });
    assert.equal(R.sequencia(d, HOJE), 2);
  });
  test('exatamente 50% conta', () => {
    const d = base([item('a', '2026-11-16'), item('b', '2026-11-16')], { '2026-11-16': ['a'] });
    assert.equal(R.sequencia(d, HOJE), 1);
  });
  test('nenhuma tarefa → 0', () => assert.equal(R.sequencia({ secoes: [], feitos: {} }, HOJE), 0));
  test('olha no máximo 365 dias para trás', () => {
    const feitos = {};
    for (let i = 0; i < 400; i++) feitos[R.somaDias(HOJE, -i)] = ['a'];
    assert.equal(R.sequencia(base([item('a', '2025-01-01')], feitos), HOJE), 365);
  });
});

describe('cores das seções', () => {
  test('converte as cores antigas, incluindo o roxo', () => {
    assert.equal(R.corTokenDe({ cor: '#7c5cff' }), 'blue');
    assert.equal(R.corTokenDe({ cor: '#F368E0' }), 'red');
    assert.equal(R.corTokenDe({ cor: '#2ecc71' }), 'green');
  });
  test('cor desconhecida vira gray e corToken válido tem prioridade', () => {
    assert.equal(R.corTokenDe({ cor: '#123456' }), 'gray');
    assert.equal(R.corTokenDe({ cor: '#7c5cff', corToken: 'teal' }), 'teal');
  });
});

describe('migração v1 → v2', () => {
  const v1 = {
    secoes: [{ id: 'lx1abc', nome: 'Treino', emoji: '🏋️', cor: '#7c5cff', rotuloNome: 'Exercício', rotuloDetalhe: 'Carga', extraSecao: 1,
      itens: [{ id: 'lx2def', nome: 'Supino', detalhe: '40 kg', criadoEm: '2026-11-10', extraItem: 'x' }] }],
    feitos: { '2026-11-16': ['lx2def'] },
    campoDesconhecido: { a: 1 },
  };
  const bruto = JSON.stringify(v1);

  test('registro antigo vira o formato novo com os padrões', () => {
    const { dados, migrou, deVersao } = R.migrar(bruto);
    assert.equal(migrou, true);
    assert.equal(deVersao, 1);
    assert.equal(dados.schemaVersion, 2);
    assert.deepEqual(dados.tarefas, []);
    assert.deepEqual(dados.ajustes, { tema: 'system' });
    assert.deepEqual(dados.feitos, v1.feitos);
    const s = dados.secoes[0];
    assert.equal(s.corToken, 'blue');
    assert.equal(s.cor, '#7c5cff');
    assert.deepEqual(s.itens[0], { ...v1.secoes[0].itens[0], notas: null, horario: null, dias: [1, 2, 3, 4, 5, 6, 7] });
  });
  test('rodar a migração duas vezes dá o mesmo resultado', () => {
    const uma = R.migrar(bruto).dados;
    const duas = R.migrar(JSON.stringify(uma));
    assert.equal(duas.migrou, false);
    assert.deepEqual(duas.dados, uma);
  });
  test('campo desconhecido é preservado na raiz, na seção e no item', () => {
    const { dados } = R.migrar(bruto);
    assert.deepEqual(dados.campoDesconhecido, { a: 1 });
    assert.equal(dados.secoes[0].extraSecao, 1);
    assert.equal(dados.secoes[0].itens[0].extraItem, 'x');
  });
  test('seção sem itens ganha lista vazia', () => {
    const { dados } = R.migrar(JSON.stringify({ secoes: [{ id: 's', nome: 'X' }] }));
    assert.deepEqual(dados.secoes[0].itens, []);
  });
  test('sem dados salvos começa vazio e não marca migração', () => {
    const r = R.migrar(null);
    assert.equal(r.migrou, false);
    assert.deepEqual(r.dados, R.vazio());
  });
  test('JSON corrompido, formato desconhecido ou versão mais nova falham sem devolver dados', () => {
    assert.throws(() => R.migrar('{"secoes":['));
    assert.throws(() => R.migrar('{"itens":[]}'));
    assert.throws(() => R.migrar('[]'));
    assert.throws(() => R.migrar(JSON.stringify({ schemaVersion: 3, secoes: [] })));
  });
  test('dias inválidos voltam para todos os dias; dias válidos são ordenados sem repetição', () => {
    const d = (dias) => R.migrar(JSON.stringify({ schemaVersion: 2, secoes: [{ id: 's', itens: [{ id: 'i', criadoEm: HOJE, dias }] }] })).dados.secoes[0].itens[0].dias;
    assert.deepEqual(d([]), [1, 2, 3, 4, 5, 6, 7]);
    assert.deepEqual(d([9, 'x']), [1, 2, 3, 4, 5, 6, 7]);
    assert.deepEqual(d([5, 1, 3, 1]), [1, 3, 5]);
  });
});

describe('dias da semana dos itens', () => {
  test('diaSemana: 1 = segunda ... 7 = domingo', () => {
    assert.equal(R.diaSemana('2026-11-16'), 1);
    assert.equal(R.diaSemana('2026-11-20'), 5);
    assert.equal(R.diaSemana('2026-11-22'), 7);
  });
  test('item só entra nos dias escolhidos', () => {
    const d = base([item('a', '2026-11-01', { dias: [1, 3, 5] }), item('b')]);
    assert.deepEqual(R.itensDoDia(d, '2026-11-16').map(i => i.id), ['a', 'b']);
    assert.deepEqual(R.itensDoDia(d, '2026-11-17').map(i => i.id), ['b']);
  });
  test('15 completo, 16 sem itens no dia, 17 completo → 2 (dia sem itens é pulado)', () => {
    const d = base([item('a', '2026-11-01', { dias: [2, 7] })], { '2026-11-15': ['a'], '2026-11-17': ['a'] });
    assert.equal(R.itensDoDia(d, '2026-11-16').length, 0);
    assert.equal(R.sequencia(d, HOJE), 2);
  });
  test('resumo dos dias', () => {
    assert.equal(R.resumoDias([1, 2, 3, 4, 5, 6, 7]), 'Todo dia');
    assert.equal(R.resumoDias([1, 2, 3, 4, 5]), 'Seg a sex');
    assert.equal(R.resumoDias([6, 7]), 'Fim de semana');
    assert.equal(R.resumoDias([5, 1, 3]), 'Seg, qua, sex');
  });
});

describe('textos de data e ordem do dia', () => {
  test('cabeçalho por extenso e formato curto dos itens', () => {
    assert.equal(R.dataExtenso('2026-11-17'), 'terça-feira, 17 de novembro');
    assert.equal(R.dataExtenso('2026-11-16'), 'segunda-feira, 16 de novembro');
    assert.equal(R.dataCurta('2026-11-17'), 'ter, 17 nov');
    assert.equal(R.dataCurta('2026-11-22'), 'dom, 22 nov');
  });
  test('Hoje, Amanhã e Ontem quando couber', () => {
    assert.equal(R.rotuloDia(HOJE, HOJE), 'Hoje');
    assert.equal(R.rotuloDia('2026-11-18', HOJE), 'Amanhã');
    assert.equal(R.rotuloDia('2026-11-16', HOJE), 'Ontem');
    assert.equal(R.rotuloDia('2026-11-20', HOJE), 'sex, 20 nov');
  });
  test('itens com horário primeiro, em ordem crescente; sem horário mantêm a ordem de criação', () => {
    const itens = [item('sem1'), item('h14', HOJE, { horario: '14:30' }), item('sem2'), item('h07', HOJE, { horario: '07:00' }), item('h00', HOJE, { horario: '00:00' })];
    assert.deepEqual(R.ordenarItens(itens).map(i => i.id), ['h00', 'h07', 'h14', 'sem1', 'sem2']);
  });
});
