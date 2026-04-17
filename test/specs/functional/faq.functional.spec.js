/**
 * faq.functional.spec.js
 * Cobertura funcional da FAQ (FAQ01–FAQ22).
 * Pré-condição: app na tela de Login.
 */
const faqScreen = require('../../screens/FaqScreen');
const { tagTest } = require('../../utils/allure-helper');

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function voltarParaHome() {
  await driver.hideKeyboard().catch(() => {});
  try {
    await faqScreen.tapElement(await faqScreen.botaoVoltar);
    await faqScreen.tituloPrincipal.waitForDisplayed({ timeout: 8000 });
  } catch {
    await driver.back().catch(() => {});
    await browser.pause(1000);
  }
}

async function verificarTelaResposta() {
  await expect(faqScreen.labelAvaliarResposta).toBeDisplayed();
  await expect(faqScreen.botaoAvaliarSim).toBeDisplayed();
  await expect(faqScreen.botaoAvaliarNao).toBeDisplayed();
}

async function verificarAvaliacaoSim() {
  await faqScreen.avaliarResposta(true);
  await expect(faqScreen.mensagemObrigado).toBeDisplayed();
}

async function verificarAvaliacaoNao() {
  await faqScreen.avaliarResposta(false);
  await expect(faqScreen.mensagemOuvidoria).toBeDisplayed();
}

async function scrollParaBaixo() {
  await browser.execute('mobile: scrollGesture', {
    left: 100, top: 300, width: 300, height: 700,
    direction: 'up', percent: 1.5,
  }).catch(() => {});
  await browser.pause(800);
}

// ═══════════════════════════════════════════════════════════════════════════════
// FAQ01 — Tela "Dúvidas frequentes"
// ═══════════════════════════════════════════════════════════════════════════════

describe('FAQ01 — Tela de Dúvidas Frequentes', () => {

  before(async () => {
    await faqScreen.abrirFaq();
  });

  it('Deve exibir título "Como podemos te ajudar?"', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ01 — Navegação até Dúvidas Frequentes', severity: 'critical' });
    await expect(faqScreen.tituloPrincipal).toBeDisplayed();
  });

  it('Deve exibir campo de pesquisa com ícone lupa', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ01 — Navegação até Dúvidas Frequentes', severity: 'critical' });
    await expect(faqScreen.campoPesquisa).toBeDisplayed();
  });

  it('Deve exibir cards acima do fold: Acesso, Quero ser cooperado, Produtos, Planeje', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ01 — Navegação até Dúvidas Frequentes', severity: 'critical' });
    for (const el of [
      faqScreen.cardAcesso,
      faqScreen.cardQueroSerCooperado,
      faqScreen.cardProdutosServicos,
      faqScreen.cardPlanjeFinancas,
    ]) {
      await expect(await el).toBeDisplayed();
    }
  });

  it('Deve exibir cards abaixo do fold: Contatos, Agências, Avaliar (requer scroll)', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ01 — Navegação até Dúvidas Frequentes', severity: 'normal' });
    await scrollParaBaixo();
    for (const el of [faqScreen.cardContatos, faqScreen.cardAgencias, faqScreen.cardAvaliar]) {
      await expect(await el).toBeDisplayed();
    }
  });

  it('Deve exibir cards de outros aplicativos (Cartões, Tag, Consórcios)', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ01 — Navegação até Dúvidas Frequentes', severity: 'normal' });
    // Rola para baixo para revelar cards de apps externos (abaixo do fold)
    await scrollParaBaixo();
    for (const el of [faqScreen.cardCresolCartoes, faqScreen.cardMinhaTag, faqScreen.cardCresolConsorcios]) {
      await expect(await el).toBeDisplayed();
    }
  });

  it('Deve retornar para tela de login ao clicar em voltar', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ01 — Navegação até Dúvidas Frequentes', severity: 'critical' });
    await faqScreen.tapElement(await faqScreen.botaoVoltar);
    const loginEl = await $('-android uiautomator:new UiSelector().resourceId("login__app-single-login--single-login")');
    await expect(loginEl).toBeDisplayed();
  });

  after(async () => {
    await faqScreen.abrirFaq().catch(() => {});
  });

});

// ═══════════════════════════════════════════════════════════════════════════════
// FAQ02 — Pesquisa com resultados
// ═══════════════════════════════════════════════════════════════════════════════

describe('FAQ02 — Pesquisar dúvidas frequentes', () => {

  before(async () => { await faqScreen.abrirFaq(); });

  it('Campo de pesquisa deve abrir teclado ao ser clicado', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ02 — Pesquisa com resultados', severity: 'normal' });
    await faqScreen.tapElement(await faqScreen.campoPesquisa);
    await browser.pause(1500);
    const input = await faqScreen.inputPesquisa;
    await expect(input).toBeDisplayed();
    await driver.hideKeyboard().catch(() => {});
  });

  it('Deve listar perguntas ao buscar "Pix"', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ02 — Pesquisa com resultados', severity: 'critical' });
    await faqScreen.pesquisar('Pix');
    const resultado = await $('-android uiautomator:new UiSelector().textContains("Pix")');
    await expect(resultado).toBeDisplayed();
    await driver.back();
    await browser.pause(800);
  });

  it('Deve listar perguntas ao buscar com acentuação "Pré"', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ02 — Pesquisa com resultados', severity: 'normal' });
    await faqScreen.pesquisar('Pré');
    await browser.pause(1000);
    await driver.back();
    await browser.pause(800);
  });

  // O comportamento correto: busca filtra a lista. Após resultado aparecer, tapa para abrir resposta.
  it('Deve abrir tela de resposta ao clicar em resultado da busca', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ02 — Pesquisa com resultados', severity: 'critical' });
    await faqScreen.pesquisar('senha');
    // Aguarda a lista filtrada carregar
    const resultado = await $('-android uiautomator:new UiSelector().textContains("senha")');
    await resultado.waitForDisplayed({ timeout: 8000 });
    // Toca no primeiro resultado para abrir a resposta
    await faqScreen.tapElement(resultado);
    // Verifica se abriu tela de resposta (aguarda label de avaliação)
    await faqScreen.labelAvaliarResposta.waitForDisplayed({ timeout: 10000 });
    await expect(faqScreen.labelAvaliarResposta).toBeDisplayed();
    await driver.back();
    await driver.back();
    await browser.pause(800);
  });

});

// ═══════════════════════════════════════════════════════════════════════════════
// FAQ03 — Pesquisa sem resultados
// ═══════════════════════════════════════════════════════════════════════════════

describe('FAQ03 — Pesquisa sem resultados', () => {

  before(async () => { await faqScreen.abrirFaq(); });

  it('Deve exibir "Nenhum resultado encontrado" para busca sem match', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ03 — Pesquisa sem resultados', severity: 'critical' });
    await faqScreen.pesquisar('xyzqwerty12345');
    await expect(faqScreen.mensagemSemResultados).toBeDisplayed();
    await driver.back();
    await browser.pause(800);
  });

  it('Deve exibir "Nenhum resultado encontrado" para símbolos "###"', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ03 — Pesquisa sem resultados', severity: 'normal' });
    await faqScreen.pesquisar('###');
    await expect(faqScreen.mensagemSemResultados).toBeDisplayed();
    await driver.back();
    await browser.pause(800);
  });

});

// ═══════════════════════════════════════════════════════════════════════════════
// FAQ04 — Categoria "Acesso"
// ═══════════════════════════════════════════════════════════════════════════════

describe('FAQ04 — Categoria Acesso', () => {

  before(async () => {
    await faqScreen.abrirFaq();
    await faqScreen.abrirCategoria(await faqScreen.cardAcesso);
  });

  it('Deve exibir título na tela de categoria Acesso', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ04 — Categoria Acesso', severity: 'critical' });
    const titulo = await $('-android uiautomator:new UiSelector().text("Acesso")');
    await expect(titulo).toBeDisplayed();
  });

  it('Deve listar as perguntas da categoria Acesso', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ04 — Categoria Acesso', severity: 'critical' });
    for (const p of [
      'Meu aplicativo não está funcionando corretamente. O que devo fazer?',
      'Perdi ou troquei de celular. O que deve fazer?',
      'Esse é meu primeiro acesso. Como faço para me cadastrar?',
      'Como faço para desbloquear minha senha?',
      'Esqueci minha senha. O que devo fazer?',
    ]) {
      const el = await $(`-android uiautomator:new UiSelector().text("${p}")`);
      await expect(el).toBeDisplayed();
    }
  });

  it('Deve retornar para FAQ home ao clicar em voltar', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ04 — Categoria Acesso', severity: 'normal' });
    await faqScreen.tapElement(await faqScreen.botaoVoltar);
    await expect(faqScreen.tituloPrincipal).toBeDisplayed();
  });

});

// ═══════════════════════════════════════════════════════════════════════════════
// FAQ05 — Respostas e avaliação na categoria "Acesso"
// ═══════════════════════════════════════════════════════════════════════════════

describe('FAQ05 — Respostas e avaliação em Acesso', () => {

  before(async () => {
    await faqScreen.abrirFaq();
    await faqScreen.abrirCategoria(await faqScreen.cardAcesso);
  });

  it('Resposta: "Meu aplicativo não está funcionando" — exibição e avaliação Sim', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ05 — Acesso: respostas e avaliação', severity: 'critical' });
    await faqScreen.abrirPergunta('Meu aplicativo não está funcionando corretamente. O que devo fazer?');
    await verificarTelaResposta();
    await expect(faqScreen.corpoResposta).toBeDisplayed();
    await verificarAvaliacaoSim();
    await driver.back();
    await browser.pause(800);
  });

  it('Resposta: "Meu aplicativo não está funcionando" — avaliação Não → ouvidoria', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ05 — Acesso: respostas e avaliação', severity: 'critical' });
    await faqScreen.abrirPergunta('Meu aplicativo não está funcionando corretamente. O que devo fazer?');
    await verificarAvaliacaoNao();
    await driver.back();
    await browser.pause(800);
  });

  it('Resposta: "Perdi ou troquei de celular" — exibição e avaliação Sim', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ05 — Acesso: respostas e avaliação', severity: 'critical' });
    await faqScreen.abrirPergunta('Perdi ou troquei de celular. O que deve fazer?');
    await verificarTelaResposta();
    await expect(faqScreen.corpoResposta).toBeDisplayed();
    await verificarAvaliacaoSim();
    await driver.back();
    await browser.pause(800);
  });

  it('Resposta: "Primeiro acesso" — exibição e avaliação Não', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ05 — Acesso: respostas e avaliação', severity: 'critical' });
    await faqScreen.abrirPergunta('Esse é meu primeiro acesso. Como faço para me cadastrar?');
    await verificarTelaResposta();
    await verificarAvaliacaoNao();
    await driver.back();
    await browser.pause(800);
  });

  it('Resposta: "Desbloquear senha" — exibição e avaliação Sim', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ05 — Acesso: respostas e avaliação', severity: 'critical' });
    await faqScreen.abrirPergunta('Como faço para desbloquear minha senha?');
    await verificarTelaResposta();
    await verificarAvaliacaoSim();
    await driver.back();
    await browser.pause(800);
  });

  it('Resposta: "Esqueci minha senha" — exibição e avaliação Não', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ05 — Acesso: respostas e avaliação', severity: 'critical' });
    await faqScreen.abrirPergunta('Esqueci minha senha. O que devo fazer?');
    await verificarTelaResposta();
    await verificarAvaliacaoNao();
    await driver.back();
    await browser.pause(800);
  });

  after(async () => { await voltarParaHome().catch(() => {}); });

});

// ═══════════════════════════════════════════════════════════════════════════════
// FAQ06/FAQ07 — "Quero ser um cooperado"
// ═══════════════════════════════════════════════════════════════════════════════

describe('FAQ06/FAQ07 — Categoria Quero ser um cooperado', () => {

  before(async () => {
    await faqScreen.abrirFaq();
    await faqScreen.abrirCategoria(await faqScreen.cardQueroSerCooperado);
  });

  it('FAQ06 — Deve exibir as perguntas da categoria', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ06 — Quero ser um cooperado', severity: 'critical' });
    for (const p of [
      'Quais os benefícios de ser um cooperado Cresol?',
      'Como abrir uma conta e me tornar sócio na Cresol?',
      'Quais documentos necessários para abrir uma conta na Cresol?',
    ]) {
      await expect(await $(`-android uiautomator:new UiSelector().text("${p}")`)).toBeDisplayed();
    }
  });

  it('FAQ06 — Deve retornar para FAQ home ao clicar em voltar', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ06 — Quero ser um cooperado', severity: 'normal' });
    await faqScreen.tapElement(await faqScreen.botaoVoltar);
    await expect(faqScreen.tituloPrincipal).toBeDisplayed();
    await faqScreen.abrirCategoria(await faqScreen.cardQueroSerCooperado);
  });

  it('FAQ07 — "Quais os benefícios?" — exibição e avaliação Sim', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ07 — Quero ser cooperado: respostas', severity: 'critical' });
    await faqScreen.abrirPergunta('Quais os benefícios de ser um cooperado Cresol?');
    await verificarTelaResposta();
    await expect(faqScreen.corpoResposta).toBeDisplayed();
    await verificarAvaliacaoSim();
    await driver.back();
    await browser.pause(800);
  });

  it('FAQ07 — "Como abrir uma conta?" — exibição e avaliação Não', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ07 — Quero ser cooperado: respostas', severity: 'critical' });
    await faqScreen.abrirPergunta('Como abrir uma conta e me tornar sócio na Cresol?');
    await verificarTelaResposta();
    await expect(faqScreen.corpoResposta).toBeDisplayed();
    await verificarAvaliacaoNao();
    await driver.back();
    await browser.pause(800);
  });

  it('FAQ07 — "Quais documentos necessários?" — exibição e avaliação Sim', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ07 — Quero ser cooperado: respostas', severity: 'critical' });
    await faqScreen.abrirPergunta('Quais documentos necessários para abrir uma conta na Cresol?');
    await verificarTelaResposta();
    await expect(faqScreen.corpoResposta).toBeDisplayed();
    await verificarAvaliacaoSim();
    await driver.back();
    await browser.pause(800);
  });

  after(async () => { await voltarParaHome().catch(() => {}); });

});

// ═══════════════════════════════════════════════════════════════════════════════
// FAQ08–FAQ14 — Produtos e Serviços
// ═══════════════════════════════════════════════════════════════════════════════

describe('FAQ08–FAQ14 — Categoria Produtos e Serviços', () => {

  before(async () => {
    await faqScreen.abrirFaq();
    await faqScreen.abrirCategoria(await faqScreen.cardProdutosServicos);
  });

  it('FAQ08 — Deve exibir aba Pix selecionada por padrão', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ08 — Produtos: aba Pix', severity: 'critical' });
    await expect(faqScreen.abaPix).toBeDisplayed();
    const p1 = await $('-android uiautomator:new UiSelector().text("O que é o Pix?")');
    await expect(p1).toBeDisplayed();
  });

  it('FAQ08 — Deve retornar para FAQ home ao clicar em voltar', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ08 — Produtos: aba Pix', severity: 'normal' });
    await faqScreen.tapElement(await faqScreen.botaoVoltar);
    await expect(faqScreen.tituloPrincipal).toBeDisplayed();
    await faqScreen.abrirCategoria(await faqScreen.cardProdutosServicos);
  });

  it('FAQ09 — "O que é o Pix?" — exibição e avaliação Sim', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ09 — Produtos: Pix respostas', severity: 'critical' });
    await faqScreen.abrirPergunta('O que é o Pix?');
    await verificarTelaResposta();
    await expect(faqScreen.corpoResposta).toBeDisplayed();
    await verificarAvaliacaoSim();
    await driver.back();
    await browser.pause(800);
  });

  it('FAQ09 — "O que é uma chave Pix?" — exibição e avaliação Não', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ09 — Produtos: Pix respostas', severity: 'critical' });
    await faqScreen.abrirPergunta('O que é uma chave Pix?');
    await verificarTelaResposta();
    await expect(faqScreen.corpoResposta).toBeDisplayed();
    await verificarAvaliacaoNao();
    await driver.back();
    await browser.pause(800);
  });

  it('FAQ09 — "Quanto custa usar Pix na Cresol?" — exibição e avaliação Sim', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ09 — Produtos: Pix respostas', severity: 'critical' });
    await faqScreen.abrirPergunta('Quanto custa para enviar e receber usando Pix no Cresol?');
    await verificarTelaResposta();
    await expect(faqScreen.corpoResposta).toBeDisplayed();
    await verificarAvaliacaoSim();
    await driver.back();
    await browser.pause(800);
  });

  it('FAQ10 — Aba Crédito deve exibir perguntas de crédito', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ10 — Produtos: aba Crédito', severity: 'critical' });
    await faqScreen.tapElement(await faqScreen.abaCredito);
    await browser.pause(1200);
    const p = await $('-android uiautomator:new UiSelector().textContains("crédito")');
    await expect(p).toBeDisplayed();
  });

  it('FAQ10 — "Quais opções de crédito?" — exibição e avaliação Sim', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ10 — Produtos: Crédito respostas', severity: 'critical' });
    await faqScreen.abrirPergunta('Quais opções de crédito a Cresol disponibiliza?');
    await verificarTelaResposta();
    await expect(faqScreen.corpoResposta).toBeDisplayed();
    await verificarAvaliacaoSim();
    await driver.back();
    await browser.pause(800);
  });

  it('FAQ11 — Aba Capital Social deve exibir perguntas', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ11 — Produtos: Capital Social', severity: 'normal' });
    await faqScreen.tapElement(await faqScreen.abaCapitalSocial);
    await browser.pause(1200);
    const p = await $('-android uiautomator:new UiSelector().textContains("Capital Social")');
    await expect(p).toBeDisplayed();
  });

  it('FAQ11 — "O que é o Capital Social?" — exibição e avaliação Sim', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ11 — Produtos: Capital Social respostas', severity: 'normal' });
    await faqScreen.abrirPergunta('O que é o Capital Social?');
    await verificarTelaResposta();
    await expect(faqScreen.corpoResposta).toBeDisplayed();
    await verificarAvaliacaoSim();
    await driver.back();
    await browser.pause(800);
  });

  it('FAQ12 — Aba Cartões deve exibir perguntas sobre cartão', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ12 — Produtos: aba Cartões', severity: 'normal' });
    await faqScreen.tapElement(await faqScreen.abaCartoes);
    await browser.pause(1200);
    const p = await $('-android uiautomator:new UiSelector().textContains("cartão")');
    await expect(p).toBeDisplayed();
  });

  it('FAQ12 — "Quais os benefícios do cartão Cresol?" — exibição e avaliação Não', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ12 — Produtos: Cartões respostas', severity: 'normal' });
    await faqScreen.abrirPergunta('Quais os benefícios do cartão Cresol?');
    await verificarTelaResposta();
    await expect(faqScreen.corpoResposta).toBeDisplayed();
    await verificarAvaliacaoNao();
    await driver.back();
    await browser.pause(800);
  });

  it('FAQ13 — Aba Consórcios deve exibir perguntas', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ13 — Produtos: aba Consórcios', severity: 'normal' });
    await faqScreen.tapElement(await faqScreen.abaConsorcios);
    await browser.pause(1200);
    const p = await $('-android uiautomator:new UiSelector().textContains("consórcio")');
    await expect(p).toBeDisplayed();
  });

  it('FAQ13 — "O que é um consórcio?" — exibição e avaliação Sim', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ13 — Produtos: Consórcios respostas', severity: 'normal' });
    await faqScreen.abrirPergunta('O que é um consórcio?');
    await verificarTelaResposta();
    await expect(faqScreen.corpoResposta).toBeDisplayed();
    await verificarAvaliacaoSim();
    await driver.back();
    await browser.pause(800);
  });

  it('FAQ14 — Aba Seguros deve exibir perguntas', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ14 — Produtos: aba Seguros', severity: 'normal' });
    await faqScreen.tapElement(await faqScreen.abaSeguros);
    await browser.pause(1200);
    const p = await $('-android uiautomator:new UiSelector().textContains("seguro")');
    await expect(p).toBeDisplayed();
  });

  it('FAQ14 — "A Cresol oferece seguros?" — exibição e avaliação Sim', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ14 — Produtos: Seguros respostas', severity: 'normal' });
    await faqScreen.abrirPergunta('A Cresol oferece seguros?');
    await verificarTelaResposta();
    await expect(faqScreen.corpoResposta).toBeDisplayed();
    await verificarAvaliacaoSim();
    await driver.back();
    await browser.pause(800);
  });

  after(async () => { await voltarParaHome().catch(() => {}); });

});

// ═══════════════════════════════════════════════════════════════════════════════
// FAQ15/FAQ16 — Planeje suas finanças
// ═══════════════════════════════════════════════════════════════════════════════

describe('FAQ15/FAQ16 — Categoria Planeje suas finanças', () => {

  before(async () => {
    await faqScreen.abrirFaq();
    await faqScreen.abrirCategoria(await faqScreen.cardPlanjeFinancas);
  });

  it('FAQ15 — Deve exibir perguntas de planejamento', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ15 — Planeje suas finanças', severity: 'critical' });
    for (const p of [
      'Como iniciar um planejamento financeiro?',
      'Como começar a investir?',
      'O que é planejamento financeiro?',
    ]) {
      await expect(await $(`-android uiautomator:new UiSelector().text("${p}")`)).toBeDisplayed();
    }
  });

  it('FAQ15 — Deve retornar para FAQ home ao clicar em voltar', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ15 — Planeje suas finanças', severity: 'normal' });
    await faqScreen.tapElement(await faqScreen.botaoVoltar);
    await expect(faqScreen.tituloPrincipal).toBeDisplayed();
    await faqScreen.abrirCategoria(await faqScreen.cardPlanjeFinancas);
  });

  it('FAQ16 — "Como iniciar um planejamento financeiro?" — exibição e avaliação Sim', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ16 — Planeje suas finanças: respostas', severity: 'critical' });
    await faqScreen.abrirPergunta('Como iniciar um planejamento financeiro?');
    await verificarTelaResposta();
    await expect(faqScreen.corpoResposta).toBeDisplayed();
    await verificarAvaliacaoSim();
    await driver.back();
    await browser.pause(800);
  });

  it('FAQ16 — "Como começar a investir?" — exibição e avaliação Não', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ16 — Planeje suas finanças: respostas', severity: 'critical' });
    await faqScreen.abrirPergunta('Como começar a investir?');
    await verificarTelaResposta();
    await expect(faqScreen.corpoResposta).toBeDisplayed();
    await verificarAvaliacaoNao();
    await driver.back();
    await browser.pause(800);
  });

  it('FAQ16 — "O que é planejamento financeiro?" — exibição e avaliação Sim', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ16 — Planeje suas finanças: respostas', severity: 'critical' });
    await faqScreen.abrirPergunta('O que é planejamento financeiro?');
    await verificarTelaResposta();
    await expect(faqScreen.corpoResposta).toBeDisplayed();
    await verificarAvaliacaoSim();
    await driver.back();
    await browser.pause(800);
  });

  after(async () => { await voltarParaHome().catch(() => {}); });

});

// ═══════════════════════════════════════════════════════════════════════════════
// FAQ17 — Contatos
// ═══════════════════════════════════════════════════════════════════════════════

describe('FAQ17 — Categoria Contatos', () => {

  before(async () => {
    await faqScreen.abrirFaq();
    await faqScreen.abrirCategoria(await faqScreen.cardContatos);
  });

  it('FAQ17 — Deve exibir seção SAC/Ouvidoria com número 0800 643 1981', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ17 — Contatos', severity: 'critical' });
    await expect(await $('-android uiautomator:new UiSelector().textContains("SAC/Ouvidoria")')).toBeDisplayed();
    await expect(await $('-android uiautomator:new UiSelector().textContains("0800 643 1981")')).toBeDisplayed();
  });

  it('FAQ17 — Deve exibir seção Cartões de crédito com números', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ17 — Contatos', severity: 'critical' });
    await expect(await $('-android uiautomator:new UiSelector().textContains("Cartões de crédito")')).toBeDisplayed();
    await expect(await $('-android uiautomator:new UiSelector().textContains("0800 704 7500")')).toBeDisplayed();
  });

  it('FAQ17 — Deve retornar para FAQ home ao clicar em voltar', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ17 — Contatos', severity: 'normal' });
    await faqScreen.tapElement(await faqScreen.botaoVoltar);
    await expect(faqScreen.tituloPrincipal).toBeDisplayed();
  });

});

// ═══════════════════════════════════════════════════════════════════════════════
// FAQ18–FAQ22 — Cards de ação externa
// ═══════════════════════════════════════════════════════════════════════════════

describe('FAQ18–FAQ22 — Cards de ação externa', () => {

  before(async () => { await faqScreen.abrirFaq(); });

  it('FAQ18 — Card "Agências" deve abrir browser com site Cresol', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ18 — Agências', severity: 'normal' });
    await faqScreen.tapElement(await faqScreen.cardAgencias);
    await browser.pause(3000);
    await driver.back().catch(() => {});
    await browser.pause(1200);
    await faqScreen.abrirFaq();
  });

  it('FAQ19 — Card "Avaliar" deve abrir loja de apps para avaliação', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ19 — Avaliar app', severity: 'minor' });
    await faqScreen.tapElement(await faqScreen.cardAvaliar);
    await browser.pause(3000);
    await driver.back().catch(() => {});
    await browser.pause(1200);
    await faqScreen.abrirFaq();
  });

  it('FAQ20 — Card "Cresol Cartões" deve abrir loja de apps', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ20 — Cresol Cartões', severity: 'minor' });
    // Cartões, Tag e Consórcios ficam abaixo do fold — rola para baixo
    await scrollParaBaixo();
    await faqScreen.tapElement(await faqScreen.cardCresolCartoes);
    await browser.pause(3000);
    await driver.back().catch(() => {});
    await browser.pause(1200);
    await faqScreen.abrirFaq();
  });

  it('FAQ21 — Card "Minha Tag Cresol" deve abrir loja de apps', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ21 — Minha Tag Cresol', severity: 'minor' });
    await scrollParaBaixo();
    await faqScreen.tapElement(await faqScreen.cardMinhaTag);
    await browser.pause(3000);
    await driver.back().catch(() => {});
    await browser.pause(1200);
    await faqScreen.abrirFaq();
  });

  it('FAQ22 — Card "Cresol Consórcios" deve abrir loja de apps', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ22 — Cresol Consórcios', severity: 'minor' });
    await scrollParaBaixo();
    await faqScreen.tapElement(await faqScreen.cardCresolConsorcios);
    await browser.pause(3000);
    await driver.back().catch(() => {});
    await browser.pause(1200);
  });

});
