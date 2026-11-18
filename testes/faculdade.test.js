process.env.TZ = 'America/Sao_Paulo';
const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../regras.js');
const F = require('../faculdade.js');

const HOJE = '2026-03-10';
const vazios = n => Array(n).fill(null);
const gradeBase = () => ({
  1: ['c', 'c', 'c', null, null], 2: vazios(5), 3: ['c', 'c', null, null, null], 4: vazios(5), 5: vazios(4),
});
function montar({ semSemestre = [], limite, extra = {}, inicio = '2026-02-02', fim = '2026-05-22', materia = {} } = {}) {
  return R.normalizarFaculdade({
    semestre: { nome: '2026.1', inicio, fim, diasSemAula: semSemestre.map(data => ({ data })) },
    materias: [{ id: 'c', nome: 'Cálculo', cor: 'blue', ...materia }],
    grades: [{ validaDesde: '2026-02-02', dias: gradeBase() }],
    ...(limite ? { limiteFaltas: limite } : {}),
    ...extra,
  });
}
const feriado = () => montar({ semSemestre: ['2026-02-18'] });
function comFaltas(fac, n) {
  let d = fac.semestre.inicio;
  while (n > 0 && d <= fac.semestre.fim) {
    if (F.diaLetivo(fac, 'c', d)) {
      fac.aulas[d] = { c: { status: 'falta', temposFaltados: 1, marcadoEm: d + 'T10:00:00.000Z' } };
      n--;
    }
    d = R.somaDias(d, 1);
  }
  return fac;
}
const est = fac => F.estatisticas(fac, HOJE).c;
const comN = n => est(comFaltas(feriado(), n));

test('totais de tempos do semestre', () => {
  assert.equal(est(montar()).total, 80);
  assert.equal(est(feriado()).total, 78);
  const f = feriado();
  f.aulas['2026-02-09'] = { c: { status: 'sem_aula', temposFaltados: 0, marcadoEm: '2026-02-09T10:00:00.000Z' } };
  assert.equal(est(f).total, 75);
  assert.equal(est(montar({ materia: { totalManual: 72 } })).total, 72);
  const g = montar();
  const nova = gradeBase();
  nova[3] = vazios(5);
  g.grades = F.aplicarGrade(g.grades, nova, '2026-04-01');
  assert.equal(g.grades.length, 2);
  assert.equal(est(g).total, 64);
});

const casos = [
  [10, '12,8%', 'ok', 9], [12, '15,4%', 'atencao', 7], [16, '20,5%', 'perigo', 3],
  [17, '17 faltas', 'ultima_chance', 2], [19, '24,4%', 'ultima_chance', 0], [20, '25,6%', 'ultrapassado', -1],
];
for (const [n, pct, nivel, restante] of casos) {
  test(`percentual e nível com ${n} faltas`, () => {
    const s = comN(n);
    assert.equal(s.maximo, 19);
    assert.equal(s.faltas, n);
    assert.equal(s.restante, restante);
    assert.equal(s.nivel, nivel);
    if (n !== 17) assert.equal(F.formatarPct(s.percentual), pct);
  });
}

test('exibição de percentuais', () => {
  assert.equal(F.formatarPct(12.45), '12,5%');
  assert.equal(F.formatarPct(0), '0,0%');
});

test('falta parcial conta só os tempos faltados', () => {
  const f = feriado();
  f.aulas['2026-02-09'] = { c: { status: 'falta', temposFaltados: 1, marcadoEm: '2026-02-09T10:00:00.000Z' } };
  assert.equal(est(f).faltas, 1);
  f.aulas['2026-02-09'].c.temposFaltados = 3;
  assert.equal(est(f).faltas, 3);
});

test('faltas fora de dias letivos da matéria não contam', () => {
  const f = feriado();
  f.aulas['2026-02-10'] = { c: { status: 'falta', temposFaltados: 1, marcadoEm: '2026-02-10T10:00:00.000Z' } };
  f.aulas['2026-02-18'] = { c: { status: 'falta', temposFaltados: 1, marcadoEm: '2026-02-18T10:00:00.000Z' } };
  assert.equal(est(f).faltas, 0);
});

test('alertas encadeados disparam uma vez por nível', () => {
  let enviados = [];
  const passo = n => {
    const r = F.avaliarAlertas(enviados, comN(n).atingidos);
    enviados = r.enviados;
    return r.novos;
  };
  assert.deepEqual(passo(11), []);
  assert.deepEqual(passo(12), ['atencao']);
  assert.deepEqual(passo(13), []);
  assert.deepEqual(passo(15), []);
  assert.deepEqual(passo(17), ['ultima_chance', 'perigo']);
  assert.deepEqual(passo(11), []);
  assert.deepEqual(enviados, []);
  assert.deepEqual(passo(12), ['atencao']);
});

test('textos dos alertas', () => {
  const base = { materia: 'Cálculo', total: 78, limite: 25 };
  assert.deepEqual(F.textoAlerta('atencao', { ...base, percentual: 12 / 78 * 100, faltas: 12, restante: 7 }),
    { titulo: 'Atenção em Cálculo', texto: 'Você já faltou 15,4% (12 de 78 tempos). Ainda pode faltar 7 tempos.' });
  assert.deepEqual(F.textoAlerta('perigo', { ...base, percentual: 16 / 78 * 100, faltas: 16, restante: 3 }),
    { titulo: 'Cuidado com Cálculo', texto: 'Suas faltas chegaram a 20,5%. Restam só 3 tempos até o limite de 25%.' });
  assert.deepEqual(F.textoAlerta('ultima_chance', { ...base, percentual: 19 / 78 * 100, faltas: 19, restante: 0 }),
    { titulo: 'Última chance em Cálculo', texto: 'Se faltar mais um dia de Cálculo, você passa de 25% e reprova por falta.' });
  assert.deepEqual(F.textoAlerta('ultrapassado', { ...base, percentual: 20 / 78 * 100, faltas: 20, restante: -1 }),
    { titulo: 'Limite de faltas ultrapassado em Cálculo', texto: 'Você faltou 25,6% e passou do limite de 25%. Fale com a coordenação.' });
  assert.equal(F.textoAlerta('atencao', { ...base, percentual: 15, faltas: 12, restante: 1 }).texto.endsWith('Ainda pode faltar 1 tempo.'), true);
  assert.equal(F.textoAlerta('perigo', { ...base, percentual: 20, faltas: 18, restante: 1 }).texto.includes('Resta só 1 tempo até'), true);
  assert.equal(F.textoAlerta('ok', base), null);
});

test('grade: adicionar tempos ao dia', () => {
  const a = F.adicionarAoDia(vazios(5), 'c', 3, 1);
  assert.deepEqual(a.slots, ['c', 'c', 'c', null, null]);
  const b = F.adicionarAoDia(a.slots, 'f', 2, 1);
  assert.deepEqual(b.slots, ['c', 'c', 'c', 'f', 'f']);
  assert.equal(F.adicionarAoDia(b.slots, 'q', 1, 1).erro, 'Segunda só tem 5 tempos. Falta 1 tempo livre para isso.');
  assert.equal(F.adicionarAoDia(a.slots, 'f', 4, 1).erro, 'Segunda só tem 5 tempos. Faltam 2 tempos livres para isso.');
});

test('grade: validação e ajuste de tempos por dia', () => {
  const tpd = R.normalizarFaculdade(null).temposPorDia;
  assert.equal(F.validarGrade(gradeBase(), tpd), true);
  assert.equal(F.validarGrade({ ...gradeBase(), 5: vazios(5) }, tpd), false);
  assert.deepEqual(Object.keys(F.gradeVazia(tpd)), ['1', '2', '3', '4', '5']);
  assert.equal(F.gradeVazia(tpd)[5].length, 4);
  const dias = { ...gradeBase(), 5: ['c', null, null, 'c'] };
  const r = F.ajustarTempos(dias, { ...tpd, 5: 3 });
  assert.deepEqual(r.dias[5], ['c', null, null]);
  assert.deepEqual(r.perdas, [{ dia: 5, materiaId: 'c', qtd: 1 }]);
  assert.deepEqual(F.ajustarTempos(gradeBase(), { ...tpd, 5: 6 }).perdas, []);
  assert.equal(F.ajustarTempos(gradeBase(), { ...tpd, 5: 6 }).dias[5].length, 6);
});

test('datas e dias letivos', () => {
  assert.equal(R.diaSemana('2026-02-02'), 1);
  assert.equal(R.diaSemana('2026-02-08'), 7);
  assert.equal(R.parseDia('2026-02-18').getDate(), 18);
  const f = feriado();
  assert.equal(F.diaLetivo(f, 'c', '2026-01-30'), false);
  assert.equal(F.diaLetivo(f, 'c', '2026-05-25'), false);
  assert.equal(F.diaLetivo(f, 'c', '2026-02-02'), true);
  assert.equal(F.diaLetivo(f, 'c', '2026-02-18'), false);
  assert.equal(F.diaLetivo(f, 'c', '2026-02-03'), false);
  assert.equal(F.temposNoDia(f, 'c', '2026-02-02'), 3);
  assert.equal(F.temposNoDia(f, 'c', '2026-02-04'), 2);
});

test('semestre de um dia', () => {
  const s = est(montar({ inicio: '2026-02-02', fim: '2026-02-02' }));
  assert.equal(s.total, 3);
  assert.equal(s.maximo, 0);
  assert.equal(s.restante, 0);
  assert.equal(s.nivel, 'ultima_chance');
});

test('semestre com todos os dias sem aula', () => {
  const dias = ['02', '03', '04', '05', '06'].map(d => '2026-02-' + d);
  const s = est(montar({ inicio: '2026-02-02', fim: '2026-02-06', semSemestre: dias }));
  assert.equal(s.total, 0);
  assert.equal(s.percentual, null);
  assert.equal(s.nivel, 'ok');
  assert.deepEqual(s.atingidos, []);
});

test('limites de 1% e 50%', () => {
  assert.equal(montar({ limite: 1 }).limiteFaltas, 1);
  assert.equal(montar({ limite: 50 }).limiteFaltas, 50);
  assert.equal(est(montar({ limite: 1 })).maximo, 0);
  assert.equal(est(montar({ limite: 50 })).maximo, 40);
  const f = comFaltas(montar({ limite: 50 }), 32);
  Object.values(f.aulas).forEach(d => delete d.c.temposFaltados);
  const s = est(f);
  assert.equal(s.faltas, 80);
  assert.equal(s.nivel, 'ultrapassado');
  assert.equal(est(comFaltas(montar({ limite: 1 }), 1)).nivel, 'ultrapassado');
});

test('normalizarFaculdade aplica padrões e descarta valores inválidos', () => {
  const n = R.normalizarFaculdade(null);
  assert.equal(n.semestre, null);
  assert.equal(n.limiteFaltas, 25);
  assert.equal(n.alertasAtivos, true);
  assert.deepEqual(n.temposPorDia, { 1: 5, 2: 5, 3: 5, 4: 5, 5: 4, 6: 0, 7: 0 });
  assert.equal(R.normalizarFaculdade({ limiteFaltas: 0 }).limiteFaltas, 25);
  assert.equal(R.normalizarFaculdade({ limiteFaltas: 51 }).limiteFaltas, 25);
  assert.equal(R.normalizarFaculdade({ semestre: { inicio: '2026-05-01', fim: '2026-02-01' } }).semestre, null);
  const m = R.normalizarFaculdade({ materias: [{ id: 'x', cor: 'inexistente', totalManual: -3 }, { nome: 'sem id' }] }).materias;
  assert.equal(m.length, 1);
  assert.equal(m[0].cor, 'gray');
  assert.equal(m[0].totalManual, null);
});

test('migrar preserva a faculdade normalizada', () => {
  const r = R.migrar(JSON.stringify({ secoes: [], faculdade: { limiteFaltas: 30 } }));
  assert.equal(r.dados.faculdade.limiteFaltas, 30);
  assert.equal(R.migrar('{"secoes":[]}').dados.faculdade.limiteFaltas, 25);
});
