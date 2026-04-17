/**
 * Spec temporário de captura de IDs da FAQ.
 * Navega por cada tela e salva getPageSource() em ui_dumps/.
 * Executar com: npm run test:physical -- --spec test/specs/capture/faq-capture.spec.js
 */
const fs   = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname, '../../../ui_dumps');
fs.mkdirSync(OUT, { recursive: true });

function extrairIds(xml) {
  return [...new Set([...xml.matchAll(/resource-id="([^"]+)"/g)].map(m => m[1]))]
    .filter(id => id && !id.startsWith('android:') && !id.startsWith('br.com.confesol.ib'));
}

async function salvar(nome) {
  await browser.pause(1500);
  const xml = await browser.getPageSource();
  fs.writeFileSync(path.join(OUT, `${nome}.xml`), xml);
  const ids = extrairIds(xml);
  console.log(`\n── ${nome} (${ids.length} IDs únicos) ──`);
  ids.forEach(id => console.log('  •', id));
}

async function tapEl(seletor) {
  const el = await $(seletor);
  await el.waitForDisplayed({ timeout: 15000 });
  try {
    const loc  = await el.getLocation();
    const size = await el.getSize();
    await driver.touchAction({ action: 'tap', x: Math.round(loc.x + size.width / 2), y: Math.round(loc.y + size.height / 2) });
  } catch {
    await el.click().catch(() => {});
  }
  await browser.pause(2500);
}

describe('FAQ — Captura de UI Hierarchy', () => {

  it('01 — Tela de Login', async () => {
    await salvar('01_login');
  });

  it('02 — FAQ Home', async () => {
    await tapEl('-android uiautomator:new UiSelector().resourceId("login__ui-icon--show-faq-modal")');
    await salvar('02_faq_home');
  });

  it('03 — Campo de Busca (foco)', async () => {
    // Tenta clicar no campo de pesquisa
    try {
      const el = await $('-android uiautomator:new UiSelector().resourceId("faq__ui-input--search")');
      await el.waitForDisplayed({ timeout: 5000 });
      await tapEl('-android uiautomator:new UiSelector().resourceId("faq__ui-input--search")');
    } catch {
      // Tenta pelo texto
      try {
        await tapEl('-android uiautomator:new UiSelector().textContains("Pesquisar")');
      } catch(e) { console.log('[SKIP busca]', e.message); }
    }
    await salvar('03_faq_busca_foco');
    await driver.back(); await browser.pause(1500);
  });

  it('04 — Categoria Acesso', async () => {
    try {
      await tapEl('-android uiautomator:new UiSelector().text("Acesso")');
      await salvar('04_faq_acesso');
    } catch(e) { console.log('[SKIP]', e.message); }
  });

  it('05 — Resposta (primeira pergunta Acesso)', async () => {
    try {
      await tapEl('-android uiautomator:new UiSelector().textContains("não está funcionando")');
      await salvar('05_faq_resposta');
    } catch(e) { console.log('[SKIP]', e.message); }
    await driver.back(); await browser.pause(1500);
  });

  it('06 — Botão avaliação (Sim/Não)', async () => {
    // Captura da tela de resposta já foi feita, voltar p/ categoria
    try {
      await salvar('05b_faq_resposta_avaliar');
    } catch(e) {}
    await driver.back(); await browser.pause(1500);
  });

  it('07 — Categoria Quero ser cooperado', async () => {
    try {
      await tapEl('-android uiautomator:new UiSelector().textContains("Quero ser")');
      await salvar('06_faq_cooperado');
      await driver.back(); await browser.pause(1500);
    } catch(e) { console.log('[SKIP]', e.message); }
  });

  it('08 — Categoria Produtos e Serviços', async () => {
    try {
      await tapEl('-android uiautomator:new UiSelector().textContains("Produtos")');
      await salvar('07_faq_produtos');
    } catch(e) { console.log('[SKIP]', e.message); }
  });

  it('09 — Aba Crédito em Produtos', async () => {
    try {
      await tapEl('-android uiautomator:new UiSelector().text("Crédito")');
      await salvar('07b_faq_credito');
    } catch(e) { console.log('[SKIP]', e.message); }
    await driver.back(); await browser.pause(1500);
  });

  it('10 — Categoria Planeje suas finanças', async () => {
    try {
      await tapEl('-android uiautomator:new UiSelector().textContains("Planeje")');
      await salvar('08_faq_financas');
      await driver.back(); await browser.pause(1500);
    } catch(e) { console.log('[SKIP]', e.message); }
  });

  it('11 — Categoria Contatos', async () => {
    try {
      await tapEl('-android uiautomator:new UiSelector().text("Contatos")');
      await salvar('09_faq_contatos');
      await driver.back(); await browser.pause(1500);
    } catch(e) { console.log('[SKIP]', e.message); }
  });

});
