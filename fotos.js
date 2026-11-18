(function (raiz) {
  const BANCO = 'rotina-app-fotos', LOJA = 'fotos', LADO = 1920, MAX_POR_ANOTACAO = 10;
  const ehImagem = f => !!f && /^image\//.test(f.type || '');
  function medidas(largura, altura, lado = LADO) {
    const k = Math.min(1, lado / Math.max(largura, altura));
    return { largura: Math.max(1, Math.round(largura * k)), altura: Math.max(1, Math.round(altura * k)) };
  }
  async function paraBase64(blob) {
    const b = new Uint8Array(await blob.arrayBuffer());
    let s = '';
    for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function deBase64(texto, tipo) {
    const s = atob(texto), b = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
    return new Blob([b], { type: tipo });
  }

  let conexao = null;
  function abrir() {
    if (conexao) return conexao;
    conexao = new Promise((ok, erro) => {
      const r = indexedDB.open(BANCO, 1);
      r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(LOJA)) r.result.createObjectStore(LOJA, { keyPath: 'id' }).createIndex('anotacaoId', 'anotacaoId'); };
      r.onsuccess = () => { r.result.onversionchange = () => { r.result.close(); conexao = null; }; ok(r.result); };
      r.onerror = () => { conexao = null; erro(r.error); };
    });
    return conexao;
  }
  async function operar(modo, fn) {
    const db = await abrir();
    return new Promise((ok, erro) => {
      const tx = db.transaction(LOJA, modo), r = fn(tx.objectStore(LOJA));
      tx.oncomplete = () => ok(r && 'result' in r ? r.result : undefined);
      tx.onerror = tx.onabort = () => erro(tx.error || new Error('Falha ao acessar as fotos.'));
    });
  }
  const salvar = reg => operar('readwrite', l => l.put(reg));
  const ler = id => operar('readonly', l => l.get(id));
  const lerVarias = ids => Promise.all(ids.map(ler)).then(l => l.filter(Boolean));
  const todos = () => operar('readonly', l => l.getAll());
  const apagar = ids => (ids.length ? operar('readwrite', l => { ids.forEach(id => l.delete(id)); }) : Promise.resolve());
  async function limparOrfas(referenciadas) {
    const orfas = (await todos()).filter(f => !referenciadas.has(f.id)).map(f => f.id);
    await apagar(orfas);
    return orfas.length;
  }
  async function espaco() {
    const fotos = (await todos()).reduce((a, f) => a + (f.bytes || 0), 0);
    let usado = 0, cota = 0;
    try { const e = await navigator.storage.estimate(); usado = e.usage || 0; cota = e.quota || 0; } catch (e) {}
    return { fotos, usado, cota };
  }
  async function persistir() {
    try { if (navigator.storage && navigator.storage.persist && !(await navigator.storage.persisted())) await navigator.storage.persist(); } catch (e) {}
  }

  const CODIGO_WORKER = `self.onmessage = async e => {
    try {
      const bmp = await createImageBitmap(e.data.arquivo, { imageOrientation: 'from-image' });
      const k = Math.min(1, e.data.lado / Math.max(bmp.width, bmp.height));
      const w = Math.max(1, Math.round(bmp.width * k)), h = Math.max(1, Math.round(bmp.height * k));
      const c = new OffscreenCanvas(w, h);
      c.getContext('2d').drawImage(bmp, 0, 0, w, h);
      bmp.close();
      let blob = await c.convertToBlob({ type: 'image/webp', quality: 0.75 });
      if (blob.type !== 'image/webp') blob = await c.convertToBlob({ type: 'image/jpeg', quality: 0.8 });
      self.postMessage({ blob, largura: w, altura: h });
    } catch (err) { self.postMessage({ erro: 'nao-imagem' }); }
  };`;
  let worker = null;
  function viaWorker(arquivo) {
    if (!worker) worker = new Worker(URL.createObjectURL(new Blob([CODIGO_WORKER], { type: 'text/javascript' })));
    return new Promise((ok, erro) => {
      worker.onmessage = e => (e.data.erro ? erro(new Error(e.data.erro)) : ok(e.data));
      worker.onerror = ev => { ev.preventDefault(); worker = null; erro(new Error('sem-worker')); };
      worker.postMessage({ arquivo, lado: LADO });
    });
  }
  async function noPrincipal(arquivo) {
    let fonte;
    try { fonte = await createImageBitmap(arquivo, { imageOrientation: 'from-image' }); }
    catch (e) {
      const url = URL.createObjectURL(arquivo);
      try { fonte = await new Promise((ok, erro) => { const img = new Image(); img.onload = () => ok(img); img.onerror = () => erro(new Error('nao-imagem')); img.src = url; }); }
      finally { setTimeout(() => URL.revokeObjectURL(url), 0); }
    }
    const { largura, altura } = medidas(fonte.naturalWidth || fonte.width, fonte.naturalHeight || fonte.height);
    const c = document.createElement('canvas');
    c.width = largura; c.height = altura;
    c.getContext('2d').drawImage(fonte, 0, 0, largura, altura);
    if (fonte.close) fonte.close();
    const gerar = (tipo, q) => new Promise(ok => c.toBlob(ok, tipo, q));
    let blob = await gerar('image/webp', 0.75);
    if (!blob || blob.type !== 'image/webp') blob = await gerar('image/jpeg', 0.8);
    return { blob, largura, altura };
  }
  async function comprimir(arquivo) {
    if (!ehImagem(arquivo)) throw new Error('nao-imagem');
    let r = null;
    if (typeof OffscreenCanvas !== 'undefined' && typeof Worker !== 'undefined') {
      try { r = await viaWorker(arquivo); } catch (e) { if (e.message === 'nao-imagem') throw e; }
    }
    if (!r) r = await noPrincipal(arquivo);
    return { blob: r.blob, tipo: r.blob.type, largura: r.largura, altura: r.altura, bytes: r.blob.size };
  }
  let fila = Promise.resolve();
  function processar(arquivo) {
    const p = fila.then(() => comprimir(arquivo));
    fila = p.catch(() => {});
    return p;
  }

  const Fotos = { MAX_POR_ANOTACAO, LADO, ehImagem, medidas, paraBase64, deBase64, abrir, salvar, ler, lerVarias, todos, apagar, limparOrfas, espaco, persistir, processar };
  if (typeof module !== 'undefined' && module.exports) module.exports = Fotos;
  else raiz.Fotos = Fotos;
})(typeof globalThis !== 'undefined' ? globalThis : this);
