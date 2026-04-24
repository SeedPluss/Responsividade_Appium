# Cresol Mobile — Suite de Testes de Responsividade e Funcional

Automação mobile para o app Cresol (Flutter/Android) usando **WebdriverIO 8 + Appium 2 + UiAutomator2**.  
Cobre testes de **responsividade** (viewport, overlaps, overflow, touch targets, visual regression) e **funcionais** (FAQ, Login) em múltiplos perfis de dispositivo.

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
git clone https://github.com/SeedPluss/Responsividade_Appium_ClaudeMCP.git
cd Responsividade_Appium_ClaudeMCP
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

### Dispositivo físico (execução padrão)

| Campo         | Valor                                  |
| ------------- | -------------------------------------- |
| Detecção      | Automática via `adb devices`           |
| `noReset`     | `true` — preserva estado entre sessões |
| Pré-requisito | USB + depuração ativa                  |

### Emuladores (AVD) — suspenso

> O app não executa em emuladores no build atual devido ao Dynatrace RASP.  
> Os AVDs estão configurados e prontos para quando um build de QA sem proteção for disponibilizado.

| Perfil     | AVD Name        | Resolução (dp) | DPI | Device  |
| ---------- | --------------- | -------------- | --- | ------- |
| `standard` | `resp_standard` | 411 × 915 dp   | 411 | Pixel 6 |
| `large`    | `resp_large`    | 412 × 892 dp   | 560 | Pixel 5 |

Para recriar os AVDs:

```bash
npm run setup:emulators
```

### Ordem de execução na suite completa (`DEVICE_FILTER=all`)

```
standard → large → físico
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

| Comando                       | Dispositivos              | Specs               |
| ----------------------------- | ------------------------- | ------------------- |
| `npm test`                    | físico                    | todos               |
| `npm run test:all`            | standard → large → físico | todos               |
| `npm run test:physical`       | só físico                 | todos               |
| `npm run test:standard`       | só standard               | todos               |
| `npm run test:large`          | só large                  | todos               |
| `npm run test:responsive`     | standard → large → físico | responsividade      |
| `npm run test:faq`            | só físico                 | FAQ funcional       |
| `npm run test:faq:responsive` | só físico                 | FAQ responsividade  |
| `npm run test:debug`          | standard                  | todos + `--inspect` |

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
│   ├── devices.js              # Matriz de capabilities (emuladores + físico)
│   └── setup-emulators.js      # Script de criação dos AVDs
│
├── test/
│   ├── screens/                # Page Objects (Screen Objects)
│   │   ├── BaseScreen.js       # Assertions de layout, tapElement, waitForVisualStability
│   │   ├── LoginScreen.js      # Tela de login
│   │   ├── FaqScreen.js        # Tela de FAQ
│   │   └── ExtratoScreen.js    # Tela de extrato
│   │
│   ├── specs/
│   │   ├── functional/
│   │   │   └── faq.functional.spec.js   # FAQ01–FAQ22
│   │   └── responsiveness/
│   │       ├── login.responsive.spec.js
│   │       └── faq.responsive.spec.js
│   │
│   └── utils/
│       ├── allure-helper.js     # tagTest(), anexarScreenshot()
│       ├── layout-assertions.js # assertAllElementsInViewport(), assertNoOverlaps()
│       └── visual-helpers.js    # aguardarEstabilidadeVisual(), salvarScreenshotVisual()
│
├── screenshots/
│   ├── baseline/               # Referências para visual regression
│   └── actual/                 # Capturas da última execução
│
├── allure-results/             # Resultados brutos (não comitar)
├── allure-report/              # Relatório HTML gerado
├── wdio.conf.js                # Configuração WDIO (capabilities, hooks, Allure, Appium)
└── package.json
```

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
4. Rodar `npm run test:faq` localmente antes de abrir PR
