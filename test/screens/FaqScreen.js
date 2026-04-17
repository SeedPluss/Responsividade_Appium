const BaseScreen = require("./BaseScreen");

/**
 * FaqScreen — tela de Dúvidas Frequentes do app Cresol.
 * Seletores mapeados a partir do BDD spec e da convenção de IDs do app.
 * IDs com prefixo (ex: faq__) seguem o padrão {componente}__{elemento}--{id}.
 * Elementos sem ID único confirmado usam text()-based selectors como fallback.
 *
 * IMPORTANTE: testes de navegação (click) requerem que hidden_api_policy
 * esteja configurável no dispositivo. Em MIUI/Redmi, habilite:
 * Configurações → Opções do desenvolvedor → "Depuração USB (Configurações de segurança)"
 */
class FaqScreen extends BaseScreen {
  // ─── Navegação ─────────────────────────────────────────────────────────────

  // Ícone de FAQ na tela de login (ponto de entrada)
  get iconeAjuda() {
    return $(
      '-android uiautomator:new UiSelector().resourceId("ui-icon__img--icon-help")',
    );
  }

  // Botão voltar genérico (ícone "<")
  get botaoVoltar() {
    return $(
      '-android uiautomator:new UiSelector().resourceId("ui-icon__img--icon-arrow-large-left")',
    );
  }

  // ─── FAQ Home ───────────────────────────────────────────────────────────────

  get tituloPrincipal() {
    return $(
      '-android uiautomator:new UiSelector().text("Como podemos te ajudar?")',
    );
  }

  // Container completo da busca — usado para assertions de viewport e touch target
  get campoPesquisa() {
    return $(
      '-android uiautomator:new UiSelector().resourceId("faq__ui-search--search")',
    );
  }

  // EditText interno — usado para setValue e ações de teclado
  get inputPesquisa() {
    return $(
      '-android uiautomator:new UiSelector().resourceId("ui-input__input--input")',
    );
  }

  get iconeLupa() {
    return $(
      '-android uiautomator:new UiSelector().resourceId("ui-icon__img--icon-search-right")',
    );
  }

  // ─── Cards de categoria na FAQ Home ────────────────────────────────────────

  get cardAcesso() {
    return $(
      '-android uiautomator:new UiSelector().resourceId("card-action-full-with__ui-item-action--item-action").instance(0)',
    );
  }

  get cardQueroSerCooperado() {
    return $(
      '-android uiautomator:new UiSelector().resourceId("card-action-full-with__ui-item-action--item-action").instance(1)',
    );
  }

  get cardProdutosServicos() {
    return $(
      '-android uiautomator:new UiSelector().resourceId("card-action-full-with__ui-item-action--item-action").instance(2)',
    );
  }

  get cardPlanjeFinancas() {
    return $(
      '-android uiautomator:new UiSelector().resourceId("card-action-full-with__ui-item-action--item-action").instance(3)',
    );
  }

  get cardContatos() {
    return $(
      '-android uiautomator:new UiSelector().resourceId("ui-menu-item__div--button").instance(0)',
    );
  }

  get cardAgencias() {
    return $(
      '-android uiautomator:new UiSelector().resourceId("ui-menu-item__div--button").instance(1)',
    );
  }

  get cardAvaliar() {
    return $(
      '-android uiautomator:new UiSelector().resourceId("ui-menu-item__div--button").instance(2)',
    );
  }

  get cardOutrosApps() {
    return $(
      '-android uiautomator:new UiSelector().text("Outros aplicativos")',
    );
  }

  get cardCresolCartoes() {
    return $(
      '-android uiautomator:new UiSelector().resourceId("faq__list-item-image-arrow-action--app-cartoes")',
    );
  }

  get cardMinhaTag() {
    return $(
      '-android uiautomator:new UiSelector().resourceId("faq__list-item-image-arrow-action--app-tag")',
    );
  }

  get cardCresolConsorcios() {
    return $(
      '-android uiautomator:new UiSelector().resourceId("faq__list-item-image-arrow-action--app-consorcio")',
    );
  }

  // ─── Tela de resultados de busca ────────────────────────────────────────────

  get mensagemSemResultados() {
    return $(
      '-android uiautomator:new UiSelector().text("Nenhum resultado encontrado")',
    );
  }

  // ─── Tela de resposta (pergunta expandida) ──────────────────────────────────

  get tituloResposta() {
    return $(
      '-android uiautomator:new UiSelector().resourceId("faq__ui-label--answer-title")',
    );
  }

  get corpoResposta() {
    return $(
      '-android uiautomator:new UiSelector().resourceId("faq__ui-label--answer-body")',
    );
  }

  get labelAvaliarResposta() {
    return $(
      '-android uiautomator:new UiSelector().text("Essa resposta foi útil?")',
    );
  }

  get botaoAvaliarSim() {
    return $('-android uiautomator:new UiSelector().text("Sim")');
  }

  get botaoAvaliarNao() {
    return $('-android uiautomator:new UiSelector().text("Não")');
  }

  get mensagemObrigado() {
    return $(
      '-android uiautomator:new UiSelector().textContains("Obrigado, sua avaliação foi registrada")',
    );
  }

  get mensagemOuvidoria() {
    return $(
      '-android uiautomator:new UiSelector().textContains("0800 643 1981")',
    );
  }

  // ─── Abas em Produtos e Serviços ────────────────────────────────────────────

  get abaPix() {
    return $('-android uiautomator:new UiSelector().text("Pix")');
  }

  get abaCredito() {
    return $('-android uiautomator:new UiSelector().text("Crédito")');
  }

  get abaCapitalSocial() {
    return $('-android uiautomator:new UiSelector().text("Capital Social")');
  }

  get abaCartoes() {
    return $('-android uiautomator:new UiSelector().text("Cartões")');
  }

  get abaConsorcios() {
    return $('-android uiautomator:new UiSelector().text("Consórcios")');
  }

  get abaSeguros() {
    return $('-android uiautomator:new UiSelector().text("Seguros")');
  }

  // ─── Elementos para testes de responsividade ───────────────────────────────

  // Apenas elementos garantidamente visíveis sem scroll (acima do fold)
  get screenElements() {
    return [
      { name: 'Título "Como podemos te ajudar?"', element: this.tituloPrincipal },
      { name: 'Campo de Pesquisa',                element: this.campoPesquisa },
      { name: 'Card Acesso',                      element: this.cardAcesso },
      { name: 'Card Quero ser cooperado',          element: this.cardQueroSerCooperado },
      { name: 'Card Produtos e Serviços',          element: this.cardProdutosServicos },
      { name: 'Card Planeje suas finanças',        element: this.cardPlanjeFinancas },
    ];
  }

  // ─── Ações compostas ────────────────────────────────────────────────────────

  async abrirFaq() {
    // Fecha a FAQ se estiver aberta para garantir estado limpo ao reabrir
    const jaAberta = await this.tituloPrincipal.isDisplayed().catch(() => false);
    if (jaAberta) {
      await driver.back().catch(() => {});
      await browser.pause(1500);
    }
    await this.iconeAjuda.waitForDisplayed({ timeout: 15000 });
    await this.tapElement(this.iconeAjuda);
    await this.tituloPrincipal.waitForDisplayed({ timeout: 15000 });
    await this.waitForVisualStability();
  }

  async aguardarCarregamento() {
    await this.tituloPrincipal.waitForDisplayed({ timeout: 30000 });
    await this.waitForVisualStability();
  }

  async pesquisar(termo) {
    await this.tapElement(await this.campoPesquisa);
    await browser.pause(1000);
    const input = await this.inputPesquisa;
    await input.waitForDisplayed({ timeout: 10000 });
    await input.setValue(termo);
    await browser.pause(1500);
  }

  async abrirCategoria(cardElement) {
    await this.tapElement(cardElement);
    await browser.pause(2000);
    await this.waitForVisualStability();
  }

  async abrirPergunta(textoPergunta) {
    const el = await $(
      `-android uiautomator:new UiSelector().text("${textoPergunta}")`,
    );
    await el.waitForDisplayed({ timeout: 15000 });
    await this.tapElement(el);
    await this.labelAvaliarResposta.waitForDisplayed({ timeout: 15000 });
    await this.waitForVisualStability();
  }

  async avaliarResposta(util = true) {
    const btn = util ? await this.botaoAvaliarSim : await this.botaoAvaliarNao;
    await btn.waitForDisplayed({ timeout: 10000 });
    await this.tapElement(btn);
    await browser.pause(2500); // aguarda 2s + margem para a mensagem aparecer
  }

  async voltarParaFaqHome() {
    await this.tapElement(await this.botaoVoltar);
    await this.tituloPrincipal.waitForDisplayed({ timeout: 10000 });
  }
}

module.exports = new FaqScreen();
