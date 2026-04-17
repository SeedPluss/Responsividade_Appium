/**
 * allure-helper.js
 * Centraliza a adição de metadata Allure (Feature, Story, Severity, Labels)
 * nos testes de responsividade. Chame no início de cada describe().
 */
const allureReporter = require('@wdio/allure-reporter').default;

/**
 * @param {object} opts
 * @param {string} opts.feature   - Nome da tela/funcionalidade (ex: 'Tela de Login')
 * @param {string} opts.story     - Cenário específico (ex: 'Responsividade em tela compacta')
 * @param {string} [opts.severity] - 'blocker'|'critical'|'normal'|'minor'|'trivial'
 * @param {string} [opts.suite]   - Agrupamento adicional no relatório
 */
function tagTest({ feature, story, severity = 'normal', suite }) {
  allureReporter.addFeature(feature);
  allureReporter.addStory(story);
  allureReporter.addSeverity(severity);
  if (suite) allureReporter.addSuite(suite);

  // Label com o perfil de dispositivo atual
  try {
    const caps  = browser.capabilities || {};
    const perfil = caps['custom:deviceProfile'] || {};
    const device = perfil.name || caps['appium:deviceName'] || 'unknown';
    allureReporter.addLabel('device', device);
    if (perfil.widthDp) {
      allureReporter.addLabel('resolution', `${perfil.widthDp}x${perfil.heightDp}dp`);
    }
  } catch (_) { /* browser pode não estar disponível fora de hooks */ }
}

/**
 * Anexa um screenshot ao resultado Allure do teste atual.
 * Útil para evidências em testes que passam (ex: visual regression).
 * @param {string} nome - Nome legível do attachment
 * @param {Buffer|string} dados - Buffer da imagem ou caminho absoluto do arquivo
 */
function anexarScreenshot(nome, dados) {
  try {
    const fs = require('fs');
    const img = Buffer.isBuffer(dados) ? dados : fs.readFileSync(dados);
    allureReporter.addAttachment(nome, img, 'image/png');
  } catch (_) { }
}

module.exports = { tagTest, anexarScreenshot };
