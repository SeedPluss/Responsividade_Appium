const BaseScreen = require('./BaseScreen');

/**
 * LoginScreen — tela de login do app Cresol.
 * IDs mapeados via adb uiautomator dump no dispositivo físico.
 * Versão do app: Cresol@3.104.0 (962)
 */
class LoginScreen extends BaseScreen {

  // ─── Abas de tipo de conta ─────────────────────────────────────────────────

  get abaPessoaFisica() {
    return $('-android uiautomator:new UiSelector().resourceId("single-login__btn--tabPF")');
  }

  get abaPessoaJuridica() {
    return $('-android uiautomator:new UiSelector().resourceId("single-login__btn--tabPJ")');
  }

  get abaGestorFinanceiro() {
    return $('-android uiautomator:new UiSelector().resourceId("single-login__btn--tabGF")');
  }

  // ─── Campos de entrada ─────────────────────────────────────────────────────

  // Container do campo Chave Multicanal (CPF/CNPJ)
  get containerChaveMulticanal() {
    return $('-android uiautomator:new UiSelector().resourceId("single-login__ui-input--gf")');
  }

  // Input real do campo Chave Multicanal
  get inputChaveMulticanal() {
    return $('-android uiautomator:new UiSelector().resourceId("ui-input__input--input-with-mask").instance(0)');
  }

  // Container do campo Senha
  get containerSenha() {
    return $('-android uiautomator:new UiSelector().resourceId("single-login__ui-input--password")');
  }

  // Input real do campo Senha
  get inputSenha() {
    return $('-android uiautomator:new UiSelector().resourceId("ui-input__input--input-with-mask").instance(1)');
  }

  // Botão olho (mostrar/ocultar senha)
  get botaoVerSenha() {
    return $('-android uiautomator:new UiSelector().resourceId("ui-input__div--icon-eye")');
  }

  // ─── Toggle "Guardar minha Chave Multicanal" ───────────────────────────────

  get toggleGuardarChave() {
    return $('-android uiautomator:new UiSelector().resourceId("ui-toggle__btn--toggle-btn")');
  }

  // ─── Botão de login ────────────────────────────────────────────────────────

  get botaoEntrar() {
    return $('-android uiautomator:new UiSelector().resourceId("ui-button__div--button")');
  }

  // ─── Outros elementos ─────────────────────────────────────────────────────

  get logoImagem() {
    return $('-android uiautomator:new UiSelector().resourceId("ui-logo__img--logo")');
  }

  get linkCadastrese() {
    return $('-android uiautomator:new UiSelector().resourceId("single-login__ui-label--register")');
  }

  get iconeAjuda() {
    return $('-android uiautomator:new UiSelector().resourceId("login__ui-icon--show-faq-modal")');
  }

  get versaoApp() {
    return $('-android uiautomator:new UiSelector().text("Cresol@3.104.0 (962)")');
  }

  // ─── Elementos críticos para testes de responsividade ─────────────────────

  get screenElements() {
    return [
      { name: 'Logo Cresol',           element: this.logoImagem },
      { name: 'Aba Pessoa Física',      element: this.abaPessoaFisica },
      { name: 'Aba Pessoa Jurídica',    element: this.abaPessoaJuridica },
      { name: 'Aba Gestor Financeiro',  element: this.abaGestorFinanceiro },
      { name: 'Campo Chave Multicanal', element: this.containerChaveMulticanal },
      { name: 'Campo Senha',            element: this.containerSenha },
      { name: 'Botão Entrar',           element: this.botaoEntrar },
      { name: 'Link Cadastre-se',       element: this.linkCadastrese },
    ];
  }

  // ─── Ações ─────────────────────────────────────────────────────────────────

  async aguardarCarregamento() {
    await this.abaPessoaFisica.waitForDisplayed({ timeout: 30000 });
    await this.waitForVisualStability();
  }

  async preencherLogin(chaveMulticanal, senha) {
    await this.inputChaveMulticanal.waitForDisplayed({ timeout: 15000 });
    await this.inputChaveMulticanal.click();
    await this.inputChaveMulticanal.setValue(chaveMulticanal);
    await this.inputSenha.click();
    await this.inputSenha.setValue(senha);
  }

  async clicarEntrar() {
    await this.botaoEntrar.click();
  }

  async selecionarAbaPF() {
    await this.abaPessoaFisica.click();
  }

  async selecionarAbaPJ() {
    await this.abaPessoaJuridica.click();
  }
}

module.exports = new LoginScreen();
