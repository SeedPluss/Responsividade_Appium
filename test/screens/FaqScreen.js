const BaseScreen = require('./BaseScreen');

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
    return $('-android uiautomator:new UiSelector().resourceId("login__ui-icon--show-faq-modal")');
  }

  // Botão voltar genérico (ícone "<")
  get botaoVoltar() {
    return $('-android uiautomator:new UiSelector().resourceId("ui-icon__div--icon").instance(0)');
  }

  // ─── FAQ Home ───────────────────────────────────────────────────────────────

  get tituloPrincipal() {
    return $('-android uiautomator:new UiSelector().text("Como podemos te ajudar?")');
  }

  get campoPesquisa() {
    return $('-android uiautomator:new UiSelector().resourceId("faq__ui-input--search")');
  }

  get inputPesquisa() {
    return $('-android uiautomator:new UiSelector().resourceId("faq__input--search-input")');
  }

  get iconeLupa() {
    return $('-android uiautomator:new UiSelector().resourceId("faq__ui-icon--search")');
  }

  // ─── Cards de categoria na FAQ Home ────────────────────────────────────────

  get cardAcesso() {
    return $('-android uiautomator:new UiSelector().text("Acesso")');
  }

  get cardQueroSerCooperado() {
    return $('-android uiautomator:new UiSelector().textContains("Quero ser um cooperado")');
  }

  get cardProdutosServicos() {
    return $('-android uiautomator:new UiSelector().textContains("Produtos e serviços")');
  }

  get cardPlanjeFinancas() {
    return $('-android uiautomator:new UiSelector().textContains("Planeje suas finanças")');
  }

  get cardContatos() {
    return $('-android uiautomator:new UiSelector().text("Contatos")');
  }

  get cardAgencias() {
    return $('-android uiautomator:new UiSelector().text("Agências")');
  }

  get cardAvaliar() {
    return $('-android uiautomator:new UiSelector().text("Avaliar")');
  }

  get cardOutrosApps() {
    return $('-android uiautomator:new UiSelector().text("Outros aplicativos")');
  }

  get cardCresolCartoes() {
    return $('-android uiautomator:new UiSelector().text("Cresol cartões")');
  }

  get cardMinhaTag() {
    return $('-android uiautomator:new UiSelector().text("Minha Tag Cresol")');
  }

  get cardCresolConsorcios() {
    return $('-android uiautomator:new UiSelector().text("Cresol Consórcios")');
  }

  // ─── Tela de resultados de busca ────────────────────────────────────────────

  get mensagemSemResultados() {
    return $('-android uiautomator:new UiSelector().text("Nenhum resultado encontrado")');
  }

  // ─── Tela de resposta (pergunta expandida) ──────────────────────────────────

  get tituloResposta() {
    return $('-android uiautomator:new UiSelector().resourceId("faq__ui-label--answer-title")');
  }

  get corpoResposta() {
    return $('-android uiautomator:new UiSelector().resourceId("faq__ui-label--answer-body")');
  }

  get labelAvaliarResposta() {
    return $('-android uiautomator:new UiSelector().text("Essa resposta foi útil?")');
  }

  get botaoAvaliarSim() {
    return $('-android uiautomator:new UiSelector().text("Sim")');
  }

  get botaoAvaliarNao() {
    return $('-android uiautomator:new UiSelector().text("Não")');
  }

  get mensagemObrigado() {
    return $('-android uiautomator:new UiSelector().textContains("Obrigado, sua avaliação foi registrada")');
  }

  get mensagemOuvidoria() {
    return $('-android uiautomator:new UiSelector().textContains("0800 643 1981")');
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

  get screenElements() {
    return [
      { name: 'Título "Como podemos te ajudar?"', element: this.tituloPrincipal },
      { name: 'Campo de Pesquisa',                element: this.campoPesquisa   },
      { name: 'Card Acesso',                      element: this.cardAcesso      },
      { name: 'Card Quero ser cooperado',         element: this.cardQueroSerCooperado },
      { name: 'Card Produtos e Serviços',         element: this.cardProdutosServicos  },
      { name: 'Card Planeje suas finanças',       element: this.cardPlanjeFinancas    },
      { name: 'Card Contatos',                    element: this.cardContatos          },
    ];
  }

  // ─── Ações compostas ────────────────────────────────────────────────────────

  async abrirFaq() {
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
    const el = await $(`-android uiautomator:new UiSelector().text("${textoPergunta}")`);
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
