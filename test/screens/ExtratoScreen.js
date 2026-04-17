const BaseScreen = require('./BaseScreen');

/**
 * ExtratoScreen — tela de extrato do app Cresol.
 * Seletores via resource ID (UiAutomator2).
 *
 * AÇÃO NECESSÁRIA: substitua os resourceId abaixo pelos IDs reais
 * da tela de extrato. Use o Appium Inspector ou UIAutomatorViewer
 * para inspecionar os elementos com o app aberto no emulador.
 *
 * Comando para abrir Appium Inspector:
 *   npx appium-inspector (ou pelo app desktop do Appium Inspector)
 */
class ExtratoScreen extends BaseScreen {

  get tituloPagina() {
    return $('-android uiautomator:new UiSelector().resourceId("extrato__title")');
  }

  get saldoDisponivel() {
    return $('-android uiautomator:new UiSelector().resourceId("extrato__saldo")');
  }

  get botaoOcultarSaldo() {
    return $('-android uiautomator:new UiSelector().resourceId("extrato__btn--toggle-saldo")');
  }

  get listaTransacoes() {
    return $('-android uiautomator:new UiSelector().resourceId("extrato__list--transacoes")');
  }

  get filtroPeriodo() {
    return $('-android uiautomator:new UiSelector().resourceId("extrato__select--periodo")');
  }

  get botaoExportar() {
    return $('-android uiautomator:new UiSelector().resourceId("extrato__btn--exportar")');
  }

  get screenElements() {
    return [
      { name: 'Título Extrato',   element: this.tituloPagina },
      { name: 'Saldo Disponível', element: this.saldoDisponivel },
      { name: 'Filtro Período',   element: this.filtroPeriodo },
    ];
  }

  async aguardarCarregamento() {
    await this.tituloPagina.waitForDisplayed({ timeout: 30000 });
    await this.waitForVisualStability();
  }
}

module.exports = new ExtratoScreen();
