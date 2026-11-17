const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const A = require('../animacoes.js');

describe('decidirGesto (largura 400)', () => {
  const g = (dx, dy, velocidade) => A.decidirGesto({ dx, dy, largura: 400, velocidade });
  test('movimento mais vertical que horizontal → rolar', () => assert.equal(g(5, 20, 0), 'rolar'));
  test('abaixo de 40% e devagar → voltar', () => assert.equal(g(100, 0, 0.1), 'voltar'));
  test('40% para a direita → marcar', () => assert.equal(g(160, 0, 0.1), 'marcar'));
  test('40% para a esquerda → excluir', () => assert.equal(g(-160, 0, 0), 'excluir'));
  test('rápido depois de 15% → marcar', () => assert.equal(g(70, 0, 0.8), 'marcar'));
  test('rápido mas com menos de 15% → voltar', () => assert.equal(g(50, 0, 0.8), 'voltar'));
  test('rápido para a esquerda depois de 15% → excluir; velocidade contrária não conta', () => {
    assert.equal(g(-70, 0, -0.8), 'excluir');
    assert.equal(g(-70, 0, 0.8), 'voltar');
  });
});

describe('elastico', () => {
  test('até 60% acompanha o dedo', () => assert.equal(A.elastico(200, 400), 200));
  test('além de 60% cresce só 30%', () => assert.equal(A.elastico(300, 400), 258));
  test('vale para a esquerda também', () => assert.equal(A.elastico(-300, 400), -258));
});

describe('tokens de movimento', () => {
  test('durações da especificação', () => {
    assert.deepEqual([A.MOV.toque, A.MOV.rapida, A.MOV.base, A.MOV.lenta, A.MOV.comemoracao], [100, 160, 240, 340, 1100]);
  });
  test('sem DOM, reduzir movimento é verdadeiro (nada anima fora do navegador)', () => assert.equal(A.reduzido(), true));
});

describe('sons', () => {
  test('tique: 880 Hz, 40 ms; comemoração: 523, 659 e 784 Hz de 120 ms; volume 0,08', () => {
    assert.deepEqual(A.SONS.tique, { freq: [880], dur: 40 });
    assert.deepEqual(A.SONS.comemoracao, { freq: [523, 659, 784], dur: 120 });
    assert.equal(A.SONS.volume, 0.08);
  });
  test('sem contexto de áudio criado, tocar não faz nada', () => assert.doesNotThrow(() => A.tocar('tique')));
});
