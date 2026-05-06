# 🎬 Demo Class Script — App Registration TFTEC Masters

> **Roteiro EXATO de 2h pra condução manual sem AI durante aula.**
> Cada cena tem: tempo, slides, falas sugeridas, ações Portal Azure step-by-step, perguntas pros alunos, troubleshooting.

**Data:** 2026-04-29 às 20h
**Audiência:** TFTEC Masters
**Sistema-base:** `tftec-auth` (https://github.com/tftec-guilherme/entra-auth-gateway)

---

## 📋 Pré-aula — Checklist 15min antes (19:45)

### 🖥️ Setup do projetor
- [ ] Resolução do projetor 1920x1080 (OK pra slides Marp 22pt)
- [ ] Browser com 4 abas pré-abertas:
  1. `https://github.com/tftec-guilherme/entra-auth-gateway` (repo)
  2. `https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade` (App Registrations)
  3. `https://authservice-front-tftec.azurewebsites.net/` (frontend live)
  4. `https://jwt.ms/` (decoder)
- [ ] VS Code aberto com extensão **Marp for VS Code** instalada → `docs/aula/slides.md` em modo preview
- [ ] Terminal/PowerShell aberto em `C:\Projetos\tftec-auth`

### 🔐 Confirmar credenciais ativas
- [ ] `az account show` → Tenant TFTEC, sub correta
- [ ] Login no Portal Azure como admin (você)
- [ ] App Registration `tftec-auth` (`78345291-2586-4691-b1f9-e4e780f55328`) acessível

### 📄 Materiais de apoio impressos / em outra tela
- [ ] `docs/aula/cheat-sheet.md` (1 página, deixe ao lado)
- [ ] `docs/aula/glossario.md` (caso aluno pergunte termo)
- [ ] Lista de Client IDs dos alunos (se eles vão criar App Reg novas — mantém pra debug)

### ⚠️ Plano B se algo quebrar
- Frontend HTTP 502: usar `https://authservice-api-tftec.azurewebsites.net/swagger` direto pra demonstrar API
- Portal lento: pre-record screencasts curtos das ações (tem nas notas de cada cena)
- Sua App Reg deletada por acidente: tenha o `tftec-auth-DEMO-BACKUP` pré-criada

---

## ⏱️ Timeline Resumido

| # | Cena | Min | Slides | Estilo |
|---|------|-----|--------|--------|
| 1 | Hook | 0–5 | 1–4 | 🎤 Provocação |
| 2 | Big Picture | 5–15 | 5–10 | 📊 Conceitos |
| 3 | First Aha (LIVE DEMO) | 15–25 | 11–13 | 🎬 Portal hands-on |
| 4 | Hands-On Lab 1 | 25–50 | 14–15 | 🛠️ Alunos práticam |
| 5 | Deep Dive Teórico | 50–65 | 16–20 | 🔬 Profundo |
| 6 | Hands-On Lab 2 | 65–90 | 21–23 | 🚀 Alunos integram |
| 7 | Troubleshooting LIVE | 90–105 | 24–26 | 🔧 Quebra ao vivo |
| 8 | Synthesis & Q&A | 105–120 | 27–30 | 🎯 Recap |

---

## 🎬 Cena 1 — Hook (0–5min)

### 📺 Mostra
Slide 1 → "App Registration na prática"

### 🎤 Fala (literal)
> "Boa noite pessoal. Hoje vamos resolver um inimigo que TODO desenvolvedor que mexe com Microsoft odeia: **erros AADSTS**. Quem aqui já viu isso na vida?"

**[Pausa. Espera mãos levantando.]**

> "Levanta a mão quem já apanhou bonito de redirect URI mismatch."
> "Quem nunca conseguiu fazer um login Microsoft funcionar e xingou o Azure?"

### 📺 Mostra
Slides 2–4 (lista de erros AADSTS comuns)

### 🎤 Fala
> "Hoje, em 2 horas, vc vai sair sabendo decodificar TODOS esses erros. E o melhor: vc vai entender **POR QUE** eles existem. Não é decoreba — é entender a lógica do Entra ID."

> "A gente vai usar um sistema REAL em produção (`tftec-auth`), criado por mim, como nosso laboratório. Ao final, vc vai conseguir criar sua própria App Registration, integrar com uma API .NET, e ainda demonstrar isso pra outras pessoas."

### ❓ Pergunta pros alunos
"Antes de continuar — quem aqui já criou uma App Registration antes? E quem nunca tinha ouvido esse nome?"

**[Anotar mentalmente o nível da turma. Se 80%+ nunca criou: foque mais em Cena 2. Se já criaram: acelere e foque Cenas 5–7.]**

---

## 🌍 Cena 2 — Big Picture (5–15min)

### 📺 Mostra
Slides 5–6 — "Identidade ≠ Autenticação ≠ Autorização" + tabela

### 🎤 Fala
> "Vamos partir do início. Vou explicar 3 conceitos que TODO mundo confunde."

> "**Identidade** responde 'QUEM é vc'. Por exemplo: meu email guilherme@tftec.com.br é minha identidade."

> "**Autenticação** responde 'VC É MESMO QUEM DIZ?' É como vc PROVA que é vc. Senha + MFA."

> "**Autorização** responde 'O QUE VC PODE FAZER?' Ex: ser admin do tenant ou só user comum."

> "Microsoft Entra ID lida com os 3. E **App Registration** é o contrato entre sua aplicação e o Entra ID — diz quem pode entrar, o que pode pedir, e como vai provar quem é."

### 📺 Mostra
Slide 7 — "Application Object vs Service Principal"

### 🎤 Fala
> "Aqui é onde 90% dos devs se enrolam. App Registration tem DUAS partes:"

> "**Application Object** é o BLUEPRINT, o template. Vive no tenant onde foi criado."

> "**Service Principal** é a INSTÂNCIA dele em cada tenant onde o app é usado."

> "Multi-tenant? 1 App Object + N Service Principals. Pensa em classe (App Object) e objeto (SP)."

### 📺 Mostra
Slide 8 — Mermaid diagram (arquitetura macro)

### 🎤 Fala
> "Esse diagrama vc vai ver em TODA aplicação corporativa Microsoft que vc tocar nos próximos 10 anos."

> "Tem 3 atores: **Frontend**, **Entra ID**, **API Backend**. Hoje vamos fazer cada conexão funcionar manualmente."

### 📺 Mostra
Slides 9–10 — "Quem precisa de App Registration?"

### 🎤 Fala
> "Tudo precisa: SPA, API, worker, CI/CD. Cada um com permissions diferentes."

> "No `tftec-auth` tenho 2 App Regs: uma pro app (`tftec-auth`) e outra pro deploy do CI/CD (`sp-tftec-authsvc-cicd-001`). Vou mostrar as 2 já já."

### ❓ Pergunta
"Alguém usa Service Principal pra deploy automatizado? Quem usa GitHub Actions?"

---

## ✨ Cena 3 — First Aha LIVE DEMO (15–25min)

> ⚠️ **ESSA É A CENA MAIS CRÍTICA.** Vc cria uma App Reg DO ZERO ao vivo. Os alunos só observam. **NÃO MEXAM AINDA.**

### 📺 Mostra
Slide 11 — "Os 7 campos que importam"

### 🎤 Fala
> "Antes de eu criar, deixa eu te mostrar OS 7 CAMPOS que importam. Quando vc clica em 'New registration', preenche 4. Mais 3 aparecem depois."

> "**Name** é cosmético. **Account types** é a decisão IMPOSSÍVEL de trocar. **Redirect URI** tem 2 partes: tipo (SPA/Web/Public) e value."

### 📺 Mostra
Slide 12 — "Decisão crítica: Account types"

### 🎤 Fala
> "Single tenant é só sua org. **Multi-tenant aceita qualquer org Entra ID** — é o que SaaS B2B usa. Hoje vamos com Multi-tenant."

> "Se vc trocar single→multi DEPOIS de criar, **PODE QUEBRAR tokens cached, redirect URIs e Audience claim**. Eu já apanhei 2x. Decida no day 1."

### 🖱️ AÇÃO PORTAL — DEMO LIVE

**Vai pro Portal aberto na aba 2:**

1. **Microsoft Entra ID** (na barra de busca top → digite "Entra ID" → Enter)
2. Menu lateral esquerdo → **App registrations**
3. Click **+ New registration** (botão azul topo)
4. Preencha NA FRENTE DOS ALUNOS, narrando:
   - **Name**: `AUTH_AULA_DEMO_<sua-data>` ← "deixa um sufixo único pra não confundir com outras App Regs"
   - **Supported account types**: clique em **Accounts in any organizational directory (Multitenant)** ← "agora é multi-tenant"
   - **Redirect URI**:
     - Platform dropdown → **Single-page application (SPA)** ← "PKCE-friendly"
     - URI → `http://localhost:5173` ← "endereço do dev local"
5. Click **Register**

### 🎤 Fala enquanto carrega
> "Pronto. Em 30 segundos eu criei a identidade do app. Vamos ver o que apareceu."

### 🖱️ AÇÃO — após criar

6. **Overview** já abre. Aponta:
   - **Application (client) ID** ← "esse vai no código como `clientId`"
   - **Directory (tenant) ID** ← "vai no `tenantId` ou `authority`"
7. Click **Endpoints** (botão no topo do Overview) → mostra:
   - OAuth 2.0 authorization endpoint (v2)
   - OAuth 2.0 token endpoint (v2)
   - OpenID Connect metadata document
   > "Esses são os endpoints do Entra ID que sua app vai falar."

### ❓ Pergunta
"Algum aluno consegue me dizer pra que serve cada um desses endpoints só pelo nome?"

**[Espera resposta. Preencher gaps com explicação dos slides.]**

---

## 🛠️ Cena 4 — Hands-On Lab 1 (25–50min)

> **ALUNOS FAZEM. Você circula. Travados? Levanta a mão.**

### 📺 Mostra
Slides 14–15 (Lab 1 checklist)

### 🎤 Fala
> "Agora é a sua vez. Vc tem 25 minutos. Cada um cria sua **AUTH_<seu-nome>**. Vou ficar circulando, qualquer dúvida levanta a mão."

> "O guia completo passo-a-passo está em **`docs/guides/app-registration-setup.md`** no repositório. Abra agora no GitHub: `github.com/tftec-guilherme/entra-auth-gateway`."

### 📋 Checklist projetado (Slide 15)

```
□ §1 Criar registration (Name + Multi-tenant + SPA localhost:5173)
□ §2 Authentication — adicionar:
    https://authservice-front-tftec.azurewebsites.net
□ §3 API permissions → Microsoft Graph (Delegated):
    User.Read, User.ReadWrite.All, Directory.ReadWrite.All
    Application.Read.All, Application.ReadWrite.All, AuditLog.Read.All
□ Grant admin consent
□ §4 Client Secret — 12 meses, COPIAR VALUE
□ §5 Expose API → api://<client-id> + scope access_as_user
```

### 🎤 Durante o lab — Pontos de circulação
A cada 5min, lance um lembrete:

**5min:** "Pessoal, na cena 1, depois de Register, **NÃO esqueçam de copiar o Client ID e Tenant ID**."

**10min:** "Quem chegou em Authentication tab? Lembrem que Web e SPA são plataformas DIFERENTES. Use SPA pra MSAL.js."

**15min:** "Em API permissions, depois de adicionar todas, **clica em 'Grant admin consent for TFTEC'** — botão verde. Sem isso, login não funciona."

**20min:** "Em Client secret, **copia o VALUE imediatamente**. Se vc fechar a página, ele some, e vc precisa criar de novo."

**25min:** "Termina aí, pessoal. Todo mundo na tabela do quadro?"

### ❓ Validação final (3min)
Peça pra cada aluno preencher no quadro/chat:
| Aluno | Client ID | Tenant ID | Audience URI |
|-------|-----------|-----------|--------------|
| João  | xxxx-...  | 5e0359c1-... | api://xxxx-... |

> Isso valida que cada um tem os 3 valores principais. Se faltam, identifica gap rapidamente.

---

## 🔬 Cena 5 — Deep Dive Teórico (50–65min) — usando `/lab/*`

> 🆕 **MUDANÇA IMPORTANTE:** O `tftec-auth` tem uma seção `/lab/*` com **JWT Decoder, Sequence Player animado e Demo interativa**. Use isso em vez de jwt.ms externo + slides estáticos.

### 🎤 Abertura
> "Agora vou abrir o **Laboratório do tftec-auth**. Acessa `/lab` na URL do frontend. Vc vai ver tudo que vamos discutir, dentro do próprio app."

### 🖱️ AÇÃO LIVE — Navegar pra `/lab/fluxos` → tab **Auth Code + PKCE**

URL: `https://authservice-front-tftec.azurewebsites.net/lab/fluxos`

> "Olha esse simulador animado. Click ▶ pra reproduzir."

1. Click ▶ Reproduzir
2. Animação roda step-by-step (~2.2s por passo, 9 passos = ~20s)
3. Painel lateral mostra título + descrição de cada passo

### 🎤 Narrar enquanto anima
**Step 1 (Início):**
> "SPA detecta sessão ausente — primeiro hit no app, sem cookie."

**Step 2 (/authorize com code_challenge):**
> "AQUI tá a mágica do PKCE. SPA gera um `code_verifier` random local — 43-128 chars — e envia o `code_challenge = SHA256(verifier)`. Entra ID NÃO recebe o verifier. Recebe só o hash."

**Step 3 (Tela de login):**
> "Microsoft hospeda. Sua app NUNCA vê senha. Isso é OAuth — delegação."

**Step 4 (Usuário autentica):**
> "Senha + MFA conforme Conditional Access do tenant."

**Step 5 (Code retorna):**
> "Code é single-use, expira em ~10min. É só uma 'permissão pra pedir token'."

**Step 6 (/token com verifier):**
> "AGORA SPA envia o verifier ORIGINAL. Entra ID compara: SHA256(verifier) == challenge guardado?"

**Step 7 (Tokens emitidos):**
> "id_token + access_token + refresh_token. Veremos a diferença em 5min."

**Step 8 (Bearer):**
> "Header `Authorization: Bearer <access_token>`."

**Step 9 (API responde):**
> "API valida JWT contra JWKS público do Entra ID."

### 🎤 Fechamento PKCE
> "Sem PKCE: token vai pela URL, fica em browser history. Vulnerável."
> "Com PKCE: mesmo se alguém roubar o code, NÃO consegue trocar por token sem o verifier que tá SÓ no browser. **PKCE é obrigatório pra SPA desde OAuth 2.1.**"

---

### 🖱️ AÇÃO LIVE — Navegar pra `/lab/tokens`

URL: `/lab/tokens` → tab **Decoder**

> "Agora vamos ver claims de um token REAL. Vou logar e pegar um token."

1. Abre nova aba: `https://authservice-front-tftec.azurewebsites.net/`
2. Click "Login com Microsoft" → loga TFTEC
3. DevTools → Application → SessionStorage → procura `msal.token.keys.<client-id>` → copia access_token
4. Volta pra `/lab/tokens` → tab Decoder → cola o token
5. Mostra claims decodificadas dentro do app

### 🎤 Narrar claims no decoder
**Click tab "Anatomia":**
> "3 partes do JWT: HEADER (algoritmo + kid), PAYLOAD (claims), SIGNATURE (RSA(SHA256(header.payload), private_key))."
> "**Atenção:** payload é só Base64URL-codificado. **NÃO criptografado.** Nunca coloque PII sensível."

**Click tab "v1 vs v2":**
> "Endpoint v1.0 vs v2.0 — diferenças no `iss`, `audience`, `appid` vs `azp`. **Sempre use v2.0 pra apps novos.**"

**Click tab "ID vs Access":**
> "ID Token diz QUEM autenticou — para o cliente."
> "Access Token diz O QUE pode fazer — para a API."
> "**Não envie ID token pra API** — ela deve rejeitar."

### 🎤 Claims importantes
| Claim | Significa |
|-------|-----------|
| `aud` | Audience — pra QUEM o token foi emitido |
| `iss` | Issuer — quem emitiu (URL Entra ID + tenant) |
| `sub` | Subject — ID único user, sem PII |
| `tid` | Tenant ID — origem multi-tenant |
| `scp` | Scopes (delegated permissions) |
| `roles` | Application permissions |
| `exp` | Expiry Unix timestamp |

> "Validação SEMPRE checa: `iss`, `aud`, `exp`, `signature`. Pular qualquer um = vulnerabilidade."

### ❓ Pergunta pros alunos
"Se alguém criasse uma App Reg single-tenant e tentasse logar com user de outro tenant, qual claim retornaria diferente?"
**Resposta:** `tid` mostraria o tenant errado, e validação custom ia rejeitar (`AADSTS50020` no Entra ID antes mesmo de emitir token)

---

## 🚀 Cena 6 — Hands-On Lab 2 (65–90min) — usando `/lab/demo` 🆕

> 🆕 **MUDANÇA CRÍTICA:** O `tftec-auth` tem `/lab/demo` que **executa OBO + Client Credentials de verdade contra a API real**, mostrando timeline de eventos ao vivo. Substitui Postman/curl manual com algo MUITO mais visual.

### 🎤 Abertura
> "Lab 2 será DENTRO do tftec-auth. Acessem `https://authservice-front-tftec.azurewebsites.net/lab/demo`."

### 🖱️ AÇÃO LIVE — Tour da `/lab/demo`

URL: `/lab/demo`

> "3 colunas: **Cenário** (escolhe), **Sequence Player** (anima passo-a-passo), **Event Timeline** (mostra requests/responses reais)."

### 🎤 Demonstração 1 — SPA → Graph (Auth Code + PKCE)

1. Cenário: deixa selecionado "spa-login-api"
2. Click ▶ **Reproduzir** → animação roda
3. Click **Executar de verdade** (botão grande)

**O que acontece (vai aparecer em Event Timeline):**
- MSAL: acquireTokenSilent (request)
- Entra ID: Token recebido (response, mostra scopes + account)
- SPA: GET /me Graph (request)
- Graph: 200 + displayName real do user (response)

> "Isso é REAL. Não é mock. O sistema acabou de pegar SEU access token, chamou Graph, e mostrou seu nome aqui."

### 🎤 Demonstração 2 — OBO Flow

1. Cenário: muda pra "obo"
2. ▶ Reproduzir animação
3. **Executar de verdade**

**Timeline mostra:**
- MSAL: acquireTokenSilent → token1
- SPA: POST /auth/obo
- AuthService: 200 → "OBO concluído — token2 emitido"

> "O `tftec-auth/api/Controllers/TokenController.cs` recebeu seu token1, fez troca via OBO no Entra ID, e retornou token2 destinado ao Graph. **Identidade do user preservada.**"

### 🎤 Demonstração 3 — Client Credentials

1. Cenário: "client-credentials"
2. ▶ Reproduzir
3. **Executar de verdade**

> "Esse é DAEMON-style. Sem usuário. Token tem `roles`, não `scp`. Auditoria mostra appId, não user."

---

### 🛠️ Hands-On (alunos exploram, 15min)

> "Agora vc tem 15 minutos. Explora `/lab/demo` com SUA conta logada."

**Tarefas pros alunos:**
- [ ] Reproduzir os 3 cenários (spa-login, obo, client-credentials) em sequência
- [ ] Click **Executar de verdade** em cada — ver o token real chegar
- [ ] Em `/lab/tokens` → tab **Decoder** → colar um token capturado de DevTools, decodificar, identificar:
  - Qual o `aud`?
  - Qual o `tid`?
  - Quais scopes em `scp`?
  - Qual `exp` (em quanto tempo expira)?

### 📋 Checkpoints durante Lab 2

**5min:** "Quem viu erro 401 ao chamar 'Executar de verdade'? Cola o token em `/lab/tokens` Decoder e veja: o `aud` bate com `api://78345291-...`?"

**10min:** "Quem completou os 3 cenários? Vc viu a diferença entre `scp` (delegated) no SPA flow e `roles` (application) no Client Credentials? Importante: AUDITORIA muda."

**13min:** "Dica: pega 2 tokens em momentos diferentes. Compara `iat` (issued at) — diferença em segundos."

### 🎤 Fechamento Cena 6
> "Esses 3 fluxos resolvem 95% dos casos de auth Microsoft que vc vai ver na carreira. Tudo dentro do `tftec-auth`, que vc pode CLONAR e estudar localmente."

### 📌 Plano B (se `/lab/demo` quebrar)
- Voltar pra **Swagger**: `https://authservice-api-tftec.azurewebsites.net/swagger`
- Authorize + colar token + chamar `/auth/me`, `/auth/obo`, `/auth/client-token`
- Decoder externo: `https://jwt.ms`

---

## 🔧 Cena 7 — Troubleshooting LIVE (90–105min)

> **CENA MAIS DIVERTIDA.** Vc QUEBRA de propósito e os alunos diagnosticam ANTES de você revelar.

### 📺 Mostra
Slide 24 — "5 erros AADSTS comuns + tabela diagnóstico"

### 🎤 Fala
> "Vou pegar agora a App Reg DEMO que criei na Cena 3. Vou quebrar UM coisa de cada vez. **Vc me diz o erro ANTES de eu rodar.** Quem acertar antes ganha um café."

### 🖱️ Demo 1 — AADSTS50011 (Redirect URI mismatch)

1. **Antes:** mostra a App Reg → Authentication → tem `http://localhost:5173`
2. **Quebra:** muda a Redirect URI pra `http://localhost:9999`
3. **Ação:** abre o frontend, clica login

> "Antes de eu mostrar o resultado — qual erro vai dar?"

**[Esperar respostas.]** Resposta: **AADSTS50011**.

4. **Mostra:** erro real no browser
5. **Fix:** volta pra `http://localhost:5173`

### 🖱️ Demo 2 — AADSTS65001 (Consent required)

1. **Antes:** API permissions com Admin Consent
2. **Quebra:** revoga admin consent
3. **Ação:** alguém da turma loga (alunos novos do tenant)
4. **Resultado esperado:** AADSTS65001
5. **Fix:** Re-grant admin consent

### 🖱️ Demo 3 — AADSTS7000215 (Invalid client secret)

1. **Antes:** secret válido
2. **Quebra:** muda 1 char no secret
3. **Ação:** Postman client_credentials
4. **Resultado:** AADSTS7000215
5. **Fix:** restaura secret correto

### 🖱️ Demo 4 — Audience mismatch

1. **Antes:** chamada com `scope=api://{correto}/.default`
2. **Quebra:** muda pra `scope=https://graph.microsoft.com/.default`
3. **Ação:** Postman
4. **Resultado:** token tem `aud=Graph`, API rejeita: HTTP 401 audience invalid
5. **Fix:** scope correto

### 🖱️ Demo 5 — Tenant ID errado

1. **Antes:** URL `/oauth2/v2.0/token` com tenant correto
2. **Quebra:** muda tenant ID na URL
3. **Ação:** Postman
4. **Resultado:** AADSTS90002
5. **Fix:** tenant correto

### 📺 Mostra
Slide 26 — "Metodologia de debug 5 perguntas"

### 🎤 Fala
> "Memoriza essas 5 perguntas. Tudo que vc debugar de Entra ID nos próximos 10 anos cabe nelas."

> "1. Qual o erro EXATO? 2. Em qual etapa? 3. Token é válido? 4. Config bate com código? 5. Existe admin consent?"

> "**Dica de ouro:** quando achar que é bug no código, é configuração. Quando achar que é config, é o código. Sempre o oposto."

---

## 🎯 Cena 8 — Synthesis & Q&A (105–120min)

### 📺 Mostra
Slide 29 — "Recap por Bloom — o que você consegue agora"

### 🎤 Fala
> "Em 2 horas, vc passou pelos 6 níveis cognitivos:"

> "Lembrar → Compreender → Aplicar (Lab 1) → Analisar (`/lab/tokens` Decoder) → Avaliar (decision matrix) → Criar (Lab 2 `/lab/demo` integration)."

> "Isso não é trivial. **Vc agora sabe MAIS de Entra ID que 80% dos devs que tocam isso na carreira.**"

### 📺 Mostra
Slide 30 — **"Pattern A vs Pattern B — Quantos App Regs?"** ⭐

### 🎤 Fala (slide novo, demanda da turma)
> "Aqui é a pergunta que TODO entrevistador faz. **Quantas App Registrations vc usaria?**"

> "Olha o `tftec-auth`: 1 App Registration. SPA + API no mesmo Client ID. Isso é **Pattern A**."

> "Pattern B é 2 App Regs: 1 pra SPA (cliente), outra pra API (recurso). Mais granular, mais seguro, mais setup."

> "**Quando A:** MVP, demo, app interno, mesma equipe gerencia ambos."
> "**Quando B:** SaaS multi-cliente, API consumida por OUTROS apps, compliance exige segregação."

> "Pergunta de entrevista: 'Você usaria 1 ou 2 App Registrations pra X?' Resposta certa: **'Depende. Quantos clients consomem a API? Equipes diferentes? Compliance?'**"

> "**Não existe certo absoluto.** Decisão arquitetural depende de contexto."

### 📺 Mostra
Slide 31 — "Roadmap próximos tópicos"

### 🎤 Fala
> "Próxima fronteira: **Conditional Access**, **MFA**, **Workload Identity Federation** (a gente já usa no `tftec-auth` pra deploy do GitHub Actions — sem secret nenhum), **Managed Identity**."

> "Tudo isso documentado em `docs/aula/roadmap-avancado.md`. Vou marcar próximo workshop com vcs."

### 📺 Mostra
Slide 32 — "Materiais pra você levar"

### 🎤 Fala
> "Repo público: `github.com/tftec-guilherme/entra-auth-gateway`. **11 documentos** organizados:"

**Material da aula (`docs/aula/`):**
- `slides.md` — esta apresentação Marp
- `glossario.md` — 50+ termos definidos
- `cheat-sheet.md` — 1-pager pra grudar no monitor
- `roadmap-avancado.md` — 8 próximos tópicos com path visual
- `perguntas-frequentes.md` — **22 perguntas técnicas com respostas** ⭐
- `lab-modules-roadmap.md` — status dos 8 módulos do `/lab`
- `claude-design-prompt.md` — prompts pra gerar visual

**Playbooks (`docs/playbook/`):**
- `demo-class.md` — este roteiro de 2h
- `replicar-ambiente.md` — **alunos refazem ambiente do zero (Portal-first)** ⭐

**Reviews (`docs/review/`):**
- `security-audit.md` — auditoria pedagogical (1 CRITICAL, 2 HIGH, 4 MEDIUM)
- `code-review-frontend.md` — review Users + AppRegistrations

**Outros:**
- `docs/api/endpoints-and-flows.md` — documentação da API (446 linhas)
- `docs/guides/app-registration-setup.md` — Lab 1 step-by-step

> "Tudo Markdown puro, GitHub renderiza visualmente. Fork → estuda → PR welcome."

### 📺 Mostra
Slide 33 — "Q&A"

### 🎤 Fala
> "Agora é hora de cobrar perguntas. Quais foram suas DORES hoje? Quais ainda têm?"

### 🆘 Q&A — apoio em `docs/aula/perguntas-frequentes.md`

**Estratégia:** Mantenha `perguntas-frequentes.md` aberto na 2ª tela. Tem **22 perguntas** mais prováveis cobertas. Se pergunta cair lá: vc responde de cabeça (vc leu antes!). Se pergunta NOVA: anota + responde no Slack/canal pós-aula.

**Top 6 mais prováveis (memoriza):**

| # | Pergunta | Resposta curta |
|---|----------|----------------|
| 1 | Por que 1 App Reg em vez de 2? | Pattern A simplificado pra MVP. Ver slide 30. |
| 2 | Single vs Multi-tenant? | Multi pra SaaS B2B; Single pra apps internos. Trocar depois quebra. |
| 5 | OAuth 2.0 vs OIDC? | OIDC = OAuth 2.0 + camada de autenticação. Login = OIDC. API access = OAuth. |
| 10 | Como rotacionar Secret sem downtime? | Cria 2º secret em paralelo, deploy, deleta antigo. |
| 11 | CI/CD sem secret? | Workload Identity Federation (OIDC). Já usado neste repo! |
| 14 | scp vs roles? | Delegated (com user) vs Application (daemon). |

> 📚 Demais perguntas: ver `docs/aula/perguntas-frequentes.md`.

### 📺 Mostra
Slide 34 — "Obrigado!"

### 🎤 Encerramento
> "Obrigado pessoal. **Material está no GitHub** (link no slide). 11 documentos pra estudar e replicar."

> "Próximo workshop chamando — **Conditional Access**. Quem quer ser avisado, manda mensagem ou estrelh o repo."

> "Boa noite!"

---

## 📞 Materiais de Apoio (URLs prontas)

### URLs LIVE
```
Repo principal:       https://github.com/tftec-guilherme/entra-auth-gateway
Frontend live:        https://authservice-front-tftec.azurewebsites.net
Lab Hub:              https://authservice-front-tftec.azurewebsites.net/lab
Demo Interativa:      https://authservice-front-tftec.azurewebsites.net/lab/demo
JWT Decoder local:    https://authservice-front-tftec.azurewebsites.net/lab/tokens
Validar Token:        https://authservice-front-tftec.azurewebsites.net/validate
API Swagger:          https://authservice-api-tftec.azurewebsites.net/swagger
JWKS:                 https://authservice-api-tftec.azurewebsites.net/.well-known/jwks.json
JWT decoder externo:  https://jwt.ms
```

### Docs no repo (11 arquivos)
```
docs/aula/
  ├── slides.md                       — esta apresentação (34 slides)
  ├── glossario.md                    — 50+ termos
  ├── cheat-sheet.md                  — 1-pager
  ├── roadmap-avancado.md             — próximos tópicos
  ├── perguntas-frequentes.md         — FAQ 22 perguntas ⭐
  ├── lab-modules-roadmap.md          — 8 módulos /lab status
  └── claude-design-prompt.md         — gerar visual no Claude

docs/playbook/
  ├── demo-class.md                   — este roteiro
  └── replicar-ambiente.md            — alunos refazem do zero ⭐

docs/review/
  ├── security-audit.md               — 1 CRITICAL + 2 HIGH + 4 MED
  └── code-review-frontend.md         — Users + AppRegistrations

docs/api/
  └── endpoints-and-flows.md          — endpoints documentados

docs/guides/
  └── app-registration-setup.md       — Lab 1 step-by-step Portal
```

## 🆘 Plano B — Se algo dá errado

| Problema | Mitigação |
|----------|-----------|
| Frontend 502 | Demo via Swagger UI direto |
| Portal Azure lento | Pre-record screencasts em backup |
| Aluno bloqueado em Lab 1 | Aponte pra `app-registration-setup.md`, ofereça pair |
| Erro AADSTS desconhecido | "Vamos investigar juntos depois — anota o trace ID" |
| Tempo curto na Cena 7 | Cortar Demo 4 e 5, foque em 50011, 65001, 7000215 |
| Tempo SOBRA na Cena 8 | Demo bonus: criar Federated Credential pra GitHub Actions |

---

**Última revisão:** 2026-04-29 (preparação imediata da aula)
**Próxima iteração:** Após coletar feedback dos alunos (Story 1.3 quiz pós + form)
