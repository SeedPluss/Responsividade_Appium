/**
 * faq.responsive.spec.js
 * Testes de responsividade específicos da FAQ — sem redundância com os funcionais.
 * Foca em: layout dos cards, busca com teclado aberto, overflow de texto,
 * touch targets, integridade visual e comportamento em telas estreitas.
 */
const faqScreen = require('../../screens/FaqScreen');
const { assertAllElementsInViewport, assertNoOverlaps } = require('../../utils/layout-assertions');
const { salvarScreenshotVisual } = require('../../utils/visual-helpers');
const { tagTest, anexarScreenshot } = require('../../utils/allure-helper');

describe('FAQ — Responsividade', () => {

  before(async () => {
    await faqScreen.abrirFaq();
  });

  // ─── Visibilidade dos elementos principais ─────────────────────────────────

  it('Todos os elementos críticos da FAQ home devem estar no viewport', async () => {
    tagTest({ feature: 'FAQ', story: 'Responsividade — Visibilidade', severity: 'critical' });
    await assertAllElementsInViewport(faqScreen);
  });

  it('Título "Como podemos te ajudar?" deve estar dentro do viewport', async () => {
    tagTest({ feature: 'FAQ', story: 'Responsividade — Visibilidade', severity: 'critical' });
    await faqScreen.assertWithinViewport(await faqScreen.tituloPrincipal, 'Título FAQ');
  });

  it('Campo de pesquisa deve estar visível e dentro do viewport', async () => {
    tagTest({ feature: 'FAQ', story: 'Responsividade — Visibilidade', severity: 'critical' });
    await faqScreen.assertWithinViewport(await faqScreen.campoPesquisa, 'Campo de pesquisa');
  });

  it('Cards de categoria não devem se sobrepor', async () => {
    tagTest({ feature: 'FAQ', story: 'Responsividade — Integridade de layout', severity: 'critical' });
    await assertNoOverlaps(faqScreen);
  });

  // ─── Overflow horizontal ───────────────────────────────────────────────────

  it('Não deve haver scroll horizontal na FAQ home', async () => {
    tagTest({ feature: 'FAQ', story: 'Responsividade — Integridade de layout', severity: 'critical' });
    await faqScreen.assertNoHorizontalOverflow();
  });

  // ─── Touch targets dos cards ───────────────────────────────────────────────

  it('Card "Acesso" deve ter touch target mínimo de 44dp', async () => {
    tagTest({ feature: 'FAQ', story: 'Responsividade — Touch Targets', severity: 'normal' });
    await faqScreen.assertMinTouchTarget(await faqScreen.cardAcesso, 'Card Acesso');
  });

  it('Card "Contatos" deve ter touch target mínimo de 44dp', async () => {
    tagTest({ feature: 'FAQ', story: 'Responsividade — Touch Targets', severity: 'normal' });
    await faqScreen.assertMinTouchTarget(await faqScreen.cardContatos, 'Card Contatos');
  });

  it('Campo de pesquisa deve ter touch target mínimo de 44dp', async () => {
    tagTest({ feature: 'FAQ', story: 'Responsividade — Touch Targets', severity: 'normal' });
    await faqScreen.assertMinTouchTarget(await faqScreen.campoPesquisa, 'Campo de pesquisa');
  });

  // ─── Texto dos cards não deve estar truncado ───────────────────────────────

  it('Texto do card "Acesso" não deve estar truncado', async () => {
    tagTest({ feature: 'FAQ', story: 'Responsividade — Truncamento de texto', severity: 'normal' });
    await faqScreen.assertNotTruncated(await faqScreen.cardAcesso, 'Card Acesso');
  });

  it('Texto do card "Quero ser um cooperado" não deve estar truncado', async () => {
    tagTest({ feature: 'FAQ', story: 'Responsividade — Truncamento de texto', severity: 'normal' });
    await faqScreen.assertNotTruncated(await faqScreen.cardQueroSerCooperado, 'Card Quero ser cooperado');
  });

  it('Texto do card "Planeje suas finanças" não deve estar truncado em tela compacta', async () => {
    tagTest({ feature: 'FAQ', story: 'Responsividade — Truncamento de texto', severity: 'normal' });
    await faqScreen.assertNotTruncated(await faqScreen.cardPlanjeFinancas, 'Card Planeje suas finanças');
  });

  // ─── Campo de busca com teclado aberto ────────────────────────────────────

  it('Campo de busca deve permanecer acessível com teclado aberto', async () => {
    tagTest({ feature: 'FAQ', story: 'Responsividade — Teclado virtual', severity: 'critical' });
    const input = await faqScreen.campoPesquisa;
    await input.waitForDisplayed({ timeout: 10000 });
    const loc  = await input.getLocation();
    const size = await input.getSize();
    await browser.action('pointer', { parameters: { pointerType: 'touch' } })
      .move({ x: Math.round(loc.x + size.width / 2), y: Math.round(loc.y + size.height / 2) })
      .down().pause(80).up().perform()
      .catch(() => input.click().catch(() => {}));
    await browser.pause(1500);
    await faqScreen.waitForVisualStability(3000);
    await faqScreen.assertWithinViewport(await faqScreen.campoPesquisa, 'Campo de pesquisa');
    await browser.hideKeyboard().catch(() => {});
    await browser.pause(500);
  });

  // ─── Tela de categoria: overflow e truncamento ────────────────────────────

  it('Não deve haver scroll horizontal na tela de categoria "Acesso"', async () => {
    tagTest({ feature: 'FAQ', story: 'Responsividade — Categoria Acesso', severity: 'critical' });
    await faqScreen.abrirCategoria(await faqScreen.cardAcesso);
    await faqScreen.assertNoHorizontalOverflow();
    await faqScreen.tapElement(await faqScreen.botaoVoltar);
  });

  it('Perguntas longas da categoria Acesso não devem transbordar horizontalmente', async () => {
    tagTest({ feature: 'FAQ', story: 'Responsividade — Categoria Acesso', severity: 'normal' });
    await faqScreen.abrirCategoria(await faqScreen.cardAcesso);
    const pergunta = await $('-android uiautomator:new UiSelector().textContains("não está funcionando")');
    if (await pergunta.isDisplayed().catch(() => false)) {
      await faqScreen.assertNotTruncated(pergunta, 'Pergunta longa (Acesso)');
    }
    await faqScreen.tapElement(await faqScreen.botaoVoltar);
  });

  // ─── Tela de resposta: conteúdo longo ─────────────────────────────────────

  it('Tela de resposta não deve ter overflow horizontal', async () => {
    tagTest({ feature: 'FAQ', story: 'Responsividade — Tela de resposta', severity: 'critical' });
    await faqScreen.abrirCategoria(await faqScreen.cardAcesso);
    try {
      await faqScreen.abrirPergunta('Meu aplicativo não está funcionando corretamente. O que devo fazer?');
      await faqScreen.assertNoHorizontalOverflow();
    } finally {
      await browser.back(); await browser.back();
      await browser.pause(1500);
    }
  });

  it('Botões de avaliação (Sim/Não) devem estar dentro do viewport na tela de resposta', async () => {
    tagTest({ feature: 'FAQ', story: 'Responsividade — Tela de resposta', severity: 'critical' });
    await faqScreen.abrirCategoria(await faqScreen.cardAcesso);
    try {
      await faqScreen.abrirPergunta('Meu aplicativo não está funcionando corretamente. O que devo fazer?');
      await faqScreen.assertWithinViewport(await faqScreen.botaoAvaliarSim, 'Botão Sim');
      await faqScreen.assertWithinViewport(await faqScreen.botaoAvaliarNao, 'Botão Não');
    } finally {
      await browser.back(); await browser.back();
      await browser.pause(1500);
    }
  });

  // ─── Abas em Produtos e Serviços ──────────────────────────────────────────

  it('Abas de Produtos e Serviços devem estar dentro do viewport sem sobreposição', async () => {
    tagTest({ feature: 'FAQ', story: 'Responsividade — Abas Produtos', severity: 'normal' });
    await faqScreen.abrirCategoria(await faqScreen.cardProdutosServicos);
    try {
      for (const { aba, nome } of [
        { aba: faqScreen.abaPix,    nome: 'Aba Pix'    },
        { aba: faqScreen.abaCredito, nome: 'Aba Crédito' },
      ]) {
        const el = await aba;
        if (await el.isDisplayed().catch(() => false)) {
          await faqScreen.assertWithinViewport(el, nome);
        }
      }
    } finally {
      await faqScreen.tapElement(await faqScreen.botaoVoltar);
    }
  });

  // ─── Visual Regression ────────────────────────────────────────────────────

  it('[Visual] Screenshot da FAQ home para comparação com baseline', async () => {
    tagTest({ feature: 'FAQ', story: 'Responsividade — Regressão Visual', severity: 'normal' });
    await faqScreen.aguardarCarregamento();
    await faqScreen.waitForVisualStability();
    const caminho = await salvarScreenshotVisual('faq_home', faqScreen.deviceProfile);
    if (caminho) anexarScreenshot('Screenshot — FAQ Home', caminho);
  });

  it('[Visual] Screenshot da categoria Acesso', async () => {
    tagTest({ feature: 'FAQ', story: 'Responsividade — Regressão Visual', severity: 'normal' });
    await faqScreen.abrirCategoria(await faqScreen.cardAcesso);
    await faqScreen.waitForVisualStability();
    const caminho = await salvarScreenshotVisual('faq_acesso', faqScreen.deviceProfile);
    if (caminho) anexarScreenshot('Screenshot — FAQ Acesso', caminho);
    await faqScreen.tapElement(await faqScreen.botaoVoltar);
  });

});
