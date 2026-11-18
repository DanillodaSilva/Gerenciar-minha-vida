const { test } = require('node:test');
const assert = require('node:assert/strict');
const F = require('../fotos.js');

test('reconhece imagem pelo tipo do arquivo', () => {
  assert.equal(F.ehImagem({ type: 'image/jpeg' }), true);
  assert.equal(F.ehImagem({ type: 'image/heic' }), true);
  assert.equal(F.ehImagem({ type: 'application/pdf' }), false);
  assert.equal(F.ehImagem({ type: '' }), false);
  assert.equal(F.ehImagem(null), false);
});
test('redimensiona para no máximo 1920 px no lado maior', () => {
  assert.deepEqual(F.medidas(3000, 2000), { largura: 1920, altura: 1280 });
  assert.deepEqual(F.medidas(2000, 4000), { largura: 960, altura: 1920 });
  assert.deepEqual(F.medidas(800, 600), { largura: 800, altura: 600 });
  assert.deepEqual(F.medidas(1920, 1920), { largura: 1920, altura: 1920 });
});
test('base64 ida e volta preserva os bytes', async () => {
  const bytes = new Uint8Array(70000).map((_, i) => (i * 31) % 256);
  const texto = await F.paraBase64(new Blob([bytes], { type: 'image/webp' }));
  const volta = F.deBase64(texto, 'image/webp');
  assert.equal(volta.type, 'image/webp');
  assert.deepEqual(new Uint8Array(await volta.arrayBuffer()), bytes);
});
test('limite de 10 fotos por anotação', () => assert.equal(F.MAX_POR_ANOTACAO, 10));
