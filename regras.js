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

  const SCHEMA = 2;
  const TODOS_OS_DIAS = [1, 2, 3, 4, 5, 6, 7];
  const ehObjeto = x => x !== null && typeof x === 'object' && !Array.isArray(x);
  const vazio = () => ({ schemaVersion: SCHEMA, secoes: [], feitos: {}, tarefas: [], ajustes: { tema: 'system' } });

  function diasValidos(dias) {
    if (!Array.isArray(dias)) return null;
    const v = [...new Set(dias.filter(n => Number.isInteger(n) && n >= 1 && n <= 7))].sort((a, b) => a - b);
    return v.length ? v : null;
  }

  function normalizar(d) {
    const feitos = ehObjeto(d.feitos) ? d.feitos : {};
    const ajustes = ehObjeto(d.ajustes) ? d.ajustes : {};
    return {
      ...d,
      schemaVersion: SCHEMA,
      feitos,
      tarefas: Array.isArray(d.tarefas) ? d.tarefas : [],
      ajustes: { ...ajustes, tema: ['system', 'light', 'dark'].includes(ajustes.tema) ? ajustes.tema : 'system' },
      secoes: d.secoes.filter(ehObjeto).map(s => ({
        ...s,
        corToken: corTokenDe(s),
        itens: (Array.isArray(s.itens) ? s.itens : []).filter(ehObjeto).map(i => ({
          ...i,
          notas: typeof i.notas === 'string' ? i.notas : null,
          horario: typeof i.horario === 'string' && /^\d{2}:\d{2}$/.test(i.horario) ? i.horario : null,
          dias: diasValidos(i.dias) || TODOS_OS_DIAS.slice(),
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

  const Regras = { CORES, COR_ANTIGA, SCHEMA, TODOS_OS_DIAS, fmt, parseDia, somaDias, curto, nomeDia, dataExtenso, dataCurta, rotuloDia, ordenarItens, corTokenDe, DIAS_CURTOS, diaSemana, repeteNoDia, resumoDias, itensDoDia, feito, resumoDia, sequencia, vazio, migrar, LIMITE_SECOES, validarTitulo, validarNomeSecao, semAcento,
    dataLocal, tarefaFeitaAte, atrasada, ordenarTarefasDia, ordenarAtrasadas, ordenarConcluidas, ordenarDia, tarefasDoDia, cabecalhoProximo, gruposProximos, buscarTarefas,
    DIAS_LONGOS, semanaDe, concluidasNoDia, barrasSemana, taxaSemana, totalConcluidas, textoSequencia, textoTaxa };
  if (typeof module !== 'undefined' && module.exports) module.exports = Regras;
  else raiz.Regras = Regras;
})(typeof globalThis !== 'undefined' ? globalThis : this);
