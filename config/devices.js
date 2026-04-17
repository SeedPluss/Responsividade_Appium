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
  if (apks.length === 0) throw new Error('Nenhum .apk encontrado. Coloque o APK na raiz ou em config/.');
  if (apks.length > 1) console.warn(`[devices] Múltiplos APKs — usando: ${apks[0]}`);
  return apks[0];
}

const APK_PATH = resolverApk();

// ─── Detecção de dispositivo físico conectado via USB ────────────────────────

function obterUdidDispositivoFisico() {
  try {
    const saida = execSync('adb devices', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    const linhas = saida.split('\n').slice(1); // remove header
    const fisico = linhas.find(
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

// ─── Capabilities base ───────────────────────────────────────────────────────

const capabilitiesBase = {
  platformName: 'Android',
  'appium:automationName': 'UiAutomator2',
  'appium:app': APK_PATH,
  'appium:appPackage': 'br.com.confesol.ib.cresol',
  'appium:appActivity': 'br.com.confesol.ib.cresol.MainActivity',
  // noReset: true evita reinstalação a cada run (útil com dispositivo físico)
  // Mude para fullReset: true quando quiser reinstalar do zero
  'appium:noReset': true,
  'appium:fullReset': false,
  'appium:autoGrantPermissions': false,
  'appium:newCommandTimeout': 300,
  'appium:adbExecTimeout': 120000,
  'appium:androidInstallTimeout': 120000,
  'appium:appWaitDuration': 60000,
  // Necessário para dispositivos físicos que bloqueiam configuração de Hidden API
  'appium:ignoreHiddenApiPolicyError': true,
  // skipUnlock evita que a instalação do settings APK com -g seja fatal no MIUI/Redmi
  'appium:skipUnlock': true,
};

// Capabilities exclusivas para emuladores (AVD)
const capabilitiesEmulador = {
  ...capabilitiesBase,
  'appium:avdLaunchTimeout': 180000,
  'appium:avdReadyTimeout': 180000,
  'appium:avdArgs': '-no-window -no-audio -no-boot-anim -gpu swiftshader_indirect',
};

// ─── Matriz de devices ───────────────────────────────────────────────────────

const EMULADORES = [
  {
    ...capabilitiesEmulador,
    'appium:avd': 'resp_compact',
    'appium:deviceName': 'resp_compact',
    'custom:deviceProfile': { name: 'compact',  category: 'compact',  avdProfile: 'Nexus 5X',    widthDp: 411, heightDp: 731, dpi: 420 },
  },
  {
    ...capabilitiesEmulador,
    'appium:avd': 'resp_standard',
    'appium:deviceName': 'resp_standard',
    'custom:deviceProfile': { name: 'standard', category: 'standard', avdProfile: 'pixel_6',     widthDp: 411, heightDp: 915, dpi: 411 },
  },
  {
    ...capabilitiesEmulador,
    'appium:avd': 'resp_large',
    'appium:deviceName': 'resp_large',
    'custom:deviceProfile': { name: 'large',    category: 'large',    avdProfile: 'pixel_7_pro', widthDp: 412, heightDp: 892, dpi: 560 },
  },
];

// ─── Filtro e seleção ────────────────────────────────────────────────────────

function obterDevices() {
  // DEVICE_FILTER=physical → usa o celular físico conectado via USB
  if (process.env.DEVICE_FILTER === 'physical') {
    const udid = obterUdidDispositivoFisico();
    if (!udid) throw new Error('Nenhum dispositivo físico encontrado. Conecte um celular via USB com depuração USB ativada.');
    return [{
      ...capabilitiesBase,
      'appium:udid': udid,
      'appium:deviceName': udid,
      'custom:deviceProfile': { name: 'physical', category: 'physical', avdProfile: 'Dispositivo físico', widthDp: 0, heightDp: 0, dpi: 0 },
    }];
  }

  // Sem filtro → usa todos os emuladores
  if (!process.env.DEVICE_FILTER) return EMULADORES;

  // Filtro por nome: compact | standard | large
  const filtrados = EMULADORES.filter(
    (d) => d['custom:deviceProfile'].name === process.env.DEVICE_FILTER
  );
  if (filtrados.length === 0) {
    throw new Error(`DEVICE_FILTER="${process.env.DEVICE_FILTER}" inválido. Use: compact, standard, large, physical`);
  }
  return filtrados;
}

module.exports = { obterDevices, EMULADORES };
