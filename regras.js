(function (raiz) {
  const CORES = ['green', 'blue', 'teal', 'orange', 'red', 'yellow', 'brown', 'gray'];
  const COR_ANTIGA = { '#2ecc71': 'green', '#ff5c6c': 'red', '#ff9f43': 'orange', '#28c2ff': 'teal', '#feca57': 'yellow', '#9aa5b1': 'gray', '#7c5cff': 'blue', '#f368e0': 'red' };
  const LIMITE_SEQUENCIA = 365;

  const dois = n => String(n).padStart(2, '0');
  const fmt = d => d.getFullYear() + '-' + dois(d.getMonth() + 1) + '-' + dois(d.getDate());
  const parseDia = iso => { const [a, m, d] = iso.split('-').map(Number); return new Date(a, m - 1, d); };
  const somaDias = (iso, n) => { const x = parseDia(iso); x.setDate(x.getDate() + n); return fmt(x); };
  const curto = iso => { const [, m, d] = iso.split('-'); return d + '/' + m; };

  function nomeDia(iso, hoje) {
    if (iso === hoje) return 'Hoje';
    if (iso === somaDias(hoje, -1)) return 'Ontem';
    return parseDia(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
  }

  const DIAS_LONGOS = ['segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado', 'domingo'];
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const dataExtenso = iso => { const d = parseDia(iso); return DIAS_LONGOS[(d.getDay() + 6) % 7] + ', ' + d.getDate() + ' de ' + MESES[d.getMonth()]; };
  const dataCurta = iso => { const d = parseDia(iso); return DIAS_LONGOS[(d.getDay() + 6) % 7].slice(0, 3) + ', ' + d.getDate() + ' ' + MESES[d.getMonth()].slice(0, 3); };
  function rotuloDia(iso, hoje) {
    if (iso === hoje) return 'Hoje';
    if (iso === somaDias(hoje, 1)) return 'Amanhã';
    if (iso === somaDias(hoje, -1)) return 'Ontem';
    return dataCurta(iso);
  }
  const ordenarItens = itens => itens.map((i, n) => [i, n]).sort(([a, na], [b, nb]) =>
    (a.horario ? 0 : 1) - (b.horario ? 0 : 1) || (a.horario && b.horario ? a.horario.localeCompare(b.horario) : 0) || na - nb).map(([i]) => i);

  const corTokenDe = s => CORES.includes(s.corToken) ? s.corToken : (COR_ANTIGA[String(s.cor || '').toLowerCase()] || 'gray');

  const DIAS_CURTOS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];
  const diaSemana = iso => { const d = parseDia(iso).getDay(); return d === 0 ? 7 : d; };
  const repeteNoDia = (item, dia) => !Array.isArray(item.dias) || !item.dias.length || item.dias.includes(diaSemana(dia));
  function resumoDias(dias) {
    if (!Array.isArray(dias) || !dias.length || dias.length === 7) return 'Todo dia';
    const v = dias.slice().sort((a, b) => a - b);
    if (v.join() === '1,2,3,4,5') return 'Seg a sex';
    if (v.join() === '6,7') return 'Fim de semana';
    const t = v.map(n => DIAS_CURTOS[n - 1]).join(', ');
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  function itensDoDia(dados, dia, secao) {
    const secs = secao ? [secao] : dados.secoes;
    return secs.flatMap(s => s.itens.filter(i => i.criadoEm <= dia && repeteNoDia(i, dia)));
  }
  const feito = (dados, dia, id) => (dados.feitos[dia] || []).includes(id);

  const PESO = { high: 0, medium: 1, low: 2 };
  const peso = p => (p in PESO ? PESO[p] : 1);
  const dataLocal = iso => (iso ? fmt(new Date(iso)) : null);
  const tarefaFeitaAte = (t, dia) => !!t.completedAt && dataLocal(t.completedAt) <= dia;
  const atrasada = (t, hoje) => !!t.dueDate && t.dueDate < hoje && !t.completedAt;
  const cmpHora = (ha, hb) => (ha ? 0 : 1) - (hb ? 0 : 1) || (ha && hb ? ha.localeCompare(hb) : 0);
  const cmpTarefaDia = (a, b) => cmpHora(a.dueTime, b.dueTime) || peso(a.priority) - peso(b.priority) || String(a.createdAt).localeCompare(String(b.createdAt));
  const ordenarTarefasDia = ts => ts.slice().sort(cmpTarefaDia);
  const ordenarAtrasadas = ts => ts.slice().sort((a, b) => a.dueDate.localeCompare(b.dueDate) || peso(a.priority) - peso(b.priority) || String(a.createdAt).localeCompare(String(b.createdAt)));
  const ordenarConcluidas = ts => ts.slice().sort((a, b) => String(b.completedAt).localeCompare(String(a.completedAt)));
  function ordenarDia(itens, tarefas) {
    const e = [
      ...itens.map((obj, n) => ({ tipo: 'item', obj, hora: obj.horario, n })),
      ...ordenarTarefasDia(tarefas).map((obj, n) => ({ tipo: 'tarefa', obj, hora: obj.dueTime, n: itens.length + n })),
    ];
    return e.sort((a, b) => cmpHora(a.hora, b.hora) || a.n - b.n);
  }
  const tarefasDoDia = (dados, dia, secao) => (dados.tarefas || []).filter(t => t.dueDate === dia && (!secao || t.categoryId === secao.id));

  function resumoDia(dados, dia, secao) {
    const itens = itensDoDia(dados, dia, secao);
    const ts = tarefasDoDia(dados, dia, secao);
    const feitas = itens.filter(i => feito(dados, dia, i.id)).length + ts.filter(t => tarefaFeitaAte(t, dia)).length;
    const total = itens.length + ts.length;
    return { total, feitas, pct: total ? Math.round(feitas / total * 100) : 0 };
  }

  function semanaDe(hoje) {
    const seg = somaDias(hoje, 1 - diaSemana(hoje));
    return Array.from({ length: 7 }, (_, i) => somaDias(seg, i));
  }
  function idsDeItens(dados) { const s = new Set(); dados.secoes.forEach(x => x.itens.forEach(i => s.add(i.id))); return s; }
  function concluidasNoDia(dados, dia, ids = idsDeItens(dados)) {
    return (dados.feitos[dia] || []).filter(id => ids.has(id)).length + (dados.tarefas || []).filter(t => dataLocal(t.completedAt) === dia).length;
  }
  function barrasSemana(dados, hoje) {
    const ids = idsDeItens(dados);
    return semanaDe(hoje).map(dia => ({ dia, valor: concluidasNoDia(dados, dia, ids), hoje: dia === hoje }));
  }
  function taxaSemana(dados, hoje) {
    let feitas = 0, total = 0;
    semanaDe(hoje).filter(d => d <= hoje).forEach(d => { const r = resumoDia(dados, d); feitas += r.feitas; total += r.total; });
    return { feitas, total, pct: total ? Math.round(feitas / total * 100) : null };
  }
  function totalConcluidas(dados) {
    const ids = idsDeItens(dados);
    return Object.values(dados.feitos).reduce((a, l) => a + l.filter(id => ids.has(id)).length, 0) + (dados.tarefas || []).filter(t => t.completedAt).length;
  }
  const textoSequencia = n => (n === 0 ? 'Comece hoje sua sequência' : 'Sequência: ' + n + (n === 1 ? ' dia' : ' dias'));
  const textoTaxa = pct => 'Esta semana: ' + (pct === null ? '—' : pct + '%');

  const cabecalhoProximo = iso => { const d = parseDia(iso); return DIAS_LONGOS[(d.getDay() + 6) % 7] + ', ' + d.getDate() + ' de ' + MESES[d.getMonth()].slice(0, 3) + '.'; };
  function gruposProximos(tarefas, hoje) {
    const pend = tarefas.filter(t => !t.completedAt);
    const amanha = somaDias(hoje, 1), limite = somaDias(hoje, 7);
    const grupos = [];
    const add = (chave, titulo, ts) => { if (ts.length) grupos.push({ chave, titulo, tarefas: ts }); };
    add(amanha, 'Amanhã', ordenarTarefasDia(pend.filter(t => t.dueDate === amanha)));
    for (let i = 2; i <= 7; i++) { const d = somaDias(hoje, i); add(d, cabecalhoProximo(d), ordenarTarefasDia(pend.filter(t => t.dueDate === d))); }
    add('depois', 'Mais tarde', pend.filter(t => t.dueDate && t.dueDate > limite).sort((a, b) => a.dueDate.localeCompare(b.dueDate) || cmpTarefaDia(a, b)));
    add('sem', 'Sem data', pend.filter(t => !t.dueDate).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))));
    return grupos;
  }
  function buscarTarefas(tarefas, termo) {
    const q = semAcento(termo);
    return tarefas.filter(t => !t.completedAt && (!q || semAcento((t.title || '') + ' ' + (t.notes || '')).includes(q)));
  }

  function sequencia(dados, hoje) {
    let seq = 0;
    for (let d = hoje, i = 0; i < LIMITE_SEQUENCIA; i++, d = somaDias(d, -1)) {
      const r = resumoDia(dados, d);
      if (!r.total) continue;
      if (r.pct >= 50) seq++;
      else if (d === hoje) continue;
      else break;
    }
    return seq;
  }

  function inicioSequencia(dados, hoje) {
    let inicio = null;
    for (let d = hoje, i = 0; i < LIMITE_SEQUENCIA; i++, d = somaDias(d, -1)) {
      const r = resumoDia(dados, d);
      if (!r.total) continue;
      if (r.pct >= 50) inicio = d;
      else if (d === hoje) continue;
      else break;
    }
    return inicio;
  }
  function maiorSequencia(dados, hoje) {
    const datas = [...Object.keys(dados.feitos), ...dados.secoes.flatMap(s => s.itens.map(i => i.criadoEm)), ...(dados.tarefas || []).map(t => t.dueDate).filter(Boolean)].filter(d => d <= hoje).sort();
    if (!datas.length) return 0;
    let maior = 0, atual = 0;
    for (let d = datas[0]; d <= hoje; d = somaDias(d, 1)) {
      const r = resumoDia(dados, d);
      if (!r.total) continue;
      if (r.pct >= 50) { atual++; maior = Math.max(maior, atual); }
      else if (d !== hoje) atual = 0;
    }
    return maior;
  }
  const MARCOS = [3, 7, 14, 30, 60, 100, 200, 365];
  function marcoParaComemorar({ sequencia, inicioSequencia, ultimoMarco }) {
    const marco = MARCOS.filter(m => m <= sequencia).pop();
    if (!marco) return null;
    if (ultimoMarco && ultimoMarco.inicio === inicioSequencia && ultimoMarco.valor >= marco) return null;
    return marco;
  }

  const LIMITE_SECOES = 20;
  const tamanho = t => Array.from(String(t || '').trim()).length;
  function validarTitulo(t) {
    const n = tamanho(t);
    if (!n) return 'Digite um título.';
    if (n > 120) return 'Máximo de 120 caracteres.';
    return null;
  }
  const semAcento = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  function validarNomeSecao(nome, secoes, ignorarId) {
    const n = tamanho(nome);
    if (!n) return 'Digite um nome.';
    if (n > 24) return 'Máximo de 24 caracteres.';
    const igual = secoes.some(s => s.id !== ignorarId && String(s.nome || '').trim().toLowerCase() === String(nome).trim().toLowerCase());
    if (igual) return 'Já existe uma seção com esse nome.';
    if (!ignorarId && secoes.length >= LIMITE_SECOES) return 'Máximo de 20 seções.';
    return null;
  }

  const SCHEMA = 4;
  const ANTECEDENCIAS = [0, 10, 30, 60];
  const antecedencia = v => (ANTECEDENCIAS.includes(v) ? v : null);
  const TODOS_OS_DIAS = [1, 2, 3, 4, 5, 6, 7];
  const ehObjeto = x => x !== null && typeof x === 'object' && !Array.isArray(x);
  const vazio = () => ({ schemaVersion: SCHEMA, secoes: [], feitos: {}, tarefas: [], ajustes: normalizarAjustes({}, false), faculdade: normalizarFaculdade(null) });
  const TEMPOS_PADRAO = { 1: 5, 2: 5, 3: 5, 4: 5, 5: 4, 6: 0, 7: 0 };
  const ehInteiro = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
  const lista = v => (Array.isArray(v) ? v : []);
  const texto = v => (typeof v === 'string' ? v : '');
  function normalizarFaculdade(f) {
    const x = ehObjeto(f) ? f : {};
    const t = ehObjeto(x.temposPorDia) ? x.temposPorDia : {};
    const h = ehObjeto(x.horario) ? x.horario : {};
    const s = x.semestre;
    const semestre = ehObjeto(s) && ehData(s.inicio) && ehData(s.fim) && s.fim >= s.inicio
      ? { ...s, nome: texto(s.nome), diasSemAula: lista(s.diasSemAula).filter(d => ehObjeto(d) && ehData(d.data)) } : null;
    return {
      ...x,
      semestre,
      temposPorDia: Object.fromEntries(TODOS_OS_DIAS.map(d => [String(d), ehInteiro(t[d], 0, 10) ? t[d] : TEMPOS_PADRAO[d]])),
      horario: { ...h, inicio: ehHora(h.inicio) ? h.inicio : null, duracaoMin: ehInteiro(h.duracaoMin, 1, 300) ? h.duracaoMin : null, intervalos: lista(h.intervalos) },
      limiteFaltas: ehInteiro(x.limiteFaltas, 1, 50) ? x.limiteFaltas : 25,
      alertasAtivos: typeof x.alertasAtivos === 'boolean' ? x.alertasAtivos : true,
      materias: lista(x.materias).filter(m => ehObjeto(m) && typeof m.id === 'string' && m.id).map(m => ({ ...m, nome: texto(m.nome), professor: texto(m.professor), sala: texto(m.sala),
        cor: CORES.includes(m.cor) ? m.cor : 'gray', totalManual: ehInteiro(m.totalManual, 1, 100000) ? m.totalManual : null, arquivada: m.arquivada === true })),
      grades: lista(x.grades).filter(g => ehObjeto(g) && ehData(g.validaDesde) && ehObjeto(g.dias)),
      aulas: ehObjeto(x.aulas) ? x.aulas : {},
      anotacoes: lista(x.anotacoes).filter(a => ehObjeto(a) && typeof a.id === 'string' && a.id),
      alertasEnviados: ehObjeto(x.alertasEnviados) ? x.alertasEnviados : {},
      semestresAnteriores: lista(x.semestresAnteriores),
      permissaoPedida: x.permissaoPedida === true,
    };
  }

  function diasValidos(dias) {
    if (!Array.isArray(dias)) return null;
    const v = [...new Set(dias.filter(n => Number.isInteger(n) && n >= 1 && n <= 7))].sort((a, b) => a - b);
    return v.length ? v : null;
  }

  function normalizarAjustes(a, temDados) {
    const ajustes = ehObjeto(a) ? a : {};
    const marco = ehObjeto(ajustes.ultimoMarco) && ehData(ajustes.ultimoMarco.inicio) && Number.isInteger(ajustes.ultimoMarco.valor) ? ajustes.ultimoMarco : null;
    return {
      ...ajustes,
      tema: ['system', 'light', 'dark'].includes(ajustes.tema) ? ajustes.tema : 'system',
      nome: typeof ajustes.nome === 'string' ? Array.from(ajustes.nome).slice(0, 24).join('') : '',
      animacoes: ajustes.animacoes === 'reduzidas' ? 'reduzidas' : 'auto',
      vibracao: typeof ajustes.vibracao === 'boolean' ? ajustes.vibracao : true,
      sons: typeof ajustes.sons === 'boolean' ? ajustes.sons : false,
      dicaGestoVista: ajustes.dicaGestoVista === true,
      boasVindasVista: typeof ajustes.boasVindasVista === 'boolean' ? ajustes.boasVindasVista : (!!temDados || ajustes.boasVindasOk === true),
      ultimaComemoracao: ehData(ajustes.ultimaComemoracao) ? ajustes.ultimaComemoracao : null,
      ultimoMarco: marco,
    };
  }

  function normalizar(d) {
    const feitos = ehObjeto(d.feitos) ? d.feitos : {};
    const ajustes = ehObjeto(d.ajustes) ? d.ajustes : {};
    const temDados = d.secoes.length > 0 || Object.keys(feitos).length > 0 || (Array.isArray(d.tarefas) && d.tarefas.length > 0);
    return {
      ...d,
      schemaVersion: SCHEMA,
      feitos,
      tarefas: (Array.isArray(d.tarefas) ? d.tarefas : []).map(t => (ehObjeto(t) ? { ...t, reminderOffsetMin: antecedencia(t.reminderOffsetMin) } : t)),
      ajustes: normalizarAjustes(ajustes, temDados),
      faculdade: normalizarFaculdade(d.faculdade),
      secoes: d.secoes.filter(ehObjeto).map(s => ({
        ...s,
        corToken: corTokenDe(s),
        itens: (Array.isArray(s.itens) ? s.itens : []).filter(ehObjeto).map(i => ({
          ...i,
          notas: typeof i.notas === 'string' ? i.notas : null,
          horario: typeof i.horario === 'string' && /^\d{2}:\d{2}$/.test(i.horario) ? i.horario : null,
          dias: diasValidos(i.dias) || TODOS_OS_DIAS.slice(),
          lembreteMin: antecedencia(i.lembreteMin),
        })),
      })),
    };
  }

  function migrar(bruto) {
    if (bruto === null || bruto === undefined || bruto === '') return { dados: vazio(), migrou: false, deVersao: SCHEMA };
    const d = JSON.parse(bruto);
    if (!ehObjeto(d) || !Array.isArray(d.secoes)) throw new Error('formato desconhecido');
    const versao = Number.isInteger(d.schemaVersion) ? d.schemaVersion : 1;
    if (versao > SCHEMA) throw new Error('versão ' + versao + ' é mais nova que a do app');
    const dados = normalizar(d);
    return { dados, migrou: JSON.stringify(dados) !== JSON.stringify(d), deVersao: versao };
  }

  const APP = 'minha-rotina';
  const ehData = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && fmt(parseDia(s)) === s;
  const ehHora = s => typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
  const ehIso = s => typeof s === 'string' && !isNaN(Date.parse(s));
  function montarBackup(dados, agoraIso) {
    return { app: APP, schemaVersion: SCHEMA, exportedAt: agoraIso, secoes: dados.secoes, feitos: dados.feitos, tarefas: dados.tarefas || [], ajustes: dados.ajustes || {}, faculdade: dados.faculdade || normalizarFaculdade(null) };
  }
  function tarefaValida(t) {
    return ehObjeto(t) && typeof t.id === 'string' && t.id && !validarTitulo(t.title)
      && (t.dueDate === null || t.dueDate === undefined || ehData(t.dueDate))
      && (t.dueTime === null || t.dueTime === undefined || (ehHora(t.dueTime) && ehData(t.dueDate)))
      && (t.priority === undefined || t.priority in PESO)
      && (t.completedAt === null || t.completedAt === undefined || ehIso(t.completedAt))
      && (t.reminderOffsetMin === null || t.reminderOffsetMin === undefined || ANTECEDENCIAS.includes(t.reminderOffsetMin));
  }
  const itemValido = i => ehObjeto(i) && typeof i.id === 'string' && i.id && typeof i.nome === 'string' && i.nome.trim() && ehData(i.criadoEm);
  const STATUS_AULA = ['presente', 'falta', 'sem_aula'];
  const opcional = (v, ok) => v === undefined || ok(v);
  function faculdadeValida(f) {
    if (f === undefined) return true;
    if (!ehObjeto(f)) return false;
    return opcional(f.semestre, s => s === null || (ehObjeto(s) && ehData(s.inicio) && ehData(s.fim) && s.fim >= s.inicio))
      && opcional(f.materias, l => Array.isArray(l) && l.every(m => ehObjeto(m) && typeof m.id === 'string' && m.id && typeof m.nome === 'string'))
      && opcional(f.grades, l => Array.isArray(l) && l.every(g => ehObjeto(g) && ehData(g.validaDesde) && ehObjeto(g.dias) && Object.values(g.dias).every(s => Array.isArray(s) && s.every(x => x === null || typeof x === 'string'))))
      && opcional(f.aulas, a => ehObjeto(a) && Object.entries(a).every(([d, r]) => ehData(d) && ehObjeto(r) && Object.values(r).every(x => ehObjeto(x) && STATUS_AULA.includes(x.status) && (x.status !== 'falta' || ehInteiro(x.temposFaltados, 1, 10)))))
      && opcional(f.anotacoes, l => Array.isArray(l) && l.every(a => ehObjeto(a) && typeof a.id === 'string' && a.id && typeof a.materiaId === 'string' && ehData(a.data) && typeof a.texto === 'string' && Array.isArray(a.fotoIds) && a.fotoIds.length <= 10))
      && opcional(f.semestresAnteriores, Array.isArray);
  }
  const fotoValida = f => ehObjeto(f) && typeof f.id === 'string' && f.id && typeof f.anotacaoId === 'string' && /^image\//.test(f.tipo) && typeof f.dados === 'string' && /^[A-Za-z0-9+/]*={0,2}$/.test(f.dados);
  const lerBackup = texto => lerBackupCompleto(texto).dados;
  function lerBackupCompleto(texto) {
    const invalido = () => new Error('Arquivo de backup inválido.');
    let obj;
    try { obj = JSON.parse(texto); } catch (e) { throw invalido(); }
    if (!ehObjeto(obj) || (obj.app !== undefined && obj.app !== APP) || !Array.isArray(obj.secoes)) throw invalido();
    if (obj.tarefas !== undefined && !Array.isArray(obj.tarefas)) throw invalido();
    if (!obj.secoes.every(s => ehObjeto(s) && typeof s.id === 'string' && (s.itens === undefined || (Array.isArray(s.itens) && s.itens.every(itemValido))))) throw invalido();
    if (!(obj.tarefas || []).every(tarefaValida)) throw invalido();
    if (!faculdadeValida(obj.faculdade)) throw invalido();
    if (obj.fotos !== undefined && !(Array.isArray(obj.fotos) && obj.fotos.every(fotoValida))) throw invalido();
    const { app, exportedAt, fotos, ...resto } = obj;
    let r;
    try { r = migrar(JSON.stringify(resto)); } catch (e) { throw invalido(); }
    r.dados.tarefas = r.dados.tarefas.map(t => ({ notes: null, dueDate: null, dueTime: null, priority: 'medium', categoryId: null, completedAt: null, ...t }));
    return { dados: r.dados, fotos: fotos || [] };
  }
  const LIMITE_LEMBRETE_MS = 30 * 864e5;
  function idNotificacao(chave) {
    let x = 2166136261;
    for (const c of chave) { x ^= c.codePointAt(0); x = Math.imul(x, 16777619); }
    return (x >>> 1) || 1;
  }
  const momento = (dia, hora) => { const [a, m, d] = dia.split('-').map(Number); const [hh, mm] = hora.split(':').map(Number); return new Date(a, m - 1, d, hh, mm, 0, 0).getTime(); };
  const textoQuando = (dia, hora, hoje) => rotuloDia(dia, hoje) + ' às ' + hora;
  function lembretesPendentes(dados, agoraMs) {
    const hoje = fmt(new Date(agoraMs)), limite = agoraMs + LIMITE_LEMBRETE_MS, lista = [];
    (dados.tarefas || []).forEach(t => {
      if (t.completedAt || antecedencia(t.reminderOffsetMin) === null || !ehData(t.dueDate) || !ehHora(t.dueTime)) return;
      const at = momento(t.dueDate, t.dueTime) - t.reminderOffsetMin * 60000;
      if (at > agoraMs && at <= limite) lista.push({ id: idNotificacao('tarefa:' + t.id), tipo: 'tarefa', ref: t.id, title: t.title, body: textoQuando(t.dueDate, t.dueTime, hoje), at });
    });
    dados.secoes.forEach(s => s.itens.forEach(i => {
      if (antecedencia(i.lembreteMin) === null || !ehHora(i.horario)) return;
      for (let k = 0; k <= 31; k++) {
        const dia = somaDias(hoje, k);
        if (i.criadoEm > dia || !repeteNoDia(i, dia) || feito(dados, dia, i.id)) continue;
        const at = momento(dia, i.horario) - i.lembreteMin * 60000;
        if (at <= agoraMs) continue;
        if (at <= limite) lista.push({ id: idNotificacao('item:' + i.id), tipo: 'item', ref: i.id, title: i.nome, body: textoQuando(dia, i.horario, hoje), at });
        break;
      }
    }));
    return lista.sort((a, b) => a.at - b.at);
  }
  const horaDe = hora => Number(String(hora).split(':')[0]);
  function periodo(hora) { const h = horaDe(hora); return h >= 5 && h < 12 ? 'manha' : h >= 12 && h < 18 ? 'tarde' : 'noite'; }
  function saudacao(hora, nome) {
    const base = { manha: 'Bom dia', tarde: 'Boa tarde', noite: 'Boa noite' }[periodo(hora)];
    const n = String(nome || '').trim();
    return n ? base + ', ' + n : base;
  }
  function fraseProgresso({ feitos, total, ehHoje }) {
    if (!total) return ehHoje ? 'Nada programado para hoje.' : 'Nada programado neste dia.';
    if (!ehHoje) return feitos + ' de ' + total + ' feitos neste dia.';
    const falta = total - feitos;
    const faltam = falta === 1 ? 'Falta 1.' : 'Faltam ' + falta + '.';
    if (feitos === 0) return total === 1 ? 'Vamos começar? É 1 item hoje.' : 'Vamos começar? São ' + total + ' itens hoje.';
    if (feitos >= total) return 'Dia completo.';
    return feitos / total < 0.5 ? 'Bom começo. ' + faltam : 'Mais da metade feita. ' + faltam;
  }
  const deveComemorarDia = ({ data, hoje, percentual, ultimaComemoracao }) => data === hoje && percentual >= 100 && ultimaComemoracao !== hoje;
  const textoComemoracao = (feitos, sequencia) => feitos + ' de ' + feitos + ' feitos · sequência de ' + sequencia + (sequencia === 1 ? ' dia' : ' dias');
  const contarTarefas = d => d.secoes.reduce((a, s) => a + s.itens.length, 0) + (d.tarefas || []).length;

  const Regras = { normalizarAjustes, normalizarFaculdade, TEMPOS_PADRAO, CORES, COR_ANTIGA, SCHEMA, TODOS_OS_DIAS, fmt, parseDia, somaDias, curto, nomeDia, dataExtenso, dataCurta, rotuloDia, ordenarItens, corTokenDe, DIAS_CURTOS, diaSemana, repeteNoDia, resumoDias, itensDoDia, feito, resumoDia, sequencia, vazio, migrar, LIMITE_SECOES, validarTitulo, validarNomeSecao, semAcento,
    dataLocal, tarefaFeitaAte, atrasada, ordenarTarefasDia, ordenarAtrasadas, ordenarConcluidas, ordenarDia, tarefasDoDia, cabecalhoProximo, gruposProximos, buscarTarefas,
    DIAS_LONGOS, semanaDe, concluidasNoDia, barrasSemana, taxaSemana, totalConcluidas, textoSequencia, textoTaxa,
    APP, montarBackup, lerBackup, lerBackupCompleto, contarTarefas,
    ANTECEDENCIAS, idNotificacao, lembretesPendentes, periodo, saudacao, fraseProgresso, deveComemorarDia, textoComemoracao, inicioSequencia, maiorSequencia, MARCOS, marcoParaComemorar };
  if (typeof module !== 'undefined' && module.exports) module.exports = Regras;
  else raiz.Regras = Regras;
})(typeof globalThis !== 'undefined' ? globalThis : this);
