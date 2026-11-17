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

  const corTokenDe = s => CORES.includes(s.corToken) ? s.corToken : (COR_ANTIGA[String(s.cor || '').toLowerCase()] || 'gray');

  function itensDoDia(dados, dia, secao) {
    const secs = secao ? [secao] : dados.secoes;
    return secs.flatMap(s => s.itens.filter(i => i.criadoEm <= dia));
  }
  const feito = (dados, dia, id) => (dados.feitos[dia] || []).includes(id);
  function resumoDia(dados, dia, secao) {
    const itens = itensDoDia(dados, dia, secao);
    const feitas = itens.filter(i => feito(dados, dia, i.id)).length;
    return { total: itens.length, feitas, pct: itens.length ? Math.round(feitas / itens.length * 100) : 0 };
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

  const Regras = { CORES, COR_ANTIGA, fmt, parseDia, somaDias, curto, nomeDia, corTokenDe, itensDoDia, feito, resumoDia, sequencia };
  if (typeof module !== 'undefined' && module.exports) module.exports = Regras;
  else raiz.Regras = Regras;
})(typeof globalThis !== 'undefined' ? globalThis : this);
