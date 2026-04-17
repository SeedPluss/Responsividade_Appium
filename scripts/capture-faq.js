/**
 * Script de captura de UI da FAQ — navega por cada tela e salva getPageSource().
 * Uso: npm run capture:faq
 */
const { remote } = require('webdriverio');
const fs   = require('fs');
const path = require('path');

const APK = (() => {
  const dir = path.resolve(__dirname, '../config');
  const f = fs.readdirSync(dir).find(f => f.endsWith('.apk'));
  return f ? path.join(dir, f) : null;
})();

const CAPS = {
  platformName: 'Android',
  'appium:automationName': 'UiAutomator2',
  'appium:app': APK,
  'appium:appPackage': 'br.com.confesol.ib.cresol',
  'appium:appActivity': 'br.com.confesol.ib.cresol.MainActivity',
  'appium:noReset': true,
  'appium:fullReset': false,
  'appium:autoGrantPermissions': false,
  'appium:newCommandTimeout': 300,
  'appium:ignoreHiddenApiPolicyError': true,
  'appium:skipUnlock': true,
  'appium:udid': '65prswbeu4z9fuhy',
  'appium:deviceName': '65prswbeu4z9fuhy',
};

const OUT = path.resolve(__dirname, '../ui_dumps');
fs.mkdirSync(OUT, { recursive: true });

let d; // driver global para helpers

async function salvar(nome) {
  await d.pause(1200);
  const xml = await d.getPageSource();
  const f = path.join(OUT, `${nome}.xml`);
  fs.writeFileSync(f, xml);
  const ids = [...new Set([...xml.matchAll(/resource-id="([^"]+)"/g)].map(m => m[1]))]
    .filter(id => id && !id.startsWith('android:') && !id.startsWith('br.com.confesol.ib'));
  console.log(`\n── ${nome} ──`);
  ids.forEach(id => console.log('  •', id));
  return ids;
}

async function tap(seletor) {
  const el = await d.$(seletor);
  await el.waitForDisplayed({ timeout: 15000 });
  const loc  = await el.getLocation();
  const size = await el.getSize();
  const x = Math.round(loc.x + size.width / 2);
  const y = Math.round(loc.y + size.height / 2);
  // W3C Pointer Actions — funciona onde element.click() falha no Redmi MIUI
  await d.action('pointer', { parameters: { pointerType: 'touch' } })
    .move({ duration: 0, x, y })
    .down()
    .pause(80)
    .up()
    .perform();
  await d.pause(2000);
}

async function tapTexto(texto) {
  await tap(`-android uiautomator:new UiSelector().text("${texto}")`);
}

async function tapContem(texto) {
  await tap(`-android uiautomator:new UiSelector().textContains("${texto}")`);
}

async function voltar() {
  await d.back();
  await d.pause(1500);
}

async function main() {
  d = await remote({ protocol: 'http', hostname: '127.0.0.1', port: 4723, path: '/', capabilities: CAPS, logLevel: 'warn' });

  try {
    await d.pause(5000);
    await salvar('01_login');

    // ── FAQ Home ─────────────────────────────────────────────────────────────
    await tap('-android uiautomator:new UiSelector().resourceId("login__ui-icon--show-faq-modal")');
    await salvar('02_faq_home');

    // ── Campo de busca ────────────────────────────────────────────────────────
    try {
      await tap('-android uiautomator:new UiSelector().resourceId("faq__ui-input--search").instance(0)');
      await salvar('03_faq_busca_foco');
      await d.back(); await d.pause(1000);
    } catch { try { await tapContem('Pesquisar'); await salvar('03_faq_busca_foco'); await d.back(); } catch(e){console.log('[SKIP busca]', e.message);} }

    // ── Categoria Acesso ─────────────────────────────────────────────────────
    try { await tapTexto('Acesso'); await salvar('04_faq_acesso'); } catch(e){console.log('[SKIP Acesso]',e.message);}

    // ── Resposta pergunta Acesso ──────────────────────────────────────────────
    try { await tapContem('não está funcionando'); await salvar('05_faq_resposta'); await voltar(); } catch(e){console.log('[SKIP resposta]',e.message);}

    // Voltar para FAQ Home
    try { await voltar(); } catch {}

    // ── Categoria Quero ser cooperado ─────────────────────────────────────────
    try { await tapContem('Quero ser'); await salvar('06_faq_cooperado'); await voltar(); } catch(e){console.log('[SKIP cooperado]',e.message);}

    // ── Categoria Produtos e Serviços ─────────────────────────────────────────
    try { await tapContem('Produtos'); await salvar('07_faq_produtos'); } catch(e){console.log('[SKIP produtos]',e.message);}
    try { await tapTexto('Crédito'); await salvar('07b_faq_credito'); } catch {}
    try { await voltar(); } catch {}

    // ── Categoria Planeje suas finanças ───────────────────────────────────────
    try { await tapContem('Planeje'); await salvar('08_faq_financas'); await voltar(); } catch(e){console.log('[SKIP financas]',e.message);}

    // ── Categoria Contatos ───────────────────────────────────────────────────
    try { await tapTexto('Contatos'); await salvar('09_faq_contatos'); await voltar(); } catch(e){console.log('[SKIP contatos]',e.message);}

  } finally {
    await d.deleteSession();
    console.log('\nCaptura concluída. XMLs salvos em:', OUT);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
