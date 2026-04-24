# Cresol Mobile — Suite de Testes de Responsividade

Automação mobile para o app Cresol (Flutter/Android) usando **WebdriverIO 8 + Appium 2 + UiAutomator2**.  
A suite executa exclusivamente testes de **responsividade** (viewport, overlaps, overflow, touch targets, visual regression) em múltiplos perfis de dispositivo simulados via ADB.

> Os testes funcionais (FAQ, Login) existem em `test/specs/functional/` mas estão **fora da execução padrão** — servem como referência e podem ser rodados pontualmente.

> **Status atual:** testes executam exclusivamente em **dispositivo físico**.  
> Os emuladores Android são bloqueados pelo Dynatrace RASP (`MessageGuardException`) presente no build — ver seção [Limitação: Emuladores](#limitação-emuladores).

---

## Stack Técnica

| Camada              | Tecnologia            | Versão   |
| ------------------- | --------------------- | -------- |
| Runtime             | Node.js               | ≥ 18.0.0 |
| Framework de testes | WebdriverIO           | 8.40.x   |
| Driver mobile       | Appium                | 2.5.4    |
| Driver Android      | UiAutomator2          | 3.10.0   |
| Relatórios          | Allure Report         | 2.29.x   |
| Visual regression   | @wdio/visual-service  | 5.2.x    |
| Linguagem           | JavaScript (CommonJS) | ES2020   |

---

## Pré-requisitos

### Software obrigatório

| Ferramenta                       | Versão mínima | Como verificar     |
| -------------------------------- | ------------- | ------------------ |
| Node.js                          | 18.0.0        | `node --version`   |
| JDK (Java)                       | 11            | `java -version`    |
| Android SDK (via Android Studio) | API 24+       | `adb --version`    |
| Allure CLI (relatórios)          | 2.x           | `allure --version` |

### Variáveis de ambiente do sistema

```bash
# Windows — adicione pelo Painel de Controle → Variáveis de Ambiente
JAVA_HOME=C:\Program Files\Java\jdk-11
ANDROID_HOME=C:\Users\<user>\AppData\Local\Android\Sdk

# PATH deve conter:
%ANDROID_HOME%\platform-tools        # adb
%ANDROID_HOME%\emulator              # emulator (binário real — não tools\emulator)
%ANDROID_HOME%\cmdline-tools\latest\bin  # sdkmanager, avdmanager
```

---

## Configuração do Ambiente

### 1. Clonar o repositório

```bash
git clone https://github.com/SeedPluss/Responsividade_Appium.git
cd Responsividade_Appium
```

### 2. Instalar dependências

```bash
npm install
```

> O Appium e o driver UiAutomator2 são instalados localmente em `node_modules` — não requerem instalação global.

### 3. Adicionar o APK

Coloque o arquivo `.apk` na raiz do projeto ou em `config/`:

```
automacao/
  app.apk       ← raiz (preferencial)
  config/
    app.apk     ← alternativa
```

O `config/devices.js` detecta automaticamente via `path.resolve` — sem erros de caminho relativo.

### 4. Conectar o dispositivo físico

- Ativar **Depuração USB**: Configurações → Opções do desenvolvedor → Depuração USB
- Redmi/MIUI: ativar também **Depuração USB (configurações de segurança)**
- Confirmar: `adb devices` deve listar o device com status `device`

### 5. Variáveis de ambiente (opcional)

```env
# DEVICE_FILTER: physical | standard | large | all (padrão: physical)
DEVICE_FILTER=physical

# Atualiza baselines visuais em vez de comparar
VISUAL_UPDATE=false
```

---

## Matriz de Dispositivos

### Estratégia: simulação de tela via ADB no dispositivo físico

O Dynatrace RASP embutido no app impede execução em emuladores (ver [Limitação: Emuladores](#limitação-emuladores)).  
A solução adotada é rodar **todas as sessões no mesmo dispositivo físico**, alterando a resolução e a densidade via ADB antes de cada sessão:

```bash
adb shell wm size 1080x1920   # redefine resolução
adb shell wm density 420      # redefine DPI
```

O hook `beforeSession` aplica o resize; o `afterSession` restaura os valores originais (`wm size reset` + `wm density reset`).  
Assim um único celular simula três classes de ecrã sem precisar de múltiplos aparelhos.

---

### Perfis ativos na suite

Cálculo: `px = dp × dpi / 160`

| Perfil     | Referência simulada       | dp (L × A)   | DPI | Resolução física   | Uso típico                                                                                                 |
| ---------- | ------------------------- | ------------ | --- | ------------------ | ---------------------------------------------------------------------------------------------------------- |
| `compact`  | Nexus 5X / iPhone SE      | 411 × 731 dp | 420 | **1080 × 1920 px** | Celulares compactos e com 3–4 anos de uso — menor viewport disponível que ainda tem market share relevante |
| `standard` | Pixel 6 / Galaxy A54      | 411 × 915 dp | 411 | **1080 × 2400 px** | Linha mid-range atual — proporção 20:9 que domina o mercado brasileiro em 2024–2025                        |
| `large`    | Pixel 7 Pro / Galaxy S23+ | 412 × 892 dp | 560 | **1440 × 3120 px** | High-end com alta densidade — estresa padding, tamanhos de fonte e touch targets em DPI elevado            |

> **Por que esses três?** Cobrem os extremos de viewport disponível (731 dp vs 915 dp de altura) e os extremos de densidade (411 vs 560 dpi). Um layout que passa em `compact` e `large` tem alta probabilidade de passar nos devices intermediários.

---

### Outros perfis que valem investigar

Os perfis abaixo não estão ativos mas cobrem cenários reais que o conjunto atual não testa:

| Perfil candidato           | Referência                | dp (L × A)    | DPI              | Resolução      | Justificativa                                                                                                                                                 |
| -------------------------- | ------------------------- | ------------- | ---------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `foldable_folded`          | Galaxy Z Fold 5 (dobrado) | 373 × 820 dp  | 402              | 904 × 2176 px  | Viewport de **373 dp de largura** — o mais estreito do mercado atual. Expõe layouts que assumem mínimo de 411 dp                                              |
| `foldable_unfolded`        | Galaxy Z Fold 5 (aberto)  | 882 × 820 dp  | 373              | 1812 × 1848 px | Proporção quase quadrada (1:1) — testa se o Flutter redimensiona a UI ou exibe com muito espaço vazio                                                         |
| `tablet_small`             | Galaxy Tab A8             | 800 × 1280 dp | 160              | 1280 × 2048 px | Tablet de entrada — DPI baixíssimo (160) significa que 44 dp = exatamente 44 px. Touch targets ficam muito menores em px absolutos                            |
| `accessibility_large_text` | Qualquer device           | 411 × 731 dp  | 420 + fonte 200% | 1080 × 1920 px | Mesmo perfil `compact`, mas com `adb shell settings put system font_scale 2.0`. Testa truncamento de texto quando usuário usa fonte grande por acessibilidade |

Para adicionar um perfil, basta incluí-lo no array `PERFIS_TELA` em `config/devices.js` e executar com `DEVICE_FILTER=<nome>`.

---

### Dispositivo físico (tela original)

| Campo     | Valor                                  |
| --------- | -------------------------------------- |
| Detecção  | Automática via `adb devices`           |
| `noReset` | `true` — preserva estado entre sessões |
| Filtro    | `DEVICE_FILTER=physical`               |

### Ordem de execução na suite completa (`DEVICE_FILTER=all`)

```
compact → standard → large
```

---

## Dados do App

| Campo      | Valor                                    |
| ---------- | ---------------------------------------- |
| Package    | `br.com.confesol.ib.cresol`              |
| Activity   | `br.com.confesol.ib.cresol.MainActivity` |
| Min SDK    | 24 (Android 7.0)                         |
| Plataforma | Flutter (Android)                        |

---

## Guia de Execução

### Iniciar o servidor Appium (terminal separado)

> Normalmente **não é necessário** — o WDIO sobe e encerra o Appium automaticamente.  
> Use apenas para depuração manual ou Appium Inspector.

```bash
npm run appium
# Com Appium Inspector:
npm run appium:inspector
```

### Rodar os testes

| Comando                 | Perfis executados          | Specs                            |
| ----------------------- | -------------------------- | -------------------------------- |
| `npm test`              | compact → standard → large | todos os specs de responsividade |
| `npm run test:all`      | compact → standard → large | todos os specs de responsividade |
| `npm run test:physical` | tela original do device    | todos os specs de responsividade |
| `npm run test:compact`  | só compact (1080×1920)     | todos os specs de responsividade |
| `npm run test:standard` | só standard (1080×2400)    | todos os specs de responsividade |
| `npm run test:large`    | só large (1440×3120)       | todos os specs de responsividade |
| `npm run test:faq`      | compact → standard → large | `faq.responsive.spec.js`         |
| `npm run test:login`    | compact → standard → large | `login.responsive.spec.js`       |
| `npm run test:debug`    | só standard + `--inspect`  | todos os specs de responsividade |

### Relatório Allure

```bash
npm run report:generate   # gera HTML a partir dos resultados
npm run report:open       # abre no browser
npm run report            # gera + abre
```

> `allure-results/` é **limpo automaticamente** antes de cada execução.  
> O relatório inclui: dispositivo, resolução, SDK Android, executor e data da run.

### Atualizar baselines visuais

```bash
npm run baseline:update
```

---

## Estrutura do Projeto

```
automacao/
├── config/
│   ├── devices.js              # Perfis de tela ADB (compact, standard, large, physical)
│   └── setup-emulators.js      # Script de criação de AVDs (suspenso — Dynatrace RASP)
│
├── test/
│   ├── screens/                # Screen Objects (Page Object Model)
│   │   ├── BaseScreen.js       # Assertions de layout reutilizáveis (viewport, overlap, overflow, touch target)
│   │   ├── LoginScreen.js      # Seletores e ações da tela de Login
│   │   └── FaqScreen.js        # Seletores e ações da tela de FAQ
│   │
│   ├── specs/
│   │   ├── responsiveness/     # ← specs em execução
│   │   │   ├── login.responsive.spec.js   # Responsividade da tela de Login
│   │   │   └── faq.responsive.spec.js     # Responsividade da tela de FAQ
│   │   └── functional/         # ← fora da execução padrão (referência)
│   │       └── faq.functional.spec.js     # Cenários funcionais FAQ01–FAQ22
│   │
│   └── utils/
│       ├── allure-helper.js     # tagTest() — feature, story, severity por cenário
│       ├── layout-assertions.js # assertAllElementsInViewport(), assertNoOverlaps(), assertScreenIntegrity()
│       └── visual-helpers.js    # salvarScreenshotVisual() — baseline e comparação
│
├── screenshots/
│   ├── baseline/               # Imagens de referência para visual regression
│   └── actual/                 # Capturas da última execução (gerado — não commitar)
│
├── allure-results/             # Resultados brutos JSON (gerado — não commitar)
├── allure-report/              # Relatório HTML (gerado — não commitar)
├── wdio.conf.js                # Configuração central: capabilities, hooks Allure, perfis ADB
└── package.json
```

---

## Por que validamos responsividade com esses asserts?

Apps Flutter compilam a UI em um canvas nativo — nenhum browser engine intervém para reorganizar o layout.  
Isso significa que se um widget for posicionado errado, truncado ou pequeno demais, **o app simplesmente exibe assim**, sem reclamar.  
Um `toBeDisplayed()` comum passa mesmo quando o elemento está fora da tela ou sobreposto por outro.

Os cinco tipos de assertion que a suite usa cobrem as falhas reais que um olho humano perceberia em um dispositivo:

### Viewport (`assertWithinViewport`)

Garante que um elemento está **inteiramente dentro da área visível** da tela, sem estar cortado pela borda ou escondido além do fold.  
Sem isso, um botão pode estar na árvore de acessibilidade (portanto "existente") mas fora do alcance do usuário.  
Usa tolerância de 2 px para absorver o subpixel rendering do Flutter.

### Overlaps (`assertNoOverlap`)

Verifica que dois elementos **não se sobrepõem**. Em telas compactas, widgets com posicionamento absoluto ou padding reduzido podem colidir — o conteúdo de um encobre o outro.  
A assertion calcula a área de interseção real e aplica tolerância de 3 px para evitar falsos positivos de arredondamento.

### Overflow (`assertNoHorizontalOverflow`)

Detecta **scroll horizontal não intencional**: qualquer elemento com texto visível cujo limite direito ultrapassa a largura da tela indica que o layout "vazou".  
Filtrar apenas elementos com texto evita falsos positivos de containers Flutter (Stack, ClipRect) que tecnicamente extrapolam a viewport mas são clippados visualmente.

### Touch Targets (`assertMinTouchTarget`)

Confirma que elementos interativos têm **pelo menos 44 × 44 dp** de área tocável, o mínimo exigido pela WCAG 2.5.5.  
Em telas com alta densidade (420 dpi), 44 dp = 115 px — fácil de errar em layouts que especificam tamanhos em px fixos.  
O assert converte pixels para dp usando o DPI real do device e aplica tolerância de 6 dp para compensar a imprecisão do resize ADB.

### Visual Regression (`salvarScreenshotVisual`)

Captura um **screenshot de referência (baseline)** na primeira execução e, nas seguintes, compara pixel a pixel.  
Qualquer mudança visual — reposicionamento, cor, fonte, ícone alterado — é detectada mesmo que todos os asserts acima passem.  
Usa `@wdio/visual-service` com threshold configurável (padrão 0,5 % de diferença tolerada).

---

## Arquitetura de Testes

### Page Object Model (POM)

| Método (`BaseScreen`)                     | Descrição                                                      |
| ----------------------------------------- | -------------------------------------------------------------- |
| `assertWithinViewport(el, nome)`          | Elemento dentro do viewport (tolerância 2px Flutter)           |
| `assertNoHorizontalOverflow()`            | Sem scroll horizontal — analisa só elementos com texto visível |
| `assertNoOverlap(elA, nomeA, elB, nomeB)` | Sem sobreposição entre elementos (tolerância 3px)              |
| `assertMinTouchTarget(el, nome, minDp)`   | Touch target ≥ 44dp (WCAG 2.5.5)                               |
| `assertNotTruncated(el, nome)`            | Elemento não está com largura colapsada                        |
| `tapElement(el)`                          | W3C pointer action → element.click()                           |
| `waitForVisualStability(ms)`              | Aguarda animações Flutter terminarem                           |

### Fluxo de execução

```
wdio.conf.js before()
  └── Loop back() → login (máx 8×)
        └── spec before() → abrirFaq() / aguardarCarregamento()
              └── it() → assertion
                    └── afterTest() → screenshot de falha no Allure
```

---

## Limitação: Emuladores

O app usa **Dynatrace Mobile Agent com RASP (Runtime Application Self-Protection)** ativado.  
No boot do app (`Application.onCreate`), o agente detecta propriedades exclusivas de emulador e encerra o processo:

```
E AndroidRuntime: com.dynatrace.android.app.MessageGuardException
E AndroidRuntime:   at com.dynatrace.android.app.ProtectedApplication.onCreate
W fesol.ib.cresol: avc: denied { read } for userdebug_or_eng_prop
```

## Troubleshooting

### `adb devices` não mostra o dispositivo

```bash
adb kill-server && adb start-server && adb devices
```

### Appium não sobe na porta 4723

```bash
netstat -ano | findstr :4723
taskkill /PID <pid> /F
```

### Emulador trava no boot

O binário real do emulador está em `Sdk/emulator/` — não em `Sdk/tools/emulator` (stub legado).  
O `wdio.conf.js` já injeta o caminho correto automaticamente via `env` do serviço Appium.

```bash
# Verificar AVDs disponíveis
"$ANDROID_HOME/emulator/emulator" -list-avds
```

### App não abre no emulador

Ver seção [Limitação: Emuladores](#limitação-emuladores).

### Testes falham por estado incorreto do app

```bash
adb shell pm clear br.com.confesol.ib.cresol
```

---

## Contribuindo

1. Novos Screen Objects devem estender `BaseScreen`
2. Seletores: priorizar `resourceId`, usar `text()` só como fallback
3. Assertions de posição/layout: usar métodos de `BaseScreen`, não `toBeDisplayed()` puro
4. Rodar `npm test` localmente antes de abrir PR (suite completa, 3 perfis)
5. Novos specs de responsividade vão em `test/specs/responsiveness/` — specs fora dessa pasta não são executados pela suite padrão
