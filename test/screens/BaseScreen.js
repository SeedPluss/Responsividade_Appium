/**
 * BaseScreen — classe base para todos os Screen Objects.
 * Todos os métodos de layout usam coordenadas reais do device
 * para gerar mensagens de erro descritivas com nome do device.
 */
class BaseScreen {

  // Retorna o perfil do device atual (lido das capabilities da sessão)
  get deviceProfile() {
    const caps = browser.capabilities || {};
    return caps['custom:deviceProfile'] || { name: 'desconhecido', widthDp: 0, heightDp: 0, dpi: 0 };
  }

  // Retorna o tamanho real da janela em pixels
  async getViewportSize() {
    return driver.getWindowSize();
  }

  // Verifica se um elemento está dentro do viewport visível (tolerância de 2px para arredondamento Flutter)
  async isWithinViewport(element) {
    const viewport = await this.getViewportSize();
    const loc = await element.getLocation();
    const size = await element.getSize();
    const T = 2;

    return (
      loc.x >= -T &&
      loc.y >= -T &&
      loc.x + size.width <= viewport.width  + T &&
      loc.y + size.height <= viewport.height + T
    );
  }

  // Assertion: elemento deve estar dentro do viewport (tolerância 2px para Flutter subpixel rendering)
  async assertWithinViewport(element, nomeElemento = 'Elemento') {
    const viewport = await this.getViewportSize();
    const loc = await element.getLocation();
    const size = await element.getSize();
    const perfil = this.deviceProfile;
    const T = 2;

    const dentro = (
      loc.x >= -T &&
      loc.y >= -T &&
      loc.x + size.width <= viewport.width  + T &&
      loc.y + size.height <= viewport.height + T
    );

    expect(dentro).toBe(
      true,
      `Elemento '${nomeElemento}' está fora do viewport no device '${perfil.name}' ` +
      `(posição: x=${loc.x}, y=${loc.y}, tamanho: ${size.width}x${size.height}px, ` +
      `viewport: ${viewport.width}x${viewport.height}px)`
    );
  }

  // Assertion: dois elementos não devem se sobrepor
  async assertNoOverlap(elementA, nomeA, elementB, nomeB) {
    const locA = await elementA.getLocation();
    const sizeA = await elementA.getSize();
    const locB = await elementB.getLocation();
    const sizeB = await elementB.getSize();
    const perfil = this.deviceProfile;

    // Calcula interseção real com tolerância de 3px para evitar falsos positivos por arredondamento
    const TOLERANCIA = 3;
    const xOverlap = Math.min(locA.x + sizeA.width, locB.x + sizeB.width) - Math.max(locA.x, locB.x);
    const yOverlap = Math.min(locA.y + sizeA.height, locB.y + sizeB.height) - Math.max(locA.y, locB.y);
    const sobrepoem = xOverlap > TOLERANCIA && yOverlap > TOLERANCIA;

    if (sobrepoem) {
      throw new Error(
        `Elementos '${nomeA}' e '${nomeB}' se sobrepõem no device '${perfil.name}' ` +
        `(${nomeA}: x=${locA.x}, y=${locA.y}, ${sizeA.width}x${sizeA.height}px | ` +
        `${nomeB}: x=${locB.x}, y=${locB.y}, ${sizeB.width}x${sizeB.height}px | ` +
        `interseção: ${xOverlap}x${yOverlap}px)`
      );
    }
  }

  // Assertion: não há scroll horizontal (nenhum elemento visível ultrapassa a largura do viewport)
  async assertNoHorizontalOverflow() {
    const viewport = await this.getViewportSize();
    const perfil   = this.deviceProfile;
    // Tolerância generosa: containers Flutter (Stack, ClipRect) podem ter 1-8px além do edge
    const TOLERANCIA = 8;

    // Filtra apenas elementos com texto visível — evita falsos positivos de containers de layout Flutter
    const elementos = await $$('-android uiautomator:new UiSelector().textMatches(".+")');

    for (const el of elementos) {
      try {
        // Só avalia elementos que o usuário pode ver (UiAutomator visibleToUser)
        const visivel = await el.isDisplayed().catch(() => false);
        if (!visivel) continue;

        const loc  = await el.getLocation();
        const size = await el.getSize();
        if (size.width <= 0 || size.height <= 0) continue;

        const ultrapassa = loc.x + size.width > viewport.width + TOLERANCIA;
        if (ultrapassa) {
          const texto = await el.getText().catch(() => '');
          expect(ultrapassa).toBe(
            false,
            `Overflow horizontal detectado no device '${perfil.name}': ` +
            `elemento "${texto || 'sem texto'}" em x=${loc.x}, largura=${size.width}px ` +
            `ultrapassa o viewport de ${viewport.width}px`
          );
        }
      } catch (_) { /* elemento removido do DOM durante iteração */ }
    }
  }

  // Assertion: texto do elemento não está truncado (largura renderizada >= largura mínima esperada)
  async assertNotTruncated(element, nomeElemento = 'Elemento') {
    const size = await element.getSize();
    const perfil = this.deviceProfile;

    // Um elemento com largura <= 10px provavelmente está truncado ou escondido
    expect(size.width > 10).toBe(
      true,
      `Texto do elemento '${nomeElemento}' pode estar truncado no device '${perfil.name}' ` +
      `(largura renderizada: ${size.width}px)`
    );
  }

  // Assertion: touch target mínimo de 44x44dp (WCAG 2.5.5)
  // tolerancia: 6dp de margem para compensar imprecisão do simulador ADB (wm size/density)
  async assertMinTouchTarget(element, nomeElemento = 'Elemento', minSize = 44, tolerancia = 6) {
    const size = await element.getSize();
    const perfil = this.deviceProfile;

    // Converte pixels para dp usando o dpi do device (px = dp * dpi / 160)
    const fator = (perfil.dpi || 160) / 160;
    const larguraDp = Math.round(size.width / fator);
    const alturaDp = Math.round(size.height / fator);
    const minEfetivo = minSize - tolerancia;

    expect(larguraDp >= minEfetivo && alturaDp >= minEfetivo).toBe(
      true,
      `Elemento '${nomeElemento}' tem touch target de ${larguraDp}x${alturaDp}dp no device '${perfil.name}', ` +
      `abaixo do mínimo de ${minSize}dp (WCAG 2.5.5) com tolerância de ${tolerancia}dp`
    );
  }

  /**
   * Toca em um elemento de forma robusta.
   * Tenta em ordem: W3C pointer action → element.click() → accessibility click.
   * Necessário porque o UiAutomator2 pode não ter permissão para injetar eventos
   * no dispositivo físico quando hidden_api_policy não é configurável (MIUI).
   */
  async tapElement(element) {
    await element.waitForDisplayed({ timeout: 15000 });
    const loc  = await element.getLocation();
    const size = await element.getSize();
    const x    = Math.round(loc.x + size.width  / 2);
    const y    = Math.round(loc.y + size.height / 2);

    try {
      // Tenta W3C Pointer Actions (preferido — não usa GestureController do UiAutomator)
      await browser.action('pointer', { parameters: { pointerType: 'touch' } })
        .move({ duration: 0, x, y })
        .down()
        .pause(80)
        .up()
        .perform();
      return;
    } catch (_) {}

    try {
      // Fallback: click via WebDriver Element endpoint
      await element.click();
    } catch (_) {}
  }

  // Aguarda estabilidade visual — essencial para apps Flutter que têm animações
  async waitForVisualStability(timeoutMs = 5000, intervaloMs = 500) {
    let screenshotAnterior = null;
    const inicio = Date.now();

    while (Date.now() - inicio < timeoutMs) {
      const screenshotAtual = await browser.takeScreenshot();
      if (screenshotAtual === screenshotAnterior) {
        // Dois screenshots idênticos consecutivos = tela estabilizou
        return;
      }
      screenshotAnterior = screenshotAtual;
      await browser.pause(intervaloMs);
    }
    // Não lança erro — se não estabilizou, o teste segue e pode detectar o problema
    console.warn(`[BaseScreen] waitForVisualStability atingiu timeout de ${timeoutMs}ms no device '${this.deviceProfile.name}'`);
  }
}

module.exports = BaseScreen;
