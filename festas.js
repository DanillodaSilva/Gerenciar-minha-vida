(function (raiz) {
  const R = typeof module !== 'undefined' && module.exports ? require('./regras.js') : raiz.Regras;
  const { fmt, parseDia, somaDias } = R;
  const IDS = ['natal', 'ano-novo', 'carnaval', 'pascoa', 'namorados', 'junina', 'halloween', 'aniversario'];
  const PRIORIDADE = ['aniversario', 'ano-novo', 'natal', 'carnaval', 'pascoa', 'namorados', 'junina', 'halloween'];
  const NOMES = { natal: 'Natal', 'ano-novo': 'Ano Novo', carnaval: 'Carnaval', pascoa: 'Páscoa', namorados: 'Dia dos Namorados', junina: 'Festa Junina', halloween: 'Halloween', aniversario: 'Seu aniversário' };
  const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const dois = n => String(n).padStart(2, '0');
  const data = (a, m, d) => a + '-' + dois(m) + '-' + dois(d);
  const somarDias = somaDias;
  const diasEntre = (a, b) => Math.round((parseDia(b) - parseDia(a)) / 864e5);
  const bissexto = a => (a % 4 === 0 && a % 100 !== 0) || a % 400 === 0;

  function pascoa(ano) {
    const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100, d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const t = h + l - 7 * m + 114;
    return data(ano, Math.floor(t / 31), (t % 31) + 1);
  }
  const janela = (id, ano, c0, c1, a0, a1, principal) => ({ id, ano, chegando: [c0, c1], auge: [a0, a1], principal });
  function janelasDoAno(ano, aniversario) {
    const P = pascoa(ano), p = n => somarDias(P, n);
    const l = [
      janela('natal', ano, data(ano, 12, 1), data(ano, 12, 23), data(ano, 12, 24), data(ano, 12, 25), data(ano, 12, 25)),
      janela('ano-novo', ano, data(ano - 1, 12, 26), data(ano - 1, 12, 30), data(ano - 1, 12, 31), data(ano, 1, 1), data(ano, 1, 1)),
      janela('carnaval', ano, p(-57), p(-51), p(-50), p(-47), p(-50)),
      janela('pascoa', ano, p(-7), p(-2), p(-1), P, P),
      janela('namorados', ano, data(ano, 6, 5), data(ano, 6, 11), data(ano, 6, 12), data(ano, 6, 12), data(ano, 6, 12)),
      janela('junina', ano, data(ano, 6, 13), data(ano, 6, 22), data(ano, 6, 23), data(ano, 6, 29), data(ano, 6, 24)),
      janela('halloween', ano, data(ano, 10, 24), data(ano, 10, 30), data(ano, 10, 31), data(ano, 10, 31), data(ano, 10, 31)),
    ];
    if (aniversario) {
      const [m, d] = aniversario.split('-').map(Number);
      const dia = m === 2 && d === 29 && !bissexto(ano) ? data(ano, 2, 28) : data(ano, m, d);
      l.push(janela('aniversario', ano, somarDias(dia, -3), somarDias(dia, -1), dia, dia, dia));
    }
    return l;
  }
  const dentro = (d, [a, b]) => d >= a && d <= b;
  function festaAtiva(d, ajustesFestas) {
    const f = ajustesFestas || {};
    if (f.ativas === false) return null;
    const desligadas = Array.isArray(f.desligadas) ? f.desligadas : [];
    const ano = Number(d.slice(0, 4));
    const candidatas = [];
    for (const y of [ano - 1, ano, ano + 1]) for (const j of janelasDoAno(y, f.aniversario || null)) {
      if (desligadas.includes(j.id)) continue;
      const fase = dentro(d, j.auge) ? 'auge' : dentro(d, j.chegando) ? 'chegando' : null;
      if (fase) candidatas.push({ id: j.id, fase, diasPara: diasEntre(d, j.principal), ano: j.ano });
    }
    if (!candidatas.length) return null;
    candidatas.sort((a, b) => (a.fase === b.fase ? 0 : a.fase === 'auge' ? -1 : 1) || PRIORIDADE.indexOf(a.id) - PRIORIDADE.indexOf(b.id));
    return candidatas[0];
  }

  const ALVO = { natal: 'o Natal', carnaval: 'o Carnaval', pascoa: 'a Páscoa', namorados: 'o Dia dos Namorados', junina: 'o São João', halloween: 'o Halloween', aniversario: 'o seu aniversário' };
  function textoChegando(festa) {
    const n = festa.diasPara, alvo = festa.id === 'ano-novo' ? String(festa.ano) : ALVO[festa.id];
    return (n === 1 ? 'Falta 1 dia' : 'Faltam ' + n + ' dias') + ' para ' + alvo;
  }
  function saudacaoFesta(festa, d, nome) {
    const n = String(nome || '').trim(), comNome = t => t + (n ? ', ' + n : '') + '!';
    const md = d.slice(5);
    if (festa.id === 'natal') return comNome(md === '12-24' ? 'Feliz véspera de Natal' : 'Feliz Natal');
    if (festa.id === 'ano-novo') return comNome(md === '12-31' ? 'Último dia de ' + (festa.ano - 1) : 'Feliz ' + festa.ano);
    return comNome({ carnaval: 'Bom Carnaval', pascoa: 'Feliz Páscoa', namorados: 'Feliz Dia dos Namorados', junina: 'Boa festa junina', halloween: 'Feliz Halloween', aniversario: 'Feliz aniversário' }[festa.id]);
  }
  function contagemAnoNovo(agora) {
    const ano = agora.getFullYear() + 1, falta = new Date(ano, 0, 1) - agora;
    if (falta < 60000) return 'Falta menos de 1 minuto para ' + ano;
    const total = Math.ceil(falta / 60000), h = Math.floor(total / 60), min = total % 60;
    const partes = [h ? h + ' h' : '', min ? min + ' min' : ''].filter(Boolean).join(' ');
    return ((h || min) === 1 ? 'Falta ' : 'Faltam ') + partes + ' para ' + ano;
  }

  function retrospectiva(dados, ano) {
    const ini = data(ano, 1, 1), fim = data(ano, 12, 31), meses = Array.from({ length: 12 }, () => ({ dados: 0, contaram: 0 }));
    let comDados = 0, contaram = 0, maior = 0, atual = 0, itens = 0;
    for (let d = ini; d <= fim; d = somarDias(d, 1)) {
      const r = R.resumoDia(dados, d), mes = Number(d.slice(5, 7)) - 1;
      itens += R.concluidasNoDia(dados, d);
      if (!r.total) continue;
      comDados++; meses[mes].dados++;
      if (r.pct >= 50) { contaram++; meses[mes].contaram++; atual++; maior = Math.max(maior, atual); }
      else atual = 0;
    }
    if (comDados < 7) return null;
    let melhor = -1, taxa = -1;
    meses.forEach((m, i) => { if (!m.dados) return; const t = m.contaram / m.dados; if (t >= taxa) { taxa = t; melhor = i; } });
    return { ano, diasContaram: contaram, maiorSequencia: maior, itensConcluidos: itens, mesMaisConstante: melhor < 0 ? null : MESES[melhor] };
  }

  function lerSimulacao(hostname, busca) {
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') return null;
    const p = new URLSearchParams(busca || '');
    const d = p.get('data'), h = p.get('hora');
    const okData = typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && fmt(parseDia(d)) === d;
    const okHora = typeof h === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(h);
    return okData || okHora ? { data: okData ? d : null, hora: okHora ? h : null } : null;
  }

  const Festas = { IDS, PRIORIDADE, NOMES, MESES, pascoa, somarDias, diasEntre, janelasDoAno, festaAtiva, textoChegando, saudacaoFesta, contagemAnoNovo, retrospectiva, lerSimulacao };
  if (typeof module !== 'undefined' && module.exports) module.exports = Festas;
  else raiz.Festas = Festas;
})(typeof globalThis !== 'undefined' ? globalThis : this);
