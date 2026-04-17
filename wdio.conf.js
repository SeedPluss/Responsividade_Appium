const path = require("path");
const fs = require("fs");
const os = require("os");
const { execSync } = require("child_process");
const allureReporter = require("@wdio/allure-reporter").default;
const { obterDevices } = require("./config/devices");

// Caminho absoluto para o Appium local — necessário no Windows
const APPIUM_BIN = path.resolve(
  __dirname,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "appium.cmd" : "appium",
);

const devices = obterDevices();

exports.config = {
  autoCompileOpts: { autoCompile: false },

  // Remove loaders ESM herdados dos workers
  execArgv: process.execArgv.filter(
    (arg) => !arg.includes("ts-node") && !arg.includes("loader"),
  ),

  runner: "local",
  port: 4723,

  // maxInstances: 1 → execução sequencial (padrão seguro para qualquer máquina).
  // Para rodar os 3 emuladores em paralelo, aumente para 3 e garanta:
  //   • ≥ 16 GB RAM disponível
  //   • SSD NVMe (emuladores são I/O intensivos)
  //   • Porta Appium dedicada por instância (ajuste port acima ou use multiremote)
  maxInstances: 1,

  capabilities: devices,

  framework: "mocha",
  mochaOpts: {
    ui: "bdd",
    timeout: 90000,
    retries: 0,
  },
  waitforTimeout: 10000,
  waitforInterval: 500,

  specs: [
    "./test/specs/responsiveness/**/*.spec.js",
  ],
  exclude: [],

  reporters: [
    "spec",
    [
      "@wdio/allure-reporter",
      {
        outputDir: path.resolve(__dirname, "allure-results"),
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
      "appium",
      {
        command: APPIUM_BIN,
        args: {
          relaxedSecurity: true,
          allowInsecure: ["chromedriver_autodownload"],
        },
        waitStartTime: 60000,
        // Injeta $ANDROID_HOME/emulator na frente do PATH do processo Appium.
        // Necessário porque o binário real do emulador está em Sdk/emulator/,
        // mas o PATH do sistema aponta para Sdk/tools/emulator (stub legado)
        // que não consegue iniciar AVDs corretamente no SDK moderno.
        env: {
          ...process.env,
          PATH: [
            path.join(process.env.ANDROID_HOME || "", "emulator"),
            path.join(process.env.ANDROID_HOME || "", "platform-tools"),
            process.env.PATH,
          ]
            .filter(Boolean)
            .join(path.delimiter),
        },
      },
    ],
    [
      "visual",
      {
        baselineFolder: path.resolve("./screenshots/baseline"),
        formatImageName: "{tag}_{logName}_{width}x{height}",
        screenshotPath: path.resolve("./screenshots"),
        autoSaveBaseline: process.env.VISUAL_UPDATE === "true" || false,
        misMatchPercentage: 1,
      },
    ],
  ],

  logLevel: "warn",
  outputDir: "./test-results", // separado de logs/ para evitar conflitos
  coloredLogs: true,
  bail: 0,

  // ─── Hooks ───────────────────────────────────────────────────────────────────

  onPrepare() {
    // Limpa allure-results antes de cada execução para relatório sempre fresco
    const allureDir = path.resolve(__dirname, "allure-results");
    if (fs.existsSync(allureDir)) {
      fs.rmSync(allureDir, { recursive: true, force: true });
    }
    [
      "./screenshots",
      "./screenshots/baseline",
      "./test-results",
      "./allure-results",
    ].forEach((d) =>
      fs.mkdirSync(path.resolve(__dirname, d), { recursive: true }),
    );

    // ── executor.json — aparece no widget "Executor" do Allure ──────────────
    const executor = {
      name: os.hostname(),
      type: "local",
      buildName: `Cresol Mobile — ${new Date().toLocaleDateString("pt-BR")}`,
      reportName: "Cresol Mobile — Responsividade & Funcional",
    };
    fs.writeFileSync(
      path.resolve(allureDir, "executor.json"),
      JSON.stringify(executor, null, 2),
    );

    // ── Coleta dados do(s) dispositivo(s) via ADB ────────────────────────────
    function adb(udid, cmd) {
      const prefix = udid ? `-s ${udid} ` : "";
      try {
        return execSync(`adb ${prefix}shell ${cmd}`, {
          encoding: "utf8",
          stdio: ["pipe", "pipe", "ignore"],
          timeout: 5000,
        }).trim();
      } catch (_) {
        return "N/A";
      }
    }

    const deviceLines = [];
    devices.forEach((d, i) => {
      const p = d["custom:deviceProfile"] || {};
      const udid = d["appium:udid"] || null;
      const idx = devices.length > 1 ? `_${i + 1}` : "";
      const tag = p.name ? `[${p.name}]` : `[device${idx}]`;

      // Dados do perfil configurado
      if (p.widthDp) {
        const pxW = Math.round((p.widthDp * p.dpi) / 160);
        const pxH = Math.round((p.heightDp * p.dpi) / 160);
        deviceLines.push(`${tag} Perfil=${p.avdProfile}`);
        deviceLines.push(`${tag} Tela_dp=${p.widthDp}x${p.heightDp}dp`);
        deviceLines.push(`${tag} Tela_px≈${pxW}x${pxH}px`);
        deviceLines.push(`${tag} Densidade=${p.dpi}dpi`);
      }

      // Dados reais do dispositivo via ADB (físico ou emulador já iniciado)
      const release = adb(udid, "getprop ro.build.version.release");
      const sdk = adb(udid, "getprop ro.build.version.sdk");
      const model = adb(udid, "getprop ro.product.model");
      const brand = adb(udid, "getprop ro.product.brand");
      const wmSize = adb(udid, "wm size"); // "Physical size: 1080x2400"
      const wmDens = adb(udid, "wm density"); // "Physical density: 440"

      const resPx = wmSize
        .replace(/Physical size:\s*/i, "")
        .replace(/Override.*/, "")
        .trim();
      const dens = wmDens
        .replace(/Physical density:\s*/i, "")
        .replace(/Override.*/, "")
        .trim();

      if (release !== "N/A")
        deviceLines.push(`${tag} Android=${release} (SDK ${sdk})`);
      if (model !== "N/A") deviceLines.push(`${tag} Modelo=${brand} ${model}`);
      if (resPx !== "N/A")
        deviceLines.push(`${tag} Resolucao_fisica=${resPx}px`);
      if (dens !== "N/A") deviceLines.push(`${tag} Densidade_real=${dens}dpi`);
      if (udid) deviceLines.push(`${tag} UDID=${udid}`);
    });

    // ── environment.properties — aparece no widget "Environment" ────────────
    const env = [
      "# ── App ────────────────────────────────",
      `App_Package=br.com.confesol.ib.cresol`,
      `App_Activity=br.com.confesol.ib.cresol.MainActivity`,
      `App_Min_SDK=24`,
      "",
      "# ── Execução ────────────────────────────",
      `Framework=WDIO 8 + Appium 2 + UiAutomator2`,
      `Node_Version=${process.version}`,
      `Tipo_dispositivo=${process.env.DEVICE_FILTER || "emulators (all)"}`,
      `Quantidade_dispositivo=${devices.length}`,
      `Data_de_execução=${new Date().toLocaleString("pt-BR")}`,
      "",
      "# ── Dispositivos testados ───────────────",
      ...deviceLines,
    ].join("\n");

    fs.writeFileSync(path.resolve(allureDir, "environment.properties"), env);
  },

  // Pré-cria o subdir que o WDIO tenta abrir para o log do reporter.
  // O path usa o nome do pacote '@wdio/allure-reporter' com '/' como separador,
  // gerando 'allure-results/wdio-{cid}-@wdio/' no Windows.
  onWorkerStart(cid) {
    fs.mkdirSync(
      path.resolve(__dirname, "allure-results", `wdio-${cid}-@wdio`),
      { recursive: true },
    );
  },

  beforeSession(_config, capabilities) {
    const perfil = capabilities["custom:deviceProfile"] || {};
    const screenProfile = capabilities["custom:screenProfile"];
    const udid =
      capabilities["appium:udid"] ||
      capabilities["appium:deviceName"] ||
      "unknown";

    console.log(`\n${"─".repeat(60)}`);
    console.log(`[WDIO] ▶ Conectando ao dispositivo físico: ${udid}`);
    if (perfil.name && perfil.name !== "physical") {
      console.log(`[WDIO]   Perfil : ${perfil.name} (${perfil.avdProfile})`);
      console.log(
        `[WDIO]   Tela   : ${perfil.widthDp}x${perfil.heightDp}dp @ ${perfil.dpi}dpi`,
      );
    }
    console.log(`[WDIO]   APK    : ${capabilities["appium:app"]}`);
    console.log(`${"─".repeat(60)}\n`);

    // Force-stop o app antes de aplicar o resize — garante que o Appium vai relaunchar do zero
    if (udid !== "unknown") {
      try {
        execSync(
          `adb -s ${udid} shell am force-stop br.com.confesol.ib.cresol`,
          { stdio: "ignore", timeout: 8000 },
        );
      } catch (_) {}
    }

    // Aplica simulação de tela via ADB antes de iniciar a sessão Appium
    if (screenProfile && udid !== "unknown") {
      try {
        execSync(`adb -s ${udid} shell wm size ${screenProfile.wmSize}`, {
          stdio: "ignore",
          timeout: 10000,
        });
        execSync(
          `adb -s ${udid} shell wm density ${screenProfile.wmDensity}`,
          { stdio: "ignore", timeout: 10000 },
        );
        console.log(
          `[WDIO] ✔ Tela ajustada: ${screenProfile.wmSize} @ ${screenProfile.wmDensity}dpi\n`,
        );
      } catch (e) {
        console.warn(`[WDIO] Falha ao ajustar tela via ADB: ${e.message}`);
      }
    }
  },

  afterSession(_config, capabilities) {
    const screenProfile = capabilities["custom:screenProfile"];
    const udid =
      capabilities["appium:udid"] ||
      capabilities["appium:deviceName"] ||
      "unknown";

    // Restaura tela original do dispositivo
    if (screenProfile && udid !== "unknown") {
      try {
        execSync(`adb -s ${udid} shell wm size reset`, {
          stdio: "ignore",
          timeout: 10000,
        });
        execSync(`adb -s ${udid} shell wm density reset`, {
          stdio: "ignore",
          timeout: 10000,
        });
        console.log(`\n[WDIO] ✔ Tela restaurada — dispositivo ${udid}\n`);
      } catch (e) {
        console.warn(`[WDIO] Falha ao restaurar tela via ADB: ${e.message}`);
      }
    } else {
      console.log(`\n[WDIO] ✔ Sessão encerrada — dispositivo ${udid}\n`);
    }
  },

  beforeTest(test, _context) {
    const caps = browser.capabilities || {};
    const perfil = caps["custom:deviceProfile"] || {};
    const udid = caps["appium:udid"] || caps["appium:deviceName"] || "unknown";
    const info = global.currentDeviceInfo || {};

    // Label "device" mantido para compatibilidade com filtros do Allure
    const deviceLabel =
      perfil.avdProfile ||
      (info.brand && info.model
        ? `${info.brand.trim()} ${info.model.trim()}`
        : udid);
    allureReporter.addLabel("device", deviceLabel);

    // ── Suite hierarchy ────────────────────────────────────────────────────────
    // O reporter adiciona automaticamente o título do describe como label "suite"
    // no onTestStart. Chamar addSuite() adicionaria um SEGUNDO label suite e o
    // Allure duplicaria o teste na árvore. Por isso usamos apenas parentSuite e
    // subSuite, que não conflitam com o label automático.
    //
    // Resultado na aba Suites:
    //   FAQ (parentSuite)
    //     └── FAQ — Responsividade  (suite auto — título do describe)
    //           ├── COMPACT — 1080x1920px  (subSuite)
    //           ├── STANDARD — 1080x2400px
    //           └── LARGE — 1440x3120px
    const perfilNome = (perfil.name || "physical").toUpperCase();

    // Resolução: prefere Override size (ADB aplicou), cai back em Physical size,
    // depois no valor calculado pelo perfil dp+dpi.
    // Parsing por regex evita concatenar as duas linhas do output "wm size".
    let resolucao = "";
    if (info.wmSize && info.wmSize !== "N/A") {
      const override  = info.wmSize.match(/Override size:\s*(\d+x\d+)/i);
      const physical  = info.wmSize.match(/Physical size:\s*(\d+x\d+)/i);
      resolucao = (override || physical)?.[1] || "";
    }
    if (!resolucao && perfil.widthDp) {
      const pxW = Math.round((perfil.widthDp * perfil.dpi) / 160);
      const pxH = Math.round((perfil.heightDp * perfil.dpi) / 160);
      resolucao = `${pxW}x${pxH}`;
    }
    if (resolucao) resolucao += "px";

    // parentSuite: nome da feature extraído do describe (ex: "FAQ — Responsividade" → "FAQ")
    const suiteTitulo = (test.parent || "").split(/\s*[—–\-]\s*/)[0].trim() || "Suite";

    allureReporter.addParentSuite(suiteTitulo);
    // subSuite = COMPACT — 1080x1920px  (perfil + resolução juntos, sem nível extra)
    if (resolucao) {
      allureReporter.addSubSuite(`${perfilNome} — ${resolucao}`);
    } else {
      allureReporter.addSubSuite(perfilNome);
    }

    // ── Parameters — aparecem no bloco "Parameters" do Allure ─────────────────

    // Dispositivo
    if (info.model && info.model !== "N/A") {
      allureReporter.addArgument(
        "Dispositivo",
        `${info.brand || ""} ${info.model || ""}`.trim(),
      );
    } else if (udid && udid !== "unknown") {
      allureReporter.addArgument("Dispositivo", udid);
    }

    // Perfil simulado (compact / standard / large / physical)
    allureReporter.addArgument("Perfil", perfil.name || "physical");

    // Android version
    if (info.release && info.release !== "N/A") {
      allureReporter.addArgument("Android", `Android ${info.release.trim()}`);
    }

    // SDK / API level
    if (info.sdk && info.sdk !== "N/A") {
      allureReporter.addArgument("SDK", `API ${info.sdk.trim()}`);
    }

    // Resolução real (após resize via ADB) — prefere Override size se disponível
    if (info.wmSize && info.wmSize !== "N/A") {
      const ovr = info.wmSize.match(/Override size:\s*(\d+x\d+)/i);
      const phy = info.wmSize.match(/Physical size:\s*(\d+x\d+)/i);
      const resPx = (ovr || phy)?.[1];
      if (resPx) allureReporter.addArgument("Resolução", `${resPx}px`);
    } else if (perfil.widthDp) {
      const pxW = Math.round((perfil.widthDp * perfil.dpi) / 160);
      const pxH = Math.round((perfil.heightDp * perfil.dpi) / 160);
      allureReporter.addArgument("Resolução", `${pxW}x${pxH}px`);
    }

    // Densidade real — prefere Override density se disponível
    if (info.wmDensity && info.wmDensity !== "N/A") {
      const ovr = info.wmDensity.match(/Override density:\s*(\d+)/i);
      const phy = info.wmDensity.match(/Physical density:\s*(\d+)/i);
      const dens = (ovr || phy)?.[1];
      if (dens) allureReporter.addArgument("Densidade", `${dens}dpi`);
    } else if (perfil.dpi) {
      allureReporter.addArgument("Densidade", `${perfil.dpi}dpi`);
    }
  },

  // Garante que o app está na tela de login antes de cada spec
  async before() {
    const APP_PACKAGE = "br.com.confesol.ib.cresol";
    const loginSelector =
      '-android uiautomator:new UiSelector().resourceId("single-login__btn--tabPF")';
    const onboardSelector =
      '-android uiautomator:new UiSelector().text("Acesse a sua conta")';
    const smsSelector =
      '-android uiautomator:new UiSelector().text("Agora não")';

    // Coleta dados reais do device uma vez por sessão (usados em beforeTest para Allure)
    try {
      const run = (cmd) =>
        browser
          .execute("mobile: shell", { command: cmd })
          .catch(() => "N/A");
      const [release, sdk, model, brand, wmSize, wmDensity] =
        await Promise.all([
          run("getprop ro.build.version.release"),
          run("getprop ro.build.version.sdk"),
          run("getprop ro.product.model"),
          run("getprop ro.product.brand"),
          run("wm size"),
          run("wm density"),
        ]);
      global.currentDeviceInfo = {
        release,
        sdk,
        model: (model || "").trim(),
        brand: (brand || "").trim(),
        wmSize,
        wmDensity,
      };
    } catch (_) {
      global.currentDeviceInfo = {};
    }

    const estaNoLogin = async () => {
      try {
        return await $(loginSelector).isDisplayed();
      } catch (_) {
        return false;
      }
    };

    // Fecha diálogo SMS se aparecer
    try {
      const negarSms = await $(smsSelector);
      await negarSms.waitForDisplayed({ timeout: 3000 });
      await negarSms.click();
    } catch (_) {}

    // Pressiona back até voltar ao login (máx 10 tentativas)
    for (let i = 0; i < 10; i++) {
      if (await estaNoLogin()) break;

      // Trata onboarding "Acesse a sua conta"
      try {
        const acessar = await $(onboardSelector);
        if (await acessar.isDisplayed()) {
          await acessar.click();
          await browser.pause(1500);
          break;
        }
      } catch (_) {}

      await browser.back().catch(() => {});
      await browser.pause(1000);
    }

    // Fallback: reinicia o app se login ainda não está visível
    if (!(await estaNoLogin())) {
      console.warn("[WDIO before] Login não encontrado — reiniciando app...");
      try {
        await browser.terminateApp(APP_PACKAGE);
        await browser.pause(2000);
        await browser.activateApp(APP_PACKAGE);
        await browser.pause(3000);
      } catch (_) {}

      // Após restart o app pode mostrar onboarding — trata navegação novamente
      for (let i = 0; i < 6; i++) {
        if (await estaNoLogin()) break;
        try {
          const acessar = await $(onboardSelector);
          if (await acessar.isDisplayed()) {
            await acessar.click();
            await browser.pause(2500);
            break;
          }
        } catch (_) {}
        await browser.back().catch(() => {});
        await browser.pause(1200);
      }
    }

    // Aguarda tela de login com timeout generoso após eventual reboot do app
    try {
      await $(loginSelector).waitForDisplayed({ timeout: 25000 });
    } catch (_) {
      console.warn(
        "[WDIO before] Tela de login não encontrada — continuando assim mesmo",
      );
    }
  },

  async afterTest(test, _context, { passed }) {
    if (!passed) {
      const nome = test.title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50);
      const ts = Date.now();
      const arquivo = `./screenshots/falha_${nome}_${ts}.png`;

      try {
        await browser.saveScreenshot(arquivo);
        const img = fs.readFileSync(arquivo);
        allureReporter.addAttachment(`Falha — ${test.title}`, img, "image/png");
      } catch (_) {
        /* screenshot opcional — não bloqueia o relatório */
      }

      // Tag de severidade automática por tipo de falha
      const titulo = (test.title || "").toLowerCase();
      if (
        titulo.includes("viewport") ||
        titulo.includes("integridade") ||
        titulo.includes("overlap")
      ) {
        allureReporter.addSeverity("critical");
      } else if (
        titulo.includes("touch target") ||
        titulo.includes("teclado")
      ) {
        allureReporter.addSeverity("normal");
      } else {
        allureReporter.addSeverity("minor");
      }
    }
  },
};
