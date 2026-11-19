const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const W = require('../widget.js');

const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'widget-retrato.json'), 'utf8'));
const clonar = x => JSON.parse(JSON.stringify(x));

describe('fixture compartilhado com o Java', () => {
  test('calculado em 20/11 dá o esperado', () => {
    const r = W.calcularDoRetrato(fixture.retrato, fixture.pendencias, fixture.calcularEm);
    const e = fixture.esperado;
    assert.equal(r.desatualizado, false);
    assert.equal(r.folhas, e.folhas);
    assert.equal(r.sequencia, e.sequencia);
    assert.equal(r.estagio, e.estagio);
    assert.equal(r.nomeEstagio, e.nomeEstagio);
    assert.equal(r.itensHoje, e.itensHoje);
    assert.equal(r.feitosHoje, e.feitosHoje);
    assert.equal(r.pctHoje, e.pctHoje);
    assert.deepEqual({ feitos: r.resumo('2026-11-18').feitos, total: r.resumo('2026-11-18').total }, e.dia18);
    assert.deepEqual({ feitos: r.resumo('2026-11-19').feitos, total: r.resumo('2026-11-19').total }, e.dia19);
  });
  test('virada de 1 dia: 18/11 completo soma folha e sequência', () => {
    const r = W.calcularDoRetrato(fixture.retrato, fixture.pendencias, '2026-11-19');
    assert.equal(r.folhas, 13);
    assert.equal(r.sequencia, 6);
    assert.equal(r.feitosHoje, 1);
    assert.equal(r.itensHoje, 4);
  });
  test('no próprio dia, o dia completo já conta folha', () => {
    const r = W.calcularDoRetrato(fixture.retrato, fixture.pendencias, '2026-11-18');
    assert.equal(r.folhas, 13);
    assert.equal(r.sequencia, 5);
  });
  test('mais de 7 dias depois fica desatualizado', () => {
    assert.equal(W.calcularDoRetrato(fixture.retrato, fixture.pendencias, '2026-11-25').desatualizado, false);
    assert.equal(W.calcularDoRetrato(fixture.retrato, fixture.pendencias, '2026-11-26').desatualizado, true);
  });
  test('vale a pendência mais recente, em qualquer ordem', () => {
    const inv = fixture.pendencias.slice().reverse();
    assert.equal(W.calcularDoRetrato(fixture.retrato, inv, '2026-11-19').folhas, 13);
  });
  test('dia sem itens não mexe em folhas nem sequência', () => {
    const a = W.calcularDoRetrato(fixture.retrato, fixture.pendencias, '2026-11-22');
    const b = W.calcularDoRetrato(fixture.retrato, fixture.pendencias, '2026-11-23');
    assert.equal(a.folhas, b.folhas);
    assert.equal(a.sequencia, b.sequencia);
  });
  test('piso 0 de folhas', () => {
    const ret = clonar(fixture.retrato);
    ret.arvore.folhasAteOntem = 0;
    assert.equal(W.calcularDoRetrato(ret, [], '2026-11-20').folhas, 0);
  });
});

describe('pendências do widget', () => {
  const dados = () => ({
    secoes: [{ id: 's', nome: 'Manhã', itens: [{ id: 'i1', nome: 'Água', criadoEm: '2026-11-01', dias: [1, 2, 3, 4, 5, 6, 7] }, { id: 'i2', nome: 'Alongar', criadoEm: '2026-11-01', dias: [1, 2, 3, 4, 5, 6, 7] }] }],
    feitos: { '2026-11-17': ['i1'] },
    tarefas: [{ id: 't1', title: 'Lista', dueDate: '2026-11-18', completedAt: null, categoryId: null }],
  });
  const p = (data, id, feito, em, tipo = 'rotina') => ({ data, id, tipo, feito, em });
  test('aplica na ordem de em e grava o estado final', () => {
    const d = dados();
    const r = W.aplicarPendencias(d, [p('2026-11-18', 'i1', false, '2026-11-18T11:00:00Z'), p('2026-11-18', 'i1', true, '2026-11-18T10:00:00Z')], '2026-11-18');
    assert.equal(d.feitos['2026-11-18'], undefined);
    assert.equal(r.ate, '2026-11-18T11:00:00Z');
  });
  test('é idempotente', () => {
    const d = dados(), lista = [p('2026-11-18', 'i2', true, '2026-11-18T10:00:00Z')];
    W.aplicarPendencias(d, lista, '2026-11-18');
    const r = W.aplicarPendencias(d, lista, '2026-11-18');
    assert.deepEqual(d.feitos['2026-11-18'], ['i2']);
    assert.equal(r.aplicadas, 0);
  });
  test('ignora item apagado e data futura, sem perder o resto', () => {
    const d = dados();
    const r = W.aplicarPendencias(d, [p('2026-11-18', 'sumiu', true, '2026-11-18T09:00:00Z'), p('2026-11-19', 'i1', true, '2026-11-18T09:30:00Z'), p('2026-11-17', 'i2', true, '2026-11-18T10:00:00Z')], '2026-11-18');
    assert.equal(r.ignoradas, 2);
    assert.equal(r.aplicadas, 1);
    assert.deepEqual(d.feitos['2026-11-17'], ['i1', 'i2']);
    assert.equal(d.feitos['2026-11-19'], undefined);
  });
  test('marca e desmarca tarefa', () => {
    const d = dados();
    W.aplicarPendencias(d, [p('2026-11-18', 't1', true, '2026-11-18T10:00:00Z', 'tarefa')], '2026-11-18');
    assert.equal(d.tarefas[0].completedAt, '2026-11-18T10:00:00Z');
    W.aplicarPendencias(d, [p('2026-11-18', 't1', false, '2026-11-18T12:00:00Z', 'tarefa')], '2026-11-18');
    assert.equal(d.tarefas[0].completedAt, null);
  });
});

describe('retrato', () => {
  const d = {
    secoes: [{ id: 's', nome: 'Manhã', itens: [{ id: 'i1', nome: 'x'.repeat(80), criadoEm: '2026-11-01', dias: [1, 2, 3, 4, 5, 6, 7] }] }],
    feitos: { '2026-11-17': ['i1'], '2026-11-16': ['i1'] },
    tarefas: [],
    ajustes: { mostrarFaculdade: true },
    faculdade: { semestre: null, materias: [] },
  };
  test('formato v1 com hoje e mais 7 dias', () => {
    const r = W.montarRetrato(d, '2026-11-18');
    assert.equal(r.versao, 1);
    assert.equal(r.hoje, '2026-11-18');
    assert.equal(r.dias.length, 8);
    assert.equal(r.dias[7].data, '2026-11-25');
    assert.deepEqual(Object.keys(r.dias[0].itens[0]), ['id', 'tipo', 'titulo', 'subtitulo', 'feito']);
    assert.equal(r.arvore.estagios.length, 10);
    assert.equal(r.semestreConfigurado, false);
    assert.deepEqual(r.aulas, []);
  });
  test('título com até 60 caracteres e reticências', () => {
    const t = W.montarRetrato(d, '2026-11-18').dias[0].itens[0].titulo;
    assert.equal(Array.from(t).length, 60);
    assert.ok(t.endsWith('…'));
  });
  test('sequência até ontem e folhas até ontem', () => {
    const r = W.montarRetrato(d, '2026-11-18');
    assert.equal(r.sequencia.ateOntem, 2);
    assert.equal(r.arvore.folhasAteOntem, 2);
  });
  test('Faculdade escondida não publica aulas', () => {
    const r = W.montarRetrato({ ...d, ajustes: { mostrarFaculdade: false } }, '2026-11-18');
    assert.equal(r.faculdadeVisivel, false);
    assert.deepEqual(r.aulas, []);
  });
});
