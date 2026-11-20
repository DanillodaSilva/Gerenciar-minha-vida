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
    assert.equal(r.tentativas, e.tentativas);
    assert.equal(r.folhasHoje, e.folhasHoje);
    assert.equal(r.estagio, e.estagio);
    assert.equal(r.nomeEstagio, e.nomeEstagio);
    assert.equal(r.itensHoje, e.itensHoje);
    assert.equal(r.feitosHoje, e.feitosHoje);
    assert.equal(r.pctHoje, e.pctHoje);
    assert.deepEqual({ feitos: r.resumo('2026-11-18').feitos, total: r.resumo('2026-11-18').total }, e.dia18);
    assert.deepEqual({ feitos: r.resumo('2026-11-19').feitos, total: r.resumo('2026-11-19').total }, e.dia19);
  });
  test('virada de 1 dia: 18/11 completo soma 5 e hoje 1 de 4 é o 7.º dia tentado', () => {
    const r = W.calcularDoRetrato(fixture.retrato, fixture.pendencias, '2026-11-19');
    assert.equal(r.folhas, 22);
    assert.equal(r.folhasHoje, 5);
    assert.equal(r.tentativas, 7);
    assert.equal(r.sequencia, 6);
    assert.equal(r.feitosHoje, 1);
    assert.equal(r.itensHoje, 4);
  });
  test('no próprio dia, o dia completo já conta 5 folhas', () => {
    const r = W.calcularDoRetrato(fixture.retrato, fixture.pendencias, '2026-11-18');
    assert.equal(r.folhas, 17);
    assert.equal(r.sequencia, 5);
  });
  test('mais de 7 dias depois fica desatualizado', () => {
    assert.equal(W.calcularDoRetrato(fixture.retrato, fixture.pendencias, '2026-11-25').desatualizado, false);
    assert.equal(W.calcularDoRetrato(fixture.retrato, fixture.pendencias, '2026-11-26').desatualizado, true);
  });
  test('vale a pendência mais recente, em qualquer ordem', () => {
    const inv = fixture.pendencias.slice().reverse();
    assert.equal(W.calcularDoRetrato(fixture.retrato, inv, '2026-11-19').folhas, 22);
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
    ret.dias.forEach(d => d.itens.forEach(i => { i.feito = false; }));
    const r = W.calcularDoRetrato(ret, [], '2026-11-20');
    assert.equal(r.folhas, 0);
    assert.equal(r.tentativas, 0);
  });
  test('retrato versão 1 sem tentativasAteOntem vale 0', () => {
    const ret = clonar(fixture.retrato);
    ret.versao = 1;
    delete ret.arvore.tentativasAteOntem;
    const r = W.calcularDoRetrato(ret, fixture.pendencias, '2026-11-20');
    assert.equal(r.tentativas, 2);
    assert.equal(r.folhas, 19);
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
  test('formato v2 com hoje e mais 7 dias', () => {
    const r = W.montarRetrato(d, '2026-11-18');
    assert.equal(r.versao, 2);
    assert.equal(r.arvore.tentativasAteOntem, 2);
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
    assert.equal(r.arvore.folhasAteOntem, 10);
  });
  test('Faculdade escondida não publica aulas', () => {
    const r = W.montarRetrato({ ...d, ajustes: { mostrarFaculdade: false } }, '2026-11-18');
    assert.equal(r.faculdadeVisivel, false);
    assert.deepEqual(r.aulas, []);
  });
});

describe('regra nova no retrato (mesmos casos do Java)', () => {
  const ret = (total, feitos, extra = {}) => ({
    versao: 2, hoje: '2026-11-10',
    dias: [{ data: '2026-11-10', itens: Array.from({ length: total }, (_, k) => ({ id: 'i' + k, tipo: 'rotina', titulo: 'I', subtitulo: 'S', feito: k < feitos })) }, { data: '2026-11-11', itens: [] }],
    arvore: { folhasAteOntem: 10, tentativasAteOntem: 0, estagios: [0, 5, 15, 35, 70, 140, 250, 400, 600, 1000], nomes: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'], ...extra },
    sequencia: { ateOntem: 0 }, faculdadeVisivel: false, semestreConfigurado: false, aulas: [],
  });
  const folhas = (total, feitos, extra) => W.calcularDoRetrato(ret(total, feitos, extra), [], '2026-11-11').folhas;
  test('faixas de 10 itens num dia encerrado', () => {
    const esperado = [-2, 1, 1, 2, 2, 3, 3, 4, 4, 5];
    [0, 1, 2, 3, 4, 5, 7, 8, 9, 10].forEach((k, i) => assert.equal(folhas(10, k), 10 + esperado[i], k + ' de 10'));
  });
  test('faixas sem arredondar', () => {
    assert.equal(folhas(12, 3), 12);
    assert.equal(folhas(3, 1), 12);
    assert.equal(folhas(3, 2), 13);
  });
  test('7.º dia tentado dá +3 de bônus', () => {
    assert.equal(folhas(10, 1, { tentativasAteOntem: 6 }), 14);
    assert.equal(W.calcularDoRetrato(ret(10, 1, { tentativasAteOntem: 6 }), [], '2026-11-11').tentativas, 7);
  });
  test('piso 0 com dia em branco', () => {
    assert.equal(folhas(10, 0, { folhasAteOntem: 1 }), 0);
  });
  test('hoje em 0% não perde e com bônus soma na hora', () => {
    const r = ret(10, 0, { tentativasAteOntem: 6 });
    assert.equal(W.calcularDoRetrato(r, [], '2026-11-10').folhas, 10);
    r.dias[0].itens[0].feito = true;
    const c = W.calcularDoRetrato(r, [], '2026-11-10');
    assert.equal(c.folhasHoje, 4);
    assert.equal(c.folhas, 14);
  });
});
