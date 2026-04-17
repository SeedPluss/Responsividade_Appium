const path = require('path');
const fs = require('fs');
const allureReporter = require('@wdio/allure-reporter').default;
const { obterDevices } = require('./config/devices');

// Caminho absoluto para o Appium local — necessário no Windows
const APPIUM_BIN = path.resolve(
  __dirname,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'appium.cmd' : 'appium'
);

const devices = obterDevices();

exports.config = {
  autoCompileOpts: { autoCompile: false },

  // Remove loaders ESM herdados dos workers
  execArgv: process.execArgv.filter(
    (arg) => !arg.includes('ts-node') && !arg.includes('loader')
  ),

  runner: 'local',
  port: 4723,

  // 1 worker por vez — evita sobrecarga na máquina local
  maxInstances: 1,

  capabilities: devices,

  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 180000, // 3 min por teste
    retries: 1,      // 1 retry automático por teste em caso de falha
  },

  specs: [
    './test/specs/responsiveness/**/*.spec.js',
    './test/specs/functional/**/*.spec.js',
  ],
  // Exclui spec de captura (utilitário interno)
  exclude: ['./test/specs/capture/**'],

  reporters: [
    'spec',
    [
      '@wdio/allure-reporter',
      {
        outputDir: path.resolve(__dirname, 'allure-results'),
        disableWebdriverStepsReporting: true,
        useCucumberStepReporter: false,
        addConsoleLogs: true,
        reportedEnvironmentVars: {
          App_Package: 'br.com.confesol.ib.cresol',
          App_Activity: 'br.com.confesol.ib.cresol.MainActivity',
          Platform: 'Android',
          Framework: 'WDIO 8 + Appium 2 + UiAutomator2',
        },
      },
    ],
  ],

  // ─── Serviços ────────────────────────────────────────────────────────────────

  services: [
    [
      'appium',
      {
        command: APPIUM_BIN,
        args: {
          relaxedSecurity: true,
          // Sem log em arquivo — evita EPERM no Windows
        },
        // Aguarda até 30s pelo Appium subir antes de falhar
        waitStartTime: 30000,
      },
    ],
    [
      'visual',
      {
        baselineFolder: path.resolve('./screenshots/baseline'),
        formatImageName: '{tag}_{logName}_{width}x{height}',
        screenshotPath: path.resolve('./screenshots'),
        autoSaveBaseline: process.env.VISUAL_UPDATE === 'true' || false,
        misMatchPercentage: 1,
      },
    ],
  ],

  logLevel: 'warn',
  outputDir: './test-results', // separado de logs/ para evitar conflitos
  coloredLogs: true,
  bail: 0,

  // ─── Hooks ───────────────────────────────────────────────────────────────────

  onPrepare() {
    ['./screenshots', './screenshots/baseline', './test-results', './allure-results'].forEach((d) =>
      fs.mkdirSync(path.resolve(__dirname, d), { recursive: true })
    );
  },

  // Pré-cria o subdir que o WDIO tenta abrir para o log do reporter.
  // O path usa o nome do pacote '@wdio/allure-reporter' com '/' como separador,
  // gerando 'allure-results/wdio-{cid}-@wdio/' no Windows.
  onWorkerStart(cid) {
    fs.mkdirSync(
      path.resolve(__dirname, 'allure-results', `wdio-${cid}-@wdio`),
      { recursive: true }
    );
  },

  beforeSession(_config, capabilities) {
    const perfil = capabilities['custom:deviceProfile'];
    if (perfil) {
      console.log(`\n[WDIO] Device: ${perfil.name} (${perfil.avdProfile}) — ${perfil.widthDp}x${perfil.heightDp}dp @ ${perfil.dpi}dpi\n`);
    }
  },

  beforeTest(_test, _context) {
    // Injeta label de dispositivo em cada teste no Allure
    const caps   = browser.capabilities || {};
    const perfil = caps['custom:deviceProfile'] || {};
    const udid   = caps['appium:udid'] || caps['appium:deviceName'] || 'unknown';

    allureReporter.addLabel('device',      perfil.avdProfile || udid);
    allureReporter.addLabel('profile',     perfil.name       || 'physical');
    if (perfil.widthDp) {
      allureReporter.addLabel('resolution', `${perfil.widthDp}x${perfil.heightDp}dp`);
    }
  },

  // Fluxo de setup do ambiente Cresol — portado do setarApp() original
  // Executado antes de cada spec file
  async before() {
    // Permissões Android
    for (const seletor of [
      'id:com.android.permissioncontroller:id/permission_allow_foreground_only_button',
      'id:com.android.permissioncontroller:id/permission_allow_button',
    ]) {
      try {
        const el = await $(seletor);
        await el.waitForDisplayed({ timeout: 5000 });
        await el.click();
      } catch (_) { /* permissão não apareceu */ }
    }

    try {
      const negarSms = await $('-android uiautomator:new UiSelector().text("Agora não")');
      await negarSms.waitForDisplayed({ timeout: 5000 });
      await negarSms.click();
    } catch (_) { }

    // Acessa menu de ambiente (clica 10x na logo) — apenas se necessário
    try {
      const logo = await $('-android uiautomator:new UiSelector().className("android.widget.TextView").instance(0)');
      await logo.waitForDisplayed({ timeout: 15000 });
      for (let i = 0; i <= 10; i++) await logo.click();

      const senha = await $('class name:android.widget.EditText');
      await senha.waitForDisplayed({ timeout: 5000 });
      await senha.addValue('18081988');

      await $('-android uiautomator:new UiSelector().text("Confirmar")').click();

      const hml = await $('-android uiautomator:new UiSelector().className("android.widget.Image").instance(2)');
      await hml.waitForDisplayed({ timeout: 5000 });
      await hml.click();

      try {
        await $("//android.view.View[@resource-id='ui-toggle__btn--toggle']/android.widget.Button").click();
      } catch (_) { }

      await $("(//android.widget.Image[@resource-id='ui-icon__img--icon-arrow-medium-right'])[2]").click();
    } catch (_) { /* app pode já estar na tela de login */ }

    // Navega para tela de login
    try {
      const acessar = await $('-android uiautomator:new UiSelector().text("Acesse a sua conta")');
      await acessar.waitForDisplayed({ timeout: 15000 });
      await acessar.click();
    } catch (_) { /* já está na tela de login */ }
  },

  async afterTest(test, _context, { passed }) {
    if (!passed) {
      const nome  = test.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
      const ts    = Date.now();
      const arquivo = `./screenshots/falha_${nome}_${ts}.png`;

      try {
        await driver.saveScreenshot(arquivo);
        const img = fs.readFileSync(arquivo);
        allureReporter.addAttachment(
          `Falha — ${test.title}`,
          img,
          'image/png'
        );
      } catch (_) { /* screenshot opcional — não bloqueia o relatório */ }

      // Tag de severidade automática por tipo de falha
      const titulo = (test.title || '').toLowerCase();
      if (titulo.includes('viewport') || titulo.includes('integridade') || titulo.includes('overlap')) {
        allureReporter.addSeverity('critical');
      } else if (titulo.includes('touch target') || titulo.includes('teclado')) {
        allureReporter.addSeverity('normal');
      } else {
        allureReporter.addSeverity('minor');
      }
    }
  },
};
