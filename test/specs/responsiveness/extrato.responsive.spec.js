const extratoScreen = require('../../screens/ExtratoScreen');
const { assertAllElementsInViewport, assertNoOverlaps, assertScreenIntegrity } = require('../../utils/layout-assertions');
const { salvarScreenshotVisual } = require('../../utils/visual-helpers');
const { tagTest, anexarScreenshot } = require('../../utils/allure-helper');

describe('Extrato — Responsividade', () => {

  before(async () => {
    await extratoScreen.aguardarCarregamento();
  });

  // ─── Visibilidade ──────────────────────────────────────────────────────────

  it('Todos os elementos críticos devem estar dentro do viewport', async () => {
    tagTest({ feature: 'Tela de Extrato', story: 'Visibilidade de elementos', severity: 'critical' });
    await assertAllElementsInViewport(extratoScreen);
  });

  it('O saldo disponível deve estar visível no topo', async () => {
    tagTest({ feature: 'Tela de Extrato', story: 'Visibilidade de elementos', severity: 'critical' });
    await expect(extratoScreen.saldoDisponivel).toBeDisplayed();
    await extratoScreen.assertWithinViewport(extratoScreen.saldoDisponivel, 'Saldo Disponível');
  });

  it('O filtro de período deve estar visível e acessível', async () => {
    tagTest({ feature: 'Tela de Extrato', story: 'Visibilidade de elementos', severity: 'normal' });
    await extratoScreen.assertWithinViewport(extratoScreen.filtroPeriodo, 'Filtro Período');
  });

  // ─── Sobreposição ──────────────────────────────────────────────────────────

  it('Nenhum elemento deve sobrepor outro', async () => {
    tagTest({ feature: 'Tela de Extrato', story: 'Integridade de layout', severity: 'critical' });
    await assertNoOverlaps(extratoScreen);
  });

  // ─── Overflow ─────────────────────────────────────────────────────────────

  it('Não deve haver scroll horizontal na tela de extrato', async () => {
    tagTest({ feature: 'Tela de Extrato', story: 'Integridade de layout', severity: 'critical' });
    await extratoScreen.assertNoHorizontalOverflow();
  });

  // ─── Touch targets ────────────────────────────────────────────────────────

  it('Botão ocultar saldo deve ter touch target mínimo de 44x44dp', async () => {
    tagTest({ feature: 'Tela de Extrato', story: 'Acessibilidade — Touch Targets', severity: 'normal' });
    const visivel = await extratoScreen.botaoOcultarSaldo.isDisplayed().catch(() => false);
    if (visivel) {
      await extratoScreen.assertMinTouchTarget(extratoScreen.botaoOcultarSaldo, 'Botão Ocultar Saldo');
    }
  });

  // ─── Truncamento de texto ─────────────────────────────────────────────────

  it('Valor do saldo não deve estar truncado em telas compactas', async () => {
    tagTest({ feature: 'Tela de Extrato', story: 'Integridade de layout', severity: 'normal' });
    await extratoScreen.assertNotTruncated(extratoScreen.saldoDisponivel, 'Saldo Disponível');
  });

  // ─── Integridade completa ─────────────────────────────────────────────────

  it('Integridade completa da tela (viewport + overlaps + overflow + touch targets)', async () => {
    tagTest({ feature: 'Tela de Extrato', story: 'Integridade de layout', severity: 'blocker' });
    await assertScreenIntegrity(extratoScreen);
  });

  // ─── Visual regression ────────────────────────────────────────────────────

  it('[Visual] Screenshot da tela de extrato para comparação com baseline', async () => {
    tagTest({ feature: 'Tela de Extrato', story: 'Regressão Visual', severity: 'normal' });
    await extratoScreen.waitForVisualStability();
    const caminho = await salvarScreenshotVisual('extrato', extratoScreen.deviceProfile);
    if (caminho) anexarScreenshot('Screenshot — Extrato', caminho);
  });

});
