/**
 * layout-assertions.js
 * Funções reutilizáveis de assertion de layout para testes de responsividade.
 * Todas as funções recebem uma instância de Screen Object (que estende BaseScreen).
 */

/**
 * Valida que TODOS os elementos de screenElements estão dentro do viewport visível.
 * @param {BaseScreen} screen — instância do Screen Object
 */
async function assertAllElementsInViewport(screen) {
  for (const { name, element } of screen.screenElements) {
    await screen.assertWithinViewport(await element, name);
  }
}

/**
 * Valida que nenhum par de elementos em screenElements se sobrepõe.
 * Compara todos os pares únicos (combinação 2 a 2).
 * @param {BaseScreen} screen — instância do Screen Object
 */
async function assertNoOverlaps(screen) {
  const elementos = screen.screenElements;

  for (let i = 0; i < elementos.length; i++) {
    for (let j = i + 1; j < elementos.length; j++) {
      const elA = await elementos[i].element;
      const elB = await elementos[j].element;

      // Verifica se ambos estão visíveis antes de checar sobreposição
      const aVisivel = await elA.isDisplayed().catch(() => false);
      const bVisivel = await elB.isDisplayed().catch(() => false);

      if (aVisivel && bVisivel) {
        await screen.assertNoOverlap(elA, elementos[i].name, elB, elementos[j].name);
      }
    }
  }
}

/**
 * Valida os touch targets mínimos (44dp — WCAG 2.5.5) de todos os elementos interativos.
 * @param {BaseScreen} screen — instância do Screen Object
 * @param {number} minDp — tamanho mínimo em dp (padrão: 44)
 */
async function assertTouchTargets(screen, minDp = 44) {
  for (const { name, element } of screen.screenElements) {
    const el = await element;
    const visivel = await el.isDisplayed().catch(() => false);
    if (visivel) {
      await screen.assertMinTouchTarget(el, name, minDp);
    }
  }
}

/**
 * Valida a integridade completa de uma tela.
 * Combina todas as assertions em uma única chamada.
 * @param {BaseScreen} screen — instância do Screen Object
 */
async function assertScreenIntegrity(screen) {
  await assertAllElementsInViewport(screen);
  await assertNoOverlaps(screen);
  await screen.assertNoHorizontalOverflow();
  await assertTouchTargets(screen);
}

module.exports = {
  assertAllElementsInViewport,
  assertNoOverlaps,
  assertScreenIntegrity,
};
