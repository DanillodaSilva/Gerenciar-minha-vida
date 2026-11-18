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

describe('migração v1 → atual', () => {
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
    assert.equal(dados.schemaVersion, R.SCHEMA);
    assert.deepEqual(dados.tarefas, []);
    assert.deepEqual(dados.ajustes, R.normalizarAjustes({}, true));
    assert.equal(dados.ajustes.boasVindasVista, true);
    assert.deepEqual(dados.feitos, v1.feitos);
    const s = dados.secoes[0];
    assert.equal(s.corToken, 'blue');
    assert.equal(s.cor, '#7c5cff');
    assert.deepEqual(s.itens[0], { ...v1.secoes[0].itens[0], notas: null, horario: null, dias: [1, 2, 3, 4, 5, 6, 7], lembreteMin: null });
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
    assert.throws(() => R.migrar(JSON.stringify({ schemaVersion: R.SCHEMA + 1, secoes: [] })));
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

describe('backup', () => {
  const atual = () => R.migrar(JSON.stringify({
    secoes: [{ id: 's1', nome: 'Treino', emoji: '🏋️', cor: '#ff5c6c', rotuloNome: 'Exercício', rotuloDetalhe: 'Carga', itens: [item('i1')] }],
    feitos: { '2026-11-16': ['i1'] },
    tarefas: [{ id: 'a1', title: 'Pagar conta', notes: null, dueDate: '2028-02-29', dueTime: '23:59', priority: 'high', categoryId: 's1', completedAt: null, createdAt: '2026-11-10T12:00:00.000Z', updatedAt: '2026-11-10T12:00:00.000Z' }],
  })).dados;
  test('exportar e importar devolve os mesmos dados', () => {
    const d = atual();
    const arquivo = JSON.stringify(R.montarBackup(d, '2026-11-17T18:00:00.000Z'));
    const b = JSON.parse(arquivo);
    assert.equal(b.app, 'minha-rotina');
    assert.equal(b.schemaVersion, R.SCHEMA);
    assert.deepEqual(R.lerBackup(arquivo), d);
  });
  test('backup antigo (formato v1, sem app) passa pela migração', () => {
    const d = R.lerBackup(JSON.stringify({ secoes: [{ id: 's', nome: 'X', cor: '#7c5cff', itens: [item('i')] }], feitos: {} }));
    assert.equal(d.schemaVersion, R.SCHEMA);
    assert.equal(d.secoes[0].corToken, 'blue');
  });
  test('backup inválido falha com a mensagem certa', () => {
    const msg = { message: 'Arquivo de backup inválido.' };
    const ok = R.montarBackup(atual(), '2026-11-17T18:00:00.000Z');
    const com = mudanca => JSON.stringify(mudanca(JSON.parse(JSON.stringify(ok))));
    assert.throws(() => R.lerBackup('não é json'), msg);
    assert.throws(() => R.lerBackup(com(b => ({ ...b, app: 'outro-app' }))), msg);
    assert.throws(() => R.lerBackup(com(b => ({ ...b, schemaVersion: R.SCHEMA + 1 }))), msg);
    assert.throws(() => R.lerBackup(com(b => { b.tarefas[0].title = '  '; return b; })), msg);
    assert.throws(() => R.lerBackup(com(b => { b.tarefas[0].dueDate = '2026-02-30'; return b; })), msg);
    assert.throws(() => R.lerBackup(com(b => { b.tarefas[0].dueDate = null; return b; })), msg);
    assert.throws(() => R.lerBackup(com(b => { b.tarefas[0].dueTime = '24:00'; return b; })), msg);
    assert.throws(() => R.lerBackup(com(b => { b.secoes[0].itens[0].criadoEm = '17/11/2026'; return b; })), msg);
  });
  test('horários 00:00 e 23:59 e a data 29/02/2028 são aceitos', () => {
    const ok = R.montarBackup(atual(), '2026-11-17T18:00:00.000Z');
    ok.tarefas[0].dueTime = '00:00';
    assert.equal(R.lerBackup(JSON.stringify(ok)).tarefas[0].dueDate, '2028-02-29');
  });
  test('conta itens da rotina e tarefas avulsas', () => assert.equal(R.contarTarefas(atual()), 2));
});

describe('migração v2 → v3 (lembretes)', () => {
  const v2 = { schemaVersion: 2, ajustes: { tema: 'dark' }, secoes: [{ id: 's', nome: 'X', corToken: 'teal', itens: [{ id: 'i', nome: 'Item', detalhe: '', criadoEm: '2026-11-01', notas: null, horario: '08:00', dias: [1, 2, 3, 4, 5, 6, 7] }] }], feitos: {},
    tarefas: [{ id: 'a', title: 'A', notes: null, dueDate: '2026-11-18', dueTime: '10:00', priority: 'medium', categoryId: null, completedAt: null, createdAt: '2026-11-10T12:00:00.000Z', updatedAt: '2026-11-10T12:00:00.000Z' }] };
  test('adiciona lembreteMin e reminderOffsetMin nulos, mantendo o resto', () => {
    const { dados, migrou, deVersao } = R.migrar(JSON.stringify(v2));
    assert.equal(migrou, true); assert.equal(deVersao, 2); assert.equal(dados.schemaVersion, R.SCHEMA);
    assert.equal(dados.secoes[0].itens[0].lembreteMin, null);
    assert.equal(dados.tarefas[0].reminderOffsetMin, null);
    assert.equal(dados.ajustes.tema, 'dark');
    assert.equal(R.migrar(JSON.stringify(dados)).migrou, false);
  });
  test('antecedência fora de 0, 10, 30 e 60 vira nula', () => {
    const x = JSON.parse(JSON.stringify(v2)); x.tarefas[0].reminderOffsetMin = 15; x.secoes[0].itens[0].lembreteMin = 30;
    const { dados } = R.migrar(JSON.stringify(x));
    assert.equal(dados.tarefas[0].reminderOffsetMin, null);
    assert.equal(dados.secoes[0].itens[0].lembreteMin, 30);
  });
});

describe('lembretes', () => {
  const agora = new Date(2026, 10, 17, 10, 0).getTime();
  const tf = (extra = {}) => ({ id: 'a', title: 'Dentista', notes: null, dueDate: '2026-11-17', dueTime: '14:30', priority: 'medium', categoryId: null, completedAt: null, createdAt: '2026-11-10T12:00:00.000Z', updatedAt: '2026-11-10T12:00:00.000Z', reminderOffsetMin: 30, ...extra });
  const d = (tarefas, itens = [], feitos = {}) => ({ secoes: [{ id: 's', nome: 'X', itens }], feitos, tarefas });
  test('disparo = data + hora − antecedência, com título e corpo', () => {
    const [l] = R.lembretesPendentes(d([tf()]), agora);
    assert.equal(l.at, new Date(2026, 10, 17, 14, 0).getTime());
    assert.equal(l.title, 'Dentista');
    assert.equal(l.body, 'Hoje às 14:30');
  });
  test('"Na hora" dispara no horário; corpo usa Amanhã ou a data curta', () => {
    const [a] = R.lembretesPendentes(d([tf({ reminderOffsetMin: 0, dueDate: '2026-11-18' })]), agora);
    assert.equal(a.at, new Date(2026, 10, 18, 14, 30).getTime());
    assert.equal(a.body, 'Amanhã às 14:30');
    const [b] = R.lembretesPendentes(d([tf({ dueDate: '2026-11-20', reminderOffsetMin: 60 })]), agora);
    assert.equal(b.body, 'sex, 20 nov às 14:30');
  });
  test('disparo no passado não agenda; tarefa concluída não agenda; sem horário ou sem lembrete não agenda', () => {
    assert.equal(R.lembretesPendentes(d([tf({ dueTime: '10:20' })]), agora).length, 0);
    assert.equal(R.lembretesPendentes(d([tf({ completedAt: '2026-11-17T12:00:00.000Z' })]), agora).length, 0);
    assert.equal(R.lembretesPendentes(d([tf({ dueTime: null })]), agora).length, 0);
    assert.equal(R.lembretesPendentes(d([tf({ reminderOffsetMin: null })]), agora).length, 0);
  });
  test('só nos próximos 30 dias', () => {
    assert.equal(R.lembretesPendentes(d([tf({ dueDate: '2026-12-16' })]), agora).length, 1);
    assert.equal(R.lembretesPendentes(d([tf({ dueDate: '2026-12-18' })]), agora).length, 0);
  });
  test('item recorrente agenda só a ocorrência atual', () => {
    const it = { id: 'i', nome: 'Remédio', detalhe: '', criadoEm: '2026-11-01', notas: null, horario: '08:00', dias: [1, 2, 3, 4, 5, 6, 7], lembreteMin: 10 };
    const l = R.lembretesPendentes(d([], [it]), agora);
    assert.equal(l.length, 1);
    assert.equal(l[0].at, new Date(2026, 10, 18, 7, 50).getTime());
    assert.equal(l[0].body, 'Amanhã às 08:00');
  });
  test('item já feito hoje pula para o próximo dia da semana em que repete', () => {
    const it = { id: 'i', nome: 'Treino', detalhe: '', criadoEm: '2026-11-01', notas: null, horario: '20:00', dias: [2, 4], lembreteMin: 0 };
    const l = R.lembretesPendentes(d([], [it], { '2026-11-17': ['i'] }), agora);
    assert.equal(l[0].at, new Date(2026, 10, 19, 20, 0).getTime());
  });
  test('ids de notificação são inteiros positivos, estáveis e diferentes', () => {
    const a = R.idNotificacao('tarefa:a'), b = R.idNotificacao('item:a');
    assert.ok(Number.isInteger(a) && a > 0 && a <= 2147483647);
    assert.notEqual(a, b);
    assert.equal(a, R.idNotificacao('tarefa:a'));
  });
  test('backup aceita lembrete válido e recusa inválido', () => {
    const base = R.montarBackup(R.migrar(JSON.stringify(d([tf()]))).dados, '2026-11-17T18:00:00.000Z');
    assert.equal(R.lerBackup(JSON.stringify(base)).tarefas[0].reminderOffsetMin, 30);
    base.tarefas[0].reminderOffsetMin = 45;
    assert.throws(() => R.lerBackup(JSON.stringify(base)), { message: 'Arquivo de backup inválido.' });
  });
});

describe('cabeçalho vivo', () => {
  test('saudação pelo horário', () => {
    const casos = { '04:59': 'Boa noite', '05:00': 'Bom dia', '11:59': 'Bom dia', '12:00': 'Boa tarde', '17:59': 'Boa tarde', '18:00': 'Boa noite', '23:59': 'Boa noite' };
    for (const [h, s] of Object.entries(casos)) assert.equal(R.saudacao(h), s, h);
  });
  test('saudação com nome; nome só com espaços fica sem nome', () => {
    assert.equal(R.saudacao('05:00', 'Ana'), 'Bom dia, Ana');
    assert.equal(R.saudacao('05:00', '   '), 'Bom dia');
  });
  test('período do dia', () => {
    assert.equal(R.periodo('05:00'), 'manha');
    assert.equal(R.periodo('12:00'), 'tarde');
    assert.equal(R.periodo('18:00'), 'noite');
    assert.equal(R.periodo('04:59'), 'noite');
  });
  test('frase de progresso', () => {
    const f = (feitos, total, ehHoje = true) => R.fraseProgresso({ feitos, total, ehHoje });
    assert.equal(f(0, 0), 'Nada programado para hoje.');
    assert.equal(f(0, 5), 'Vamos começar? São 5 itens hoje.');
    assert.equal(f(2, 5), 'Bom começo. Faltam 3.');
    assert.equal(f(4, 5), 'Mais da metade feita. Falta 1.');
    assert.equal(f(5, 5), 'Dia completo.');
    assert.equal(f(3, 5, false), '3 de 5 feitos neste dia.');
    assert.equal(f(0, 1), 'Vamos começar? É 1 item hoje.');
    assert.equal(f(1, 2), 'Mais da metade feita. Falta 1.');
  });
});

describe('semana do dia exibido', () => {
  test('segunda, domingo e virada de ano', () => {
    assert.deepEqual([R.semanaDe('2026-11-16')[0], R.semanaDe('2026-11-16')[6]], ['2026-11-16', '2026-11-22']);
    assert.deepEqual([R.semanaDe('2026-11-22')[0], R.semanaDe('2026-11-22')[6]], ['2026-11-16', '2026-11-22']);
    assert.deepEqual([R.semanaDe('2026-12-31')[0], R.semanaDe('2026-12-31')[6]], ['2026-12-28', '2027-01-03']);
  });
});

describe('comemoração do dia', () => {
  const c = (data, percentual, ultimaComemoracao = null) => R.deveComemorarDia({ data, hoje: HOJE, percentual, ultimaComemoracao });
  test('100% hoje sem comemoração anterior → true', () => assert.equal(c(HOJE, 100), true));
  test('já comemorado hoje → false', () => assert.equal(c(HOJE, 100, HOJE), false));
  test('comemorado ontem conta como nova → true', () => assert.equal(c(HOJE, 100, '2026-11-16'), true));
  test('99% → false', () => assert.equal(c(HOJE, 99), false));
  test('dia passado com 100% → false', () => assert.equal(c('2026-11-16', 100), false));
  test('texto do cartão, com singular', () => {
    assert.equal(R.textoComemoracao(7, 4), '7 de 7 feitos · sequência de 4 dias');
    assert.equal(R.textoComemoracao(3, 1), '3 de 3 feitos · sequência de 1 dia');
  });
});

describe('normalizarAjustes', () => {
  test('objeto vazio recebe todos os padrões da 5.16', () => {
    assert.deepEqual(R.normalizarAjustes({}, false), { tema: 'system', nome: '', animacoes: 'auto', vibracao: true, sons: false, dicaGestoVista: false, boasVindasVista: false, ultimaComemoracao: null, ultimoMarco: null, festas: { ativas: true, desligadas: [], aniversario: null, cartaoFechadoEm: null, retrospectivaVista: null }, abertura: { concluida: false, passo: 1, novidadesVistas: null }, mostrarFaculdade: true, lembreteDiario: { ativo: false, hora: '08:00' }, folhinha: { ativa: true, dicasVistas: [], ultimaAparicao: null, proximaDica: 0 }, arvore: { folhasVistas: null, estagioVisto: null } });
  });
  test('com dados existentes, boasVindasVista = true (e o campo antigo do APK também conta)', () => {
    assert.equal(R.normalizarAjustes({}, true).boasVindasVista, true);
    assert.equal(R.normalizarAjustes({ boasVindasOk: true }, false).boasVindasVista, true);
    assert.equal(R.migrar(JSON.stringify({ secoes: [{ id: 's', itens: [] }] })).dados.ajustes.boasVindasVista, true);
    assert.equal(R.migrar(null).dados.ajustes.boasVindasVista, false);
  });
  test('campo desconhecido é preservado; valores inválidos voltam ao padrão', () => {
    const a = R.normalizarAjustes({ extra: 7, animacoes: 'muito', vibracao: 'sim', nome: 'x'.repeat(30), ultimoMarco: { inicio: '2026-11-10', valor: 7 } }, true);
    assert.equal(a.extra, 7);
    assert.equal(a.animacoes, 'auto');
    assert.equal(a.vibracao, true);
    assert.equal(a.nome.length, 30);
    assert.deepEqual(a.ultimoMarco, { inicio: '2026-11-10', valor: 7 });
  });
  test('normalizar duas vezes não muda nada', () => {
    const uma = R.migrar(JSON.stringify({ secoes: [], feitos: {}, ajustes: { nome: 'Ana', sons: true } })).dados;
    assert.equal(R.migrar(JSON.stringify(uma)).migrou, false);
  });
});

describe('marcos de sequência', () => {
  const m = (sequencia, ultimoMarco, inicioSequencia = '2026-11-10') => R.marcoParaComemorar({ sequencia, inicioSequencia, ultimoMarco });
  test('casos da especificação', () => {
    assert.equal(m(3, null), 3);
    assert.equal(m(5, { inicio: '2026-11-10', valor: 3 }), null);
    assert.equal(m(7, { inicio: '2026-11-10', valor: 3 }), 7);
    assert.equal(m(7, { inicio: '2026-10-01', valor: 30 }), 7);
    assert.equal(m(2, null), null);
    assert.equal(m(365, { inicio: '2026-11-10', valor: 200 }), 365);
  });
  test('início e maior sequência pela regra de 50%', () => {
    const d = base([item('a', '2026-11-01')], { '2026-11-05': ['a'], '2026-11-06': ['a'], '2026-11-07': ['a'], '2026-11-08': ['a'], '2026-11-15': ['a'], '2026-11-16': ['a'] });
    assert.equal(R.sequencia(d, HOJE), 2);
    assert.equal(R.inicioSequencia(d, HOJE), '2026-11-15');
    assert.equal(R.maiorSequencia(d, HOJE), 4);
    assert.equal(R.inicioSequencia({ secoes: [], feitos: {} }, HOJE), null);
    assert.equal(R.maiorSequencia({ secoes: [], feitos: {} }, HOJE), 0);
  });
});

describe('migração v3 → v4 (faculdade)', () => {
  const v3 = { schemaVersion: 3, ajustes: { tema: 'dark', nome: 'Ana' }, secoes: [{ id: 's', nome: 'X', corToken: 'teal', itens: [{ id: 'i', nome: 'Item', detalhe: '', criadoEm: '2026-11-01', notas: null, horario: '08:00', dias: [1, 2, 3], lembreteMin: 10 }] }],
    feitos: { '2026-11-16': ['i'] }, tarefas: [{ id: 'a', title: 'A', notes: null, dueDate: '2026-11-18', dueTime: null, priority: 'high', categoryId: null, completedAt: null, reminderOffsetMin: null }] };
  test('dado antigo ganha a faculdade padrão sem mudar o resto', () => {
    const { dados, migrou, deVersao } = R.migrar(JSON.stringify(v3));
    assert.equal(migrou, true); assert.equal(deVersao, 3); assert.equal(dados.schemaVersion, 4);
    assert.deepEqual(dados.faculdade, {
      semestre: null, temposPorDia: { 1: 5, 2: 5, 3: 5, 4: 5, 5: 4, 6: 0, 7: 0 }, horario: { inicio: null, duracaoMin: null, intervalos: [] },
      limiteFaltas: 25, alertasAtivos: true, materias: [], grades: [], aulas: {}, anotacoes: [], alertasEnviados: {}, semestresAnteriores: [], permissaoPedida: false,
    });
    const { faculdade, schemaVersion, ...resto } = dados;
    const { schemaVersion: _v, ...antes } = v3;
    assert.deepEqual(resto.secoes, antes.secoes);
    assert.deepEqual(resto.feitos, antes.feitos);
    assert.deepEqual(resto.tarefas, antes.tarefas);
    assert.equal(resto.ajustes.nome, 'Ana');
  });
  test('rodar duas vezes dá o mesmo resultado', () => {
    const uma = R.migrar(JSON.stringify(v3)).dados;
    const duas = R.migrar(JSON.stringify(uma));
    assert.equal(duas.migrou, false);
    assert.deepEqual(duas.dados, uma);
  });
  test('faculdade existente é mantida e valores inválidos voltam ao padrão', () => {
    const fac = { semestre: { nome: '2026.1', inicio: '2026-02-02', fim: '2026-05-22', diasSemAula: [{ data: '2026-02-18', motivo: 'Cinzas' }, { data: 'x' }] },
      temposPorDia: { 1: 5, 5: 3, 6: 99 }, limiteFaltas: 70, alertasAtivos: false,
      materias: [{ id: 'm1', nome: 'Cálculo', cor: 'roxo', totalManual: 72 }], grades: [{ validaDesde: '2026-02-02', dias: { 1: ['m1', 'm1', 'm1', null, null] } }],
      aulas: { '2026-02-02': { m1: { status: 'falta', temposFaltados: 1, marcadoEm: '2026-02-02T12:00:00.000Z' } } } };
    const f = R.migrar(JSON.stringify({ ...v3, faculdade: fac })).dados.faculdade;
    assert.deepEqual(f.semestre.diasSemAula, [{ data: '2026-02-18', motivo: 'Cinzas' }]);
    assert.equal(f.temposPorDia[5], 3); assert.equal(f.temposPorDia[6], 0);
    assert.equal(f.limiteFaltas, 25); assert.equal(f.alertasAtivos, false);
    assert.equal(f.materias[0].cor, 'gray'); assert.equal(f.materias[0].totalManual, 72); assert.equal(f.materias[0].arquivada, false);
    assert.deepEqual(f.aulas, fac.aulas); assert.deepEqual(f.grades, fac.grades);
  });
  test('semestre com fim antes do início vira nulo', () => {
    assert.equal(R.normalizarFaculdade({ semestre: { nome: 'x', inicio: '2026-05-01', fim: '2026-04-01' } }).semestre, null);
  });
});

describe('backup com a faculdade', () => {
  const fac = { semestre: { nome: '2026.1', inicio: '2026-02-02', fim: '2026-05-22', diasSemAula: [] }, materias: [{ id: 'm1', nome: 'Cálculo', cor: 'blue' }],
    grades: [{ validaDesde: '2026-02-02', dias: { 1: ['m1', 'm1', 'm1', null, null] } }], aulas: { '2026-02-02': { m1: { status: 'falta', temposFaltados: 2, marcadoEm: '2026-02-02T12:00:00.000Z' } } },
    anotacoes: [{ id: 'a1', materiaId: 'm1', data: '2026-02-02', titulo: 'Limites', texto: 'x', fotoIds: ['f1'], paraProximaAula: '', criadoEm: '2026-02-02T12:00:00.000Z', atualizadoEm: '2026-02-02T12:00:00.000Z' }] };
  const dados = () => R.migrar(JSON.stringify({ schemaVersion: 4, secoes: [], feitos: {}, tarefas: [], faculdade: fac })).dados;
  test('exportar e importar devolve a faculdade igual', () => {
    const d = dados();
    const b = R.montarBackup(d, '2026-11-18T12:00:00.000Z');
    assert.deepEqual(b.faculdade, d.faculdade);
    assert.deepEqual(R.lerBackup(JSON.stringify(b)), d);
  });
  test('backup com fotos devolve as fotos separadas', () => {
    const b = { ...R.montarBackup(dados(), '2026-11-18T12:00:00.000Z'), fotos: [{ id: 'f1', anotacaoId: 'a1', tipo: 'image/webp', largura: 10, altura: 10, bytes: 3, criadoEm: '2026-02-02T12:00:00.000Z', dados: 'AAEC' }] };
    const r = R.lerBackupCompleto(JSON.stringify(b));
    assert.equal(r.fotos.length, 1);
    assert.equal(r.dados.fotos, undefined);
    assert.equal(r.dados.faculdade.anotacoes[0].fotoIds[0], 'f1');
  });
  test('backup antigo sem faculdade recebe a estrutura padrão', () => {
    const d = R.lerBackup(JSON.stringify({ app: 'minha-rotina', schemaVersion: 3, secoes: [], feitos: {}, tarefas: [] }));
    assert.equal(d.faculdade.semestre, null);
    assert.equal(d.faculdade.limiteFaltas, 25);
  });
  test('faculdade ou fotos inválidas recusam o arquivo inteiro', () => {
    const msg = { message: 'Arquivo de backup inválido.' };
    const b = () => JSON.parse(JSON.stringify(R.montarBackup(dados(), '2026-11-18T12:00:00.000Z')));
    const com = f => JSON.stringify(f(b()));
    assert.throws(() => R.lerBackup(com(x => { x.faculdade.aulas['2026-02-02'].m1.status = 'talvez'; return x; })), msg);
    assert.throws(() => R.lerBackup(com(x => { x.faculdade.aulas['2026-02-02'].m1.temposFaltados = 0; return x; })), msg);
    assert.throws(() => R.lerBackup(com(x => { x.faculdade.semestre.fim = '2026-01-01'; return x; })), msg);
    assert.throws(() => R.lerBackup(com(x => { x.faculdade.anotacoes[0].fotoIds = Array(11).fill('f'); return x; })), msg);
    assert.throws(() => R.lerBackup(com(x => { x.faculdade.grades[0].dias[1] = 'm1'; return x; })), msg);
    assert.throws(() => R.lerBackup(com(x => ({ ...x, fotos: [{ id: 'f1', anotacaoId: 'a1', tipo: 'text/plain', dados: 'AAEC' }] }))), msg);
    assert.throws(() => R.lerBackup(com(x => ({ ...x, fotos: [{ id: 'f1', anotacaoId: 'a1', tipo: 'image/webp', dados: 'não é base64' }] }))), msg);
  });
});

describe('ajustes da abertura, Folhinha e árvore', () => {
  test('usuário existente já tem a abertura concluída e ainda não viu as novidades', () => {
    const a = R.normalizarAjustes({}, true);
    assert.equal(a.abertura.concluida, true);
    assert.equal(a.abertura.novidadesVistas, null);
  });
  test('usuário novo começa no passo 1', () => {
    const a = R.normalizarAjustes({}, false);
    assert.deepEqual(a.abertura, { concluida: false, passo: 1, novidadesVistas: null });
  });
  test('valores inválidos voltam ao padrão e os válidos ficam', () => {
    const a = R.normalizarAjustes({ abertura: { concluida: true, passo: 12, novidadesVistas: '1.6.0' }, mostrarFaculdade: false, lembreteDiario: { ativo: true, hora: '25:00' }, folhinha: { ativa: false, dicasVistas: ['rotina', 3, 'rotina'], ultimaAparicao: '2026-02-30', proximaDica: -1 }, arvore: { folhasVistas: 12, estagioVisto: 10 } }, true);
    assert.deepEqual(a.abertura, { concluida: true, passo: 1, novidadesVistas: '1.6.0' });
    assert.equal(a.mostrarFaculdade, false);
    assert.deepEqual(a.lembreteDiario, { ativo: true, hora: '08:00' });
    assert.deepEqual(a.folhinha, { ativa: false, dicasVistas: ['rotina'], ultimaAparicao: null, proximaDica: 0 });
    assert.deepEqual(a.arvore, { folhasVistas: 12, estagioVisto: null });
  });
  test('nome aceita até 30 caracteres, sem espaços nas pontas', () => {
    assert.equal(R.normalizarAjustes({ nome: '  ' + 'a'.repeat(40) + ' ' }, true).nome.length, 30);
    assert.equal(R.normalizarAjustes({ nome: '  Ana  ' }, true).nome, 'Ana');
  });
  test('normalizar duas vezes não muda nada', () => {
    const uma = R.migrar(JSON.stringify({ schemaVersion: 4, secoes: [{ id: 's', itens: [] }], feitos: {}, tarefas: [] })).dados;
    assert.equal(R.migrar(JSON.stringify(uma)).migrou, false);
  });
});
