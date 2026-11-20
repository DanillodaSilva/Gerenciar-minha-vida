(function (raiz) {
  const node = typeof module !== 'undefined' && module.exports;
  const R = node ? require('./regras.js') : raiz.Regras;
  const A = node ? require('./arvore.js') : raiz.Arvore;
  const F = node ? require('./faculdade.js') : raiz.Faculdade;
  const { somaDias } = R;
  const DIAS = 7, DIAS_AULA = 14, MAX_TITULO = 60;

  const cortar = t => { const c = Array.from(String(t || '')); return c.length > MAX_TITULO ? c.slice(0, MAX_TITULO - 1).join('') + '…' : c.join(''); };
  const ehData = d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);

  function itensDoDia(dados, dia) {
    const secao = id => dados.secoes.find(s => s.id === id);
    const itens = dados.secoes.flatMap(s => s.itens.filter(i => i.criadoEm <= dia && R.repeteNoDia(i, dia)).map(i => ({
      id: i.id, tipo: 'rotina', titulo: cortar(i.nome), subtitulo: cortar(s.nome), feito: (dados.feitos[dia] || []).includes(i.id),
    })));
    const tarefas = (dados.tarefas || []).filter(t => t.dueDate === dia).map(t => ({
      id: t.id, tipo: 'tarefa', titulo: cortar(t.title), subtitulo: cortar(secao(t.categoryId) ? secao(t.categoryId).nome : 'Tarefa'), feito: R.tarefaFeitaAte(t, dia),
    }));
    return itens.concat(tarefas);
  }

  function sequenciaAteOntem(dados, hoje) {
    let seq = 0;
    const inicio = A.primeiroDia(dados);
    if (!inicio) return 0;
    for (let d = somaDias(hoje, -1); d >= inicio; d = somaDias(d, -1)) {
      const r = R.resumoDia(dados, d);
      if (!r.total) continue;
      if (r.pct >= 50) seq++; else break;
    }
    return seq;
  }

  function aulas(dados, hoje) {
    const f = dados.faculdade;
    if (!f || !f.semestre) return [];
    const est = F.estatisticas(f, hoje), lista = [];
    for (let k = 0; k < DIAS_AULA; k++) {
      const dia = somaDias(hoje, k);
      F.aulasDoDia(f, dia).forEach(a => {
        const m = f.materias.find(x => x.id === a.materiaId);
        if (!m || m.arquivada || (a.registro && a.registro.status === 'sem_aula')) return;
        const s = est[m.id];
        lista.push({ data: dia, tempos: F.rotuloTempos(a.posicoes), materia: cortar(m.nome), sala: cortar(m.sala || ''), faltas: s ? F.formatarPct(s.percentual) : '0%', nivel: s ? s.nivel : 'ok' });
      });
    }
    return lista;
  }

  function montarRetrato(dados, hoje, memo) {
    const arv = A.calcularArvore(dados, hoje, memo);
    return {
      versao: 2,
      geradoEm: new Date().toISOString(),
      hoje,
      dias: Array.from({ length: DIAS + 1 }, (_, k) => { const data = somaDias(hoje, k); return { data, itens: itensDoDia(dados, data) }; }),
      arvore: { folhasAteOntem: arv.folhasAteOntem, tentativasAteOntem: arv.tentativasAteOntem, estagios: A.LIMITES.slice(), nomes: A.NOMES.slice() },
      sequencia: { ateOntem: sequenciaAteOntem(dados, hoje) },
      faculdadeVisivel: !(dados.ajustes && dados.ajustes.mostrarFaculdade === false),
      semestreConfigurado: !!(dados.faculdade && dados.faculdade.semestre),
      aulas: dados.ajustes && dados.ajustes.mostrarFaculdade === false ? [] : aulas(dados, hoje),
    };
  }

  function aplicarPendencias(dados, pendencias, hoje) {
    const lista = (Array.isArray(pendencias) ? pendencias : []).filter(p => p && ehData(p.data) && typeof p.id === 'string' && typeof p.em === 'string')
      .slice().sort((a, b) => (a.em < b.em ? -1 : a.em > b.em ? 1 : 0));
    let aplicadas = 0, ignoradas = 0, ate = null;
    lista.forEach(p => {
      if (!ate || p.em > ate) ate = p.em;
      const valor = p.feito === true;
      if (p.data > hoje) { ignoradas++; return; }
      if (p.tipo === 'tarefa') {
        const t = (dados.tarefas || []).find(x => x.id === p.id);
        if (!t) { ignoradas++; return; }
        if (!!t.completedAt === valor) return;
        t.completedAt = valor ? p.em : null; t.updatedAt = p.em;
        aplicadas++; return;
      }
      const existe = dados.secoes.some(s => s.itens.some(i => i.id === p.id));
      if (!existe) { ignoradas++; return; }
      const atual = dados.feitos[p.data] || [], tem = atual.includes(p.id);
      if (tem === valor) return;
      dados.feitos[p.data] = valor ? atual.concat(p.id) : atual.filter(x => x !== p.id);
      if (!dados.feitos[p.data].length) delete dados.feitos[p.data];
      aplicadas++;
    });
    return { aplicadas, ignoradas, ate };
  }

  function calcularDoRetrato(retrato, pendencias, hoje) {
    const ultimo = new Map();
    (pendencias || []).slice().sort((a, b) => (a.em < b.em ? -1 : 1)).forEach(p => ultimo.set(p.data + '|' + p.id, p.feito === true));
    const dia = d => retrato.dias.find(x => x.data === d);
    const resumo = d => { const x = dia(d); if (!x) return null; const total = x.itens.length, feitos = x.itens.filter(i => (ultimo.has(d + '|' + i.id) ? ultimo.get(d + '|' + i.id) : i.feito)).length; return { total, feitos, pct: total ? Math.round(feitos * 100 / total) : 0 }; };
    if (hoje > somaDias(retrato.hoje, DIAS) || hoje < retrato.hoje) return { desatualizado: true };
    let folhas = Math.max(0, retrato.arvore.folhasAteOntem || 0), seq = retrato.sequencia.ateOntem, tent = Math.max(0, retrato.arvore.tentativasAteOntem || 0);
    for (let d = retrato.hoje; d < hoje; d = somaDias(d, 1)) {
      const r = resumo(d);
      if (!r || !r.total) continue;
      let bonus = 0;
      if (r.feitos > 0) { tent++; if (tent % A.CICLO === 0) bonus = A.BONUS; } else tent = 0;
      folhas = Math.max(0, folhas + A.faixaDia(r.feitos, r.total, true).folhas + bonus);
      seq = r.pct >= 50 ? seq + 1 : 0;
    }
    const h = resumo(hoje) || { total: 0, feitos: 0, pct: 0 };
    const tentouHoje = h.total > 0 && h.feitos > 0;
    const folhasHoje = tentouHoje ? A.folhasDaFaixa(h.feitos, h.total) + ((tent + 1) % A.CICLO === 0 ? A.BONUS : 0) : 0;
    folhas += folhasHoje;
    const tentativas = tent + (tentouHoje ? 1 : 0);
    const lim = retrato.arvore.estagios || A.LIMITES, nomes = retrato.arvore.nomes || A.NOMES;
    let estagio = 0; lim.forEach((l, i) => { if (folhas >= l) estagio = i; });
    return { desatualizado: false, folhas, folhasHoje, tentativas, sequencia: seq, estagio, nomeEstagio: nomes[estagio] || '', itensHoje: h.total, feitosHoje: h.feitos, pctHoje: h.pct, resumo };
  }

  const Widget = { montarRetrato, aplicarPendencias, calcularDoRetrato, sequenciaAteOntem, cortar };
  if (node) module.exports = Widget;
  else raiz.Widget = Widget;
})(typeof globalThis !== 'undefined' ? globalThis : this);
