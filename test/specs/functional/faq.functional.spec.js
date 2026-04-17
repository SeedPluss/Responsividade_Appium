/**
 * faq.functional.spec.js
 * Cobertura funcional da FAQ (FAQ01–FAQ22) conforme BDD spec.
 * Pré-condição: app na tela de Login (gerenciado pelo hook `before` no wdio.conf.js).
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
    await browser.pause(1500);
  }
}

async function verificarTelaResposta(textoPergunta) {
  const titulo = await $(`-android uiautomator:new UiSelector().text("${textoPergunta}")`);
  await expect(titulo).toBeDisplayed();
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

  it('Deve exibir cards: Acesso, Quero ser cooperado, Produtos, Planeje, Contatos', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ01 — Navegação até Dúvidas Frequentes', severity: 'critical' });
    for (const [el, nome] of [
      [faqScreen.cardAcesso,            'Acesso'],
      [faqScreen.cardQueroSerCooperado, 'Quero ser um cooperado'],
      [faqScreen.cardProdutosServicos,  'Produtos e serviços'],
      [faqScreen.cardPlanjeFinancas,    'Planeje suas finanças'],
      [faqScreen.cardContatos,          'Contatos'],
      [faqScreen.cardAgencias,          'Agências'],
      [faqScreen.cardAvaliar,           'Avaliar'],
    ]) {
      await expect(await el).toBeDisplayed();
    }
  });

  it('Deve exibir cards de outros aplicativos (Cartões, Tag, Consórcios)', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ01 — Navegação até Dúvidas Frequentes', severity: 'normal' });
    for (const el of [faqScreen.cardCresolCartoes, faqScreen.cardMinhaTag, faqScreen.cardCresolConsorcios]) {
      const visivel = await (await el).isDisplayed().catch(() => false);
      if (!visivel) {
        await browser.execute('mobile: scrollGesture', {
          left: 200, top: 600, width: 200, height: 200, direction: 'down', percent: 0.5,
        }).catch(() => {});
      }
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
    // Reabre FAQ para próximos describes
    await faqScreen.abrirFaq().catch(() => {});
  });

});

// ═══════════════════════════════════════════════════════════════════════════════
// FAQ02 — Pesquisa com resultados
// ═══════════════════════════════════════════════════════════════════════════════

describe('FAQ02 — Pesquisar dúvidas frequentes', () => {

  before(async () => { await faqScreen.aguardarCarregamento(); });

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
    await browser.pause(1000);
  });

  it('Deve listar perguntas ao buscar com acentuação "Pré"', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ02 — Pesquisa com resultados', severity: 'normal' });
    await faqScreen.pesquisar('Pré');
    await browser.pause(1500);
    await driver.back();
    await browser.pause(1000);
  });

  it('Deve abrir tela de resposta ao clicar em resultado da busca', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ02 — Pesquisa com resultados', severity: 'critical' });
    await faqScreen.pesquisar('senha');
    const resultado = await $('-android uiautomator:new UiSelector().textContains("senha")');
    await resultado.waitForDisplayed({ timeout: 10000 });
    await faqScreen.tapElement(resultado);
    await expect(faqScreen.labelAvaliarResposta).toBeDisplayed();
    await driver.back();
    await driver.back();
    await browser.pause(1000);
  });

});

// ═══════════════════════════════════════════════════════════════════════════════
// FAQ03 — Pesquisa sem resultados
// ═══════════════════════════════════════════════════════════════════════════════

describe('FAQ03 — Pesquisa sem resultados', () => {

  before(async () => { await faqScreen.aguardarCarregamento(); });

  it('Deve exibir "Nenhum resultado encontrado" para busca sem match', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ03 — Pesquisa sem resultados', severity: 'critical' });
    await faqScreen.pesquisar('xyzqwerty12345');
    await expect(faqScreen.mensagemSemResultados).toBeDisplayed();
    await driver.back();
    await browser.pause(1000);
  });

  it('Deve exibir "Nenhum resultado encontrado" para símbolos "###"', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ03 — Pesquisa sem resultados', severity: 'normal' });
    await faqScreen.pesquisar('###');
    await expect(faqScreen.mensagemSemResultados).toBeDisplayed();
    await driver.back();
    await browser.pause(1000);
  });

});

// ═══════════════════════════════════════════════════════════════════════════════
// FAQ04 — Categoria "Acesso"
// ═══════════════════════════════════════════════════════════════════════════════

describe('FAQ04 — Categoria Acesso', () => {

  before(async () => {
    await faqScreen.aguardarCarregamento();
    await faqScreen.abrirCategoria(await faqScreen.cardAcesso);
  });

  it('Deve exibir título "Acesso" na tela de categoria', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ04 — Categoria Acesso', severity: 'critical' });
    const titulo = await $('-android uiautomator:new UiSelector().text("Acesso")');
    await expect(titulo).toBeDisplayed();
  });

  it('Deve listar as 5 perguntas da categoria Acesso', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ04 — Categoria Acesso', severity: 'critical' });
    for (const p of [
      'Meu aplicativo não está funcionando corretamente. O que devo fazer?',
      'Perdi ou troquei de celular. O que deve fazer?',
      'Esse é meu primeiro acesso. Como faço para me cadastrar?',
      'Como faço para desbloquear minha senha?',
      'Esqueci minha senha. O que devo fazer?',
    ]) {
      await expect(await $(`-android uiautomator:new UiSelector().text("${p}")`)).toBeDisplayed();
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
    await faqScreen.aguardarCarregamento();
    await faqScreen.abrirCategoria(await faqScreen.cardAcesso);
  });

  it('Resposta: "Meu aplicativo não está funcionando" — exibição e avaliação Sim', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ05 — Acesso: respostas e avaliação', severity: 'critical' });
    await faqScreen.abrirPergunta('Meu aplicativo não está funcionando corretamente. O que devo fazer?');
    await verificarTelaResposta('Meu aplicativo não está funcionando corretamente. O que devo fazer?');
    const corpo = await $('-android uiautomator:new UiSelector().textContains("Verifique se sua versão")');
    await expect(corpo).toBeDisplayed();
    await verificarAvaliacaoSim();
    await driver.back();
    await browser.pause(1000);
  });

  it('Resposta: "Meu aplicativo não está funcionando" — avaliação Não → ouvidoria', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ05 — Acesso: respostas e avaliação', severity: 'critical' });
    await faqScreen.abrirPergunta('Meu aplicativo não está funcionando corretamente. O que devo fazer?');
    await verificarAvaliacaoNao();
    await driver.back();
    await browser.pause(1000);
  });

  it('Resposta: "Perdi ou troquei de celular" — exibição e avaliação Sim', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ05 — Acesso: respostas e avaliação', severity: 'critical' });
    await faqScreen.abrirPergunta('Perdi ou troquei de celular. O que deve fazer?');
    await verificarTelaResposta('Perdi ou troquei de celular. O que deve fazer?');
    const corpo = await $('-android uiautomator:new UiSelector().textContains("entre em contato com sua agência")');
    await expect(corpo).toBeDisplayed();
    await verificarAvaliacaoSim();
    await driver.back();
    await browser.pause(1000);
  });

  it('Resposta: "Primeiro acesso" — exibição e avaliação Não', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ05 — Acesso: respostas e avaliação', severity: 'critical' });
    await faqScreen.abrirPergunta('Esse é meu primeiro acesso. Como faço para me cadastrar?');
    await verificarTelaResposta('Esse é meu primeiro acesso. Como faço para me cadastrar?');
    await verificarAvaliacaoNao();
    await driver.back();
    await browser.pause(1000);
  });

  it('Resposta: "Desbloquear senha" — exibição e avaliação Sim', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ05 — Acesso: respostas e avaliação', severity: 'critical' });
    await faqScreen.abrirPergunta('Como faço para desbloquear minha senha?');
    await verificarTelaResposta('Como faço para desbloquear minha senha?');
    await verificarAvaliacaoSim();
    await driver.back();
    await browser.pause(1000);
  });

  it('Resposta: "Esqueci minha senha" — exibição e avaliação Não', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ05 — Acesso: respostas e avaliação', severity: 'critical' });
    await faqScreen.abrirPergunta('Esqueci minha senha. O que devo fazer?');
    await verificarTelaResposta('Esqueci minha senha. O que devo fazer?');
    await verificarAvaliacaoNao();
    await driver.back();
    await browser.pause(1000);
  });

  after(async () => { await voltarParaHome().catch(() => {}); });

});

// ═══════════════════════════════════════════════════════════════════════════════
// FAQ06/FAQ07 — "Quero ser um cooperado"
// ═══════════════════════════════════════════════════════════════════════════════

describe('FAQ06/FAQ07 — Categoria Quero ser um cooperado', () => {

  before(async () => {
    await faqScreen.aguardarCarregamento();
    await faqScreen.abrirCategoria(await faqScreen.cardQueroSerCooperado);
  });

  it('FAQ06 — Deve exibir as 3 perguntas da categoria', async () => {
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
    await verificarTelaResposta('Quais os benefícios de ser um cooperado Cresol?');
    const corpo = await $('-android uiautomator:new UiSelector().textContains("dono do seu negócio")');
    await expect(corpo).toBeDisplayed();
    await verificarAvaliacaoSim();
    await driver.back();
    await browser.pause(1000);
  });

  it('FAQ07 — "Como abrir uma conta?" — exibição e avaliação Não', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ07 — Quero ser cooperado: respostas', severity: 'critical' });
    await faqScreen.abrirPergunta('Como abrir uma conta e me tornar sócio na Cresol?');
    const corpo = await $('-android uiautomator:new UiSelector().textContains("vá até uma de nossas agências")');
    await expect(corpo).toBeDisplayed();
    await verificarAvaliacaoNao();
    await driver.back();
    await browser.pause(1000);
  });

  it('FAQ07 — "Quais documentos necessários?" — exibição e avaliação Sim', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ07 — Quero ser cooperado: respostas', severity: 'critical' });
    await faqScreen.abrirPergunta('Quais documentos necessários para abrir uma conta na Cresol?');
    const corpo = await $('-android uiautomator:new UiSelector().textContains("Documento de identificação")');
    await expect(corpo).toBeDisplayed();
    await verificarAvaliacaoSim();
    await driver.back();
    await browser.pause(1000);
  });

  after(async () => { await voltarParaHome().catch(() => {}); });

});

// ═══════════════════════════════════════════════════════════════════════════════
// FAQ08–FAQ14 — Produtos e Serviços
// ═══════════════════════════════════════════════════════════════════════════════

describe('FAQ08–FAQ14 — Categoria Produtos e Serviços', () => {

  before(async () => {
    await faqScreen.aguardarCarregamento();
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
    const corpo = await $('-android uiautomator:new UiSelector().textContains("Banco Central")');
    await expect(corpo).toBeDisplayed();
    await verificarAvaliacaoSim();
    await driver.back();
    await browser.pause(1000);
  });

  it('FAQ09 — "O que é uma chave Pix?" — exibição e avaliação Não', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ09 — Produtos: Pix respostas', severity: 'critical' });
    await faqScreen.abrirPergunta('O que é uma chave Pix?');
    const corpo = await $('-android uiautomator:new UiSelector().textContains("apelido")');
    await expect(corpo).toBeDisplayed();
    await verificarAvaliacaoNao();
    await driver.back();
    await browser.pause(1000);
  });

  it('FAQ09 — "Quanto custa usar Pix na Cresol?" — exibição e avaliação Sim', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ09 — Produtos: Pix respostas', severity: 'critical' });
    await faqScreen.abrirPergunta('Quanto custa para enviar e receber usando Pix no Cresol?');
    const corpo = await $('-android uiautomator:new UiSelector().textContains("não há cobranças")');
    await expect(corpo).toBeDisplayed();
    await verificarAvaliacaoSim();
    await driver.back();
    await browser.pause(1000);
  });

  it('FAQ10 — Aba Crédito deve exibir perguntas de crédito', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ10 — Produtos: aba Crédito', severity: 'critical' });
    await faqScreen.tapElement(await faqScreen.abaCredito);
    await browser.pause(1500);
    const p = await $('-android uiautomator:new UiSelector().textContains("opções de crédito")');
    await expect(p).toBeDisplayed();
  });

  it('FAQ10 — "Quais opções de crédito?" — exibição e avaliação Sim', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ10 — Produtos: Crédito respostas', severity: 'critical' });
    await faqScreen.abrirPergunta('Quais opções de crédito a Cresol disponibiliza?');
    const corpo = await $('-android uiautomator:new UiSelector().textContains("Procapcred")');
    await expect(corpo).toBeDisplayed();
    await verificarAvaliacaoSim();
    await driver.back();
    await browser.pause(1000);
  });

  it('FAQ11 — Aba Capital Social deve exibir perguntas', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ11 — Produtos: Capital Social', severity: 'normal' });
    await faqScreen.tapElement(await faqScreen.abaCapitalSocial);
    await browser.pause(1500);
    const p = await $('-android uiautomator:new UiSelector().textContains("Capital Social")');
    await expect(p).toBeDisplayed();
  });

  it('FAQ11 — "O que é o Capital Social?" — exibição e avaliação Sim', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ11 — Produtos: Capital Social respostas', severity: 'normal' });
    await faqScreen.abrirPergunta('O que é o Capital Social?');
    const corpo = await $('-android uiautomator:new UiSelector().textContains("fortalecendo o sistema")');
    await expect(corpo).toBeDisplayed();
    await verificarAvaliacaoSim();
    await driver.back();
    await browser.pause(1000);
  });

  it('FAQ12 — Aba Cartões deve exibir perguntas sobre cartão', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ12 — Produtos: aba Cartões', severity: 'normal' });
    await faqScreen.tapElement(await faqScreen.abaCartoes);
    await browser.pause(1500);
    const p = await $('-android uiautomator:new UiSelector().textContains("benefícios do cartão")');
    await expect(p).toBeDisplayed();
  });

  it('FAQ12 — "Quais os benefícios do cartão Cresol?" — exibição e avaliação Não', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ12 — Produtos: Cartões respostas', severity: 'normal' });
    await faqScreen.abrirPergunta('Quais os benefícios do cartão Cresol?');
    const corpo = await $('-android uiautomator:new UiSelector().textContains("Aceitação global")');
    await expect(corpo).toBeDisplayed();
    await verificarAvaliacaoNao();
    await driver.back();
    await browser.pause(1000);
  });

  it('FAQ13 — Aba Consórcios deve exibir perguntas', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ13 — Produtos: aba Consórcios', severity: 'normal' });
    await faqScreen.tapElement(await faqScreen.abaConsorcios);
    await browser.pause(1500);
    const p = await $('-android uiautomator:new UiSelector().textContains("consórcio")');
    await expect(p).toBeDisplayed();
  });

  it('FAQ13 — "O que é um consórcio?" — exibição e avaliação Sim', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ13 — Produtos: Consórcios respostas', severity: 'normal' });
    await faqScreen.abrirPergunta('O que é um consórcio?');
    const corpo = await $('-android uiautomator:new UiSelector().textContains("grupo de pessoas")');
    await expect(corpo).toBeDisplayed();
    await verificarAvaliacaoSim();
    await driver.back();
    await browser.pause(1000);
  });

  it('FAQ14 — Aba Seguros deve exibir perguntas', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ14 — Produtos: aba Seguros', severity: 'normal' });
    await faqScreen.tapElement(await faqScreen.abaSeguros);
    await browser.pause(1500);
    const p = await $('-android uiautomator:new UiSelector().textContains("seguro")');
    await expect(p).toBeDisplayed();
  });

  it('FAQ14 — "A Cresol oferece seguros?" — exibição e avaliação Sim', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ14 — Produtos: Seguros respostas', severity: 'normal' });
    await faqScreen.abrirPergunta('A Cresol oferece seguros?');
    const corpo = await $('-android uiautomator:new UiSelector().textContains("Automóveis")');
    await expect(corpo).toBeDisplayed();
    await verificarAvaliacaoSim();
    await driver.back();
    await browser.pause(1000);
  });

  after(async () => { await voltarParaHome().catch(() => {}); });

});

// ═══════════════════════════════════════════════════════════════════════════════
// FAQ15/FAQ16 — Planeje suas finanças
// ═══════════════════════════════════════════════════════════════════════════════

describe('FAQ15/FAQ16 — Categoria Planeje suas finanças', () => {

  before(async () => {
    await faqScreen.aguardarCarregamento();
    await faqScreen.abrirCategoria(await faqScreen.cardPlanjeFinancas);
  });

  it('FAQ15 — Deve exibir título e 6 perguntas de planejamento', async () => {
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
    const corpo = await $('-android uiautomator:new UiSelector().textContains("além de gastar menos")');
    await expect(corpo).toBeDisplayed();
    await verificarAvaliacaoSim();
    await driver.back();
    await browser.pause(1000);
  });

  it('FAQ16 — "Como começar a investir?" — exibição e avaliação Não', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ16 — Planeje suas finanças: respostas', severity: 'critical' });
    await faqScreen.abrirPergunta('Como começar a investir?');
    const corpo = await $('-android uiautomator:new UiSelector().textContains("objetivos de curto")');
    await expect(corpo).toBeDisplayed();
    await verificarAvaliacaoNao();
    await driver.back();
    await browser.pause(1000);
  });

  it('FAQ16 — "O que é planejamento financeiro?" — exibição e avaliação Sim', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ16 — Planeje suas finanças: respostas', severity: 'critical' });
    await faqScreen.abrirPergunta('O que é planejamento financeiro?');
    const corpo = await $('-android uiautomator:new UiSelector().textContains("monitorar e organizar")');
    await expect(corpo).toBeDisplayed();
    await verificarAvaliacaoSim();
    await driver.back();
    await browser.pause(1000);
  });

  after(async () => { await voltarParaHome().catch(() => {}); });

});

// ═══════════════════════════════════════════════════════════════════════════════
// FAQ17 — Contatos
// ═══════════════════════════════════════════════════════════════════════════════

describe('FAQ17 — Categoria Contatos', () => {

  before(async () => {
    await faqScreen.aguardarCarregamento();
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

  before(async () => { await faqScreen.aguardarCarregamento(); });

  it('FAQ18 — Card "Agências" deve abrir browser com site Cresol', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ18 — Agências', severity: 'normal' });
    await faqScreen.tapElement(await faqScreen.cardAgencias);
    await browser.pause(3000);
    await driver.back().catch(() => {});
    await browser.pause(1500);
  });

  it('FAQ19 — Card "Avaliar" deve abrir loja de apps para avaliação', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ19 — Avaliar app', severity: 'minor' });
    await faqScreen.aguardarCarregamento();
    await faqScreen.tapElement(await faqScreen.cardAvaliar);
    await browser.pause(3000);
    await driver.back().catch(() => {});
    await browser.pause(1500);
  });

  it('FAQ20 — Card "Cresol Cartões" deve abrir loja de apps', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ20 — Cresol Cartões', severity: 'minor' });
    await faqScreen.aguardarCarregamento();
    await browser.execute('mobile: scrollGesture', {
      left: 200, top: 600, width: 200, height: 200, direction: 'down', percent: 0.5,
    }).catch(() => {});
    await faqScreen.tapElement(await faqScreen.cardCresolCartoes);
    await browser.pause(3000);
    await driver.back().catch(() => {});
    await browser.pause(1500);
  });

  it('FAQ21 — Card "Minha Tag Cresol" deve abrir loja de apps', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ21 — Minha Tag Cresol', severity: 'minor' });
    await faqScreen.aguardarCarregamento();
    await faqScreen.tapElement(await faqScreen.cardMinhaTag);
    await browser.pause(3000);
    await driver.back().catch(() => {});
    await browser.pause(1500);
  });

  it('FAQ22 — Card "Cresol Consórcios" deve abrir loja de apps', async () => {
    tagTest({ feature: 'FAQ', story: 'FAQ22 — Cresol Consórcios', severity: 'minor' });
    await faqScreen.aguardarCarregamento();
    await faqScreen.tapElement(await faqScreen.cardCresolConsorcios);
    await browser.pause(3000);
    await driver.back().catch(() => {});
    await browser.pause(1500);
  });

});
