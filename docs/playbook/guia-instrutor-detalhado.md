---
title: "Guia do instrutor — minute-by-minute, screen-by-screen"
audience: "Instrutor TFTEC Masters dando esta aula pela 1ª vez"
duration: "2h aula + 30min setup"
companion: "docs/playbook/roteiro-aula.md (narrativo) + docs/aula/hands-on.md (espinha dorsal aluno)"
last_updated: 2026-05-13
related:
  - "docs/aula/from-zero-walkthrough.md (aula 100% Azure via Cloud Shell + Portal + apps deployed — alternativa primária ao stack local)"
  - "docs/aula/slides.md (6 slides)"
  - "docs/aula/cheat-sheet.md (comandos az)"
  - "docs/aula/perguntas-frequentes.md (FAQ pra Q&A)"
  - "docs/aula/hands-on.md (auto-suficiente, aluno acompanha)"
  - "docs/aula/app-reg-recipes.md (10 receitas técnicas)"
---

# Guia do instrutor — minute-by-minute

> **Diferença vs `roteiro-aula.md`:** o roteiro é narrativo ("o que dizer"). Este guia é **screen-centric** — minuto a minuto: qual aba do browser está ativa, qual click executar, qual fala curta dizer, qual fallback ter pronto. Pra quem nunca deu esta aula antes.

> **🆕 Dois tracks suportados (aula 100% Azure é o recomendado em 2026-05):**
>
> | Track | Quando usar | Doc-mãe |
> |---|---|---|
> | **A — Cloud Shell + Portal + apps deployed** *(recomendado)* | Aluno chega só com browser + Microsoft account. Zero setup local. Apps já rodando em `https://authservice-{api,front}-tftec.azurewebsites.net`. | **`docs/aula/from-zero-walkthrough.md`** (5 Steps, ~75min) |
> | **B — Stack local (`npm run dev` + `dotnet run`)** *(legado / dev experience)* | Quando aluno é dev que quer reproduzir tudo offline depois. Este guia, blocos 1-8, foi escrito originalmente nesse mundo. | Blocos abaixo + `hands-on.md` |
>
> Os **blocos minute-by-minute desta página descrevem o Track B** (estilo aula presencial original). Pra Track A use o `from-zero-walkthrough.md` como roteiro principal e este doc como **referência das análises bit-a-bit + Plano B + Bloco 9 Recipes**. As análises técnicas (🔬) valem pros dois tracks.

## Como usar

- **Tela 1 (projetor / share com a turma):** o que está descrito em cada linha "Tela:" da tabela
- **Tela 2 (suas notas privadas):** este guia + `roteiro-aula.md` aberto pra fallback
- **Tela 3 opcional:** `perguntas-frequentes.md` aberto pra `Ctrl+F` no Q&A do Bloco 8
- **Imprimir:** o "Plano B" no final. Tela travada não é hora de scroll.

## Convenções nas tabelas

- **🎬 Você** = ação SUA (instrutor) — click, fala curta, gesto.
- **👥 Aluno** = o que aluno está fazendo nesse momento.
- **🆘 Se travar** = fallback específico do momento.
- **Tela:** aba do browser ATIVA na tela do projetor. Mudanças explícitas: "→ troca pra"
- **📍 Ref:** atalho pro material relacionado (hands-on cap, FAQ, lab).

---

## 🔧 Setup pre-aula — 30 minutos antes

> **Escolha o track antes**. Se vai dar a aula **100% Azure** (recomendado), pule pra `from-zero-walkthrough.md` (seção "Pré-aula instrutor") — basta Cloud Shell + 4 tabs (Portal, shell.azure.com, `/lab/recipes` deployed, jwt.ms). Sem `npm run dev` nem `dotnet run`.
>
> A tabela abaixo é o **setup do Track B (local)**.

| Min | 🎬 Você | Tela | 🆘 Se travar |
|---|---|---|---|
| -30 | Abrir notebook + projetor + login Microsoft pessoal já feito | — | Reinicia notebook |
| -28 | `az account show` no terminal → confirmar tenant TFTEC | Terminal | `az login` no browser |
| -26 | Abrir 6 tabs em ordem: (1) `portal.azure.com` → Entra ID → App registrations, (2) `localhost:8080/swagger` (backend local) OU `https://authservice-api-tftec.azurewebsites.net/swagger` (deployed), (3) `localhost:5173/lab/demo` (Vite local) OU `https://authservice-front-tftec.azurewebsites.net/lab/demo` (deployed), (4) `https://jwt.ms`, (5) `https://authservice-front-tftec.azurewebsites.net`, (6) GitHub repo público | Browser | Mata processos node se 5173 ocupado |
| -22 | `npm run dev` no diretório `tftec-auth` (background) — sobe Vite em `5173` | Terminal | Se erro: `npm ci && npm run dev`. **Fallback Track A:** usa o SPA deployed (`authservice-front-tftec.azurewebsites.net`) e pula este step. |
| -20 | `dotnet run` no backend `api/` (background) — sobe API em `5000/5001` | Terminal 2 | Se erro: `dotnet restore && dotnet run`. **Fallback Track A:** usa `authservice-api-tftec.azurewebsites.net` |
| -18 | Validar `localhost:8080/health` (proxy/deployed) OU `localhost:5001/health` (.NET) retorna JSON `Healthy` | Tab (2) | Reinicia backend |
| -16 | Validar `localhost:5173/lab` carrega + login Entra ID | Tab (3) | Limpa cache MSAL (`sessionStorage.clear()`) |
| -14 | Confirmar App Reg backup `tftec-auth-DEMO-BACKUP` está visível no Portal | Tab (1) | Se ausente: cria 1 agora (5 min) |
| -10 | Imprimir / abrir em PDF a seção "🆘 Plano B" deste guia | — | Tira foto com celular |
| -8 | Slide com QR/URL do repo público pronto pra projetar | `docs/aula/slides.pdf` slide 6 | Se PDF não build: usa o `.md` direto no VSCode |
| -5 | Mute notificações (Slack/Teams/email) | Sistema | Modo "Não perturbe" do Windows |
| -3 | Última checagem: turma chegando? Ajusta projetor pra 1920×1080 | — | — |
| -1 | Tela 1 = Slide 1 (Cover) projetado, full screen | `slides.pdf` p.1 | Tela preta: ESC + F11 |

---

## 🎤 Bloco 1 — Abertura (5 min)

📍 **Slides 1-6** (`docs/aula/slides.md`)

| Min | 🎬 Você | Tela | 👥 Aluno | 🆘 Se travar |
|---|---|---|---|---|
| 0:00 | "Boa noite. Hoje vamos atacar..." | Slide 1 Cover | Sentando, abrindo notebook | — |
| 0:30 | Avança → Slide 2 (`AADSTS50011`). "Quem aqui já apanhou de Redirect URI?" Mão pra cima esperada. | Slide 2 Hook | Levanta mão se já apanhou | Se ninguém levantar: "Nunca? Sortudos. Vão apanhar antes do final da aula." |
| 1:30 | Avança → Slide 3 (5 AADSTS). "Esses 5 são 90%. Cada um tem causa rastreável." | Slide 3 Outros AADSTS | Lendo | — |
| 2:30 | Avança → Slide 4 (Promise). Lê 6 bullets devagar. | Slide 4 Promise | Lendo, anotando | — |
| 3:30 | Avança → Slide 5 (Mapa 8 blocos). "8 blocos. 50/50 — eu narro, você executa." | Slide 5 Mapa | Vendo timeline | — |
| 4:30 | Avança → Slide 6 (Handoff). Projeta QR. "Quem ainda não clonou: 1 min." | Slide 6 Handoff | Clonando repo | Se WiFi travado: USB stick com repo pré-baixado |
| 4:55 | **➡️ Transition:** "Antes da primeira App Reg, 2 min de quadro mental." | Slide 6 | Última chance de clonar | — |

**Marcador final:** 0:05 atingido.

---

## 📊 Bloco 2 — Quadro mental + tipos de app (10 min)

📍 hands-on [Cap 0](../aula/hands-on.md#cap-0--quadro-mental-2-min) + [Cap 1](../aula/hands-on.md#cap-1--escolher-o-tipo-de-aplicação-5-min)

| Min | 🎬 Você | Tela | 👥 Aluno | 🆘 Se travar |
|---|---|---|---|---|
| 0:05 | Troca pra Tab (1) Portal Entra ID → **App registrations**. Lista do tenant aparece. | Portal App registrations | Acompanha visual | Portal lento: usa screenshot pré-tirado de `tftec-auth` |
| 0:06 | Click no `tftec-auth` da lista. Abre página de Overview. Aponta com mouse: **Application ID**, **Object ID**, **Directory ID**. | Portal App Reg Overview | Olhando os 3 GUIDs | — |
| 0:07 | Click em **Endpoints** (botão topo). Mostra a lista. Não explica linha a linha — aponta `/v2.0/.well-known/openid-configuration`. "Cada endpoint que MSAL usa vive aqui." | Portal Endpoints flyout | Vendo URLs | — |
| 0:08 | Fecha flyout. Sidebar esquerda → **Enterprise applications**. Filtra por `tftec-auth`. Mostra que aparece como SP. | Portal Enterprise apps filtrado | "Aha, é o mesmo App? Por quê 2 lugares?" | — |
| 0:10 | Volta pra App Reg. Abre 2ª tab Portal lado a lado (App Reg + Enterprise App). "App Object = template global. SP = instância no tenant." | Portal 2-up (split) | Anotando relação 1:N | — |

> **🔬 ANÁLISE BIT-A-BIT — App Object vs Service Principal vs Enterprise Application (90s)**
>
> Três conceitos que SE SOBREPÕEM mas são distintos no Microsoft Graph data model:
>
> | Conceito | Endpoint Graph | Onde vive | Quem cria | Manifest field |
> |---|---|---|---|---|
> | **App Registration / App Object** | `/applications/{id}` | **APENAS no tenant home** (onde foi criado) | Você (developer) | `appId`, `displayName`, `signInAudience`, `appRoles[]`, `requiredResourceAccess[]` |
> | **Service Principal (SP)** | `/servicePrincipals/{id}` | **EM CADA tenant** que usa o app | Provisionado automático no 1º consent OU `az ad sp create` | `appId` (FK pro App Object), `appRoleAssignedTo[]`, `tags`, `replyUrls` |
> | **Enterprise Application** | (não é endpoint — é VIEW no Portal sobre `/servicePrincipals/{id}`) | Mesma coisa que SP | Mesmo que SP | Visualiza tags `WindowsAzureActiveDirectoryIntegratedApp` |
>
> **Mind-blow #1:** "Enterprise applications" no Portal é literalmente uma TELA DIFERENTE pro mesmo objeto que "App registrations" mostra do outro lado. Microsoft separou pra clarear PERSPECTIVAS:
> - **App registrations** = visão do DEV que criou (gerencia código, secrets, scopes, app roles)
> - **Enterprise applications** = visão do ADMIN do tenant (gerencia consent, users/groups assignments, conditional access)
>
> **Mind-blow #2 (multi-tenant):** quando um cliente B faz login pela primeira vez no seu SaaS multi-tenant, Entra ID **provisiona automaticamente** um novo `/servicePrincipal` NO tenant dele (referenciando o seu `appId`). Esse SP é local ao tenant B — você (dev) NÃO consegue editar ele direto. O cliente B vê seu app em "Enterprise applications" do tenant dele.
>
> **Demonstre ao vivo (15s):** click no SP que apareceu em Enterprise applications → URL muda pra `/objectId={sp-guid}`. Aponta: "Esse SP guid é DIFERENTE do Application ID. SP é objeto, App é template."
| 0:12 | 🙋 "Vamos construir SPA React + API .NET. Quantas App Regs?" Espera respostas (1 vs 2). "Vamos ver no Cap 7. Por enquanto: 1." | Portal | Discutindo | — |

> **🔬 ANÁLISE BIT-A-BIT — Quando criar (e quando NÃO criar) uma App Reg (90s, resposta-padrão)**
>
> Pergunta que mais aparece: *"Mas por que eu PRECISO criar uma App Reg? Quando faz sentido?"*. Resposta-quadro pra **decorar literalmente:**
>
> **Você PRECISA criar App Reg quando:**
> 1. Sua aplicação precisa **identificar usuários do Entra ID** (login Microsoft / SSO corporativo)
> 2. Sua aplicação precisa **chamar APIs Microsoft** (Graph, SharePoint, Teams) em nome do user OU do próprio app
> 3. Sua aplicação precisa **gerenciar acesso** baseado em roles/groups do Entra ID
> 4. Você está construindo uma **API protegida** que outras apps vão consumir
> 5. Você quer **gestão centralizada** de quem acessa o quê (em vez de banco de senhas próprio)
>
> **Você NÃO precisa de App Reg quando:**
> - App é 100% pública sem login (blog estático)
> - App usa OUTRO provedor de identidade exclusivo (Auth0/Cognito/Google sem Microsoft)
> - App é só backend interno sem usuários reais (cron job que não chama API externa autenticada)
> - App vai usar **Managed Identity** em vez de App Reg (Azure → Azure puro)
>
> **Frase pra fechar:** *"App Registration é a **identidade da sua aplicação no Entra ID**. Sem ela, sua aplicação 'não existe' pro Microsoft — não pode pedir tokens, não pode receber tokens, não pode validar tokens emitidos pelo Entra ID."*
>
> **Exemplos concretos pra aluno fixar:**
> - "Tenho SPA React + API .NET que quero proteger" → ✅ App Reg
> - "Tenho cron job que precisa ler Graph" → ✅ App Reg (Daemon flow, Recipe 5)
> - "Tenho CI/CD que precisa deployar em Azure" → ✅ App Reg (FIC, Recipe 6) — SIM, CI/CD também
> - "Tenho App Service que só lê KeyVault" → ❌ Use Managed Identity (mais simples)
> - "Quero SSO corporativo com Microsoft" → ✅ App Reg + claim mapping
>
> 📍 **Recipe 1** mostra a app reg mínima do `tftec-auth`. Demais receitas cobrem cenários específicos.
| 0:13 | Compartilha hands-on Cap 1 (matriz tipos). "Hoje SPA + API. Mas vejam a matriz — Mobile, Daemon, etc." | hands-on.md Cap 1 | Lendo matriz | — |
| 0:14 | **Bonus:** abre `/lab/topologias` rapidamente. Mostra cards SPA + Web App + Mobile + Daemon visualmente. "Auto-estudo depois da aula." | localhost:5173/lab/topologias | "Que bonito!" | Frontend off → mostra screenshot do `lab-modules-roadmap.md` |
| 0:14:30 | **➡️ Transition:** "Vamos pro vivo. Cap 2." | — | — | — |

**Marcador final:** 0:15 atingido.

---

## 🎬 Bloco 3 — Criar App Reg ao vivo (15 min)

📍 hands-on [Cap 2](../aula/hands-on.md#cap-2--criar-a-app-reg-10-min) · alternativa 100% Azure: [`from-zero-walkthrough.md` Step 1](../aula/from-zero-walkthrough.md) (mesma operação via `az ad app create` no Cloud Shell)

| Min | 🎬 Você | Tela | 👥 Aluno | 🆘 Se travar |
|---|---|---|---|---|
| 0:15 | Portal → **App registrations** → **+ New registration** | Portal Form | Acompanha | — |
| 0:15:30 | **Digita devagar pra todos verem:** Name `tftec-auth-instrutor-{data-hoje}`. **Multi-tenant** (radio). Redirect URI = **vazio**. | Portal Form preenchido | "Por que multi-tenant?" | — |
| 0:17 | Aponta o campo Redirect URI VAZIO. "Atenção: estou deixando vazio de propósito. Vamos voltar." | Portal Form | Notando | — |
| 0:17:30 | Click **Register**. App Reg criada. Abre Overview com 3 GUIDs. | Portal Overview App Reg nova | "Tá criada" | Se demorar >10s: explica enquanto carrega |
| 0:18 | **Pinta com mouse** o Application ID. Diz "Esse vai virar `client_id` no código." | Portal Overview | Anotando | — |
| 0:18:30 | Mesma coisa pra Tenant ID. "Esse no `.env`." | Portal Overview | Anotando | — |
| 0:19 | 🙋 "Vejam os 3 IDs. Qual é secreto?" Espera 30s. Revela: **nenhum**. "Não são credentials. Pode logar onde quiser." | Portal | "Sério?" | — |

> **🔬 ANÁLISE BIT-A-BIT — Application ID vs Object ID vs Tenant ID (90s)**
>
> Três GUIDs aparecem juntos no Overview e confundem TODO mundo:
>
> | ID | Outro nome | Escopo | Stable? | Onde aparece em runtime |
> |---|---|---|---|---|
> | **Application (client) ID** | `appId` no Graph | **GLOBAL** — mesmo GUID em todos tenants que provisionaram o SP | ✅ permanente (não muda nunca) | `client_id` no `/authorize`, claim `appid`/`azp` no token, `aud` se for token pra essa app |
> | **Object ID (do App Registration)** | `id` no Graph `/applications/{id}` | **LOCAL ao tenant home** — só existe onde você criou | ✅ permanente | Usado em Graph API calls `PATCH /applications/{object-id}` |
> | **Object ID (do Service Principal)** | `id` no Graph `/servicePrincipals/{id}` | **LOCAL ao tenant onde o SP foi provisionado** — DIFERENTE pra cada tenant! | ✅ permanente dentro do tenant | Usado em role assignments, FICs (subject=SP object id), Enterprise app views |
> | **Directory (tenant) ID** | `tid` | **GLOBAL** — identifica o tenant | ✅ permanente (mas multi-tenant tem N tenant IDs) | Authority URL, claim `tid` no token, issuer URL |
>
> **Mind-blow:** Application ID e Object ID do App **são DIFERENTES** mesmo no tenant home. Olha o Overview do `tftec-auth`:
> - Application ID: `78345291-2586-4691-b1f9-e4e780f55328` ← isso vira `client_id` no código
> - Object ID: `xyz-abc-...` ← isso é o "primary key" do App Object no Graph
>
> **Quando confundir importa:**
> - `az ad app show --id <X>` aceita Application ID OU Object ID (Azure CLI dedupa)
> - Graph REST `GET /applications/{id}` aceita SÓ Object ID (não Application ID)
> - FIC subject precisa do **SP Object ID** (não App Object ID, não Application ID)
> - `audience` no JWT é Application ID (com `api://` prefix)
>
> **🙋 Pergunta de aprofundamento (se sobrar 30s):** "Em multi-tenant, o **Tenant ID** dum cliente é diferente do meu. Como meu backend valida tokens de N tenants distintos sem listar todos?" Resposta: `ValidateIssuer=false` + custom `OnTokenValidated` que confere `tid` contra lista permitida (ou aceita qualquer um se SaaS open). Veja `api/Program.cs:55-78`.
| 0:20 | **⏸️ Aluno turn (5 min):** "Sigam Cap 2. Nome `tftec-auth-aluno-{seu-nome}`. Multi-tenant. Redirect vazio. Anotem Application ID + Tenant ID." | hands-on.md Cap 2 projetado | Criando própria App Reg | Aluno sem permissão: empresta `tftec-auth-DEMO-BACKUP` |
| 0:25 | Circula (presencial) / monitora chat (remoto). | — | Criando | — |
| 0:28 | "Quem tem o SP visível em Enterprise apps?" Espera mãos. 80% → segue. | Portal Enterprise apps | Confirmando | <80%: dá +2min |
| 0:29 | **➡️ Transition:** "App Reg existe. Mas login não funciona — falta Redirect URI. Próximos 20 min: URLs + Tokens." | — | — | — |

**Marcador final:** 0:30 atingido.

---

## 🔗 Bloco 4 — URLs + Tokens com quebra deliberada (20 min)

📍 hands-on [Cap 3](../aula/hands-on.md#cap-3--urls-e-uris-10-min) + [Cap 4](../aula/hands-on.md#cap-4--tokens-15-min)

### 4a — URLs (0:30 → 0:40)

| Min | 🎬 Você | Tela | 👥 Aluno | 🆘 Se travar |
|---|---|---|---|---|
| 0:30 | Sua App Reg → **Authentication** → **+ Add a platform** → **Single-page application** | Portal Platform config | Acompanha | — |
| 0:31 | Digita Redirect URI = `http://localhost:5173/` (com barra). Salva. | Portal SPA platform salva | Acompanha | — |
| 0:32 | **Quebra deliberada:** Tab `localhost:5173`. F5. Click "Login". Popup MSAL. → **AADSTS50011** | localhost:5173 + erro popup | "Mas você adicionou!" | — |
| 0:33 | 🙋 "O que aconteceu? Quem arrisca?" Espera 30s. | Erro AADSTS50011 visível | Pensando | — |
| 0:34 | **Revela:** "Olhem a URL exata: `http://localhost:5173` (sem barra) vs registrada `http://localhost:5173/` (com barra). Byte a byte." | Portal Platform + URL visível | "Aaah!" | — |
| 0:35 | Adiciona `http://localhost:5173` (sem barra) também. Salva. | Portal Platform 2 URIs | — | — |

> **🔬 ANÁLISE BIT-A-BIT — Redirect URI matching (60s)**
>
> Entra ID faz **comparação literal string-by-string** entre a URL que o cliente envia em `redirect_uri` (parameter do `/authorize`) e o que está cadastrado no `replyUrls[]` (manifest field).
>
> | Aspecto | Entra ID compara? | Por quê |
> |---|---|---|
> | **Case do scheme** (`HTTP://` vs `http://`) | 🟡 normaliza pra lowercase | Spec OAuth 2.0 |
> | **Case do hostname** (`Localhost` vs `localhost`) | 🟡 normaliza pra lowercase | DNS é case-insensitive |
> | **Trailing slash** (`/`) | ❌ **NÃO normaliza** — registra-AS-IS, valida-AS-IS | Pode ser path significativo |
> | **Path case** (`/Callback` vs `/callback`) | ✅ **case-SENSITIVE** | Path é case-sensitive |
> | **Porta explicita** (`:8080` vs default) | ✅ case-sensitive (string) | Default port = vazio |
> | **Query string** (`?foo=bar`) | ❌ NÃO permitida em `redirect_uri` | Spec OAuth 2.0 |
> | **Fragment** (`#hash`) | ❌ NÃO permitida | Spec OAuth 2.0 |
>
> **Por que o erro `AADSTS50011` aparece tantas vezes:**
> 1. Aluno copia URL do browser DEPOIS do login (browser adicionou `/` final)
> 2. Pasta no Portal sem barra. Registra `http://localhost:5173`.
> 3. SPA envia `http://localhost:5173/` (Vite serve com barra) → mismatch
>
> **Defesa em profundidade:** cadastre **3 variantes** se possível: com barra, sem barra, com `/callback` explícito. Entra ID aceita múltiplos URIs.
>
> **🙋 Pergunta gancho:** "Por que Entra ID é tão estrito? Não podia normalizar?" Resposta: spec OAuth 2.0 RFC 6749 §3.1.2.3 + RFC 8252 §7.5 exigem comparação literal pra prevenir **redirect attack** (atacante registra URI similar pra interceptar code).
| 0:36 | Tab `localhost:5173` → F5 → Login. **Funciona.** Vê displayName. | localhost:5173 logado | — | Se ainda erro: abre DevTools, mostra `code_challenge` no Network |

> **🔬 ANÁLISE BIT-A-BIT — Conditional Access (90s — se alguém do MFA aparecer)**
>
> Conditional Access (CA) **não é parte da App Reg** — é **POLÍTICA do tenant** que roda DEPOIS do user provar credencial mas ANTES de Entra ID emitir o token. Funcionalmente: filtro que aplica regras como MFA obrigatório, location-based block, device compliance check, sign-in risk score.
>
> **Quando aluno da Turma 02 perguntou "por que MFA não pediu?":** o tenant dele provavelmente não tinha CA policy exigindo MFA pra esse cenário. CA tem ~30 condições combinatórias:
> - **Users/Groups:** all users / específicos / guests
> - **Cloud apps:** all / específicos (incluindo SUA App Reg!)
> - **Conditions:** location (IP/country), client app (browser/mobile/legacy), device platform, sign-in risk, user risk
> - **Grant controls:** require MFA, require compliant device, require approved app, require app protection policy
>
> **Importante pro debug:** se aluno reporta "minha App Reg não loga", primeira pergunta é "**vc tem CA policy que bloqueia esse client app?**". Verifique em Portal → Entra ID → Security → Conditional Access → Policies.
>
> **Como CA aparece no token:**
> - `acrs` claim: array de claims provadas (MFA?, compliant device?, etc.)
> - `auth_time`: quando user fez last factor (pra timeout)
> - Tenant pode forçar **re-authentication** via CA mesmo com refresh token válido (sessão expira por policy, não por token expiry)
>
> **Mind-blow:** CA pode aplicar diferentemente por App Reg. App Reg crítica (admin app) pode exigir MFA; App Reg dev/test pode dispensar. Não é decisão do dev — é decisão do admin do tenant.
>
> **Quando NÃO aprofundar em aula:** se ninguém perguntar sobre MFA, pule. CA é tema de admin Entra ID, não de dev de aplicação. Mas TENHA essa resposta na manga.

> **🔬 ANÁLISE BIT-A-BIT — PKCE mecânica (90s)**
>
> Auth Code + **PKCE** (Proof Key for Code Exchange) substitui o client_secret em flows públicos (SPA, Mobile). Mecânica:
>
> 1. **SPA gera** `code_verifier` = string aleatória 43-128 chars URL-safe (ex: `dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk`)
> 2. **SPA calcula** `code_challenge = BASE64URL(SHA256(code_verifier))` (`code_challenge_method=S256`)
> 3. **SPA envia** `code_challenge` no `/authorize` request — Entra ID anota internamente
> 4. **Entra ID retorna** `code` via redirect (Entra ID já tem o `code_challenge`, não o verifier)
> 5. **SPA envia** `code + code_verifier` no `/token` request
> 6. **Entra ID valida:** `BASE64URL(SHA256(code_verifier)) == code_challenge_anotado`? Se sim, emite token.
>
> **Por que protege:** se um atacante interceptar o `code` no redirect (XSS, MITM no localhost, mobile deep-link hijack), ele NÃO TEM o `code_verifier` (que ficou só na memória do SPA original). Sem verifier, troca de code → token falha.
>
> **Demonstre ao vivo (30s):** DevTools → Network → filtra `authorize` → query string mostra `code_challenge=...&code_challenge_method=S256`. Filtra `token` → request body tem `code_verifier=...&grant_type=authorization_code`.
>
> **Mind-blow:** essa mecânica está em `@azure/msal-browser` (dependency do `tftec-auth`). `MsalProvider` gera o pair automaticamente em cada acquireToken. Você nunca digita PKCE no código.

| 0:37 | "Outras URLs que confundem: App ID URI (Cap 3), Issuer, Authority. Hands-on cobre cada uma." | hands-on.md Cap 3 | Lendo | — |
| 0:38 | **⏸️ Aluno turn (2 min):** "Configurem o Redirect URI de vocês. Atualizem `.env.local`. Restart `npm run dev`. Tentem login." | hands-on.md Cap 3 | Configurando | — |

### 4b — Tokens (0:40 → 0:50)

| Min | 🎬 Você | Tela | 👥 Aluno | 🆘 Se travar |
|---|---|---|---|---|
| 0:40 | Tab `localhost:5173/lab/tokens` → aba **Decoder**. Click **Access Token** (botão). | /lab/tokens Decoder | "Veio meu token!" | — |
| 0:41 | Aponta o payload. Highlight: `aud`, `iss`, `iat`, `exp`, `scp`. | /lab/tokens payload | Lendo claims | — |

> **🔬 ANÁLISE BIT-A-BIT — Token lifetime + Refresh tokens (90s)**
>
> Tokens Entra ID **NÃO duram forever**. Existem 3 tipos com lifetimes diferentes:
>
> | Token | Lifetime padrão | Renovável? | Onde fica |
> |---|---|---|---|
> | **ID Token** | 1h | ❌ não direto (login novo) | sessionStorage / cookie |
> | **Access Token** | 60-90min (variável) | ❌ não direto | sessionStorage / cookie |
> | **Refresh Token** | 24h (SPA) / 90 dias (Web/Mobile) | ✅ pode trocar por novo access token | sessionStorage criptografado / token broker |
>
> **Renovação silenciosa (silent refresh) em SPA:**
> ```javascript
> // MSAL.js faz internamente quando access_token expira:
> const result = await instance.acquireTokenSilent({
>   ...request,
>   account: accounts[0]
> });
> // 1) Verifica cache local — tem access_token não-expirado? Usa.
> // 2) Não tem? Verifica se tem refresh_token. Tem?
> //    POST /token com grant_type=refresh_token + refresh_token
> //    Recebe access_token NOVO + refresh_token NOVO (rotação!)
> // 3) Refresh_token expirou também? Throws InteractionRequiredAuthError
> //    → SPA precisa fazer login interativo de novo (popup/redirect)
> ```
>
> **Refresh Token Rotation (SPA):**
> - Cada uso de refresh_token devolve OUTRO refresh_token (anterior invalidado)
> - Se mesmo refresh_token for usado 2x → Entra ID detecta replay → revoga family inteiro → user precisa re-autenticar
> - Defesa contra session hijacking
>
> **Quando alunos perguntam "por que tem que logar de novo após 24h?":**
> - Refresh token de SPA tem lifetime de 24h (fixo por security spec)
> - Web/Mobile podem ter 90 dias (com Conditional Access overriding)
> - **Não dá pra estender em SPA** — limitação spec Microsoft pra mitigar XSS
> - Solução: server-side session com cookies + token cache no server (Pattern Web Recipe 3)
>
> **Demonstre ao vivo (30s):** `/lab/tokens` → decode access_token → mostra `iat` (issued at) e `exp` (expiry). Calcula `exp - iat = ~3600s = 60min`. Refresh token NÃO está no token decodificável — fica no cache MSAL apenas.

> **🔬 ANÁLISE BIT-A-BIT — JWT format + JWKS validation (2min)**
>
> JWT = 3 partes separadas por `.`:
> ```
> eyJhbGciOiJSUzI1NiI...   .   eyJhdWQiOiJhcGk6Ly8u...   .   abc123...assinatura...
> ─── HEADER (base64url) ───────── PAYLOAD (base64url) ─────── SIGNATURE
> ```
>
> Demonstre ao vivo (30s): no `/lab/tokens`, click "📋 Anatomia" tab. Mostra header decodificado:
> ```json
> {
>   "alg": "RS256",        // algorítmo assinatura RSA-256
>   "kid": "abc-xyz...",   // KEY ID — qual chave pública usar pra validar
>   "typ": "JWT"
> }
> ```
>
> **Fluxo de validação no backend** (Microsoft.Identity.Web faz automático):
> 1. Recebe `Authorization: Bearer eyJ...`
> 2. Decoda header → pega `kid`
> 3. Fetch `https://login.microsoftonline.com/{tenant}/discovery/v2.0/keys` (JWKS endpoint) → JSON com array de chaves públicas
> 4. Acha a chave com `"kid": "abc-xyz..."`
> 5. Reconstroi a signature: `RSA-Verify(public_key, payload, signature)` → bool
> 6. Se válido: parse payload → cria `ClaimsPrincipal` → adiciona em `HttpContext.User`
> 7. Valida claims standard:
>    - `iss` (issuer) bate?
>    - `aud` (audience) bate com config?
>    - `exp` (expiry) está no futuro?
>    - `nbf` (not before) está no passado?
>
> **Mind-blow:** o `tftec-auth` deployed expõe **seu próprio JWKS** em `/.well-known/jwks.json` (porque também emite tokens internos — `InternalTokenService`). Veja `Program.cs:184` + `Models/TokenModels.cs:23` (`JwksResponse`). Modelo 2 dos protocolos: JWKS + RS256, sem cookie de sessão.
>
> **Demonstre (30s):** abre `https://authservice-api-tftec.azurewebsites.net/.well-known/jwks.json` → mostra JSON com `keys[].kty=RSA, n=<modulus base64>, e=AQAB, kid=...`. "Cada um desses é uma chave pública. Backends que confiam no AuthService usam ESTA URL pra validar tokens internos."

| 0:42 | Copia o `access_token` (botão). Cola em `jwt.ms`. Mostra mesma coisa lá. "Use jwt.ms quando quiser inspecionar token de prod." | jwt.ms decoded | Comparando | jwt.ms off → fica no Decoder local |
| 0:43 | Tab **v1 vs v2** do `/lab/tokens`. Mostra issuer formato `/v2.0`. | /lab/tokens v1 vs v2 | — | — |
| 0:44 | Tab **ID vs Access**. "ID = sobre o user. Access = pra API. Não confunda." | /lab/tokens ID vs Access | — | — |
| 0:45 | **Bonus visual:** `/lab/permissions-claims` aba 2 (`scp vs roles`). Click "Ver SEU token". | /lab/permissions-claims Tab 2 | "Olha meu scp real" | — |
| 0:47 | "Cap 4 do hands-on tem detalhe. Vamos pra permissions." | — | — | — |
| 0:48 | **⏸️ 2 min experimentação livre:** alunos colam próprio token em jwt.ms. | hands-on.md Cap 4 | Inspecionando | — |

**Marcador final:** 0:50 atingido.

---

## 🔑 Bloco 5 — Permissions + Credenciais (20 min)

📍 hands-on [Cap 5](../aula/hands-on.md#cap-5--permissions-e-roles-15-min) + [Cap 6](../aula/hands-on.md#cap-6--credenciais-10-min)

### 5a — Permissions & Roles (0:50 → 1:02)

| Min | 🎬 Você | Tela | 👥 Aluno | 🆘 Se travar |
|---|---|---|---|---|
| 0:50 | Sua App Reg → **API permissions**. Mostra `User.Read` default. | Portal API permissions | — | — |
| 0:51 | 🙋 "Delegated vs Application — qual é qual?" Espera. | Portal | Pensando | — |
| 0:52 | Tab `/lab/permissions-claims` → **Tab 1 (Delegated vs Application)**. Mostra cards lado a lado. | /lab/permissions-claims Tab 1 | "Aaah, agora vi" | — |
| 0:54 | Tab 2 do mesmo lab → 2 JWTs com `scp` (string) vs `roles` (array). Aponta highlight no claim. | /lab/permissions-claims Tab 2 | Anotando diferença | — |

> **🔬 ANÁLISE BIT-A-BIT — Consent framework (2min — momento "AHA!")**
>
> Quando aluno cria App Reg e pede permission `User.Read.All`, Entra ID **NÃO emite token automático**. Há uma camada CONCEITUAL entre App Reg → token, que é o **consent**.
>
> **3 atores no consent:**
> 1. **App Reg** declara: "preciso de `User.Read` (Delegated) + `User.Read.All` (Application)"
> 2. **User** OU **Admin** consente (concorda em dar essas permissões)
> 3. **Service Principal** ganha `oauth2PermissionGrants` (Delegated) OU `appRoleAssignments` (Application) — registros que ATIVAM as permissions
>
> **Sem o passo 3, o passo 1 é apenas DECLARAÇÃO. Token vem SEM as permissions.**
>
> **Quem pode consentir cada tipo:**
>
> | Permission type | User pode consentir? | Admin obrigatório? |
> |---|---|---|
> | Delegated user-consent-able (User.Read) | ✅ Sim | Não (mas admin pode pre-consentir pra todos) |
> | Delegated admin-only (User.Read.All Delegated) | ❌ Não — marcada "Admin only" | ✅ Sim |
> | Application (qualquer) | ❌ Não — sempre | ✅ Sim, sempre |
> | App Roles atribuídos | ❌ Não — é assignment | ✅ Admin atribui via Enterprise apps |
>
> **Mind-blow:** "user-consent-able" é decisão da MICROSOFT (no manifest do Graph). User.Read é user-OK porque ler próprio perfil é low-risk. Mail.Read DELEGATED já é admin-only em muitos tenants (policy override).
>
> **Onde isso aparece tecnicamente:**
> - `/applications/{appId}` (App Reg) tem `requiredResourceAccess[]` — declaração
> - `/servicePrincipals/{spId}` (SP) tem `oauth2PermissionGrants[]` + `appRoleAssignedTo[]` — consents reais
> - Token só inclui claims das permissions com **consent ATIVO** no SP local do tenant onde user está logando
>
> **Erro `AADSTS65001` é literalmente "step 3 não aconteceu":** App Reg pediu, user logou, mas SP não tem grant ativo pra essa permission. Fix: admin consent (`az ad app permission admin-consent`) OU prompt user consent.
>
> **Frase pra responder ao aluno confuso:**
> *"Permission na App Reg = DECLARAÇÃO. Consent = ATIVAÇÃO. Sem ativação no Service Principal local do tenant, token vem sem claim. Daí o erro AADSTS65001."*

> **🔬 ANÁLISE BIT-A-BIT — scp vs roles no token (2min)**
>
> Por que **scp** vem como STRING space-separated e **roles** como ARRAY?
>
> **`scp` (delegated permissions):**
> ```json
> "scp": "api.read api.write User.Read"
> ```
> - Tipo: **string** com scopes separados por espaço
> - Origem histórica: OAuth 2.0 spec (RFC 6749 §3.3) — scope é string serializável em URL query
> - Reflete o que o USER consentiu (e está nos `aud`-allowed scopes)
> - Validação: `value.Contains("api.read")` ou `value.Split(" ").Contains(...)`
>
> **`roles` (application permissions OU App Roles):**
> ```json
> "roles": ["api.admin", "Approver", "User.Read.All"]
> ```
> - Tipo: **array de strings**
> - Origem: SAML attribute statements + .NET ClaimsPrincipal (que sempre teve `Role` claim como multi-valued)
> - Reflete:
>   - **Application permissions** consentidas pelo admin (Daemon flow) — vem da App Reg
>   - **App Roles atribuídos** ao user/SP via Enterprise applications → Users and groups
> - Validação: `policy.RequireRole("Admin")` (built-in ASP.NET Core).
>
> **Por que .NET parece "mágico":** `Microsoft.Identity.Web` mapeia automaticamente `roles` claim → `ClaimsPrincipal.IsInRole(...)`. Daí `RequireRole("Admin")` funciona sem você configurar nada. Mas pra `scp`, NÃO há mapping automático — você precisa `HasClaim("scp", value => value.Contains(...))`. Veja `api/Program.cs:80-98`.
>
> **Casos especiais:**
> - **`scp` e `roles` no MESMO token:** raríssimo. Acontece se app tem App Role atribuído + scope consentido. Microsoft.Identity.Web prioriza `roles`.
> - **Long-form claim** (`http://schemas.microsoft.com/identity/claims/scope`): v1 tokens usam esse nome longo. v2 usa `scp` (curto). O `tftec-auth` valida AMBOS pra compatibilidade (`api/Program.cs:85-86`).
> - **`scp` ausente em Application permission tokens** (`grant_type=client_credentials`): correto. Sem user = sem delegated scope.

| 0:56 | Tab 4 do mesmo lab → snippet de `api/Program.cs:80-98`. Aponta `RequireRole` vs `HasClaim("scp")`. "Não dá pra trocar." | /lab/permissions-claims Tab 4 | Vendo código real | — |
| 0:56 | Tab 4 do mesmo lab → snippet de `api/Program.cs:80-98`. Aponta `RequireRole` vs `HasClaim("scp")`. "Não dá pra trocar." | /lab/permissions-claims Tab 4 | Vendo código real | — |
| 0:58 | Sua App Reg → **App roles** → **+ Create**. Display=`Admin`, Value=`Admin`, Members=`Users/Groups`. Apply. | Portal App roles form | Acompanha | — |
| 0:59 | Enterprise apps → sua App Reg → **Users and groups** → **+ Add user/group**. Você → role Admin. Assign. | Portal Assignment | Acompanha | — |
| 1:00 | Logout + login no `localhost:5173`. Tab `/lab/tokens` Decoder. **Click "Access Token". Aponta claim `roles: ["Admin"]`.** | /lab/tokens com roles | "🤯" | Se sem `roles`: cache MSAL — `Application.localStorage.clear()` |
| 1:02 | Tab 5 do `/lab/permissions-claims` → Admin consent decision tree. "Quando admin é obrigatório? Quando dá 65001?" | /lab/permissions-claims Tab 5 | Vendo Mermaid | — |

### 5b — Credenciais (1:02 → 1:10)

📍 hands-on [Cap 6](../aula/hands-on.md#cap-6--credenciais-10-min) · Daemon end-to-end ao vivo no Cloud Shell: [`from-zero-walkthrough.md` Step 3](../aula/from-zero-walkthrough.md) (cria App Reg paralela + Client Secret + token via `curl` + decode em jwt.ms)

| Min | 🎬 Você | Tela | 👥 Aluno | 🆘 Se travar |
|---|---|---|---|---|
| 1:02 | Tab `/lab/credenciais`. Aponta matriz 4 colunas: Secret / Cert / FIC / MI. | /lab/credenciais matriz | "Quantas?" | — |
| 1:03 | Tab **FIC**. **Mostra workflow real** do `tftec-auth` deploy-azure.yml na tela. | /lab/credenciais Tab FIC | "É o que vai pra prod!" | — |

> **🔬 ANÁLISE BIT-A-BIT — FIC trust mechanism (3min — frame em destaque)**
>
> Federated Identity Credential parece mágica. Não é. É **trust de issuer OIDC** com 4 condições verificáveis:
>
> **Quando GitHub Actions roda `azure/login@v2`:**
> 1. GitHub Actions Runner solicita `id_token` do **GitHub OIDC issuer** (`https://token.actions.githubusercontent.com`)
> 2. GitHub emite JWT assinado com chave RS256 do GitHub. Payload exemplo:
>    ```json
>    {
>      "iss": "https://token.actions.githubusercontent.com",
>      "sub": "repo:tftec-guilherme/entra-auth-gateway:ref:refs/heads/main",
>      "aud": "api://AzureADTokenExchange",
>      "ref": "refs/heads/main",
>      "repository": "tftec-guilherme/entra-auth-gateway",
>      "actor": "tftec-guilherme",
>      "workflow": "Deploy to Azure",
>      "job_workflow_ref": "tftec-guilherme/entra-auth-gateway/.github/workflows/deploy-azure.yml@refs/heads/main",
>      "iat": 1715616000,
>      "exp": 1715616300
>    }
>    ```
> 3. Runner envia esse JWT pro endpoint Entra ID `/oauth2/v2.0/token` como `client_assertion` (parâmetro do request `grant_type=client_credentials`).
> 4. **Entra ID valida 4 coisas:**
>    - **Issuer match:** `iss == "https://token.actions.githubusercontent.com"` (FIC field)
>    - **Subject match:** `sub == "repo:tftec-guilherme/entra-auth-gateway:ref:refs/heads/main"` (FIC field)
>    - **Audience match:** `aud == "api://AzureADTokenExchange"` (FIC field — constante MS)
>    - **Signature verification:** Entra ID busca chaves públicas do GitHub via `https://token.actions.githubusercontent.com/.well-known/jwks` (JWKS) → valida `RS256(payload, signature)`
> 5. Se 4/4 passa, Entra ID emite **access_token Entra ID** com `appid={APP_ID}` (sua App Reg `sp-tftec-authsvc-cicd-001`)
>
> **Por que isso é seguro:**
> - Trust é POSSE de um repositório (GitHub gerencia identity), não posse de uma string secreta
> - Vazar `client_id` é OK (é GUID público, qualquer um vê)
> - Atacante precisaria comprometer o GitHub Actions runner OU clonar exato `repository`+`ref` pra emitir id_token válido
>
> **Demonstre ao vivo (30s):** abre `https://token.actions.githubusercontent.com/.well-known/openid-configuration` (no browser). Mostra:
> ```json
> {
>   "issuer": "https://token.actions.githubusercontent.com",
>   "jwks_uri": "https://token.actions.githubusercontent.com/.well-known/jwks",
>   "subject_types_supported": ["public"],
>   "id_token_signing_alg_values_supported": ["RS256"]
> }
> ```
> "Esse JSON é o que Entra ID lê pra saber como validar tokens do GitHub. Mesma coisa que `tftec-auth` expõe (`/.well-known/jwks.json`) — vc é o issuer pros backends que confiam em você."

| 1:05 | Click "Ver runs reais no GitHub Actions" → abre GitHub. Mostra runs success do dia. | GitHub Actions deploy-azure | "Sem secret no repo" | GitHub off → mostra workflow.yml direto |
| 1:07 | Decision tree no rodapé. "Azure → MI. CI/CD → FIC. On-prem → Cert. Dev → Secret." | /lab/credenciais decision tree | — | — |
| 1:08 | Sua App Reg → **Certificates & secrets** → mostra os secrets existentes (vazios ou expirando). NÃO cria novo agora. | Portal Secrets | — | — |
| 1:09 | "Cap 6 do hands-on tem `az ad app federated-credential create` se vc quer reproduzir. Auto-estudo." | hands-on.md Cap 6 | Anotando | — |
| 1:09:30 | **➡️ Transition:** "Próximo: multi-tenant + onde isso encaixa no código." | — | — | — |

**Marcador final:** 1:10 atingido.

---

## 🌐 Bloco 6 — Multi-tenant + integrar no código (20 min)

📍 hands-on [Cap 7](../aula/hands-on.md#cap-7--multi-tenant-e-múltiplos-app-regs-10-min) + [Cap 8](../aula/hands-on.md#cap-8--integrar-no-código-15-min)

### 6a — Multi-tenant (1:10 → 1:20)

| Min | 🎬 Você | Tela | 👥 Aluno | 🆘 Se travar |
|---|---|---|---|---|
| 1:10 | Tab `/lab/multi-app` → **Tab 1 (Pattern A vs B)**. Cards lado a lado + Mermaid. | /lab/multi-app Tab 1 | — | — |
| 1:12 | "tftec-auth usa Pattern A. Vamos ver os trade-offs." Aponta prós/contras. | /lab/multi-app Tab 1 | Comparando | — |
| 1:13 | Tab 2 (Single vs Multi-tenant). Tabela `signInAudience`. Aponta `AzureADMultipleOrgs`. | /lab/multi-app Tab 2 | — | — |
| 1:14 | Mermaid 1 App Object + N SPs. Explica AADSTS7000229. | /lab/multi-app Tab 2 | "Já vi esse erro" | — |

> **🔬 ANÁLISE BIT-A-BIT — AADSTS7000229 internals (90s)**
>
> Mensagem exata: *"The application 'X' is missing a service principal in the tenant 'Y'."*
>
> **Por que existe esse erro:**
> Quando um cliente B (de outro tenant) acessa seu SaaS multi-tenant:
> 1. Entra ID busca: `appId == X` está no tenant home? ✅ achou (no SEU tenant)
> 2. Entra ID busca: existe `/servicePrincipal` com esse `appId` NO TENANT do cliente B? ❌ não achou → **AADSTS7000229**
>
> **Por que SP precisa existir LOCAL:**
> - Service Principal é o "contrato" entre o app e o tenant: lista de permissões consentidas, lista de App Roles atribuídos a users desse tenant, conditional access policies aplicáveis.
> - Sem SP local = Entra ID não sabe O QUE liberar pro user → bloqueia.
>
> **3 soluções (em ordem):**
> 1. **Admin consent endpoint:** redirect cliente pra `https://login.microsoftonline.com/{tenant_B}/adminconsent?client_id={APP_ID}&redirect_uri=...`. Admin de B aceita → Entra ID provisiona SP automaticamente no tenant B.
> 2. **CLI manual:** `az ad sp create --id {APP_ID}` rodando contra tenant B (precisa ser admin).
> 3. **Login normal com user-consent-able permissions:** se SUA App Reg pediu só permissions que usuário pode consentir (ex: `User.Read`), o primeiro login funciona — Entra ID cria SP automático no consent flow.
>
> **Quando "primeiro login user consent" NÃO funciona:**
> - App tem alguma permission marcada "Admin only" (User.Read.All, qualquer Application permission)
> - Tenant B tem política "Users can NOT consent to apps" (cada vez mais comum em corp)
> → Solução obrigatória: admin consent endpoint
>
> **Demonstre (30s):** abre `/lab/multi-app` Tab 2 → snippet `az ad sp create`. Aponta o exato comando.
| 1:15 | Tab 3 (B2B). Mostra Mermaid de invite cross-tenant. "Pra parceria com outra empresa." | /lab/multi-app Tab 3 | — | — |
| 1:16 | Tab 4 (OBO chains). Mermaid 3+ saltos. "Microservices com identidade preservada." | /lab/multi-app Tab 4 | — | — |
| 1:17 | Tab 4 → botão **Abrir Demo** → `/lab/demo` cenário OBO. **Click Executar de verdade.** | /lab/demo OBO timeline | "Olha o Graph respondendo" | OBO 500 → admin consent — usa fallback de mostrar Network tab |
| 1:19 | **➡️ Transition:** "Vimos arquitetura. Agora código real." | — | — | — |

### 6b — Integrar no código (1:20 → 1:30)

📍 hands-on [Cap 8](../aula/hands-on.md#cap-8--integrar-no-código-15-min) · App Role na deployed via Cloud Shell: [`from-zero-walkthrough.md` Step 2](../aula/from-zero-walkthrough.md) (cria App Role `Admin` via `az ad app update --app-roles` + assignment via Enterprise Apps + valida logging na SPA deployed)

| Min | 🎬 Você | Tela | 👥 Aluno | 🆘 Se travar |
|---|---|---|---|---|
| 1:20 | VSCode → `src/config/msal.ts` aberto. Aponta `msalConfig` (instance + clientId + redirectUri). | VSCode msal.ts | Vendo código | — |

> **🔬 ANÁLISE BIT-A-BIT — Build-time vs Runtime no frontend (60s — versão clássica)**
>
> Pergunta plantada pra turma: "**No App Service do frontend no Portal Azure, em `Configuration`, vejam quantas env vars têm.**" Espera resposta: "tem `VITE_AZURE_CLIENT_ID`, `VITE_AZURE_TENANT_ID`, `VITE_AZURE_AUDIENCE`, `VITE_AUTHSERVICE_URL` (4 settings) — desde Story 1.21".
>
> "Agora vejam o backend `authservice-api-tftec` → 13 env vars. **Por quê o frontend tinha ZERO antes?**"
>
> Revela:
> - **Backend .NET:** lê `IConfiguration` em RUNTIME. Env vars `AzureAd__ClientId` viram `AzureAd:ClientId` na config hierárquica (`__` = separador). Microsoft.Identity.Web binda no startup. Mudou env var → restart App Service → pega valor novo.
> - **Frontend Vite (modo CLÁSSICO):** build-time injection. Durante `npm run build` no GitHub Actions, Vite **substitui** literalmente todas as ocorrências de `import.meta.env.VITE_AZURE_CLIENT_ID` no código fonte pelo valor da env var de build. O `dist/index-*.js` que vai pro App Service teria o GUID **hardcoded como string literal**.
>
> **Implicações no modo clássico:**
> - Pra trocar `clientId` do frontend → **rebuild + redeploy** (3 min CI). Mexer env var no Portal não faz nada.
> - SPA é estática — mesmo bundle serve N usuários, CDN-friendly.
> - **Secrets NÃO podem ir no bundle** — qualquer um inspeciona DevTools. Por isso SPA NÃO tem `ClientSecret` — usa PKCE.
> - GUIDs (`clientId`, `tenantId`) **não são secrets** — vazar é OK (igual mostrar um e-mail). PKCE + Redirect URI controlam quem usa.

> **🔬 ANÁLISE BIT-A-BIT NOVA — Runtime config sem rebuild (Story 1.21, commit `c5b3172`) (90s — counter-argument ao trade-off acima)**
>
> O trade-off "rebuild + redeploy 3min pra trocar `clientId`" **foi atacado** em maio/2026. Agora o frontend deployed troca `clientId` em **~30 segundos** sem rebuild. Mecânica:
>
> **3 peças:**
>
> 1. **`public/config.js`** (servido AS-IS pelo `serve`, fora do bundle):
>    ```javascript
>    window.__APP_CONFIG__ = {
>      clientId: "__VITE_AZURE_CLIENT_ID__",       // placeholder literal
>      tenantId: "__VITE_AZURE_TENANT_ID__",
>      audience: "__VITE_AZURE_AUDIENCE__",
>      authServiceUrl: "__VITE_AUTHSERVICE_URL__"
>    };
>    ```
> 2. **`scripts/replace-runtime-config.sh`** (startup script do App Service — roda ANTES do `npx serve`):
>    ```bash
>    sed -i "s|__VITE_AZURE_CLIENT_ID__|${VITE_AZURE_CLIENT_ID}|g" /home/site/wwwroot/config.js
>    # ... mesmo pras outras 3 vars ...
>    exec npx serve -s /home/site/wwwroot -l 8080
>    ```
> 3. **`src/config/azure.ts`** — 3 fontes de config em ordem de prioridade:
>    - (1) `window.__APP_CONFIG__` (runtime) — usado em produção
>    - (2) `import.meta.env.VITE_*` (build-time) — fallback dev local com Vite
>    - (3) `DEFAULT_CLIENT_ID` constante — emergência
>    - Detecta placeholders não substituídos (forma `__VITE_*`) e cai pro próximo nível.
>
> **Passo prático ao vivo (45s — DEMO PRATICAMENTE GRATUITO PRA AULA):**
> 1. Portal Azure → `authservice-front-tftec` → **Configuration** → **Application settings**
> 2. Edita `VITE_AZURE_CLIENT_ID` → cola um GUID diferente (ex: o `recipe-1-aula-...` que criou no Step 1 do walkthrough)
> 3. **Save** → Portal pergunta "Restart now?" → **Yes**
> 4. ~30s depois: F5 no `authservice-front-tftec.azurewebsites.net` → DevTools Network → `config.js` → vê GUID NOVO. Login agora usa a App Reg nova **sem rebuild, sem GitHub Actions, sem CI/CD**.
> 5. Volta o GUID antigo, restart, F5 — voltou ao normal.
>
> **Prova "config.js veio do server" (15s):** DevTools → Sources → `/config.js` (NÃO o bundle). Vê `window.__APP_CONFIG__ = { clientId: "78345291-..." }`. Compara com bundle minificado — agora o bundle tem `window.__APP_CONFIG__?.clientId ?? import.meta.env.VITE_...` (lookup runtime), não mais GUID literal.
>
> **Trade-off:**
> - ✅ Troca config sem rebuild (operacional grande)
> - ✅ Mesmo bundle reusável entre stages (dev / staging / prod só mudam env vars)
> - ⚠️ Custo: 1 request HTTP extra pro `config.js` no page load (mínimo, `no-cache` header)
> - ⚠️ Setup de startup script no App Service (`az webapp config set --startup-file "bash /home/site/wwwroot/scripts/replace-runtime-config.sh"`) — config inicial only
>
> **Frase pra fechar:** *"SPA estática NÃO precisa ser config-immutável. Quem decide é arquitetura: bundle separado das settings = runtime config. Bundle com settings embedded = build-time. Microsoft Entra ID não se importa — ele vê apenas o `client_id` que chega no `/authorize`."*
>
> 📍 Spec completa: commit `c5b3172` (Story 1.21). Arquivos: `public/config.js`, `scripts/replace-runtime-config.sh`, `src/config/azure.ts`, `index.html` (script tag), `.github/workflows/deploy-azure.yml` (step que escreve app settings).

| 1:21 | VSCode → `src/App.tsx` linha do `MsalProvider`. Mostra wrapping da app inteira. | VSCode App.tsx | — | — |
| 1:22 | VSCode → `src/hooks/useAuthService.ts`. Mostra como SPA chama `acquireTokenSilent`. | VSCode useAuthService.ts | — | — |
| 1:24 | Switch backend: `api/Program.cs` linha `AddMicrosoftIdentityWebApi`. Explica que isso é tudo. | VSCode Program.cs | "Só isso?" | — |

> **🔬 ANÁLISE BIT-A-BIT — Token cache distribuído no backend (90s)**
>
> Quando backend faz OBO ou Client Credentials (Recipes 5, 6), o token recebido fica em **cache** pra não pedir token novo a cada request. Microsoft.Identity.Web tem 3 tipos de cache:
>
> | Tipo | Onde | Quando usar |
> |---|---|---|
> | **In-Memory** | RAM do process | Single instance dev/test. Reinicia = perde cache. |
> | **Distributed** (Redis/SQL) | Redis ou SQL Server | Multi-instance produção. Sticky sessions OU shared cache. |
> | **Distributed (msal-node-extensions)** | Linux: GNOME keyring; Windows: DPAPI; macOS: keychain | Desktop apps |
>
> **Configuração no `tftec-auth` (Program.cs:31-47):**
> ```csharp
> var redisConnectionString = builder.Configuration.GetValue<string>("Redis:ConnectionString");
> if (!string.IsNullOrEmpty(redisConnectionString))
> {
>     builder.Services.AddStackExchangeRedisCache(options => { ... });
> }
> else
> {
>     builder.Services.AddDistributedMemoryCache();   // fallback
> }
> ```
>
> **Por que Microsoft.Identity.Web cuida disso:**
> - OBO cache key: `obo:{targetApi}:{scopes}:{userToken.GetHashCode()}`
> - Client Credentials cache key: `cc:{targetApi}:{scopes}`
> - TTL: até `result.ExpiresOn - 5min` (buffer pra não dar miss durante request)
>
> **Mind-blow:** sem cache, EVERY single request fazia call a `https://login.microsoftonline.com/oauth2/v2.0/token` (~150-300ms latência). Com cache de 1h, 99% dos requests evita chamada externa. Performance gain enorme.
>
> **Quando aluno pergunta sobre escala:**
> *"Pra app single-instance, cache em memória basta. Pra multi-instance (load balancer + 5 app services), use Redis — todas as instances compartilham cache. Senão, cada instance vai pedir token próprio = 5x mais calls /token = rate limit Microsoft."*

> **🔬 ANÁLISE BIT-A-BIT — Microsoft.Identity.Web no startup (2min)**
>
> `builder.Services.AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"))` parece UMA linha. Por baixo do capô:
>
> **No startup (uma vez):**
> 1. Lê `AzureAd:*` da config (`appsettings.json` + env vars + Key Vault references)
> 2. Configura JWT Bearer authentication scheme:
>    - `Authority = "{Instance}{TenantId}"` (ex: `https://login.microsoftonline.com/organizations`)
>    - `ValidAudience = "{Audience}"` ou `"{ClientId}"`
>    - `Events.OnTokenValidated` → seu callback custom (multi-tenant validation, etc.)
> 3. Configura `MetadataAddress = "{Authority}/.well-known/openid-configuration"`
> 4. No primeiro request, .NET faz **GET** nesse metadata → recebe JSON com `jwks_uri`, `issuer`, `token_endpoint`, etc.
> 5. **GET no jwks_uri** → cache em memória das chaves públicas (refresh automático a cada 24h ou 401 force-refresh)
>
> **Em CADA request:**
> 1. Middleware lê `Authorization: Bearer eyJ...`
> 2. Decode header → pega `kid`
> 3. Busca chave pública no cache via `kid`
> 4. `RSA-Verify(public_key, payload, signature)` → valid?
> 5. Valida `iss`, `aud`, `exp`, `nbf` (auto)
> 6. Dispara `Events.OnTokenValidated` → seu código pode rejeitar (no `tftec-auth`, valida `tid` contra `AllowedTenants` — `Program.cs:65-74`)
> 7. Cria `HttpContext.User = ClaimsPrincipal(payload)` → controllers acessam claims
>
> **Multi-tenant trick** (no `tftec-auth`):
> ```csharp
> options.TokenValidationParameters.ValidateIssuer = false;  // pula validação built-in
> options.Events.OnTokenValidated = async context =>
> {
>     var tid = context.Principal?.FindFirst("tid")?.Value;
>     if (!tenantService.IsTenantAllowed(tid))
>         context.Fail("Tenant not allowed");
> };
> ```
> Sem `ValidateIssuer=false`, .NET rejeitaria qualquer issuer que não fosse o "ValidIssuer" hardcoded. Pra multi-tenant, isso quebra (cada cliente tem issuer único). Truque: desliga validação built-in + faz validação manual baseada em `tid` claim.
>
> **Demonstre (30s):** F12 no `tftec-auth` deployed → Network → pega um request `/auth/me` → mostra header `Authorization: Bearer eyJ...`. Aponta: "Esse JWT chega no backend, Microsoft.Identity.Web faz tudo que acabei de descrever em ~5ms."

| 1:25 | `api/appsettings.json` → seção `AzureAd`. Aponta `ClientId`, `Audience`. | VSCode appsettings.json | — | — |
| 1:26 | `api/Program.cs:80-98` → as 4 policies. **Recapitula:** `RequireRole` lê `roles`, `HasClaim("scp")` lê delegated. | VSCode Program.cs policies | Anotando | — |
| 1:28 | **⏸️ 2 min Q&A express:** "Quem tem dúvida de código antes de irmos pra debug?" | — | Pergunta | — |
| 1:29:30 | **➡️ Transition:** "Próximos 15 min: **eu quebro a App Reg de propósito. Vocês diagnosticam.**" | — | "Oba" | — |

**Marcador final:** 1:30 atingido.

---

## 🔥 Bloco 7 — Debug AADSTS LIVE (adversarial) (15 min)

📍 hands-on [Cap 9](../aula/hands-on.md#cap-9--debug-aadsts-comuns-5-min) + [FAQ](../aula/perguntas-frequentes.md)

> **Este é o highlight da aula. Não pule. Vc quebra, aluno diagnostica antes da revelação.**

| Min | 🎬 Você | Tela | 👥 Aluno | 🆘 Se travar |
|---|---|---|---|---|
| 1:30 | **Quebra 1:** Portal → Authentication → REMOVE o Redirect URI `http://localhost:5173/`. Salva. | Portal Authentication | — | — |
| 1:30:30 | Tab `localhost:5173` → F5 → Login → AADSTS50011. | Erro popup | "Já vimos esse!" | — |
| 1:31 | 🙋 "Quem identifica em 30s?" Espera. Aluno responde "Redirect URI mismatch". ✅ | — | Diagnostica | — |

> **🔬 ANÁLISE BIT-A-BIT — AADSTS error code anatomy (2min)**
>
> Todo erro `AADSTS` tem 5 dígitos. **Não é random — segue range significativo:**
>
> | Range | Stage do flow | Exemplos |
> |---|---|---|
> | `AADSTS50000-50199` | **Authorize stage** (login UI / consent) | 50011 (redirect mismatch), 50020 (user not in tenant), 50058 (no signed-in user), 50105 (entitlement missing) |
> | `AADSTS50200-50299` | **Authentication factor failure** | 50158 (external claims missing), 50194 (sign-in must use account in directory) |
> | `AADSTS65000-65099` | **Consent stage** | 65001 (consent required), 65004 (user declined consent) |
> | `AADSTS70000-70099` | **Token stage** (`/token` endpoint) | 70008 (code expired), 70021 (no federated credential match) |
> | `AADSTS75000-75099` | **WS-Federation specific** | 75011 (auth method mismatch) |
> | `AADSTS90000-90999` | **Generic/Other** | 90014 (required field missing), 90094 (admin consent required) |
> | `AADSTS7000000+` | **App-specific** | 7000218 (request body must contain), 7000229 (missing SP) |
>
> **Workflow de debug em 30s:**
> 1. Pegue o número AADSTS
> 2. Identifique o **stage** (authorize / consent / token)
> 3. Reproduza com Network tab aberto — vê qual request falhou
> 4. **Filtre por palavra-chave** no `error_description` (geralmente humana)
>
> **Pra cada erro do Bloco 7 (que vc vai quebrar):**
>
> - **AADSTS50011** (Redirect mismatch): stage authorize. Causa: `redirect_uri` no request difere de `replyUrls[]`. Fix: 1 char por vez.
> - **AADSTS50194 / 50158** (Single-tenant mas user vem de outro tenant): stage authorize. Causa: `signInAudience=AzureADMyOrg` + user é guest/external. Fix: mudar pra Multi OU adicionar user como member.
> - **AADSTS65001** (Consent missing): stage consent. Causa: permission não consentida OU user-not-consent-able sem admin consent. Fix: Grant admin consent OU reduzir permissions.
> - **AADSTS70021** (FIC no match): stage token. Causa: subject/issuer/audience do client_assertion não bate com FIC. Fix: confira branch (`main` vs `master`), repo exact, audience constante.
>
> **🙋 Pergunta deep:** "Por que Entra ID mostra erro detalhado nessas telas (`AADSTS...` + descrição)?" Resposta: Microsoft considera erro de configuração diferentes de erro de credencial. Credencial errada → tela genérica ("não foi possível fazer login"). **Configuração errada → erro detalhado pro DEV diagnosticar.** Em prod, oculte o ID/descrição do user final (UX) mas logue tudo.
| 1:32 | Conserta. Continua. | Portal | — | — |
| 1:33 | **Quebra 2:** Portal → Authentication → muda Supported account types pra **Single tenant**. Salva. | Portal supported account types | — | — |
| 1:34 | Logout + Login com SEU user (mesmo tenant). Funciona. Logout. **Login com user de outro tenant** (se houver) ou simula com endpoint customizado. → AADSTS50194 ou similar. | localhost:5173 com erro | "Tenant errado!" | Se single tenant não der erro: explica condição |
| 1:35 | 🙋 "Diagnóstico?" Espera. ✅ | — | Diagnostica | — |
| 1:36 | Volta pra multi-tenant. | Portal | — | — |
| 1:37 | **Quebra 3:** Portal → API permissions → REMOVE `User.Read`. Salva. **Não dá Grant admin consent.** | Portal API permissions | — | — |
| 1:38 | Logout + Login. → AADSTS65001 (consent missing). | Erro popup | — | — |
| 1:39 | 🙋 "Diagnóstico?" Espera. ✅ Revela. | — | — | — |
| 1:40 | Conserta (re-adiciona + Grant admin consent). | Portal | — | — |
| 1:41 | **Quebra 4 (bônus se sobrou tempo):** App role atribuído removido → SPA carrega mas faz call protegida → 403. | localhost:5173 + Network | — | — |
| 1:43 | **Sem mais quebra.** Pergunta: "Top 6 AADSTS — quem decorou?" Mostra Cap 9 do hands-on. | hands-on.md Cap 9 | Lendo | — |
| 1:44:30 | **➡️ Transition:** "Último bloco — síntese." | — | — | — |

**Marcador final:** 1:45 atingido.

---

## 🎯 Bloco 8 — Síntese + Q&A (15 min)

📍 [Apêndices do hands-on](../aula/hands-on.md) + [FAQ](../aula/perguntas-frequentes.md)

| Min | 🎬 Você | Tela | 👥 Aluno | 🆘 Se travar |
|---|---|---|---|---|
| 1:45 | Tab `/lab` Hub. **Mostra os 8 cards LIVE.** "Aqui vc continua. 8 módulos. Roadmap inteiro." | localhost:5173/lab | — | — |
| 1:46 | Cards específicos rápidos: `/lab/demo` (executa), `/lab/tokens` (decoder), `/lab/protocolos` (OIDC vs SAML vs WS-Fed bônus enterprise). | localhost:5173/lab/protocolos | "Tem protocolo antigo também?" | — |
| 1:48 | Tab GitHub repo público. "Cheat-sheet, FAQ, glossário, roadmap-avançado — tudo aqui." | GitHub repo | — | — |
| 1:50 | Q&A aberto. **Tab `perguntas-frequentes.md` com Ctrl+F na 2ª tela.** | hands-on/perguntas-frequentes.md | Pergunta livre | Se pergunta fora do FAQ: anota e responde async |
| 1:55 | "Faltam 5 min. Mais uma volta de perguntas." | — | — | — |
| 1:58 | "Próximos passos: (1) terminem o hands-on Cap 0-9 essa semana, (2) explorem `/lab` à vontade, (3) contribuam — PRs aceitos, vão pro mirror público." | GitHub repo público | — | — |
| 1:59:30 | **Encerramento:** "Obrigado. Café/cerveja lá fora." | — | Aplaude / sai | — |

**Marcador final:** 2:00 atingido. ✅

---

## 🧪 BLOCO 9 — Recipes deep-dive (capítulo bônus, 30-45 min — aula 2 ou pós-Q&A)

📍 `/lab/recipes` + `docs/aula/app-reg-recipes.md`

> **Quando usar este bloco:** se aula tem 2.5h, OU como segunda sessão "App Reg avançado", OU como follow-up async (gravar vídeo cobrindo isso). Cobre as **10 receitas** com análise bit-a-bit de cada uma — explica POR QUE cada uma tem decisões específicas.

### Estrutura sugerida pra cada receita (~3-5 min)

Em cada receita, alterna:
1. **Abre o card no `/lab/recipes`** (1 min — mostra cenário + decisões + setup)
2. **Análise bit-a-bit** (2-4 min — o que vou destacar abaixo)
3. **Quando faria ao vivo / quando só cita** (decisão sua)

---

### 🔬 Recipe 1 — SPA Pattern A (já demonstrada na aula principal)

> **Versão Cloud Shell ao vivo:** `from-zero-walkthrough.md` Step 1 cria `recipe-1-aula-{data}` paralela à `tftec-auth` deployed e usa pra comparação visual lado-a-lado no Portal.

**Análise bit-a-bit (3 min):**

A App Reg `tftec-auth` é literalmente Recipe 1. Não precisa criar nova. Mostre:
- Manifest no Portal: `signInAudience=AzureADMultipleOrgs`, `spa.redirectUris=[...]`, `identifierUris=["api://78345291-..."]`
- Por que `audience` próprio (não Graph): pra emitir token COM `aud=api://{client-id}` em vez de `aud=graph` — daí o backend valida com Microsoft.Identity.Web sem confundir com tokens do Graph.

**Comando deconstruction:**
```powershell
az ad app create --display-name X --sign-in-audience AzureADMultipleOrgs
```
→ **HTTP request real** que isso faz: `POST https://graph.microsoft.com/v1.0/applications` com body `{ "displayName": "X", "signInAudience": "AzureADMultipleOrgs" }`. Graph API retorna o `appId`. **`az` é só wrapper sobre o Graph.**

**Demonstre se quiser:** `az ad app create --display-name "demo" --sign-in-audience AzureADMultipleOrgs --debug` → mostra a chamada HTTP real ao Graph.

---

### 🔬 Recipe 2 — SPA + API separadas (Pattern B)

**Análise bit-a-bit (4 min):**

**Por que separar:** quando a API ganha 2º cliente. Mas separação tem custo:
- **2 App Regs = 2 lifecycles** (cada uma tem secrets, owners, audits independentes)
- **Cross-app permission** via `requiredResourceAccess[]` no manifest do Cliente — referencia `resourceAppId` da API + lista de `resourceAccess[]` (que são GUIDs de scopes/roles da API)

**Mecânica do consent cross-app:**
1. User loga no SPA Cliente
2. SPA pede token com `scope=api://{API_APP_ID}/access_as_user`
3. Entra ID:
   - Decoda scope → `audience=API_APP_ID`
   - Procura no SP do CLIENT (no tenant atual) o `oauth2PermissionGrants[]` referenciando esse scope
   - Se não tem → mostra tela consent
   - Se tem → emite token com `aud=API_APP_ID` e `appid=CLIENT_APP_ID`
4. SPA chama API com esse token. API valida `aud=API_APP_ID`.

**Mind-blow:** o token tem **2 identidades**: `appid` = cliente, `aud` = API. Auditoria sabe QUEM (cliente) chamou QUAL API.

**Quando ENSINAR ao vivo:** sim, é o "moment of clarity" pra Pattern A vs B. Crie 2 App Regs no Portal em 5 min, faça login no SPA cliente, mostre token aud diferente.

---

### 🔬 Recipe 3 — Web App ASP.NET MVC

**Análise bit-a-bit (3 min):**

**O grande shift do SPA pra Web:** quem segura o token muda. SPA: browser segura (memory/sessionStorage). Web: server segura (token cache distribuído).

**Cookies vs Bearer:**
- SPA → Bearer header em cada request (`Authorization: Bearer eyJ...`)
- Web → Cookie de sessão (`AspNetCore.Cookies` HttpOnly+Secure+SameSite=Lax). Browser MANDA cookie sozinho, JS não acessa.

**Por que cookie é mais seguro:**
- XSS NÃO consegue ler o token (HttpOnly)
- CSRF é mitigado por SameSite=Lax + anti-forgery token

**Trade-off:** servidor precisa de **token cache** (Microsoft.Identity.Web.TokenCache.Distributed) — Redis em escala horizontal, senão sticky sessions OU memory cache (perde tokens em deploy).

**Quando NÃO ensinar ao vivo:** requer projeto .NET MVC criado do zero. Cite + mostre snippet `appsettings.json` + Program.cs do Recipe 3 doc.

---

### 🔬 Recipe 4 — Mobile Android+MSAL

**Análise bit-a-bit (4 min — pra alunos com background mobile):**

**Por que broker?** Apps mobile rodam em sistema operacional MULTIuser-experience. SSO entre Outlook + Teams + seu app exige um **agente único** que segure tokens.

- Android: **Microsoft Authenticator** app. Se instalado, MSAL Android delega login + token storage pro broker via IPC (AccountManager Android API).
- iOS: **Authenticator** ou **Microsoft Edge**. Sem qualquer um, MSAL cai pra **ASWebAuthenticationSession** (WebView seguro).

**Device-bound tokens (TPM/Secure Enclave):**
- Token de refresh é encriptado com chave do **TPM** (Trusted Platform Module) do device.
- Mesmo se o device for clonado (backup), o refresh token NÃO descripta no novo device — TPM é único.
- Token cache no app é encriptado com mesma chave.

**Conditional Access integration:**
- Token broker reporta device compliance (Intune managed?, encrypted disk?, recent biometric auth?) → Entra ID aplica policy.
- Sem broker → device claims faltam → policies que exigem "compliant device" → bloqueia.

**Quando NÃO ensinar ao vivo:** requer Android Studio + emulador. Cite + mostra `Recipe 4` snippet Kotlin.

---

### 🔬 Recipe 5 — Daemon Client Secret

> **Versão Cloud Shell ao vivo:** `from-zero-walkthrough.md` Step 3 (~8min) cria `recipe-5-daemon-aula-{data}` + Client Secret + admin consent User.Read.All + token via `Invoke-RestMethod` + decode em jwt.ms. Mostra `roles=["User.Read.All"]` + ausência de `scp`/user oid — wow moment garantido.

**Análise bit-a-bit (3 min):**

**Client Credentials flow no fio:**
```http
POST https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=78345291-...
&client_secret=URL_ENCODED_SECRET
&scope=https%3A%2F%2Fgraph.microsoft.com%2F.default
```

**Por que `/.default` e não scope específico:**
- `/.default` significa "todas as Application permissions consentidas pela App Reg pra esse resource"
- Tradução: o daemon pede o que o ADMIN consentiu (não scope-by-scope)
- Se admin consentiu `User.Read.All` + `Mail.Read.All` na App Reg, o token vem com AMBOS em `roles[]`
- `.default` é OBRIGATÓRIO em Client Credentials flow (vs delegated onde scope-específico funciona)

**Por que admin consent obrigatório:**
- Application permission = app age "como administrador" do tenant (pode ler users de TODO mundo, etc.)
- User normal não pode consentir — só admin do tenant.

**Demonstre AO VIVO (5min):**
```powershell
# Cria App Reg + SP + Secret + Permission (~3min no Portal/CLI)
$APP_ID = az ad app create --display-name "recipe-5-demo" --query appId -o tsv
az ad sp create --id $APP_ID
$SECRET = az ad app credential reset --id $APP_ID --query password -o tsv
az ad app permission add --id $APP_ID --api 00000003-0000-0000-c000-000000000000 `
  --api-permissions df021288-bdef-4463-88db-98f22de89214=Role
az ad app permission admin-consent --id $APP_ID

# Pega token via curl
$body = "grant_type=client_credentials&client_id=$APP_ID&client_secret=$SECRET&scope=https%3A%2F%2Fgraph.microsoft.com%2F.default"
$resp = Invoke-RestMethod -Uri "https://login.microsoftonline.com/$TENANT_ID/oauth2/v2.0/token" -Method POST -ContentType "application/x-www-form-urlencoded" -Body $body
$TOKEN = $resp.access_token

# Decode em jwt.ms → mostra "roles": ["User.Read.All"], "appid": "...", SEM "scp", SEM user identity claims
```

**O que aluno vê na timeline:** scp ausente, roles presente, appid = daemon. **Audit log mostra appid, não user.** Esse é o ponto pedagógico.

---

### 🔬 Recipe 6 — Daemon FIC GitHub Actions

**Análise bit-a-bit:** já coberta no Bloco 5b (análise FIC trust mechanism — 3 min). Recipe 6 é versão concreta.

**Pra aprofundar (~2 min extras):**

**`audience: api://AzureADTokenExchange` — por que essa constante exata?**
- Microsoft escolheu uma string pra audience que sirva apenas pra **token exchange flow** (não pra emitir token de API)
- Garante isolamento: id_token GitHub com aud=`api://AzureADTokenExchange` NÃO pode ser usado contra outras APIs
- Constante hardcoded — qualquer outro audience falha o trust

**Subject patterns úteis:**
- `repo:org/repo:ref:refs/heads/main` — branch específica
- `repo:org/repo:ref:refs/heads/*` — wildcards NÃO funcionam em FIC. Pra cobrir múltiplas branches, crie FICs separadas.
- `repo:org/repo:environment:production` — Environment do GitHub (mais restritivo, recomendado)
- `repo:org/repo:pull_request` — Pull Requests (cuidado: PR externo de fork pode hijack)

**Demonstre ao vivo (3 min):** mostra a FIC já existente do `tftec-auth` no Portal → click em "Edit" → mostra issuer/subject/audience exatos. Compara com snippet do workflow.

---

### 🔬 BÔNUS — B2C vs Entra External ID for Customers (analise bit-a-bit, 3 min)

> **Pergunta que sempre aparece:** *"E B2C? Microsoft mudou pra External ID, né? Posso continuar usando o Azure AD B2C?"*. Tópico onde a Turma 02 ficou no escuro — Microsoft anunciou retirement do Azure AD B2C mas o caminho de migração não está cristalino.

**Estado atual (2026-05):**

| Produto | Status | Quando criado | Cenários de uso |
|---|---|---|---|
| **Azure AD B2C** | 🟡 Em retirement gradual (no new tenants) | 2018 | Apps consumer com social login (Google, Facebook, Apple). Limitação: 50K MAU free, depois pago. |
| **Microsoft Entra External ID for Customers** | ✅ Produto atual recomendado | 2024 (GA) | Mesmo cenário consumer, com infra simplificada (sem segundo tenant separado) |

**Diferença arquitetural FUNDAMENTAL:**

- **Azure AD B2C (legacy):** criava um **TENANT SEPARADO** com `.onmicrosoft.com` próprio. Você gerencia 2 tenants distintos: workforce (funcionários) + B2C (clientes consumer). Confusão clássica: cliente provisionava VM no tenant B2C achando que era o workforce → caos.
- **External ID for Customers (atual):** **MESMO tenant** do workforce, com flag de "external collaboration" + "customers" tenant type. Sem segundo tenant.

**Quando o Customer Tenant ainda faz sentido (External ID):**

- ✅ App consumer (Xbox-like): users criam conta com email/Google/Facebook social
- ✅ B2B-to-Consumer (e-commerce, banco, varejo)
- ✅ Você NÃO quer misturar identidades de funcionários com clientes
- ❌ B2B parceiros corporativos → usa **multi-tenant standard** (Recipe 7), não Customer tenant

**Migração B2C → External ID:**

Microsoft anunciou em mai/2024 que **não cria mais tenants B2C novos**. Existing tenants continuam funcionando (com data de retirement futura ainda incerta). Path de migração:
1. Avalie quais user flows / IEF policies usa
2. Crie External ID tenant novo
3. Migre users via Graph API (não há "import direto" — é re-cadastro ou social-login linking)
4. Atualize URLs MSAL: `b2clogin.com` → `ciamlogin.com`
5. Atualize policies via Microsoft Graph (não há IEF custom policies no External ID)

**Frase pra responder ao aluno:**
*"Se você JÁ tem B2C em produção: mantém funcionando, planeja migração quando Microsoft anunciar deadline firme. Se está começando hoje: usa External ID for Customers direto. NÃO crie novo B2C tenant — Microsoft já fechou esse path."*

**Mind-blow técnico:** External ID for Customers é tecnicamente um **tipo de tenant** diferente — `tenantType=CIAM` (Customer Identity Access Management). Coexiste com seu `workforce` tenant. App Reg pode existir em qualquer um, mas user pool é separado.

**Onde NÃO entrar em detalhes na aula:**
- IEF custom policies (B2C only, deep XML — pesadelo). External ID resolveu isso movendo pra Graph API simples.
- Custom domains (`auth.mycompany.com`) — funciona em ambos mas config diferente.
- B2B vs B2C diferença — já cobre `/lab/multi-app` Tab 3.

📍 **Recipe 7** cobre **B2B multi-tenant** (corporate Entra ID parceiros). Pra **B2C consumer**, External ID é o caminho mas não tem receita dedicada — fora do escopo `tftec-auth` que é B2B.

---

### 🔬 Recipe 7 — B2B SaaS multi-tenant

**Análise bit-a-bit (4 min):**

**Guest user object provisioning:**
1. Admin do SEU tenant convida `fulano@cliente.com` via Entra ID → Users → External identities → Invite user
2. Entra ID cria `User` object no SEU tenant com:
   - `userPrincipalName = fulano_cliente.com#EXT#@seutenant.onmicrosoft.com`
   - `userType = Guest`
   - `mail = fulano@cliente.com`
3. Quando fulano loga no seu SaaS, fluxo:
   - SPA → `/authorize` (tenant home dele OU `common` authority)
   - Entra ID identifica como guest no SEU tenant
   - **Token emitido COM 2 issuers:** `iss = seutenant` (recurso), `idp = clientetenant` (origem)

**Claims diferentes em guest user:**
```json
{
  "aud": "api://your-saas",
  "iss": "https://sts.windows.net/seu-tenant/",     // seu tenant emitiu
  "tid": "seu-tenant-id",                            // tenant do recurso (seu)
  "idp": "https://sts.windows.net/cliente-tenant/", // tenant ORIGEM do guest
  "oid": "guid-do-guest-NO-SEU-TENANT",              // oid local, NÃO o oid original
  "sub": "...",
  "unique_name": "fulano_cliente.com#EXT#@seutenant.onmicrosoft.com"
}
```

**Pegada importante:** `oid` é LOCAL ao tenant que emitiu. **Mesmo guest user tem `oid` diferente no tenant origem vs. no SEU tenant.** Pra correlacionar identidade real cross-tenant, use `idp + sub` (que é estável no tenant origem).

**Quando ensinar ao vivo:** se tiver um colega/test account em outro tenant Microsoft, faça login com ele → decoda token → mostra `idp` aparecer. Wow moment.

---

### 🔬 Recipe 8 — AKS Workload Identity

**Análise bit-a-bit (4 min — pra audiência com background k8s):**

**Por que Workload Identity substitui Pod Identity:**
- Pod Identity (legacy) usava DaemonSet + iptables hijack pra interceptar requests pro IMDS endpoint (169.254.169.254). Frágil + segurança questionável.
- Workload Identity usa **OIDC federation + projected service account tokens** (Kubernetes 1.21+). Native, sem hack de rede.

**Token projection mechanism:**
1. AKS habilita `oidc-issuer` → cluster expõe `https://oidc.prod-aks.azure.com/{cluster-uuid}/`
2. Quando você cria um Pod com:
   ```yaml
   spec:
     serviceAccountName: my-sa
     containers:
       - name: app
         # workload-identity mutation webhook adiciona:
         # volumeMounts:
         #   - name: azure-identity-token
         #     mountPath: /var/run/secrets/azure/tokens
         #     readOnly: true
   ```
3. **Mutating Admission Webhook** (`azure-workload-identity-webhook`) intercepta o pod spec → injeta:
   - `volume` de tipo `projected` com `serviceAccountToken` source
   - `audience: api://AzureADTokenExchange`
   - `expirationSeconds: 3600`
   - Kubernetes monta arquivo `/var/run/secrets/azure/tokens/azure-identity-token` com JWT renovado automaticamente
4. Quando app chama `DefaultAzureCredential.GetToken(...)`:
   - Detecta env var `AZURE_FEDERATED_TOKEN_FILE` (também injetado pelo webhook)
   - Lê o JWT desse arquivo
   - Faz token exchange contra Entra ID `/oauth2/v2.0/token` com `client_assertion`
   - Entra ID valida FIC (subject = `system:serviceaccount:{ns}:{sa}`) → emite access_token

**Mind-blow:** o token JWT é renovado a CADA HORA pelo kubelet automático. App nunca toca nesse refresh.

**Quando ensinar ao vivo:** só se tiver cluster AKS rodando E aluno tem fluência k8s. Senão, cite + mostra snippet manifest.

---

### 🔬 Recipe 9 — Custom Claims

> **Versão Cloud Shell ao vivo:** `from-zero-walkthrough.md` Step 2 cria App Role `Admin` na `tftec-auth` deployed via `az ad app update --app-roles $json`, atribui você via Enterprise apps, faz logout/login em `authservice-front-tftec` e mostra `roles=["Admin"]` no token real.

**Análise bit-a-bit (3 min):**

**Optional Claims via Manifest:**
```json
"optionalClaims": {
  "idToken":     [{ "name": "email" }, { "name": "groups" }],
  "accessToken": [{ "name": "email" }, { "name": "groups" }, { "name": "ipaddr" }],
  "saml2Token":  []
}
```

**Por que separado por token type:**
- ID Token: feito pro cliente "saber QUEM é o user" — claims que ajudam UX
- Access Token: feito pra API "autorizar" — claims que afetam decisões de autz (ipaddr pra geo-fence, groups pra RBAC)
- SAML: pra apps SAML 2.0 (Enterprise apps na Gallery)

**App Roles vs Groups:**
- App Roles: definidos no MANIFEST da App Reg. Apenas pra esse app. Atribuídos via Enterprise applications → Users and groups. Claim: `roles`.
- Groups: definidos no tenant (Entra ID groups). Geral. Atribuídos como membership. Claim: `groups` (mas precisa habilitar Token configuration → Add groups claim).

**Mind-blow:** **`roles` é o MESMO claim usado pra App Roles E pra Application permissions!** ASP.NET Core `RequireRole("Admin")` funciona com ambos sem distinção.

**Demonstre:** abre Manifest da App Reg → mostra `appRoles[]` + `optionalClaims`. Faz logout/login no SPA → decode → vê `roles=["Admin"]` (que você atribuiu na Story 1.10).

---

### 🔬 Recipe 10 — Swagger UI com OAuth2 ✅ ATIVO EM PRODUÇÃO

> **Status maio/2026:** Recipe 10 está **deployed e funcional** em `https://authservice-api-tftec.azurewebsites.net/swagger`. Implementação merged em commit `3b88360` (Story 1.18/1.20). Antes era só doc — agora botão **Authorize** abre popup MSAL real, troca code por token, injeta `Bearer` em todos os `Try it out`.

**Análise bit-a-bit (3 min):**

**Como Swagger UI faz Auth Code + PKCE sem você escrever JS:**
1. Swashbuckle gera HTML `/swagger/index.html` com `swagger-ui-bundle.js` (vendored).
2. Configurado no `api/Program.cs` (deployed, commit `3b88360`):
   ```csharp
   // SecurityDefinition declarada no AddSwaggerGen (Program.cs:128-150 aprox)
   c.AddSecurityDefinition("oauth2", new OpenApiSecurityScheme
   {
       Type = SecuritySchemeType.OAuth2,
       Description = "Auth Code + PKCE via Microsoft Entra ID",
       Flows = new OpenApiOAuthFlows
       {
           AuthorizationCode = new OpenApiOAuthFlow
           {
               AuthorizationUrl = new Uri($"https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/authorize"),
               TokenUrl         = new Uri($"https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token"),
               Scopes           = new Dictionary<string,string> { [swaggerScope] = "Access API" }
           }
       }
   });
   // Bearer mantido como fallback (cola token manual pra debug)

   // No UseSwaggerUI (Program.cs:195-200 aprox)
   c.OAuthClientId(swaggerClientId);   // lê AzureAd:ClientId do config
   c.OAuthUsePkce();                   // sem isso → AADSTS9002326
   c.OAuthScopes(swaggerScope);        // "api://{clientId}/access_as_user"
   c.OAuthScopeSeparator(" ");
   ```
3. No HTML servido, isso vira:
   ```javascript
   window.ui = SwaggerUIBundle({
     oauth2RedirectUrl: window.location.origin + "/swagger/oauth2-redirect.html",
     ...
   });
   window.ui.initOAuth({
     clientId: "78345291-2586-4691-b1f9-e4e780f55328",
     usePkceWithAuthorizationCodeGrant: true,
     scopes: "api://78345291-.../access_as_user"
   });
   ```
4. Quando user clica Authorize:
   - Swagger UI gera `code_verifier` + `code_challenge` (PKCE)
   - Abre popup → `/authorize?client_id=...&redirect_uri={origin}/swagger/oauth2-redirect.html&code_challenge=...`
   - Microsoft Entra ID retorna code via redirect pro `/swagger/oauth2-redirect.html`
   - Esse arquivo (vendored em Swashbuckle) faz `postMessage(code)` pro window pai
   - Swagger UI faz `/token` request com `code + code_verifier`
   - Salva `access_token` em memory (NÃO localStorage — segurança)
5. Próximas chamadas `Try it out`: header `Authorization: Bearer {token}` é injetado automaticamente.

**Pré-requisito crítico (JÁ FEITO em prod):** App Reg `tftec-auth` tem **3 SPA Redirect URIs** — `http://localhost:8080`, `https://authservice-front-tftec.azurewebsites.net`, e `https://authservice-api-tftec.azurewebsites.net/swagger/oauth2-redirect.html`. O 3º é o que habilita o Authorize do Swagger. Se aluno reproduz em outra App Reg, precisa adicionar esse Redirect URI via `az ad app update --set spa.redirectUris=...` (Step 4 do `from-zero-walkthrough.md` faz exatamente isso).

**Validação rápida (15s — mostra que está realmente ativo):**
```powershell
# Confirma SecuritySchemes oauth2 + Bearer no swagger.json deployed
curl https://authservice-api-tftec.azurewebsites.net/swagger/v1/swagger.json | ConvertFrom-Json | `
  Select-Object -ExpandProperty components | Select-Object -ExpandProperty securitySchemes
# Esperado: 2 keys → "oauth2" (Type=oauth2, AuthorizationCode flow) + "Bearer" (Type=http)
```

**Mind-blow:** Swagger UI é literalmente uma **SPA** rodando dentro do `/swagger`. Auth Code + PKCE flow + CORS — tudo isso aplica. Por isso registrar como SPA platform (não Web).

**Demonstre AO VIVO (3min — sem Plano A/B, OAuth está ATIVO):**
1. Abre `https://authservice-api-tftec.azurewebsites.net/swagger`
2. Click 🔐 **Authorize** → modal mostra `oauth2 (OAuth2, authorizationCode + PKCE)` E `Bearer` como opções
3. Click Authorize do oauth2 → popup Microsoft → login com sua conta → consent (se primeira vez)
4. Volta pro Swagger UI com "Authorized" verde → fecha modal
5. Try `GET /auth/me` → **200 com seus claims** (`oid`, `tid`, `roles=["Admin"]` se Story 1.10/Step 2 do walkthrough rodou)
6. F12 → Network → última request → header `Authorization: Bearer eyJ...` injetado automaticamente

**Se popup bloqueado:** ative pop-ups pra `authservice-api-tftec.azurewebsites.net` nos settings do browser. Comum em corp browsers.

---

## 🌟 BÔNUS — Se sobrou 5-10 min (raro)

**Tópico:** FIC end-to-end no backend.

| Min | 🎬 Você | Tela | 👥 Aluno |
|---|---|---|---|
| +0 | Tab `/lab/credenciais` → Tab FIC + workflow real. "Olha o CI/CD usa FIC. Mas backend ainda lê secret." | /lab/credenciais Tab FIC | "Como elimina?" |
| +2 | Tab `docs/aula/fic-end-to-end-migration.md` no GitHub. Mostra step-by-step de Managed Identity como FIC. | GitHub doc | — |
| +4 | Tab GitHub branch `feat/fic-end-to-end`. "Tem implementação pronta. Feature flag — opt-in." | GitHub branch | "Genial" |
| +6 | "Demo de mão na massa: outra aula. Hoje fica como teaser." | — | — |

---

## 🆘 Plano B detalhado — se algo travar

> **Track A (Cloud Shell + deployed) elimina ~60% dos cenários abaixo de uma só vez.** Se tudo der errado local, **bote o `from-zero-walkthrough.md` na mesa e migra ao vivo pra Cloud Shell + apps deployed.** Aluno nem nota.

### Cenário: Portal Azure lento (>5s por click)

**Sintoma:** click → spinner → atraso.

**Fallback imediato:**
1. F5 no Portal. Espera 5s.
2. Se persistir: troca pra **Cloud Shell** (https://shell.azure.com) e usa `az` CLI ao vivo. `cheat-sheet.md` tem os comandos. `from-zero-walkthrough.md` Step 1-5 inteirinho roda via Cloud Shell.
3. Se Portal totalmente off: anuncia "Azure Portal tá lento. Vou narrar via terminal." Cloud Shell é endpoint diferente — geralmente sobrevive.

### Cenário: `localhost:5173` não abre (porta ocupada) — Track B

**Sintoma:** `npm run dev` falha.

**Fallback:**
1. Terminal 2: `npx kill-port 5173` (ou `5174` se Vite shift).
2. `npm run dev` de novo. Vite escolherá outra porta automática. **Atualize Redirect URI no Portal pra match** (5174, 5175, etc.).
3. **Solução definitiva:** **migra pra Track A** — troca pra `tftec-auth` deployed (`https://authservice-front-tftec.azurewebsites.net`). Login Microsoft real → mesma demo, sem porta local. Story 1.21 garante que se quiser apontar SPA deployed pra OUTRA App Reg (a `recipe-1-aula-...` criada ao vivo), basta env var no Portal + restart (~30s) — vide análise bit-a-bit "Runtime config".

### Cenário: backend `localhost:8080`/`localhost:5001` não sobe — Track B

**Sintoma:** API health 502 ou conn refused.

**Fallback:**
1. Terminal: `cd api && dotnet run` de novo.
2. Se compile error: `dotnet restore` primeiro.
3. **Solução definitiva:** **migra pra Track A** — troca pra backend deployed (`https://authservice-api-tftec.azurewebsites.net`). `.env.local` aponta pra ele. `/swagger` lá em cima tem OAuth Authorize ativo (Recipe 10) — pode demonstrar 100% das funcionalidades sem subir nada local.

### Cenário: Cloud Shell não inicia / pede pra criar storage

**Sintoma:** `shell.azure.com` mostra "You have no storage mounted" e pede configuração.

**Fallback:**
1. Click "Show advanced settings" → seleciona Subscription + Region → "Attach" ou "Create new storage". Demora ~1min.
2. Se ainda travar: usa `cloudshell.azure.com` (mesma coisa, URL alternativa).
3. Como último recurso: usa Azure CLI **local** no notebook do instrutor (`az` já autenticado em `pre-aula`). Mostra o comando rodando local — semântica é idêntica, só não é "no Azure".

### Cenário: Login Microsoft trava com MFA

**Sintoma:** popup MSAL fica em loop ou pede MFA infinitamente.

**Fallback:**
1. `sessionStorage.clear()` no DevTools Console.
2. F5.
3. Se persiste: usa o **`tftec-auth-DEMO-BACKUP`** App Reg (já configurado, sem MFA enforcement no teu user).
4. Última opção: usa conta de aluno emprestada que já logou na pre-aula.

### Cenário: Aluno trava no Cap 2 (não consegue criar App Reg)

**Sintomas comuns:**
- "Erro: Insufficient privileges to complete the operation"
- Lista App Reg vazia / não acessa

**Fallback:**
1. Confirma tenant — aluno tá no tenant pessoal dele OU no TFTEC? Se TFTEC, precisa role temporária (Application Developer).
2. **Plano alternativo:** aluno usa tenant pessoal dele (gratuito, qualquer hotmail/outlook cria). Cria App Reg lá.
3. **Plano final:** dupla com colega que conseguiu. Em sala, é normal 10-20% travarem aqui — agrupa.

### Cenário: AADSTS7000229 em alunos (multi-tenant + falta SP)

**Sintoma:** aluno criou App Reg multi-tenant, mas login falha com 7000229.

**Fallback:**
1. Solução rápida: aluno acessa `https://login.microsoftonline.com/{tenant}/adminconsent?client_id={app-id}` no browser dele. Aceita.
2. Ou via CLI: `az ad sp create --id <APP_ID>`.
3. Demo no `/lab/multi-app` Tab 2 já mostra exatamente isso — referencia ao vivo.

### Cenário: Internet/WiFi cai

**Sintoma:** sem rede pra projetor / sem `localhost` (improvável, mas...).

**Fallback:**
1. Hotspot do celular (já testado pre-aula?).
2. Se hotspot lento: muda pra modo "narrar com diagramas" — usa screenshots e Mermaid no VSCode aberto offline. hands-on.md, slides.md são offline.

---

## 📦 Pós-aula — Checklist 10 min depois

| Item | 🎬 Ação |
|---|---|
| Encerrar serviços locais | `Ctrl+C` no `npm run dev` e `dotnet run`. Mata processos órfãos com `taskkill /f /im node.exe /im dotnet.exe`. |
| App Reg lixo | Lista de App Regs criadas por alunos hoje. Se eram só pra aula: cleanup script ou pede pra deletarem no fim. |
| Coletar feedback | Forms simples ou Slack `#tftec-masters` — 3 perguntas: o que mais funcionou, o que mais confundiu, sugestão. |
| Lista de issues | Anota TUDO que travou: lentidão Portal, AADSTS específicos, erros em alunos. Issues no repo público ou tarefa pessoal. |
| Atualizar FAQ | Perguntas novas do Q&A → adiciona em `perguntas-frequentes.md` antes da próxima turma. |
| Marp PDF dos slides | Se mudou conteúdo: `npx @marp-team/marp-cli docs/aula/slides.md --pdf`. |

---

## 🎓 Estados emocionais previstos da turma

| Bloco | Onde aluno se sente perdido | Sinais | Sua mitigação |
|---|---|---|---|
| 2 (Quadro mental) | "App Reg vs SP vs Enterprise app — confunde" | Cara confusa, mão hesitante | Volta pra Portal 2-up no Bloco 2 e repete |
| 3 (Criar App Reg) | Setup do `.env.local` errado | "Não tá logando" | `localhost:5173` mostra erro no console — abre DevTools junto |
| 4 (Tokens) | "Por que tantos tokens?" | Anotação confusa | Repete `/lab/tokens` Tab "ID vs Access" |
| 5 (Permissions) | "scp vs roles — qual eu uso?" | Quietude estranha | `/lab/permissions-claims` Tab 1 + Tab 2 visualiza |
| 6 (Multi-tenant) | "Pattern A ou B?" | Pergunta repetida | "Comece com A. Migra quando aparecer 2º consumidor." Cap 7 hands-on é definitivo. |
| 7 (Debug LIVE) | Aluno **acerta** o diagnóstico | Cara de orgulho | Reforça: "Você acabou de fazer o que MVPs Microsoft fazem em prod." |
| 8 (Q&A) | Pergunta que você não sabe | Hesitação sua | "Vou voltar com a resposta no Slack." Anota. Não invente. |

---

## 📚 Referências cruzadas

| Material | Quando consultar |
|---|---|
| `docs/aula/from-zero-walkthrough.md` | **Track A — aula 100% Azure via Cloud Shell + Portal + deployed apps.** Use como roteiro primário se vai dar Track A. |
| `docs/playbook/roteiro-aula.md` | Pra script narrativo (falas-chave) de cada bloco |
| `docs/aula/hands-on.md` | Espinha dorsal — aluno acompanha em paralelo |
| `docs/aula/cheat-sheet.md` | Comandos `az` ao vivo se precisar |
| `docs/aula/perguntas-frequentes.md` | Q&A do Bloco 8 com `Ctrl+F` |
| `docs/aula/glossario.md` | Termos que você usa e aluno pergunta |
| `docs/aula/lab-modules-roadmap.md` | Recap do `/lab` no Bloco 8 |
| `docs/aula/fic-end-to-end-migration.md` | BÔNUS se sobrar tempo (avançado) |
| `.github/workflows/deploy-azure.yml` | Mostrar workflow real no Bloco 5b (FIC) |
| `api/Program.cs:80-98` | Snippet das policies no Bloco 5a + 6b |
| `api/Program.cs:128-200` (commit `3b88360`) | Swagger OAuth2 SecurityDefinition + UseSwaggerUI OAuthClientId/OAuthUsePkce — Bloco 9 Recipe 10 |
| `public/config.js` + `scripts/replace-runtime-config.sh` + `src/config/azure.ts` (commit `c5b3172`) | Runtime config sem rebuild — Bloco 6b análise nova |

---

**Última nota:** confiança > script. Decora os 2-3 momentos críticos (Bloco 4 quebra Redirect URI; Bloco 7 adversarial). O resto pode improvisar olhando este guia na 2ª tela.

Boa aula. — Orion 🎯
