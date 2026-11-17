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
