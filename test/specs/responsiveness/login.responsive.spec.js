const loginScreen = require('../../screens/LoginScreen');
const { assertAllElementsInViewport, assertNoOverlaps, assertScreenIntegrity } = require('../../utils/layout-assertions');
const { salvarScreenshotVisual } = require('../../utils/visual-helpers');
const { tagTest, anexarScreenshot } = require('../../utils/allure-helper');

describe('Login — Responsividade', () => {

  before(async () => {
    await loginScreen.aguardarCarregamento();
  });

  // ─── Visibilidade ──────────────────────────────────────────────────────────

  it('Logo Cresol deve estar visível no viewport', async () => {
    tagTest({ feature: 'Tela de Login', story: 'Visibilidade de elementos', severity: 'critical' });
    await expect(loginScreen.logoImagem).toBeDisplayed();
    await loginScreen.assertWithinViewport(loginScreen.logoImagem, 'Logo Cresol');
  });

  it('As 3 abas (PF, PJ, GF) devem estar visíveis simultaneamente', async () => {
    tagTest({ feature: 'Tela de Login', story: 'Visibilidade de elementos', severity: 'critical' });
    await loginScreen.assertWithinViewport(loginScreen.abaPessoaFisica,     'Aba Pessoa Física');
    await loginScreen.assertWithinViewport(loginScreen.abaPessoaJuridica,   'Aba Pessoa Jurídica');
    await loginScreen.assertWithinViewport(loginScreen.abaGestorFinanceiro, 'Aba Gestor Financeiro');
  });

  it('Campos Chave Multicanal e Senha devem estar dentro do viewport', async () => {
    tagTest({ feature: 'Tela de Login', story: 'Visibilidade de elementos', severity: 'critical' });
    await loginScreen.assertWithinViewport(loginScreen.containerChaveMulticanal, 'Campo Chave Multicanal');
    await loginScreen.assertWithinViewport(loginScreen.containerSenha,           'Campo Senha');
  });

  it('Botão Entrar deve estar dentro do viewport', async () => {
    tagTest({ feature: 'Tela de Login', story: 'Visibilidade de elementos', severity: 'critical' });
    await loginScreen.assertWithinViewport(loginScreen.botaoEntrar, 'Botão Entrar');
  });

  it('Link Cadastre-se deve estar dentro do viewport', async () => {
    tagTest({ feature: 'Tela de Login', story: 'Visibilidade de elementos', severity: 'normal' });
    await loginScreen.assertWithinViewport(loginScreen.linkCadastrese, 'Link Cadastre-se');
  });

  it('Todos os elementos críticos devem estar dentro do viewport', async () => {
    tagTest({ feature: 'Tela de Login', story: 'Visibilidade de elementos', severity: 'critical' });
    await assertAllElementsInViewport(loginScreen);
  });

  // ─── Sobreposição ──────────────────────────────────────────────────────────

  it('Nenhum elemento deve sobrepor outro', async () => {
    tagTest({ feature: 'Tela de Login', story: 'Integridade de layout', severity: 'critical' });
    await assertNoOverlaps(loginScreen);
  });

  // ─── Overflow ─────────────────────────────────────────────────────────────

  it('Não deve haver scroll horizontal na tela de login', async () => {
    tagTest({ feature: 'Tela de Login', story: 'Integridade de layout', severity: 'critical' });
    await loginScreen.assertNoHorizontalOverflow();
  });

  // ─── Touch targets (WCAG 2.5.5 — mínimo 44dp) ────────────────────────────

  it('Aba Pessoa Física deve ter touch target mínimo de 44dp', async () => {
    tagTest({ feature: 'Tela de Login', story: 'Acessibilidade — Touch Targets', severity: 'normal' });
    await loginScreen.assertMinTouchTarget(loginScreen.abaPessoaFisica, 'Aba Pessoa Física');
  });

  it('Aba Pessoa Jurídica deve ter touch target mínimo de 44dp', async () => {
    tagTest({ feature: 'Tela de Login', story: 'Acessibilidade — Touch Targets', severity: 'normal' });
    await loginScreen.assertMinTouchTarget(loginScreen.abaPessoaJuridica, 'Aba Pessoa Jurídica');
  });

  it('Botão Entrar deve ter touch target mínimo de 44dp', async () => {
    tagTest({ feature: 'Tela de Login', story: 'Acessibilidade — Touch Targets', severity: 'critical' });
    await loginScreen.assertMinTouchTarget(loginScreen.botaoEntrar, 'Botão Entrar');
  });

  // ─── Comportamento com teclado ────────────────────────────────────────────

  it('Botão Entrar deve permanecer acessível após abrir o teclado', async () => {
    tagTest({ feature: 'Tela de Login', story: 'Comportamento com teclado virtual', severity: 'critical' });
    const input = await loginScreen.inputChaveMulticanal;
    await input.waitForDisplayed({ timeout: 10000 });
    const loc  = await input.getLocation();
    const size = await input.getSize();
    await driver.touchAction({ action: 'tap', x: Math.round(loc.x + size.width / 2), y: Math.round(loc.y + size.height / 2) })
      .catch(() => input.click().catch(() => {}));
    await browser.pause(1500);
    await loginScreen.waitForVisualStability(3000);
    await loginScreen.assertWithinViewport(loginScreen.botaoEntrar, 'Botão Entrar');
    await driver.hideKeyboard().catch(() => {});
    await browser.pause(500);
  });

  // ─── Integridade completa ─────────────────────────────────────────────────

  it('Integridade completa: viewport + overlaps + overflow + touch targets', async () => {
    tagTest({ feature: 'Tela de Login', story: 'Integridade de layout', severity: 'blocker' });
    await assertScreenIntegrity(loginScreen);
  });

  // ─── Visual regression ────────────────────────────────────────────────────

  it('[Visual] Screenshot da tela de login', async () => {
    tagTest({ feature: 'Tela de Login', story: 'Regressão Visual', severity: 'normal' });
    await loginScreen.waitForVisualStability();
    const caminho = await salvarScreenshotVisual('login', loginScreen.deviceProfile);
    if (caminho) anexarScreenshot('Screenshot — Login', caminho);
  });

});
