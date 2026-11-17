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

describe('validação do editor', () => {
  test('título obrigatório, de 1 a 120 caracteres depois do trim', () => {
    assert.equal(R.validarTitulo('   '), 'Digite um título.');
    assert.equal(R.validarTitulo(''), 'Digite um título.');
    assert.equal(R.validarTitulo('a'.repeat(120)), null);
    assert.equal(R.validarTitulo('  ' + 'a'.repeat(120) + '  '), null);
    assert.equal(R.validarTitulo('a'.repeat(121)), 'Máximo de 120 caracteres.');
  });
  test('título só com emoji conta caracteres, não unidades de código', () => {
    assert.equal(R.validarTitulo('🏋️'), null);
    assert.equal(R.validarTitulo('😀'.repeat(120)), null);
    assert.equal(R.validarTitulo('😀'.repeat(121)), 'Máximo de 120 caracteres.');
  });
  test('nome da seção: 1 a 24 caracteres, único sem diferenciar maiúsculas, até 20 seções', () => {
    const secoes = [{ id: 'a', nome: 'Trabalho' }];
    assert.equal(R.validarNomeSecao('', secoes), 'Digite um nome.');
    assert.equal(R.validarNomeSecao('x'.repeat(24), secoes), null);
    assert.equal(R.validarNomeSecao('x'.repeat(25), secoes), 'Máximo de 24 caracteres.');
    assert.equal(R.validarNomeSecao('TRABALHO', secoes), 'Já existe uma seção com esse nome.');
    assert.equal(R.validarNomeSecao('Trabalho', secoes, 'a'), null);
    const vinte = Array.from({ length: 20 }, (_, i) => ({ id: 's' + i, nome: 'S' + i }));
    assert.equal(R.validarNomeSecao('Nova', vinte), 'Máximo de 20 seções.');
    assert.equal(R.validarNomeSecao('S0 renomeada', vinte, 's0'), null);
  });
  test('busca ignora maiúsculas e acentos', () => {
    assert.equal(R.semAcento('  Saúde e AÇÃO '), 'saude e acao');
  });
});

describe('tarefas avulsas', () => {
  const t = (id, extra = {}) => ({ id, title: 'Tarefa ' + id, notes: null, dueDate: HOJE, dueTime: null, priority: 'medium', categoryId: null, completedAt: null, createdAt: '2026-11-10T12:00:00.000Z', updatedAt: '2026-11-10T12:00:00.000Z', ...extra });
  test('ordem de "de hoje": horário crescente, depois prioridade, depois criação mais antiga', () => {
    const ts = [t('baixa', { priority: 'low' }), t('h15', { dueTime: '15:00', priority: 'low' }), t('alta2', { priority: 'high', createdAt: '2026-11-12T00:00:00.000Z' }),
      t('h08', { dueTime: '08:00' }), t('alta1', { priority: 'high', createdAt: '2026-11-11T00:00:00.000Z' }), t('media')];
    assert.deepEqual(R.ordenarTarefasDia(ts).map(x => x.id), ['h08', 'h15', 'alta1', 'alta2', 'media', 'baixa']);
  });
  test('rotina e avulsas juntas: horários primeiro; sem horário, rotina antes das avulsas', () => {
    const itens = [item('r1'), item('r9', HOJE, { horario: '09:00' })];
    const ts = [t('a7', { dueTime: '07:00' }), t('aSem', { priority: 'high' })];
    assert.deepEqual(R.ordenarDia(itens, ts).map(e => e.obj.id), ['a7', 'r9', 'r1', 'aSem']);
  });
  test('atrasadas: data mais antiga primeiro, depois prioridade', () => {
    const ts = [t('d16', { dueDate: '2026-11-16' }), t('d15b', { dueDate: '2026-11-15', priority: 'low' }), t('d15a', { dueDate: '2026-11-15', priority: 'high' })];
    assert.deepEqual(R.ordenarAtrasadas(ts).map(x => x.id), ['d15a', 'd15b', 'd16']);
  });
  test('tarefa de ontem não concluída = atrasada; concluída = não atrasada; de hoje nunca é atrasada', () => {
    assert.equal(R.atrasada(t('a', { dueDate: '2026-11-16' }), HOJE), true);
    assert.equal(R.atrasada(t('a', { dueDate: '2026-11-16', completedAt: '2026-11-17T10:00:00.000Z' }), HOJE), false);
    assert.equal(R.atrasada(t('a', { dueTime: '00:00' }), HOJE), false);
  });
  test('concluídas: completedAt mais recente primeiro', () => {
    const ts = [t('a', { completedAt: '2026-11-17T10:00:00.000Z' }), t('b', { completedAt: '2026-11-17T15:00:00.000Z' })];
    assert.deepEqual(R.ordenarConcluidas(ts).map(x => x.id), ['b', 'a']);
  });
  test('progresso do dia soma rotina e avulsas; avulsa só conta como feita se concluída até o dia', () => {
    const d = { ...base([item('r')], { [HOJE]: ['r'] }), tarefas: [t('a', { completedAt: '2026-11-17T13:00:00.000Z' }), t('b'), t('c', { dueDate: '2026-11-16', completedAt: '2026-11-17T13:00:00.000Z' })] };
    assert.deepEqual(R.resumoDia(d, HOJE), { total: 3, feitas: 2, pct: 67 });
    assert.deepEqual(R.resumoDia(d, '2026-11-16'), { total: 2, feitas: 0, pct: 0 });
  });
  test('tarefa do dia 15 concluída só no dia 16 não conta para o dia 15', () => {
    const d = { secoes: [], feitos: {}, tarefas: [t('a', { dueDate: '2026-11-15', completedAt: '2026-11-16T15:00:00.000Z' })] };
    assert.equal(R.resumoDia(d, '2026-11-15').feitas, 0);
  });
  test('Próximos: Amanhã, os 6 dias seguintes, Mais tarde e Sem data; concluídas ficam de fora', () => {
    const ts = [t('am', { dueDate: '2026-11-18' }), t('d19', { dueDate: '2026-11-19' }), t('d24', { dueDate: '2026-11-24' }), t('tarde', { dueDate: '2026-11-25' }),
      t('semVelha', { dueDate: null, createdAt: '2026-11-01T00:00:00.000Z' }), t('semNova', { dueDate: null, createdAt: '2026-11-15T00:00:00.000Z' }),
      t('feita', { dueDate: '2026-11-18', completedAt: '2026-11-17T09:00:00.000Z' }), t('hoje')];
    const g = R.gruposProximos(ts, HOJE);
    assert.deepEqual(g.map(x => x.titulo), ['Amanhã', 'quinta-feira, 19 de nov.', 'terça-feira, 24 de nov.', 'Mais tarde', 'Sem data']);
    assert.deepEqual(g[0].tarefas.map(x => x.id), ['am']);
    assert.deepEqual(g[4].tarefas.map(x => x.id), ['semNova', 'semVelha']);
  });
  test('busca por título e notas, sem diferenciar maiúsculas nem acentos, só não concluídas', () => {
    const ts = [t('a', { title: 'Consulta no médico' }), t('b', { title: 'Mercado', notes: 'Comprar AÇÚCAR' }), t('c', { title: 'Médico', completedAt: '2026-11-17T09:00:00.000Z' })];
    assert.deepEqual(R.buscarTarefas(ts, 'medico').map(x => x.id), ['a']);
    assert.deepEqual(R.buscarTarefas(ts, 'acucar').map(x => x.id), ['b']);
  });
  test('dataLocal converte o ISO em UTC para o dia do aparelho', () => {
    assert.equal(R.dataLocal('2026-11-18T02:30:00.000Z'), '2026-11-17');
  });
});

describe('progresso da semana', () => {
  const QUI = '2026-11-19';
  const tf = (id, dueDate, completedAt = null) => ({ id, title: id, notes: null, dueDate, dueTime: null, priority: 'medium', categoryId: null, completedAt, createdAt: '2026-11-01T12:00:00.000Z', updatedAt: '2026-11-01T12:00:00.000Z' });
  const noDia = d => d + 'T15:00:00.000Z';
  const dados = tarefas => ({ secoes: [], feitos: {}, tarefas });
  test('semana vai de segunda a domingo', () => {
    assert.deepEqual(R.semanaDe(QUI), ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22']);
    assert.equal(R.semanaDe('2026-11-22')[0], '2026-11-16');
  });
  test('10 tarefas de 16 a 19, 8 concluídas a tempo → 80%', () => {
    const ts = [];
    ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19'].forEach((d, i) => { for (let k = 0; k < (i < 2 ? 3 : 2); k++) ts.push(tf(d + k, d)); });
    for (let i = 0; i < 8; i++) ts[i].completedAt = noDia(ts[i].dueDate);
    assert.equal(ts.length, 10);
    assert.equal(R.taxaSemana(dados(ts), QUI).pct, 80);
  });
  test('3 de 3 → 100%; 2 de 3 → 67%; 1 de 8 → 13% (12,5 arredonda para cima); 0 tarefas → —', () => {
    const tres = n => Array.from({ length: 3 }, (_, i) => tf('t' + i, '2026-11-17', i < n ? noDia('2026-11-17') : null));
    assert.equal(R.taxaSemana(dados(tres(3)), QUI).pct, 100);
    assert.equal(R.taxaSemana(dados(tres(2)), QUI).pct, 67);
    const oito = Array.from({ length: 8 }, (_, i) => tf('o' + i, '2026-11-18', i === 0 ? noDia('2026-11-18') : null));
    assert.equal(R.taxaSemana(dados(oito), QUI).pct, 13);
    assert.equal(R.taxaSemana(dados([]), QUI).pct, null);
    assert.equal(R.textoTaxa(null), 'Esta semana: —');
    assert.equal(R.textoTaxa(82), 'Esta semana: 82%');
  });
  test('concluída depois do prazo não conta na taxa; tarefas depois de hoje ficam de fora', () => {
    const ts = [tf('a', '2026-11-16', noDia('2026-11-18')), tf('b', '2026-11-20')];
    assert.deepEqual(R.taxaSemana(dados(ts), QUI), { feitas: 0, total: 1, pct: 0 });
  });
  test('barras: conclusões por dia (data local), com hoje destacado', () => {
    const d = { ...base([item('r')], { '2026-11-16': ['r', 'apagado'], '2026-11-19': ['r'] }), tarefas: [tf('a', '2026-11-10', noDia('2026-11-19')), tf('b', null, noDia('2026-11-17'))] };
    const b = R.barrasSemana(d, QUI);
    assert.deepEqual(b.map(x => x.valor), [1, 1, 0, 2, 0, 0, 0]);
    assert.deepEqual(b.map(x => x.hoje), [false, false, false, true, false, false, false]);
    assert.equal(R.totalConcluidas(d), 4);
  });
  test('texto da sequência', () => {
    assert.equal(R.textoSequencia(0), 'Comece hoje sua sequência');
    assert.equal(R.textoSequencia(1), 'Sequência: 1 dia');
    assert.equal(R.textoSequencia(4), 'Sequência: 4 dias');
  });
});
