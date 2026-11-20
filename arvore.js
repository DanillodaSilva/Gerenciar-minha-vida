(function (raiz) {
  const R = typeof module !== 'undefined' && module.exports ? require('./regras.js') : raiz.Regras;
  const { somaDias } = R;
  const LIMITES = [0, 5, 15, 35, 70, 140, 250, 400, 600, 1000];
  const NOMES = ['Semente', 'Broto', 'Muda', 'Arvoreta', 'Árvore jovem', 'Árvore', 'Árvore frondosa', 'Árvore florida', 'Árvore com frutos', 'Árvore anciã'];
  const FAIXAS = ['Começou', 'Caminhando', 'Bom dia', 'Quase lá', 'Dia completo'];
  const EM_BRANCO = 'Em branco', PERDA = 2, BONUS = 3, CICLO = 7;
  const estagioDe = folhas => { let e = 0; for (let i = 0; i < LIMITES.length; i++) if (folhas >= LIMITES[i]) e = i; return e; };

  function folhasDaFaixa(feitas, total) {
    if (!total || feitas <= 0) return 0;
    if (feitas >= total) return 5;
    if (feitas * 4 >= total * 3) return 4;
    if (feitas * 2 >= total) return 3;
    if (feitas * 4 >= total) return 2;
    return 1;
  }
  function faixaDia(feitas, total, encerrado) {
    if (!total) return { folhas: 0, faixa: null };
    if (feitas <= 0) return encerrado ? { folhas: -PERDA, faixa: EM_BRANCO } : { folhas: 0, faixa: null };
    const f = folhasDaFaixa(feitas, total);
    return { folhas: f, faixa: FAIXAS[f - 1] };
  }
  function proximaFaixa(feitas, total) {
    if (!total || feitas >= total) return null;
    const atual = folhasDaFaixa(feitas, total);
    for (let c = feitas + 1; c <= total; c++) { const f = folhasDaFaixa(c, total); if (f > atual) return { faltamItens: c - feitas, folhas: f }; }
    return null;
  }
  const contagem = (dados, dia) => { const r = R.resumoDia(dados, dia); return { feitas: r.feitas, total: r.total }; };

  function primeiroDia(dados) {
    let menor = null;
    const ver = d => { if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && (!menor || d < menor)) menor = d; };
    dados.secoes.forEach(s => s.itens.forEach(i => ver(i.criadoEm)));
    Object.keys(dados.feitos || {}).forEach(ver);
    (dados.tarefas || []).forEach(t => { ver(t.dueDate); ver(R.dataLocal(t.completedAt)); });
    return menor;
  }
  function passo(estado, feitas, total) {
    const fx = faixaDia(feitas, total, true);
    let bonus = 0;
    if (total && feitas > 0) { estado.tentativas++; if (estado.tentativas % CICLO === 0) bonus = BONUS; }
    else if (total) estado.tentativas = 0;
    const variacao = fx.folhas + bonus, antes = estado.folhas;
    estado.folhas = Math.max(0, antes + variacao);
    const real = estado.folhas - antes;
    if (real > 0) estado.ganhas += real; else estado.perdidas -= real;
    return { variacao, faixa: fx.faixa, bonus, real };
  }
  function variacaoDia(dados, dia) { const c = contagem(dados, dia); return faixaDia(c.feitas, c.total, true).folhas; }

  function acumular(dados, de, ate) {
    const estado = { folhas: 0, ganhas: 0, perdidas: 0, tentativas: 0 };
    const porDia = new Map();
    if (de) for (let d = de; d <= ate; d = somaDias(d, 1)) { const c = contagem(dados, d); porDia.set(d, passo(estado, c.feitas, c.total)); }
    return { ...estado, porDia };
  }
  function assinatura(dados, hoje) {
    const feitos = Object.keys(dados.feitos || {}).filter(d => d < hoje).sort().map(d => d + (dados.feitos[d] || []).join(','));
    const itens = dados.secoes.map(s => s.itens.map(i => i.id + i.criadoEm + (i.dias || []).join('')).join('|'));
    const tarefas = (dados.tarefas || []).map(t => { const c = R.dataLocal(t.completedAt); return t.id + (t.dueDate || '') + (c && c < hoje ? c : ''); });
    return hoje + '#' + feitos.join(';') + '#' + itens.join('/') + '#' + tarefas.join(';');
  }
  const VAZIO = { variacao: 0, faixa: null, bonus: 0, real: 0 };
  function calcularArvore(dados, hoje, memo) {
    const ontem = somaDias(hoje, -1), inicio = primeiroDia(dados);
    const chave = memo ? assinatura(dados, hoje) : null;
    const a = memo && memo.chave === chave ? memo.acumulado : acumular(dados, inicio && inicio <= ontem ? inicio : null, ontem);
    if (memo) { memo.chave = chave; memo.acumulado = a; }
    const ativo = !!(inicio && inicio <= hoje);
    const c = ativo ? contagem(dados, hoje) : { feitas: 0, total: 0 };
    const tentou = c.total > 0 && c.feitas > 0;
    const fx = faixaDia(c.feitas, c.total, false);
    const bonusHoje = tentou && (a.tentativas + 1) % CICLO === 0 ? BONUS : 0;
    const folhasHoje = fx.folhas + bonusHoje;
    const folhas = a.folhas + folhasHoje, estagio = estagioDe(folhas);
    const historico = [];
    for (let k = 29; k >= 0; k--) {
      const d = somaDias(hoje, -k);
      const p = d === hoje ? { variacao: folhasHoje, faixa: fx.faixa, bonus: bonusHoje, real: folhasHoje } : (a.porDia.get(d) || VAZIO);
      historico.push({ data: d, variacao: p.variacao, faixa: p.faixa, bonus: p.bonus, real: p.real });
    }
    return {
      hoje, folhas, folhasAteOntem: a.folhas, estagio, nomeEstagio: NOMES[estagio],
      proximo: estagio < 9 ? { nome: NOMES[estagio + 1], faltam: LIMITES[estagio + 1] - folhas } : null,
      ganhas: a.ganhas + folhasHoje, perdidas: a.perdidas, historico,
      folhasHoje, faixaHoje: fx.faixa, bonusHoje, feitasHoje: c.feitas, totalHoje: c.total,
      tentativasAteOntem: a.tentativas, tentativasSeguidas: a.tentativas + (tentou ? 1 : 0),
      proximaFaixa: proximaFaixa(c.feitas, c.total),
    };
  }
  const vazio = x => x === null || x === undefined;
  function eventosDesde(anterior, atual) {
    const ev = [];
    if (!anterior || vazio(anterior.folhasVistas)) return ev;
    const est = vazio(anterior.estagioVisto) ? estagioDe(anterior.folhasVistas) : anterior.estagioVisto;
    const diaNovo = !!anterior.diaFaixa && anterior.diaFaixa < atual.hoje;
    if (diaNovo) {
      const perdidas = atual.historico.filter(h => h.data >= anterior.diaFaixa && h.data < atual.hoje && h.real < 0).reduce((s, h) => s - h.real, 0);
      if (perdidas > 0) ev.push({ tipo: 'perdeu', n: perdidas });
      if (atual.estagio < est) ev.push({ tipo: 'voltouEstagio', nome: NOMES[atual.estagio] });
    }
    const vista = anterior.diaFaixa === atual.hoje && Number.isInteger(anterior.faixaVista) ? anterior.faixaVista : 0;
    const f = folhasDaFaixa(atual.feitasHoje, atual.totalHoje);
    if (f > vista) ev.push({ tipo: 'faixaSubiu', faixa: FAIXAS[f - 1], folhas: f, primeira: vista === 0 });
    if (atual.bonusHoje > 0 && anterior.bonusDia !== atual.hoje) ev.push({ tipo: 'bonus', dias: atual.tentativasSeguidas });
    if (atual.estagio > est) ev.push({ tipo: 'subiuEstagio', nome: NOMES[atual.estagio] });
    return ev;
  }
  function registrarVisto(anterior, atual) {
    const mesmoDia = anterior && anterior.diaFaixa === atual.hoje;
    const vista = mesmoDia && Number.isInteger(anterior.faixaVista) ? anterior.faixaVista : 0;
    return {
      ...anterior, folhasVistas: atual.folhas, estagioVisto: atual.estagio, diaFaixa: atual.hoje,
      faixaVista: Math.max(vista, folhasDaFaixa(atual.feitasHoje, atual.totalHoje)),
      bonusDia: atual.bonusHoje > 0 ? atual.hoje : (anterior && anterior.bonusDia) || null,
    };
  }
  function transicaoRegra(anterior, atual) {
    if (anterior && anterior.regra === 2) return null;
    const tinha = !!anterior && !vazio(anterior.folhasVistas);
    return {
      arvore: { ...registrarVisto(anterior || {}, atual), regra: 2 },
      fala: tinha ? `Mudei a regra: agora todo esforço conta! Cada item feito ajuda sua árvore. Ela foi recalculada e está com ${atual.folhas} ${atual.folhas === 1 ? 'folha' : 'folhas'}.` : null,
    };
  }

  const Arvore = { LIMITES, NOMES, FAIXAS, EM_BRANCO, BONUS, CICLO, estagioDe, folhasDaFaixa, faixaDia, proximaFaixa, primeiroDia, variacaoDia, calcularArvore, eventosDesde, registrarVisto, transicaoRegra };
  if (typeof module !== 'undefined' && module.exports) module.exports = Arvore;
  else raiz.Arvore = Arvore;
})(typeof globalThis !== 'undefined' ? globalThis : this);
