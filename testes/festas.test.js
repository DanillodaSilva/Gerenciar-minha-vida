process.env.TZ = 'America/Sao_Paulo';
const test = require('node:test');
const assert = require('node:assert/strict');
const F = require('../festas.js');
const R = require('../regras.js');

const TODAS = { ativas: true, desligadas: [], aniversario: null };
const com = extra => ({ ...TODAS, ...extra });
const ativa = (d, aj) => F.festaAtiva(d, aj || TODAS);
const janela = (ano, id) => F.janelasDoAno(ano).find(j => j.id === id);
const intervalo = (a, b) => { const r = []; for (let d = a; d <= b; d = F.somarDias(d, 1)) r.push(d); return r; };
const montar = (inicio, feitos) => {
  const f = {};
  feitos.forEach(d => { f[d] = ['i']; });
  const json = JSON.stringify({ schemaVersion: 4, secoes: [{ id: 's', nome: 'X', itens: [{ id: 'i', nome: 'Item', criadoEm: inicio }] }], feitos: f, tarefas: [] });
  return R.migrar(json).dados;
};

test('páscoa', () => {
  const esperado = { 2008: '2008-03-23', 2024: '2024-03-31', 2025: '2025-04-20', 2026: '2026-04-05', 2027: '2027-03-28', 2028: '2028-04-16', 2038: '2038-04-25' };
  for (const [ano, data] of Object.entries(esperado)) assert.equal(F.pascoa(Number(ano)), data, 'ano ' + ano);
});

test('carnaval: terça e sábado', () => {
  const casos = [[2026, '2026-02-17', '2026-02-14'], [2027, '2027-02-09', null], [2028, '2028-02-29', '2028-02-26']];
  for (const [ano, terca, sabado] of casos) {
    const j = janela(ano, 'carnaval');
    assert.equal(j.auge[1], terca, 'terça ' + ano);
    if (sabado) assert.equal(j.auge[0], sabado, 'sábado ' + ano);
  }
});

test('somarDias atravessa mês e ano bissexto', () => {
  assert.equal(F.somarDias('2026-12-31', 1), '2027-01-01');
  assert.equal(F.somarDias('2028-02-28', 1), '2028-02-29');
});

test('festaAtiva: datas do calendário', () => {
  const casos = [
    ['2026-11-30', null],
    ['2026-12-01', 'natal', 'chegando', 24],
    ['2026-12-23', 'natal', 'chegando', 2],
    ['2026-12-24', 'natal', 'auge'],
    ['2026-12-25', 'natal', 'auge'],
    ['2026-12-26', 'ano-novo', 'chegando', 6, 2027],
    ['2026-12-31', 'ano-novo', 'auge'],
    ['2027-01-01', 'ano-novo', 'auge', 0, 2027],
    ['2027-01-02', null],
    ['2026-02-07', 'carnaval', 'chegando', 7],
    ['2026-02-13', 'carnaval', 'chegando'],
    ['2026-02-17', 'carnaval', 'auge'],
    ['2026-02-18', null],
    ['2028-02-29', 'carnaval', 'auge'],
    ['2026-03-28', null],
    ['2026-03-29', 'pascoa', 'chegando', 7],
    ['2026-04-03', 'pascoa', 'chegando'],
    ['2026-04-05', 'pascoa', 'auge'],
    ['2026-04-06', null],
    ['2026-06-11', 'namorados', 'chegando'],
    ['2026-06-12', 'namorados', 'auge'],
    ['2026-06-13', 'junina', 'chegando'],
    ['2026-06-29', 'junina', 'auge'],
    ['2026-06-30', null],
    ['2026-10-31', 'halloween', 'auge'],
    ['2026-11-01', null],
  ];
  for (const [d, id, fase, diasPara, ano] of casos) {
    const r = ativa(d);
    if (id === null) { assert.equal(r, null, d); continue; }
    assert.ok(r, d + ' não retornou festa');
    assert.equal(r.id, id, d + ' id');
    assert.equal(r.fase, fase, d + ' fase');
    if (diasPara !== undefined) assert.equal(r.diasPara, diasPara, d + ' diasPara');
    if (ano !== undefined) assert.equal(r.ano, ano, d + ' ano');
  }
});

test('textos de contagem regressiva', () => {
  const casos = [
    ['2026-12-01', 'Faltam 24 dias para o Natal'],
    ['2026-12-26', 'Faltam 6 dias para 2027'],
    ['2026-02-13', 'Falta 1 dia para o Carnaval'],
    ['2026-04-03', 'Faltam 2 dias para a Páscoa'],
    ['2026-06-11', 'Falta 1 dia para o Dia dos Namorados'],
    ['2026-06-13', 'Faltam 11 dias para o São João'],
  ];
  for (const [d, texto] of casos) assert.equal(F.textoChegando(ativa(d)), texto, d);
});

test('saudações com nome', () => {
  const casos = [
    ['2026-12-24', 'Feliz véspera de Natal, Ana!'],
    ['2026-12-31', 'Último dia de 2026, Ana!'],
    ['2027-01-01', 'Feliz 2027, Ana!'],
  ];
  for (const [d, texto] of casos) assert.equal(F.saudacaoFesta(ativa(d), d, 'Ana'), texto, d);
});

test('saudação: nome ausente, presente e só espaços', () => {
  const f = ativa('2026-12-25');
  assert.equal(F.saudacaoFesta(f, '2026-12-25', ''), 'Feliz Natal!');
  assert.equal(F.saudacaoFesta(f, '2026-12-25', undefined), 'Feliz Natal!');
  assert.equal(F.saudacaoFesta(f, '2026-12-25', 'Ana'), 'Feliz Natal, Ana!');
  assert.equal(F.saudacaoFesta(f, '2026-12-25', '   '), 'Feliz Natal!');
});

test('aniversário 03-15', () => {
  const aj = com({ aniversario: '03-15' });
  const a = ativa('2026-03-12', aj);
  assert.equal(a.id, 'aniversario');
  assert.equal(a.fase, 'chegando');
  assert.equal(F.textoChegando(a), 'Faltam 3 dias para o seu aniversário');
  assert.equal(ativa('2026-03-15', aj).fase, 'auge');
  assert.equal(ativa('2026-03-16', aj), null);
});

test('aniversário 02-29 em ano não bissexto e bissexto', () => {
  const aj = com({ aniversario: '02-29' });
  assert.deepEqual([ativa('2027-02-28', aj).id, ativa('2027-02-28', aj).fase], ['aniversario', 'auge']);
  assert.equal(ativa('2027-02-25', aj).fase, 'chegando');
  assert.deepEqual([ativa('2028-02-29', aj).id, ativa('2028-02-29', aj).fase], ['aniversario', 'auge']);
});

test('prioridade do aniversário sobre festas', () => {
  const natal = com({ aniversario: '12-25' });
  assert.equal(ativa('2026-12-25', natal).id, 'aniversario');
  assert.equal(ativa('2026-12-24', natal).id, 'natal');
  const ano = com({ aniversario: '01-01' });
  assert.deepEqual([ativa('2026-12-29', ano).id, ativa('2026-12-29', ano).fase], ['aniversario', 'chegando']);
  assert.equal(ativa('2026-12-31', ano).id, 'ano-novo');
  assert.deepEqual([ativa('2027-01-01', ano).id, ativa('2027-01-01', ano).fase], ['aniversario', 'auge']);
});

test('ajustes: festas desligadas e desativadas', () => {
  const sem = com({ desligadas: ['natal'] });
  assert.equal(ativa('2026-12-24', sem), null);
  assert.equal(ativa('2026-12-26', sem).id, 'ano-novo');
  const datas = ['2026-12-01', '2026-12-24', '2026-12-26', '2027-01-01', '2026-02-07', '2026-02-17', '2026-03-29', '2026-04-05', '2026-06-12', '2026-06-13', '2026-10-31'];
  for (const d of datas) assert.equal(ativa(d, com({ ativas: false })), null, d);
});

test('contagem para o ano novo', () => {
  const c = (h, m, s) => F.contagemAnoNovo(new Date(2026, 11, 31, h, m, s));
  assert.equal(c(18, 47, 0), 'Faltam 5 h 13 min para 2027');
  assert.equal(c(18, 47, 30), 'Faltam 5 h 13 min para 2027');
  assert.equal(c(23, 0, 0), 'Falta 1 h para 2027');
  assert.equal(c(22, 59, 0), 'Falta 1 h 1 min para 2027');
  assert.equal(c(23, 59, 0), 'Falta 1 min para 2027');
  assert.equal(c(23, 59, 30), 'Falta menos de 1 minuto para 2027');
});

test('retrospectiva (a): janeiro e março', () => {
  const dados = montar('2026-01-01', [...intervalo('2026-01-01', '2026-01-10'), ...intervalo('2026-03-01', '2026-03-03')]);
  const r = F.retrospectiva(dados, 2026);
  assert.equal(r.ano, 2026);
  assert.equal(r.diasContaram, 13);
  assert.equal(r.maiorSequencia, 10);
  assert.equal(r.mesMaisConstante, 'Janeiro');
});

test('retrospectiva (b): poucos dados retorna null', () => {
  const dados = montar('2026-12-27', intervalo('2026-12-27', '2026-12-31'));
  assert.equal(F.retrospectiva(dados, 2026), null);
});

test('retrospectiva (c): sequência não atravessa o ano', () => {
  const dados = montar('2025-12-28', [...intervalo('2025-12-28', '2026-01-05'), ...intervalo('2026-02-01', '2026-02-03')]);
  const r = F.retrospectiva(dados, 2026);
  assert.equal(r.maiorSequencia, 5);
  assert.equal(r.diasContaram, 8);
});

test('lerSimulacao', () => {
  assert.equal(F.lerSimulacao('localhost', '?data=2026-12-24').data, '2026-12-24');
  assert.equal(F.lerSimulacao('127.0.0.1', '?data=2026-12-24').data, '2026-12-24');
  assert.equal(F.lerSimulacao('exemplo.github.io', '?data=2026-12-24'), null);
  assert.equal(F.lerSimulacao('localhost', '?data=2026-02-30'), null);
});

test('parseDia usa a data local', () => {
  assert.equal(R.parseDia('2026-12-24').getDate(), 24);
});

test('normalizarFestas: padrão', () => {
  assert.deepEqual(R.normalizarFestas(undefined), { ativas: true, desligadas: [], aniversario: null, cartaoFechadoEm: null, retrospectivaVista: null });
  assert.deepEqual(R.normalizarFestas({}), R.normalizarFestas(null));
});

test('normalizarFestas: aniversário e ids', () => {
  assert.equal(R.normalizarFestas({ aniversario: '02-29' }).aniversario, '02-29');
  assert.equal(R.normalizarFestas({ aniversario: '02-30' }).aniversario, null);
  assert.equal(R.normalizarFestas({ aniversario: '13-01' }).aniversario, null);
  assert.deepEqual(R.normalizarFestas({ desligadas: ['natal', 'xyz', 'pascoa'] }).desligadas, ['natal', 'pascoa']);
});
