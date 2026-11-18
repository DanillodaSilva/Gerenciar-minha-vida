(function (raiz) {
  const R = typeof module !== 'undefined' && module.exports ? require('./regras.js') : raiz.Regras;
  const { somaDias, diaSemana, semAcento } = R;
  const NIVEIS = ['ok', 'atencao', 'perigo', 'ultima_chance', 'ultrapassado'];
  const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  const plural = (n, um, varios) => n + ' ' + (Math.abs(n) === 1 ? um : varios);
  const tempos = n => plural(n, 'tempo', 'tempos');

  const ordenarGrades = fac => fac.grades.slice().sort((a, b) => a.validaDesde.localeCompare(b.validaDesde));
  function gradeVigente(fac, data, ord = ordenarGrades(fac)) {
    let g = null;
    for (const x of ord) { if (x.validaDesde <= data) g = x; else break; }
    return g || ord[0] || null;
  }
  const slotsDoDia = (grade, data) => { const s = grade && grade.dias[diaSemana(data)]; return Array.isArray(s) ? s : []; };
  const temposNoDia = (fac, mid, data) => slotsDoDia(gradeVigente(fac, data), data).filter(x => x === mid).length;
  const registro = (fac, data, mid) => (fac.aulas[data] || {})[mid] || null;
  const dentro = (fac, data) => !!fac.semestre && data >= fac.semestre.inicio && data <= fac.semestre.fim;
  const feriado = (fac, data) => (fac.semestre ? fac.semestre.diasSemAula.find(d => d.data === data) || null : null);
  function diaLetivo(fac, mid, data) {
    if (!dentro(fac, data) || feriado(fac, data) || !temposNoDia(fac, mid, data)) return false;
    const r = registro(fac, data, mid);
    return !(r && r.status === 'sem_aula');
  }
  function maiorNoDia(grade, mid) {
    if (!grade) return 0;
    return Math.max(0, ...Object.values(grade.dias).map(s => (Array.isArray(s) ? s.filter(x => x === mid).length : 0)));
  }
  const faltados = (r, noDia) => Math.min(noDia, Number.isInteger(r.temposFaltados) && r.temposFaltados > 0 ? r.temposFaltados : noDia);

  function niveisAtingidos({ total, faltas, maximo, restante, maiorNoDia: maior }, limite) {
    if (!total) return [];
    const n = [];
    if (faltas * 1000 >= limite * 6 * total) n.push('atencao');
    if (faltas * 1000 >= limite * 8 * total) n.push('perigo');
    if (restante >= 0 && restante < maior) n.push('ultima_chance');
    if (faltas > maximo) n.push('ultrapassado');
    return n;
  }
  const nivelDe = atingidos => atingidos.reduce((a, n) => (NIVEIS.indexOf(n) > NIVEIS.indexOf(a) ? n : a), 'ok');

  function estatisticas(fac, hoje) {
    const res = {};
    if (!fac.semestre) return res;
    const ord = ordenarGrades(fac);
    const feriados = new Set(fac.semestre.diasSemAula.map(d => d.data));
    fac.materias.forEach(m => { res[m.id] = { calculado: 0, dados: 0, faltas: 0, faltasAteHoje: 0, pendentes: 0 }; });
    for (let d = fac.semestre.inicio; d <= fac.semestre.fim; d = somaDias(d, 1)) {
      if (feriados.has(d)) continue;
      const cont = {};
      slotsDoDia(gradeVigente(fac, d, ord), d).forEach(x => { if (x) cont[x] = (cont[x] || 0) + 1; });
      for (const mid in cont) {
        const s = res[mid];
        if (!s) continue;
        const r = registro(fac, d, mid);
        if (r && r.status === 'sem_aula') continue;
        s.calculado += cont[mid];
        if (d <= hoje) s.dados += cont[mid];
        if (r && r.status === 'falta') { const f = faltados(r, cont[mid]); s.faltas += f; if (d <= hoje) s.faltasAteHoje += f; }
        if (!r && d < hoje) s.pendentes++;
      }
    }
    const gHoje = gradeVigente(fac, hoje, ord), limite = fac.limiteFaltas;
    fac.materias.forEach(m => {
      const s = res[m.id];
      s.total = m.totalManual || s.calculado;
      s.maximo = Math.floor(s.total * limite / 100);
      s.restante = s.maximo - s.faltas;
      s.percentual = s.total ? s.faltas / s.total * 100 : null;
      s.frequencia = s.dados ? (s.dados - s.faltasAteHoje) / s.dados * 100 : null;
      s.maiorNoDia = maiorNoDia(gHoje, m.id);
      s.atingidos = niveisAtingidos(s, limite);
      s.nivel = nivelDe(s.atingidos);
    });
    return res;
  }

  function avaliarAlertas(enviados, atingidos) {
    const nivel = nivelDe(atingidos), teto = NIVEIS.indexOf(nivel);
    const mantidos = (enviados || []).filter(n => NIVEIS.indexOf(n) > 0 && NIVEIS.indexOf(n) <= teto);
    const novos = atingidos.filter(n => !mantidos.includes(n)).sort((a, b) => NIVEIS.indexOf(b) - NIVEIS.indexOf(a));
    return { novos, enviados: NIVEIS.filter(n => mantidos.includes(n) || novos.includes(n)) };
  }

  const formatarPct = p => (Math.round(p * 10 + 1e-7) / 10).toFixed(1).replace('.', ',') + '%';
  function textoAlerta(nivel, { materia, percentual, faltas, total, restante, limite }) {
    const p = formatarPct(percentual);
    if (nivel === 'atencao') return { titulo: 'Atenção em ' + materia, texto: `Você já faltou ${p} (${faltas} de ${tempos(total)}). Ainda pode faltar ${tempos(restante)}.` };
    if (nivel === 'perigo') return { titulo: 'Cuidado com ' + materia, texto: `Suas faltas chegaram a ${p}. ${restante === 1 ? 'Resta' : 'Restam'} só ${tempos(restante)} até o limite de ${limite}%.` };
    if (nivel === 'ultima_chance') return { titulo: 'Última chance em ' + materia, texto: `Se faltar mais um dia de ${materia}, você passa de ${limite}% e reprova por falta.` };
    if (nivel === 'ultrapassado') return { titulo: 'Limite de faltas ultrapassado em ' + materia, texto: `Você faltou ${p} e passou do limite de ${limite}%. Fale com a coordenação.` };
    return null;
  }
  function textoRestante(s) {
    if (!s.total) return 'Sem aulas previstas';
    if (s.restante < 0) return 'passou do limite';
    if (s.restante === 0) return 'não pode faltar mais';
    return 'pode faltar mais ' + tempos(s.restante);
  }
  const textoStatus = s => (s.total ? 'Faltas: ' + formatarPct(s.percentual) + ' · ' + textoRestante(s) : 'Sem aulas previstas');

  function aulasDoDia(fac, data) {
    if (!dentro(fac, data) || feriado(fac, data)) return [];
    const mapa = new Map();
    slotsDoDia(gradeVigente(fac, data), data).forEach((mid, i) => { if (!mid) return; if (!mapa.has(mid)) mapa.set(mid, []); mapa.get(mid).push(i + 1); });
    return [...mapa].map(([materiaId, posicoes]) => ({ materiaId, posicoes, tempos: posicoes.length, registro: registro(fac, data, materiaId) }));
  }
  function rotuloTempos(p) {
    if (p.length === 1) return p[0] + 'º tempo';
    if (p[p.length - 1] - p[0] === p.length - 1) return p[0] + 'º ao ' + p[p.length - 1] + 'º tempo';
    return p.slice(0, -1).map(n => n + 'º').join(', ') + ' e ' + p[p.length - 1] + 'º tempos';
  }
  const paraMin = h => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };
  const paraHora = m => String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  function inicioDoTempo(horario, n) {
    const extra = (horario.intervalos || []).filter(i => i && i.apos < n).reduce((a, i) => a + (Number(i.min) || 0), 0);
    return paraMin(horario.inicio) + (n - 1) * horario.duracaoMin + extra;
  }
  function faixaHorario(horario, posicoes) {
    if (!horario || !horario.inicio || !horario.duracaoMin || !posicoes.length) return '';
    const fim = posicoes[posicoes.length - 1];
    return paraHora(inicioDoTempo(horario, posicoes[0])) + '–' + paraHora(inicioDoTempo(horario, fim) + horario.duracaoMin);
  }
  function proximaAula(fac, data) {
    if (!fac.semestre) return null;
    let d = data < fac.semestre.inicio ? fac.semestre.inicio : somaDias(data, 1);
    for (let k = 0; k < 120 && d <= fac.semestre.fim; k++, d = somaDias(d, 1)) {
      const a = aulasDoDia(fac, d).find(x => !(x.registro && x.registro.status === 'sem_aula'));
      if (a) return { data: d, materiaId: a.materiaId };
    }
    return null;
  }
  function proximaAulaDe(fac, mid, data) {
    if (!fac.semestre) return null;
    for (let d = somaDias(data, 1), k = 0; k < 120 && d <= fac.semestre.fim; k++, d = somaDias(d, 1)) if (diaLetivo(fac, mid, d)) return d;
    return null;
  }
  function pendentes(fac, hoje) {
    const lista = [];
    if (!fac.semestre) return lista;
    const ativas = new Set(fac.materias.map(m => m.id));
    for (let d = fac.semestre.inicio; d < hoje && d <= fac.semestre.fim; d = somaDias(d, 1)) {
      aulasDoDia(fac, d).forEach(a => { if (!a.registro && ativas.has(a.materiaId)) lista.push({ data: d, materiaId: a.materiaId, tempos: a.tempos, posicoes: a.posicoes }); });
    }
    return lista.reverse();
  }
  function calendario(fac, mid, hoje) {
    const dias = [];
    if (!fac.semestre) return dias;
    const ord = ordenarGrades(fac);
    for (let d = fac.semestre.inicio; d <= fac.semestre.fim; d = somaDias(d, 1)) {
      const n = slotsDoDia(gradeVigente(fac, d, ord), d).filter(x => x === mid).length;
      if (!n) continue;
      const r = registro(fac, d, mid);
      const estado = feriado(fac, d) || (r && r.status === 'sem_aula') ? 'sem_aula' : r && r.status === 'falta' ? 'falta' : r ? 'presente' : d > hoje ? 'futuro' : 'pendente';
      dias.push({ data: d, estado, tempos: n, faltados: estado === 'falta' ? faltados(r, n) : 0 });
    }
    return dias;
  }

  function validarSemestre({ nome, inicio, fim }) {
    const n = String(nome || '').trim();
    if (!n) return 'Dê um nome ao semestre.';
    if (Array.from(n).length > 20) return 'Use até 20 caracteres no nome.';
    if (!inicio || !fim) return 'Informe as datas de início e de fim.';
    if (fim < inicio) return 'A data de fim não pode ser antes do início.';
    return '';
  }
  function validarMateria(nome, materias, idAtual) {
    const n = String(nome || '').trim();
    if (!n) return 'Dê um nome à matéria.';
    if (Array.from(n).length > 40) return 'Use até 40 caracteres.';
    if (materias.some(m => m.id !== idAtual && m.nome.trim().toLocaleLowerCase('pt-BR') === n.toLocaleLowerCase('pt-BR'))) return 'Já existe uma matéria com esse nome.';
    return '';
  }
  function gradeVazia(temposPorDia) {
    const dias = {};
    for (let d = 1; d <= 7; d++) if (temposPorDia[d] > 0) dias[d] = Array(temposPorDia[d]).fill(null);
    return dias;
  }
  function validarGrade(dias, temposPorDia) {
    for (let d = 1; d <= 7; d++) {
      const n = temposPorDia[d] || 0, s = dias[d];
      if (n === 0 ? s !== undefined && (!Array.isArray(s) || s.length !== 0) : !Array.isArray(s) || s.length !== n) return false;
    }
    return true;
  }
  function adicionarAoDia(slots, mid, qtd, dia) {
    const livres = slots.filter(x => x === null).length;
    if (qtd > livres) {
      const falta = qtd - livres;
      return { erro: `${DIAS[dia - 1]} só tem ${tempos(slots.length)}. ${falta === 1 ? 'Falta 1 tempo livre' : 'Faltam ' + falta + ' tempos livres'} para isso.` };
    }
    const novo = slots.slice();
    let resta = qtd;
    for (let i = 0; i < novo.length && resta; i++) if (novo[i] === null) { novo[i] = mid; resta--; }
    return { slots: novo };
  }
  function ajustarTempos(dias, temposPorDia) {
    const novo = {}, perdas = [];
    for (let d = 1; d <= 7; d++) {
      const n = temposPorDia[d] || 0, s = Array.isArray(dias[d]) ? dias[d] : [];
      if (!n) { s.filter(Boolean).forEach(mid => perdas.push({ dia: d, materiaId: mid })); continue; }
      novo[d] = s.slice(0, n).concat(Array(Math.max(0, n - s.length)).fill(null));
      s.slice(n).filter(Boolean).forEach(mid => perdas.push({ dia: d, materiaId: mid }));
    }
    const agrupadas = [];
    perdas.forEach(p => { const a = agrupadas.find(x => x.dia === p.dia && x.materiaId === p.materiaId); if (a) a.qtd++; else agrupadas.push({ ...p, qtd: 1 }); });
    return { dias: novo, perdas: agrupadas };
  }
  function aplicarGrade(grades, dias, validaDesde) {
    return grades.filter(g => g.validaDesde < validaDesde).concat([{ validaDesde, dias }]).sort((a, b) => a.validaDesde.localeCompare(b.validaDesde));
  }
  function usoDaMateria(fac, mid) {
    const aulas = Object.values(fac.aulas).filter(dia => dia && dia[mid]).length;
    const anotacoes = fac.anotacoes.filter(a => a.materiaId === mid).length;
    return { aulas, anotacoes, podeExcluir: !aulas && !anotacoes };
  }
  function buscarAnotacoes(anotacoes, termo, mid) {
    const q = semAcento(String(termo || '').trim());
    return anotacoes.filter(a => (!mid || a.materiaId === mid) && (!q || semAcento([a.titulo, a.texto, a.paraProximaAula].join(' ')).includes(q)))
      .sort((a, b) => b.data.localeCompare(a.data) || String(b.atualizadoEm).localeCompare(String(a.atualizadoEm)));
  }
  function ordenarPorGravidade(materias, est) {
    return materias.slice().sort((a, b) => {
      const ea = est[a.id], eb = est[b.id];
      return NIVEIS.indexOf(eb.nivel) - NIVEIS.indexOf(ea.nivel) || (eb.percentual || 0) - (ea.percentual || 0) || a.nome.localeCompare(b.nome, 'pt-BR');
    });
  }

  const Faculdade = { NIVEIS, DIAS, tempos, gradeVigente, temposNoDia, diaLetivo, estatisticas, niveisAtingidos, nivelDe, avaliarAlertas, formatarPct, textoAlerta, textoRestante, textoStatus,
    aulasDoDia, rotuloTempos, faixaHorario, proximaAula, proximaAulaDe, pendentes, calendario, feriado, dentro, registro,
    validarSemestre, validarMateria, gradeVazia, validarGrade, adicionarAoDia, ajustarTempos, aplicarGrade, usoDaMateria, buscarAnotacoes, ordenarPorGravidade };
  if (typeof module !== 'undefined' && module.exports) module.exports = Faculdade;
  else raiz.Faculdade = Faculdade;
})(typeof globalThis !== 'undefined' ? globalThis : this);
