(function (raiz) {
  const R = typeof module !== 'undefined' && module.exports ? require('./regras.js') : raiz.Regras;
  const { somaDias } = R;
  const LIMITES = [0, 1, 3, 7, 14, 30, 60, 100, 180, 365];
  const NOMES = ['Semente', 'Broto', 'Muda', 'Arvoreta', 'Árvore jovem', 'Árvore', 'Árvore frondosa', 'Árvore florida', 'Árvore com frutos', 'Árvore anciã'];
  const estagioDe = folhas => { let e = 0; for (let i = 0; i < LIMITES.length; i++) if (folhas >= LIMITES[i]) e = i; return e; };

  function primeiroDia(dados) {
    let menor = null;
    const ver = d => { if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && (!menor || d < menor)) menor = d; };
    dados.secoes.forEach(s => s.itens.forEach(i => ver(i.criadoEm)));
    Object.keys(dados.feitos || {}).forEach(ver);
    (dados.tarefas || []).forEach(t => { ver(t.dueDate); ver(R.dataLocal(t.completedAt)); });
    return menor;
  }
  function variacaoDia(dados, dia) {
    const r = R.resumoDia(dados, dia);
    if (!r.total) return 0;
    if (r.feitas >= r.total) return 1;
    return r.pct < 50 ? -1 : 0;
  }
  const completoHoje = (dados, hoje) => variacaoDia(dados, hoje) === 1;

  function acumular(dados, de, ate) {
    let folhas = 0, ganhas = 0, perdidas = 0;
    const porDia = new Map();
    if (de) for (let d = de; d <= ate; d = somaDias(d, 1)) {
      const v = variacaoDia(dados, d);
      if (v > 0) { folhas++; ganhas++; } else if (v < 0 && folhas > 0) { folhas--; perdidas++; }
      porDia.set(d, v);
    }
    return { folhas, ganhas, perdidas, porDia };
  }
  function assinatura(dados, hoje) {
    const feitos = Object.keys(dados.feitos || {}).filter(d => d < hoje).sort().map(d => d + (dados.feitos[d] || []).join(','));
    const itens = dados.secoes.map(s => s.itens.map(i => i.id + i.criadoEm + (i.dias || []).join('')).join('|'));
    const tarefas = (dados.tarefas || []).map(t => { const c = R.dataLocal(t.completedAt); return t.id + (t.dueDate || '') + (c && c < hoje ? c : ''); });
    return hoje + '#' + feitos.join(';') + '#' + itens.join('/') + '#' + tarefas.join(';');
  }
  function calcularArvore(dados, hoje, memo) {
    const ontem = somaDias(hoje, -1), inicio = primeiroDia(dados);
    const chave = memo ? assinatura(dados, hoje) : null;
    const a = memo && memo.chave === chave ? memo.acumulado : acumular(dados, inicio && inicio <= ontem ? inicio : null, ontem);
    if (memo) { memo.chave = chave; memo.acumulado = a; }
    const hojeMais = inicio && inicio <= hoje && completoHoje(dados, hoje) ? 1 : 0;
    const folhas = a.folhas + hojeMais, estagio = estagioDe(folhas);
    const historico = [];
    for (let k = 29; k >= 0; k--) {
      const d = somaDias(hoje, -k);
      historico.push({ data: d, variacao: d === hoje ? hojeMais : (a.porDia.get(d) || 0) });
    }
    return {
      folhas, folhasAteOntem: a.folhas, estagio, nomeEstagio: NOMES[estagio],
      proximo: estagio < 9 ? { nome: NOMES[estagio + 1], faltam: LIMITES[estagio + 1] - folhas } : null,
      ganhas: a.ganhas + hojeMais, perdidas: a.perdidas, historico,
    };
  }
  function eventosDesde(anterior, atual) {
    const ev = [];
    if (!anterior || anterior.folhasVistas === null || anterior.folhasVistas === undefined) return ev;
    const dif = atual.folhas - anterior.folhasVistas, est = anterior.estagioVisto === null || anterior.estagioVisto === undefined ? estagioDe(anterior.folhasVistas) : anterior.estagioVisto;
    if (dif < 0) ev.push({ tipo: 'perdeu', n: -dif });
    if (atual.estagio < est) ev.push({ tipo: 'voltouEstagio', nome: NOMES[atual.estagio] });
    if (dif > 0) ev.push({ tipo: 'ganhou', n: dif });
    if (atual.estagio > est) ev.push({ tipo: 'subiuEstagio', nome: NOMES[atual.estagio] });
    return ev;
  }

  const Arvore = { LIMITES, NOMES, estagioDe, primeiroDia, variacaoDia, calcularArvore, eventosDesde };
  if (typeof module !== 'undefined' && module.exports) module.exports = Arvore;
  else raiz.Arvore = Arvore;
})(typeof globalThis !== 'undefined' ? globalThis : this);
