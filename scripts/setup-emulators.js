/**
 * setup-emulators.js
 * Cria os 3 AVDs da matriz de dispositivos para testes de responsividade.
 * Usa apenas módulos nativos do Node.js — sem dependências extras.
 *
 * Pré-requisito: ANDROID_HOME configurado e sdkmanager/avdmanager no PATH
 * ou dentro de %ANDROID_HOME%/cmdline-tools/latest/bin
 */

const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ─── Utilitários ──────────────────────────────────────────────────────────────

function run(cmd, opcoes = {}) {
  console.log(`  > ${cmd}`);
  return spawnSync(cmd, { shell: true, stdio: 'inherit', ...opcoes });
}

function saida(cmd) {
  try {
    return execSync(cmd, { shell: true, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
}

function erro(msg) {
  console.error(`\nERRO: ${msg}\n`);
  process.exit(1);
}

// ─── Localiza os binários do Android SDK ─────────────────────────────────────

function resolverCaminhoSdk() {
  const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;

  if (!androidHome) {
    erro(
      'Variável ANDROID_HOME não está definida.\n' +
      '  Windows: setx ANDROID_HOME "C:\\Users\\SeuUsuario\\AppData\\Local\\Android\\Sdk"\n' +
      '  Depois feche e abra o terminal novamente.'
    );
  }

  // Tenta localizar o sdkmanager em múltiplos locais comuns
  const candidatos = [
    path.join(androidHome, 'cmdline-tools', 'latest', 'bin'),
    path.join(androidHome, 'cmdline-tools', 'bin'),
    path.join(androidHome, 'tools', 'bin'),
  ];

  for (const dir of candidatos) {
    const sdkmanager = path.join(dir, 'sdkmanager');
    const avdmanager = path.join(dir, 'avdmanager');
    if (fs.existsSync(sdkmanager + '.bat') || fs.existsSync(sdkmanager)) {
      console.log(`  SDK encontrado em: ${dir}`);
      return { sdkmanager, avdmanager };
    }
  }

  erro(
    'sdkmanager não encontrado dentro de ANDROID_HOME.\n' +
    '  Instale o "Command-line tools" pelo Android Studio:\n' +
    '  SDK Manager → SDK Tools → Android SDK Command-line Tools (latest)'
  );
}

// ─── Lógica principal ─────────────────────────────────────────────────────────

function avdExiste(avdmanager, nome) {
  const lista = saida(`"${avdmanager}" list avd`);
  return lista.includes(`Name: ${nome}`);
}

function instalarSystemImage(sdkmanager, pacote) {
  console.log(`\n  Verificando system image: ${pacote}`);
  run(`"${sdkmanager}" --install "${pacote}"`);
}

function criarAvd(avdmanager, sdkmanager, nome, device, api) {
  if (avdExiste(avdmanager, nome)) {
    console.log(`  AVD '${nome}' já existe — pulando criação.`);
    return;
  }

  const pacote = `system-images;android-${api};google_apis;x86_64`;
  instalarSystemImage(sdkmanager, pacote);

  console.log(`  Criando AVD: ${nome} (device=${device}, android-${api})`);
  run(`echo no | "${avdmanager}" create avd --name "${nome}" --device "${device}" --package "${pacote}" --force`);
  console.log(`  ✓ AVD '${nome}' criado.\n`);
}

// ─── Execução ─────────────────────────────────────────────────────────────────

console.log('\n=== Setup de Emuladores — Cresol Automação ===\n');

const { sdkmanager, avdmanager } = resolverCaminhoSdk();

// Aceitar licenças automaticamente
run(`"${sdkmanager}" --licenses`, { input: 'y\ny\ny\ny\ny\n' });

const avds = [
  { nome: 'resp_compact',  device: 'Nexus 5X',     api: '30' },
  { nome: 'resp_standard', device: 'pixel_6',      api: '33' },
  { nome: 'resp_large',    device: 'pixel_7_pro',  api: '33' },
];

for (const avd of avds) {
  criarAvd(avdmanager, sdkmanager, avd.nome, avd.device, avd.api);
}

console.log('=== Todos os AVDs configurados com sucesso! ===');
console.log('\nPara verificar:  avdmanager list avd');
console.log('Para executar:   npm test\n');
