const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// ─── APK ─────────────────────────────────────────────────────────────────────

function encontrarApksEm(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.apk'))
    .map((f) => path.join(dir, f));
}

function resolverApk() {
  const raiz = path.resolve(__dirname, '..');
  const apks = [...encontrarApksEm(raiz), ...encontrarApksEm(__dirname)];
  if (apks.length === 0) throw new Error('Nenhum .apk encontrado. Coloque o APK na raiz do projeto.');
  if (apks.length > 1) console.warn(`[devices] Múltiplos APKs — usando: ${apks[0]}`);
  return apks[0];
}

// Caminho absoluto resolvido via path.resolve — evita erros "file not found" por paths relativos
const APK_PATH = resolverApk();

// ─── Detecção de dispositivo físico ──────────────────────────────────────────

function obterUdidDispositivoFisico() {
  try {
    const saida = execSync('adb devices', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    const fisico = saida.split('\n').slice(1).find(
      (l) => l.includes('\tdevice') && !l.startsWith('emulator-') && l.trim() !== ''
    );
    if (fisico) {
      const udid = fisico.split('\t')[0].trim();
      console.log(`[devices] Dispositivo físico detectado: ${udid}`);
      return udid;
    }
  } catch (_) {}
  return null;
}

// ─── Capabilities base (compartilhadas) ──────────────────────────────────────

const capabilitiesBase = {
  platformName: 'Android',
  'appium:automationName': 'UiAutomator2',
  'appium:app': APK_PATH,                          // caminho absoluto resolvido dinamicamente
  'appium:appPackage': 'br.com.confesol.ib.cresol',
  'appium:appActivity': 'br.com.confesol.ib.cresol.MainActivity',
  'appium:autoGrantPermissions': true,
  'appium:newCommandTimeout': 300,
  'appium:adbExecTimeout': 120000,
  'appium:androidInstallTimeout': 120000,
  'appium:appWaitDuration': 60000,
  'appium:ignoreHiddenApiPolicyError': true,
  'appium:skipUnlock': true,
};

// Capabilities exclusivas para emuladores AVD
// noReset: false → reinstala o APK a cada sessão garantindo estado limpo para responsividade
const capabilitiesEmulador = {
  ...capabilitiesBase,
  'appium:noReset': false,
  'appium:fullReset': false,
  // Cold boot em HDD pode levar 4+ min — valores conservadores para CI e máquinas lentas
  'appium:avdLaunchTimeout': 300000,
  'appium:avdReadyTimeout': 300000,
  // -no-window: headless (sem janela visível). Remova para depuração visual.
  // -gpu swiftshader_indirect: renderização por software — compatível com máquinas sem GPU dedicada
  'appium:avdArgs': '-no-window -no-audio -no-boot-anim -gpu swiftshader_indirect',
};

// ─── Matriz de emuladores ─────────────────────────────────────────────────────
//
// Os nomes em appium:avd devem corresponder EXATAMENTE aos AVDs criados no Android Studio.
// Para listar os AVDs disponíveis: emulator -list-avds
// Para criar/recriar: npm run setup:emulators
//
// maxInstances no wdio.conf.js controla quantos emuladores rodam em paralelo:
//   maxInstances: 1  → sequencial (padrão — seguro para qualquer máquina)
//   maxInstances: 3  → todos em paralelo (requer ≥16GB RAM + SSD NVMe)

const EMULADORES = [
  {
    ...capabilitiesEmulador,
    'appium:avd': 'resp_standard',
    'appium:deviceName': 'resp_standard',
    'custom:deviceProfile': {
      name: 'standard',
      category: 'standard',
      avdProfile: 'Pixel 6',
      widthDp: 411,
      heightDp: 915,
      dpi: 411,
    },
  },
  {
    ...capabilitiesEmulador,
    'appium:avd': 'resp_large',
    'appium:deviceName': 'resp_large',
    'custom:deviceProfile': {
      name: 'large',
      category: 'large',
      avdProfile: 'Pixel 5',
      widthDp: 412,
      heightDp: 892,
      dpi: 560,
    },
  },
];

// ─── Seleção de dispositivos ──────────────────────────────────────────────────

function capabilitiesFisico() {
  const udid = obterUdidDispositivoFisico();
  if (!udid) throw new Error(
    'Nenhum dispositivo físico encontrado. Conecte um celular via USB com depuração USB ativada.'
  );
  return {
    ...capabilitiesBase,
    'appium:noReset': true,
    'appium:fullReset': false,
    'appium:udid': udid,
    'appium:deviceName': udid,
    'custom:deviceProfile': {
      name: 'physical',
      category: 'physical',
      avdProfile: 'Dispositivo físico',
      widthDp: 0,
      heightDp: 0,
      dpi: 0,
    },
  };
}

function obterDevices() {
  const filter = process.env.DEVICE_FILTER;

  // Filtros de dispositivo único
  if (filter === 'physical') return [capabilitiesFisico()];

  if (filter && filter !== 'all') {
    const filtrados = EMULADORES.filter(
      (d) => d['custom:deviceProfile'].name === filter
    );
    if (filtrados.length === 0) throw new Error(
      `DEVICE_FILTER="${filter}" inválido. Use: compact, standard, large, physical, all`
    );
    return filtrados;
  }

  // DEVICE_FILTER=all ou sem filtro → emuladores + físico em sequência
  // Ordem: compact → standard → large → físico
  const fisico = obterUdidDispositivoFisico();
  const lista  = [...EMULADORES];
  if (fisico) {
    lista.push(capabilitiesFisico());
    console.log('[devices] Suite completa: compact → standard → large → físico');
  } else {
    console.log('[devices] Dispositivo físico não conectado — rodando apenas emuladores');
  }
  return lista;
}

module.exports = { obterDevices, EMULADORES };
