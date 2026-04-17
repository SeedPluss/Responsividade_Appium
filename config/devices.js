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

// ─── Capabilities base ────────────────────────────────────────────────────────

const capabilitiesBase = {
  platformName: 'Android',
  'appium:automationName': 'UiAutomator2',
  'appium:app': APK_PATH,
  'appium:appPackage': 'br.com.confesol.ib.cresol',
  'appium:appActivity': 'br.com.confesol.ib.cresol.MainActivity',
  'appium:noReset': true,       // preserva instalação entre perfis — só muda a tela
  'appium:fullReset': false,
  'appium:autoGrantPermissions': true,
  'appium:newCommandTimeout': 300,
  'appium:adbExecTimeout': 120000,
  'appium:androidInstallTimeout': 120000,
  'appium:appWaitDuration': 60000,
  'appium:ignoreHiddenApiPolicyError': true,
  'appium:skipUnlock': true,
};

// ─── Perfis de tela simulados via ADB ─────────────────────────────────────────
//
// Estratégia: o mesmo dispositivo físico roda 3 sessões com tamanhos de tela
// diferentes, aplicados via "adb shell wm size/density" antes de cada sessão.
// Isso simula diferentes densidades de ecrã sem necessidade de emuladores.
//
// Cálculo: px = dp × dpi / 160
// Perfil    | dp (WxH)    | dpi | px (WxH)
// ----------|-------------|-----|----------
// compact   | 411 × 731   | 420 | 1080×1920
// standard  | 411 × 915   | 411 | 1056×2350 → arredondado para 1080×2400
// large     | 412 × 892   | 560 | 1442×3122 → arredondado para 1440×3120

const PERFIS_TELA = [
  {
    name: 'compact',
    avdProfile: 'Nexus 5X (simulado via ADB)',
    widthDp: 411, heightDp: 731, dpi: 420,
    wmSize: '1080x1920', wmDensity: 420,
  },
  {
    name: 'standard',
    avdProfile: 'Pixel 6 (simulado via ADB)',
    widthDp: 411, heightDp: 915, dpi: 411,
    wmSize: '1080x2400', wmDensity: 411,
  },
  {
    name: 'large',
    avdProfile: 'Pixel 7 Pro (simulado via ADB)',
    widthDp: 412, heightDp: 892, dpi: 560,
    wmSize: '1440x3120', wmDensity: 560,
  },
];

function gerarCapabilitiesPerfil(udid, perfil) {
  return {
    ...capabilitiesBase,
    'appium:udid': udid,
    'appium:deviceName': udid,
    'custom:deviceProfile': {
      name: perfil.name,
      category: perfil.name,
      avdProfile: perfil.avdProfile,
      widthDp: perfil.widthDp,
      heightDp: perfil.heightDp,
      dpi: perfil.dpi,
    },
    // Instruções ADB lidas pelo wdio.conf.js nos hooks beforeSession/afterSession
    'custom:screenProfile': {
      wmSize: perfil.wmSize,
      wmDensity: perfil.wmDensity,
    },
  };
}

// ─── Seleção de dispositivos ──────────────────────────────────────────────────

function obterDevices() {
  const filter = process.env.DEVICE_FILTER;

  const udid = obterUdidDispositivoFisico();
  if (!udid) throw new Error(
    'Nenhum dispositivo físico encontrado. Conecte um celular via USB com depuração USB ativada.'
  );

  // Perfil específico pelo nome
  if (filter && filter !== 'all' && filter !== 'physical') {
    const perfil = PERFIS_TELA.find((p) => p.name === filter);
    if (!perfil) throw new Error(
      `DEVICE_FILTER="${filter}" inválido. Use: compact, standard, large, physical, all`
    );
    return [gerarCapabilitiesPerfil(udid, perfil)];
  }

  // Tela original do dispositivo (sem alteração)
  if (filter === 'physical') {
    return [{
      ...capabilitiesBase,
      'appium:udid': udid,
      'appium:deviceName': udid,
      'custom:deviceProfile': {
        name: 'physical',
        category: 'physical',
        avdProfile: 'Tela original do dispositivo',
        widthDp: 0, heightDp: 0, dpi: 0,
      },
    }];
  }

  // Sem filtro ou DEVICE_FILTER=all → 3 perfis em sequência no mesmo dispositivo
  console.log('[devices] Suite completa: compact → standard → large (mesmo dispositivo físico)');
  return PERFIS_TELA.map((perfil) => gerarCapabilitiesPerfil(udid, perfil));
}

module.exports = { obterDevices, PERFIS_TELA };
