/**
 * visual-helpers.js
 * Utilitários para estabilização visual antes de screenshots.
 * Essencial para apps Flutter, que têm animações de transição e
 * carregamento assíncrono de widgets.
 */

/**
 * Aguarda animações Flutter terminarem comparando screenshots consecutivos.
 * Equivalente ao waitForVisualStability do BaseScreen mas desacoplado da classe.
 * @param {number} timeoutMs — tempo máximo de espera
 * @param {number} intervaloMs — intervalo entre comparações
 */
async function aguardarEstabilidadeVisual(timeoutMs = 5000, intervaloMs = 500) {
  let screenshotAnterior = null;
  const inicio = Date.now();

  while (Date.now() - inicio < timeoutMs) {
    const screenshotAtual = await driver.takeScreenshot();
    if (screenshotAtual === screenshotAnterior) return;
    screenshotAnterior = screenshotAtual;
    await browser.pause(intervaloMs);
  }
}

/**
 * Tira um screenshot com nome padronizado incluindo o device profile.
 * Salva em screenshots/ com timestamp para evitar sobrescrita.
 * @param {string} tag — identificador da tela (ex: 'login', 'extrato')
 * @param {object} deviceProfile — perfil do device (de BaseScreen.deviceProfile)
 */
async function salvarScreenshot(tag, deviceProfile) {
  await aguardarEstabilidadeVisual();
  const nome = `${tag}_${deviceProfile.name}_${Date.now()}`;
  await driver.saveScreenshot(`./screenshots/${nome}.png`);
  return nome;
}

/**
 * Salva screenshot de visual regression (compara com baseline).
 * Na primeira execução (VISUAL_UPDATE=true) salva como baseline.
 * @param {string} tag — identificador único para a baseline
 * @param {object} deviceProfile — perfil do device
 */
async function salvarScreenshotVisual(tag, deviceProfile) {
  const path = require('path');
  await aguardarEstabilidadeVisual();
  const nomeComDevice = `${tag}_${deviceProfile.name}`;
  await browser.saveScreen(nomeComDevice, { waitForFontsLoaded: true });
  // Retorna o caminho onde o @wdio/visual-service salva a imagem atual
  return path.resolve('./screenshots', 'actual', `${nomeComDevice}.png`);
}

module.exports = {
  aguardarEstabilidadeVisual,
  salvarScreenshot,
  salvarScreenshotVisual,
};
