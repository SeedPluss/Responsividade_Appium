const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');
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

  // maxInstances: 1 → execução sequencial (padrão seguro para qualquer máquina).
  // Para rodar os 3 emuladores em paralelo, aumente para 3 e garanta:
  //   • ≥ 16 GB RAM disponível
  //   • SSD NVMe (emuladores são I/O intensivos)
  //   • Porta Appium dedicada por instância (ajuste port acima ou use multiremote)
  maxInstances: 1,

  capabilities: devices,

  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 90000,
    retries: 0,
  },
  waitforTimeout: 10000,
  waitforInterval: 500,

  specs: [
    './test/specs/responsiveness/**/*.spec.js',
    './test/specs/functional/**/*.spec.js',
  ],
  exclude: [],

  reporters: [
    'spec',
    [
      '@wdio/allure-reporter',
      {
        outputDir: path.resolve(__dirname, 'allure-results'),
        disableWebdriverStepsReporting: true,
        useCucumberStepReporter: false,
        addConsoleLogs: true,
        // environment.properties é gerado dinamicamente no onPrepare
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
          allowInsecure: ['chromedriver_autodownload'],
        },
        waitStartTime: 60000,
        // Injeta $ANDROID_HOME/emulator na frente do PATH do processo Appium.
        // Necessário porque o binário real do emulador está em Sdk/emulator/,
        // mas o PATH do sistema aponta para Sdk/tools/emulator (stub legado)
        // que não consegue iniciar AVDs corretamente no SDK moderno.
        env: {
          ...process.env,
          PATH: [
            path.join(process.env.ANDROID_HOME || '', 'emulator'),
            path.join(process.env.ANDROID_HOME || '', 'platform-tools'),
            process.env.PATH,
          ].filter(Boolean).join(path.delimiter),
        },
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
    // ── Pre-check: valida AVDs antes de qualquer sessão ──────────────────────
    const avdNecessarios = devices
      .map((d) => d['appium:avd'])
      .filter(Boolean);

    if (avdNecessarios.length > 0) {
      let avdsInstalados = '';
      try {
        const emulatorBin = path.join(process.env.ANDROID_HOME || '', 'emulator', 'emulator');
        avdsInstalados = execSync(`"${emulatorBin}" -list-avds`, {
          encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'], timeout: 10000,
        });
      } catch (_) {
        try {
          avdsInstalados = execSync('emulator -list-avds', {
            encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'], timeout: 10000,
          });
        } catch (_) {}
      }

      const faltando = avdNecessarios.filter((nome) => !avdsInstalados.includes(nome));
      if (faltando.length > 0) {
        console.error(`\n${'═'.repeat(60)}`);
        console.error(`[WDIO] ERRO: AVD(s) não encontrado(s): ${faltando.join(', ')}`);
        console.error(`[WDIO] AVDs disponíveis:\n${avdsInstalados.trim()}`);
        console.error(`[WDIO] Execute "npm run setup:emulators" para criá-los.`);
        console.error(`${'═'.repeat(60)}\n`);
        process.exit(1);
      }
      console.log(`\n[WDIO] ✔ AVDs verificados: ${avdNecessarios.join(', ')}\n`);
    }

    // Limpa allure-results antes de cada execução para relatório sempre fresco
    const allureDir = path.resolve(__dirname, 'allure-results');
    if (fs.existsSync(allureDir)) {
      fs.rmSync(allureDir, { recursive: true, force: true });
    }
    ['./screenshots', './screenshots/baseline', './test-results', './allure-results'].forEach((d) =>
      fs.mkdirSync(path.resolve(__dirname, d), { recursive: true })
    );

    // ── executor.json — aparece no widget "Executor" do Allure ──────────────
    const executor = {
      name: os.hostname(),
      type: 'local',
      buildName: `Cresol Mobile — ${new Date().toLocaleDateString('pt-BR')}`,
      reportName: 'Cresol Mobile — Responsividade & Funcional',
    };
    fs.writeFileSync(
      path.resolve(allureDir, 'executor.json'),
      JSON.stringify(executor, null, 2)
    );

    // ── Coleta dados do(s) dispositivo(s) via ADB ────────────────────────────
    function adb(udid, cmd) {
      const prefix = udid ? `-s ${udid} ` : '';
      try {
        return execSync(`adb ${prefix}shell ${cmd}`, {
          encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'], timeout: 5000,
        }).trim();
      } catch (_) { return 'N/A'; }
    }

    const deviceLines = [];
    devices.forEach((d, i) => {
      const p    = d['custom:deviceProfile'] || {};
      const udid = d['appium:udid'] || null;
      const idx  = devices.length > 1 ? `_${i + 1}` : '';
      const tag  = p.name ? `[${p.name}]` : `[device${idx}]`;

      // Dados do perfil configurado
      if (p.widthDp) {
        const pxW = Math.round(p.widthDp  * p.dpi / 160);
        const pxH = Math.round(p.heightDp * p.dpi / 160);
        deviceLines.push(`${tag} Perfil=${p.avdProfile}`);
        deviceLines.push(`${tag} Tela_dp=${p.widthDp}x${p.heightDp}dp`);
        deviceLines.push(`${tag} Tela_px≈${pxW}x${pxH}px`);
        deviceLines.push(`${tag} Densidade=${p.dpi}dpi`);
      }

      // Dados reais do dispositivo via ADB (físico ou emulador já iniciado)
      const release = adb(udid, 'getprop ro.build.version.release');
      const sdk     = adb(udid, 'getprop ro.build.version.sdk');
      const model   = adb(udid, 'getprop ro.product.model');
      const brand   = adb(udid, 'getprop ro.product.brand');
      const wmSize  = adb(udid, 'wm size');   // "Physical size: 1080x2400"
      const wmDens  = adb(udid, 'wm density'); // "Physical density: 440"

      const resPx = wmSize.replace(/Physical size:\s*/i, '').replace(/Override.*/, '').trim();
      const dens  = wmDens.replace(/Physical density:\s*/i, '').replace(/Override.*/, '').trim();

      if (release !== 'N/A') deviceLines.push(`${tag} Android=${release} (SDK ${sdk})`);
      if (model   !== 'N/A') deviceLines.push(`${tag} Modelo=${brand} ${model}`);
      if (resPx   !== 'N/A') deviceLines.push(`${tag} Resolucao_fisica=${resPx}px`);
      if (dens    !== 'N/A') deviceLines.push(`${tag} Densidade_real=${dens}dpi`);
      if (udid)              deviceLines.push(`${tag} UDID=${udid}`);
    });

    // ── environment.properties — aparece no widget "Environment" ────────────
    const env = [
      '# ── App ────────────────────────────────',
      `App_Package=br.com.confesol.ib.cresol`,
      `App_Activity=br.com.confesol.ib.cresol.MainActivity`,
      `App_Min_SDK=24`,
      '',
      '# ── Execução ────────────────────────────',
      `Framework=WDIO 8 + Appium 2 + UiAutomator2`,
      `Node_Version=${process.version}`,
      `Device_Filter=${process.env.DEVICE_FILTER || 'emulators (all)'}`,
      `Devices_Count=${devices.length}`,
      `Run_Date=${new Date().toLocaleString('pt-BR')}`,
      `Machine=${os.hostname()} (${os.platform()} ${os.arch()})`,
      '',
      '# ── Dispositivos testados ───────────────',
      ...deviceLines,
    ].join('\n');

    fs.writeFileSync(path.resolve(allureDir, 'environment.properties'), env);
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
    const perfil = capabilities['custom:deviceProfile'] || {};
    const avd    = capabilities['appium:avd'];
    const udid   = capabilities['appium:udid'] || capabilities['appium:deviceName'] || 'unknown';

    if (avd) {
      // Emulador: indica qual AVD está sendo iniciado (boot pode levar até 3 min)
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`[WDIO] ▶ Iniciando emulador AVD: "${avd}"`);
      console.log(`[WDIO]   Perfil : ${perfil.name} (${perfil.avdProfile})`);
      console.log(`[WDIO]   Tela   : ${perfil.widthDp}x${perfil.heightDp}dp @ ${perfil.dpi}dpi`);
      console.log(`[WDIO]   APK    : ${capabilities['appium:app']}`);
      console.log(`${'─'.repeat(60)}\n`);
    } else {
      // Dispositivo físico
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`[WDIO] ▶ Conectando ao dispositivo físico: ${udid}`);
      console.log(`[WDIO]   APK    : ${capabilities['appium:app']}`);
      console.log(`${'─'.repeat(60)}\n`);
    }
  },

  afterSession(_config, capabilities) {
    const avd  = capabilities['appium:avd'];
    const udid = capabilities['appium:udid'] || capabilities['appium:deviceName'] || 'unknown';
    const alvo = avd ? `emulador "${avd}"` : `dispositivo ${udid}`;
    console.log(`\n[WDIO] ✔ Sessão encerrada — ${alvo}\n`);
  },

  beforeTest(_test, _context) {
    const caps   = browser.capabilities || {};
    const perfil = caps['custom:deviceProfile'] || {};
    const udid   = caps['appium:udid'] || caps['appium:deviceName'] || 'unknown';

    // Device label principal (aparece nos filtros do Allure)
    allureReporter.addLabel('device', perfil.avdProfile || udid);

    // Tamanho de tela em dp — métrica central de responsividade
    if (perfil.widthDp) {
      const pxW = Math.round(perfil.widthDp  * perfil.dpi / 160);
      const pxH = Math.round(perfil.heightDp * perfil.dpi / 160);
      allureReporter.addLabel('screen_dp',  `${perfil.widthDp}x${perfil.heightDp}dp`);
      allureReporter.addLabel('screen_px',  `${pxW}x${pxH}px`);
      allureReporter.addLabel('density',    `${perfil.dpi}dpi`);
      allureReporter.addLabel('profile',    perfil.name);
    } else {
      // Dispositivo físico — lê dados reais das capabilities Appium
      const sdkVer = caps['appium:platformVersion'] || '';
      allureReporter.addLabel('profile', 'physical');
      allureReporter.addLabel('udid',    udid);
      if (sdkVer) allureReporter.addLabel('android_sdk', `API ${sdkVer}`);
    }
  },

  // Garante que o app está na tela de login antes de cada spec
  async before() {
    const loginSelector   = '-android uiautomator:new UiSelector().resourceId("single-login__btn--tabPF")';
    const onboardSelector = '-android uiautomator:new UiSelector().text("Acesse a sua conta")';
    const smsSelector     = '-android uiautomator:new UiSelector().text("Agora não")';

    const estaNoLogin = async () => {
      try { return await $(loginSelector).isDisplayed(); } catch (_) { return false; }
    };

    // Fecha diálogo SMS se aparecer
    try {
      const negarSms = await $(smsSelector);
      await negarSms.waitForDisplayed({ timeout: 3000 });
      await negarSms.click();
    } catch (_) {}

    // Pressiona back até voltar ao login (máx 8 tentativas)
    for (let i = 0; i < 8; i++) {
      if (await estaNoLogin()) break;

      // Trata onboarding "Acesse a sua conta"
      try {
        const acessar = await $(onboardSelector);
        if (await acessar.isDisplayed()) { await acessar.click(); break; }
      } catch (_) {}

      await driver.back().catch(() => {});
      await browser.pause(1000);
    }

    // Aguarda login estar visível com timeout razoável
    try {
      await $(loginSelector).waitForDisplayed({ timeout: 10000 });
    } catch (_) {
      console.warn('[WDIO before] Login screen not found after navigation — proceeding anyway');
    }
  },

  async afterTest(test, _context, { passed }) {
    if (!passed) {
      const nome  = test.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
      const ts    = Date.now();
      const arquivo = `./screenshots/falha_${nome}_${ts}.png`;

      try {
        await browser.saveScreenshot(arquivo);
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
