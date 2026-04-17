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
function tagTest({ feature, story, severity = 'normal' }) {
  allureReporter.addFeature(feature);
  allureReporter.addStory(story);
  allureReporter.addSeverity(severity);
  // suite/parentSuite/subSuite são definidos pelo beforeTest do wdio.conf.js
  // com base no perfil de dispositivo — não sobrescrever aqui
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
