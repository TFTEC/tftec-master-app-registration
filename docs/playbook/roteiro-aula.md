---
title: "Roteiro de aula — App Registration na prática"
audience: "TFTEC Masters (devs intermediários, ~10-25 alunos)"
duration: "2h"
format: "Presencial ou remoto via Teams/Meet"
companion:
  - "docs/aula/hands-on.md (espinha dorsal conceitual — alunos consultam)"
  - "docs/aula/from-zero-walkthrough.md (roteiro paralelo 100% Cloud Shell + Portal — sem app local)"
  - "docs/aula/app-reg-recipes.md (10 receitas pós-aula)"
last_updated: 2026-05-13
---

# Roteiro de aula — App Registration na prática

> Script fino narrativo de **8 blocos = 2h**. Aponta pro [hands-on.md](../aula/hands-on.md) em cada bloco — não duplica comandos, code blocks ou explicações teóricas.
> Use junto: hands-on.md em uma tela, este roteiro na 2ª tela ou impresso.
>
> 🌐 **Modo "100% Azure" (default 2026-05+):** a aula NÃO depende de app rodando local. Tudo via **Cloud Shell** (`https://shell.azure.com`) + **Portal Azure** + apps deployed (`https://authservice-front-tftec.azurewebsites.net` e `.../authservice-api-tftec.azurewebsites.net`). Veja [from-zero-walkthrough.md](../aula/from-zero-walkthrough.md) pro fluxo paralelo cobrindo Pre-Step 0 → Step 5 + cleanup.
>
> 💡 **Primeira vez dando esta aula?** Veja antes o [guia detalhado minute-by-minute](./guia-instrutor-detalhado.md) — é screen-centric (qual aba, qual click, qual fallback, análises bit-a-bit de telas Portal), enquanto este roteiro é narrativo (o que dizer e quando). Não duplique — referencie.

## Como usar este roteiro

- Cada bloco tem: **⏱️ timing**, **→ hands-on cap**, **🎬 cues de demo**, **🙋 perguntas pra turma**, **⏸️ pausas pra alunos**, **➡️ transition pro próximo**.
- Não há comandos `az` ou code blocks longos aqui — eles estão no [hands-on](../aula/hands-on.md) e no [cheat-sheet](../aula/cheat-sheet.md). Se precisar de comando ao vivo, lê de lá.
- **Tom**: cronológico/narrativo. Você narra; aluno executa.
- Bloco 7 é **adversarial**: você quebra a App Reg de propósito, aluno diagnostica antes da revelação. É o highlight da aula — não pule.

---

## ⏱️ Timeline resumido

| # | Bloco | Min | Acumulado | → Hands-on cap |
|---|-------|-----|-----------|----------------|
| 1 | Abertura | 5 | 0:05 | (só slides) |
| 2 | Quadro mental + tipos de app | 10 | 0:15 | Cap 0 + Cap 1 |
| 3 | Criar App Reg ao vivo | 15 | 0:30 | Cap 2 |
| 4 | URLs + Tokens (quebra deliberada) | 20 | 0:50 | Cap 3 + Cap 4 |
| 5 | Permissions + Credenciais | 20 | 1:10 | Cap 5 + Cap 6 |
| 6 | Multi-tenant + integrar no código | 20 | 1:30 | Cap 7 + Cap 8 |
| 7 | Debug AADSTS LIVE (adversarial) | 15 | 1:45 | Cap 9 |
| 8 | Síntese + Q&A | 15 | 2:00 | Apêndices |

---

## 🔧 Pre-aula — Checklist 15min antes (19:45 se aula 20h)

### Setup do projetor / share (modo 100% Azure — default)
- [ ] Resolução do projetor 1920x1080
- [ ] **Tela 1 (foco da turma):** Portal Azure em `https://portal.azure.com` → Entra ID → App registrations
- [ ] **Tela 2 (terminal):** Cloud Shell em `https://shell.azure.com` (PowerShell), `az account show` já confirma tenant TFTEC
- [ ] **Tela 3 (frontend deployed):** `https://authservice-front-tftec.azurewebsites.net/lab/recipes` aberto e logado (Hub dos 9 labs acessível pela sidebar)
- [ ] **Tela 4 (utilitários):** `https://jwt.ms`, [FAQ](../aula/perguntas-frequentes.md) aberto pra ctrl+F, este roteiro
- [ ] Browser tabs extras: GitHub repo público, `.../authservice-api-tftec.azurewebsites.net/swagger` (Recipe 10 — Swagger OAuth funcional)

### Confirmar serviços
- [ ] `az account show` mostra subscription `Microsoft AS - Github Enterprise - Partner` (`3075a5eb-...`)
- [ ] Frontend deployed: `https://authservice-front-tftec.azurewebsites.net` carrega; login funciona
- [ ] Backend deployed: `https://authservice-api-tftec.azurewebsites.net/health` = `Healthy`
- [ ] Swagger deployed: `https://authservice-api-tftec.azurewebsites.net/swagger` mostra botão **Authorize** (OAuth flow Recipe 10 ativo)
- [ ] App Reg `tftec-auth` (Client ID `78345291-...`) intacta — Secret válido até 2026-10-26
- [ ] App Reg backup `tftec-auth-DEMO-BACKUP` existe (Plano C se a principal quebrar)

### Plano B fallback — app local (só se Cloud Shell ou rede Azure falhar)
- [ ] `tftec-auth` clonado e buildado localmente
- [ ] Backend `localhost:5000/health` ou `localhost:5001/health` = `Healthy` (perfis HTTP/HTTPS)
- [ ] Frontend `localhost:8080` abre (Vite — **porta 8080, NÃO 5173**; confira `vite.config.ts`)
- [ ] Redirect URI `http://localhost:8080` adicionado na App Reg da demo

### Materiais à mão
- [ ] [Cheat-sheet](../aula/cheat-sheet.md) impresso ou tela auxiliar
- [ ] Lista de Client IDs dos alunos vazia mas pronta (você vai anotar pra debug)
- [ ] Link curto/QR do repo público pra projetar no Bloco 1

### Plano B (se algo quebrar)
- **Cloud Shell lento ou off:** cai pro Plano B (app local) ou usa Portal puro + slide-by-slide do [guia detalhado](./guia-instrutor-detalhado.md).
- **Portal lento (>5s por click):** se tem screencast curto de cada cena, troca pra screencast. Se não, narra com diagrama no whiteboard.
- **Frontend deployed off (HTTP 502):** demonstra pela `.../authservice-api-tftec.azurewebsites.net/swagger` direto (Bloco 4 usa Swagger OAuth ao invés do frontend — Recipe 10 já implementada).
- **Sua App Reg principal deletada/quebrada:** use o backup `tftec-auth-DEMO-BACKUP`.
- **Runtime config trocou Client ID errado:** restart do App Service (App Service → Overview → Restart) volta ao default. Veja Story 1.21 / Bloco 8 (runtime config sem rebuild).
- **Aluno trava no Cap 2:** monitor cruzado — dupla com colega que já passou.

---

## 🎤 Bloco 1 — Abertura (5 min)

**⏱️ 0:00 → 0:05**
**→ Slides 1-6 ([docs/aula/slides.md](../aula/slides.md))**

### O que mostrar
Projeta slides 1 a 6 sequencialmente. Tela única (não compartilhe IDE/portal ainda).

### Falas-chave (paráfrase, não decorada)

**Slide 1 (Cover, 30s):** "Boa noite. Hoje vamos atacar o inimigo que todo dev Microsoft odeia. Provocação direta:"

**Slide 2 (Hook, 1min):** mostra `AADSTS50011`. **🙋 Pergunta**: "Quem aqui já apanhou de Redirect URI mismatch? Mão pra cima." *Espera mãos.* "Quem nunca conseguiu fazer login Microsoft funcionar e xingou o Azure?"

**Slide 3 (Outros AADSTS, 1min):** "Esses 5 são 90% dos erros que vc vai encontrar. Cada um tem causa rastreável. Hoje vc vai diagnosticar em 30 segundos cada um."

**Slide 4 (Promise, 1min):** lê os 6 bullets. "Tudo isso em 2 horas. Não é magic — é metódico."

**Slide 5 (Mapa, 1min):** mostra a timeline. "8 blocos. 50% você executando, 50% eu narrando. Hands-on.md no GitHub é a espinha dorsal. Aberto agora?"

**Slide 6 (Handoff, 30s):** projeta QR/URL do repo. "Vou referenciar o app `tftec-auth` deployed o tempo todo — `authservice-front-tftec.azurewebsites.net`. Lá tem **9 labs interativos** (Demo, Tokens, Fluxos, Topologias, Permissions & Claims, Credenciais, Multi-App, Protocolos, Recipes) que aprofundam cada bloco. Quem quiser o código: repo público no GitHub."

### ⏸️ Pausa
30s pra alunos abrirem o frontend deployed em `https://authservice-front-tftec.azurewebsites.net` e fazerem login com a conta Microsoft.

### ➡️ Transition
"Antes de criar a primeira App Reg, 2 minutos de quadro mental — pra não confundir App Reg com Service Principal e Enterprise Application."

---

## 📊 Bloco 2 — Quadro mental + tipos de app (10 min)

**⏱️ 0:05 → 0:15**
**→ hands-on [Cap 0](../aula/hands-on.md#cap-0--quadro-mental-2-min) + [Cap 1](../aula/hands-on.md#cap-1--escolher-o-tipo-de-aplicação-5-min)**

### 🎬 Cues de demo

1. **Compartilha portal Azure** → Entra ID → **App registrations** (lista). Mostra o `tftec-auth` principal e diz "este é o App Object — vejam o domínio".
2. **Mesma tela, lateral esquerda** → clica **Enterprise applications**. "Vejam que aparece de novo — mesma App Reg, ângulo diferente. Esse é o Service Principal." Aponta a coluna "Application ID" igual nos dois.
3. **Aluno acompanha no hands-on Cap 0**: tabela de 4 conceitos.

### 🙋 Perguntas pra turma

- "Vamos construir uma SPA React + uma API .NET. Quantas App Registrations vc acha que precisa?" *Espera respostas: 1 vs 2.* (Mostra que é a discussão Pattern A vs B do Cap 7 — semente.)
- "O que muda entre criar uma App Reg pra mobile vs SPA vs daemon? Alguém arrisca?"

### Falas-chave

- "App Registration = template global. Service Principal = instância no tenant. Multi-tenant = 1 template + N SPs."
- "O Portal mostra dois cards separados porque ele exibe duas perspectivas. Quando vc fizer multi-tenant, a separação vira clara: 1 App Reg sua + Enterprise app aparecendo em cada cliente que consentiu."

### Hands-on Cap 1 (matriz de tipos)

Diga: "Cap 1 do hands-on tem a matriz. Decida agora: quem aqui já tem ideia se vai usar SPA, Web, Mobile, ou Daemon no seu projeto?"

### 🧭 Visualização opcional (1 min)
Se a turma estiver curiosa: abra `https://authservice-front-tftec.azurewebsites.net/lab/topologias`. "Esse lab mostra decision tree de topologias — Pattern A vs B, single vs multi-tenant, B2B/B2C. Vão revisitar no Bloco 6. Por ora, fixem o quadro mental."

### ⏸️ Pausa
Não há — ritmo é alto.

### ➡️ Transition
"Vamos pro vivo. Cap 2 — criar a App Reg. Eu crio uma na frente via Portal (e mostro o equivalente em Cloud Shell), vocês acompanham."

---

## 🎬 Bloco 3 — Criar App Reg ao vivo (15 min)

**⏱️ 0:15 → 0:30**
**→ hands-on [Cap 2](../aula/hands-on.md#cap-2--criar-a-app-reg-10-min) + [from-zero-walkthrough Step 1](../aula/from-zero-walkthrough.md)**

> 🌐 **Modo 100% Azure (default):** demo é Portal + Cloud Shell, sem app local. Veja [from-zero-walkthrough.md Step 1](../aula/from-zero-walkthrough.md) pro script paralelo com comandos `az ad app create`.

### 🎬 Cues de demo — Portal (UI primeiro)

1. **Tela 1 (Portal):** Entra ID → **App registrations** → **+ New registration**
2. Preencha ao vivo (compartilhando tela):
   - Name: `tftec-auth-instrutor-{data}`
   - Supported account types: **Multi-tenant**
   - Redirect URI: **deixa em branco** (faz questão de mostrar o campo e deixar vazio — explica que vai voltar)
3. Clica **Register**.
4. Página de Overview aparece. **Aponta com mouse**: Application ID, Object ID, Directory ID.

### 🎬 Cues de demo — Cloud Shell (mesmo resultado em 1 comando)

5. **Tela 2 (Cloud Shell):** "Mesma coisa via CLI — 1 linha." Cole:
   ```powershell
   az ad app create --display-name "tftec-auth-instrutor-cli-$(Get-Date -Format yyyyMMdd)" `
                    --sign-in-audience AzureADMultipleOrgs
   ```
6. Aponta o JSON de retorno → `appId` é o mesmo Application ID que o Portal mostra. "Portal é UI sobre Graph API. CLI fala direto com Graph. **Mesma App Reg.**"

### 🙋 Perguntas pra turma

- "Por que escolhi multi-tenant aqui? Quem arrisca?" → introduz o Bloco 6 sem aprofundar.
- "Vejam os 3 IDs. Qual é secreto?" → resposta: **nenhum**. Os 3 podem vazar (não são credenciais). Só o que vai aparecer no Bloco 5 (Secret/Cert) é secreto.

### ⏸️ Pausa — alunos criam a deles (5 min)

"Agora vocês. **Modo Cloud Shell (default):** abram `https://shell.azure.com`, autentiquem, e rodem o `az ad app create` substituindo `instrutor` pelo seu nome. Anotem o `appId` e o `tenantId`. **Modo Portal (alternativa):** seguem Cap 2 do hands-on, mesma UI que mostrei. 5 minutos. Quem termina antes ajuda o vizinho."

*Você circula (se presencial) ou observa Teams chat. Resolve problemas conhecidos:*
- `az login` necessário se Cloud Shell em sessão nova
- Aluno sem permissão `Application.ReadWrite.All` no tenant → emprestar tenant TFTEC com role temporária ou aluno usa sandbox próprio
- Aluno preferindo Portal puro → totalmente ok, fim é o mesmo

### 🎬 Volta — mostre o SP

Após 5 min: "Voltem ao Portal. Lateral esquerda, **Enterprise applications**. Filtrem por nome. Vejam que apareceu — é o SP que o Portal criou automaticamente." (Via CLI: `az ad sp create --id <appId>` cria explicitamente — mostre se sobrar tempo.)

### ✅ Checkpoint visual
Pergunta: "Quem tem o SP visível no Enterprise applications?" *Mãos pra cima.* Espera 80% confirmar antes de seguir.

### ➡️ Transition
"App Reg existe. Mas ainda não dá pra logar — falta Redirect URI. Próximos 20 minutos: URLs e Tokens, onde 90% dos AADSTS nascem."

---

## 🔗 Bloco 4 — URLs + Tokens, com quebra deliberada (20 min)

**⏱️ 0:30 → 0:50**
**→ hands-on [Cap 3](../aula/hands-on.md#cap-3--urls-e-uris-10-min) + [Cap 4](../aula/hands-on.md#cap-4--tokens-15-min)**

### Subbloco 4a — URLs (10 min)

#### 🎬 Cues de demo

1. Sua App Reg → **Authentication** → **+ Add a platform** → **Single-page application**
2. Adiciona: `https://authservice-front-tftec.azurewebsites.net/` (com barra). Salva.
3. **NÃO adiciona** a versão sem barra. Salva.
4. Tenta login no frontend deployed (`https://authservice-front-tftec.azurewebsites.net`).
5. **Quebra deliberada:** vai dar `AADSTS50011`. Mostra o erro inteiro com a URL exata.

> 🔄 **Plano B (app local):** se estiver no fallback, a porta do Vite é `http://localhost:8080` — **não 5173**. Confirme em `vite.config.ts`.

#### 🙋 Pergunta pra turma
"O que aconteceu? Quem arrisca?" *Espera resposta.* "Vejam a URL exata no erro vs o que está registrado. Trailing slash. Um byte."

#### 🎬 Conserta
Adiciona a URL sem barra também. Salva. Tenta de novo → login abre popup e completa.

#### Falas-chave
- "Redirect URI é byte a byte. Trailing slash, http vs https, porta — tudo conta."
- "Outras URLs/URIs que confundem: App ID URI (Cap 3 do hands-on), Issuer, Authority. Tudo no hands-on."

#### ⏸️ Pausa — alunos configuram (3 min)
"Configurem o Redirect URI da App Reg de vocês apontando pro frontend deployed. Com e sem barra. Tentem login. (Quem está no Plano B local: usem `http://localhost:8080`.)"

### Subbloco 4b — Tokens (10 min)

#### 🎬 Cues de demo
1. **Login no frontend deployed** (já reconfigurado). Login funciona.
2. Abra DevTools (F12) → Network → encontre `/token` da Microsoft. Copia o `access_token`.
3. **Atalho recomendado:** abra `https://authservice-front-tftec.azurewebsites.net/lab/tokens` → cola o token no decoder embutido (tem highlight de claims). Alternativa pura: `https://jwt.ms`.
4. **Aponta com mouse:** `iss`, `aud`, `tid`, `sub`, `oid`, `exp`, `scp`.

#### 🙋 Perguntas pra turma
- "Olhem `aud`. Pra quem é esse token?"
- "Vejam `scp`. Quais permissions estão concedidas?"
- "ID Token vs Access Token — quem aposta a diferença?" *Espera resposta.* → Cap 4 do hands-on + `/lab/tokens` (tab v1 vs v2 lado a lado) têm a tabela.

#### Falas-chave
- "ID Token: `aud = clientId`, pra app cliente, identifica user."
- "Access Token: `aud = api://{client-id}`, pra API, autoriza chamada."
- "Refresh Token: pra renovar access sem novo login."

#### ⏸️ Pausa — alunos decodificam o deles (5 min)
"Cada um pega seu próprio access token, joga no `/lab/tokens` ou jwt.ms. Aponta `iss`, `aud`, `tid`, `scp`. Quem quiser ver os flows graficamente: abra `/lab/fluxos` em paralelo — tem Auth Code + PKCE, Client Credentials, OBO, Device Code passo a passo."

### ➡️ Transition
"Token tem `scp = openid profile` só. Não dá pra ler nada do user no Graph nem dar `roles` admin. Bloco 5: permissions e App Roles."

---

## 🔐 Bloco 5 — Permissions e Credenciais (20 min)

**⏱️ 0:50 → 1:10**
**→ hands-on [Cap 5](../aula/hands-on.md#cap-5--permissions-e-roles-15-min) + [Cap 6](../aula/hands-on.md#cap-6--credenciais-10-min)**

### Subbloco 5a — Permissions e App Roles (12 min)

#### 🎬 Cues de demo
1. Portal → sua App Reg → **API permissions** → **+ Add a permission** → Microsoft Graph → Delegated → `User.Read`. Adiciona. Clica **Grant admin consent**.
2. Volta no `tftec-auth`. Faz logout, login novamente.
3. Decodifica access token no jwt.ms — mostra `scp` agora tem `User.Read`.
4. **App Role:** Portal → **App roles** → **+ Create app role**. Cria `Admin` com value `Admin`.
5. Enterprise applications → sua App Reg → **Users and groups** → **+ Add user/group** → seu user → role `Admin`.
6. Logout/login. Decodifica access token — mostra `roles: ["Admin"]` aparecendo.

#### 🙋 Perguntas pra turma
- "scp vs roles — qual é qual?" → Delegated (`scp`) vs Application/App Roles (`roles`).
- "Por que precisei fazer logout/login pra ver a App Role? Por que não atualizou automático?" → Tokens são cacheados; mudança no Portal requer novo token.

#### Falas-chave
- "Delegated permissions = age em nome do user. Application permissions = age como o app, sem user."
- "App Roles é o default pra autorização do seu próprio app. Groups quando RBAC fica enterprise."

#### ⏸️ Pausa — alunos atribuem App Role (5 min)
"Cada um: cria App Role `Admin` na sua App Reg, atribui a si mesmo, logout/login, decodifica token, mostra `roles` aparecendo. Pra deep dive: `/lab/permissions-claims` no app deployed tem 5 tabs cobrindo Delegated vs Application, App Roles vs Groups, Consent (admin vs user), Claims customizadas, e mapping JWT → C# claims."

### Subbloco 5b — Credenciais (8 min)

#### 🎬 Cues de demo
1. **Client Secret:** Portal → **Certificates & secrets** → **+ New client secret** → cria. **Aponta:** "Esse valor aparece UMA VEZ. Copia agora ou nunca mais."
2. **Federated Identity Credential:** mesma página, aba **Federated credentials** → **+ Add credential**. Mostra o form:
   - Scenario: GitHub Actions
   - Organization: `tftec-guilherme`
   - Repository: `entra-auth-gateway`
   - Subject: `repo:tftec-guilherme/entra-auth-gateway:ref:refs/heads/main`
3. **Aponta a `.github/workflows/` do `tftec-auth`:** usa essa FIC. **Sem secret no GitHub Secrets.**
4. **Visualização rápida:** abra `/lab/credenciais` no app deployed — tem decision tree das 4 credenciais (Secret, Cert, FIC, Managed Identity) com prós/contras lado a lado.

> 💡 **Demo Swagger OAuth** (Recipe 10, FIC + secret na mesma App Reg) vem no **Bloco 6** — não antecipe aqui pra preservar o flow.

#### Falas-chave
- "Default moderno: Managed Identity dentro do Azure, FIC no CI/CD, Cert fora. Client Secret só dev local."
- "Rotação de secret: 6/12/24 meses no Portal. Rotação de FIC: nunca — não tem secret."

#### Pergunta rápida
"Quem ainda usa client secret em produção? *Mãos.* Quantos automatizaram a rotação? *Mãos baixam.*"

### ➡️ Transition
"Configuramos uma App Reg. Multi-tenant. Mas o que muda quando OUTRO tenant tenta usar? Bloco 6."

---

## 🌐 Bloco 6 — Multi-tenant + integrar no código (20 min)

**⏱️ 1:10 → 1:30**
**→ hands-on [Cap 7](../aula/hands-on.md#cap-7--multi-tenant-e-múltiplos-app-regs-10-min) + [Cap 8](../aula/hands-on.md#cap-8--integrar-no-código-15-min)**

### Subbloco 6a — Multi-tenant + Pattern A vs B (6 min)

#### 🎬 Cues de demo
1. Portal → sua App Reg → **Manifest** (JSON) → mostra `signInAudience: "AzureADMultipleOrgs"`. Diz: "Esse é o switch."
2. **Abra `/lab/multi-app`** (Tab 1) no app deployed → mostra visualmente **Pattern A** (1 App Reg pra SPA+API, o que o `tftec-auth` usa) **vs Pattern B** (2 App Regs com OBO). "Esse lab tem ainda multi-tenant, B2B e OBO chains nas outras tabs."
3. Diagrama complementar (whiteboard se preciso): "1 App Object + N Service Principals (um por tenant que consente)."
4. Mostra o **FAQ #2** ([Single vs Multi](../aula/perguntas-frequentes.md#2-single-tenant-vs-multi-tenant--qual-escolher)) e **FAQ #1** ([Pattern A vs B](../aula/perguntas-frequentes.md#1-por-que-vc-usou-1-app-registration-em-vez-de-2-uma-spa--uma-api)) na tela auxiliar.

#### 🙋 Perguntas
- "Aqui é Pattern A. Olhando o lab, quando vc migra pra Pattern B?" → Resposta no FAQ #1 + `/lab/multi-app` Tab 1.
- "Se um cliente novo logar amanhã, o que o Entra ID faz?" → Auto-provisiona SP no tenant dele. Se falhar = `AADSTS7000229`.

### Subbloco 6b — Mini-demo Swagger OAuth ao vivo (3 min)

> 🎯 **Wow moment:** Pattern A real, autenticando uma API .NET pelo Swagger UI.

1. Abra `https://authservice-api-tftec.azurewebsites.net/swagger`. Aponta o cadeado nos endpoints protegidos.
2. Clica **Authorize**. Aparece o dialog OAuth → "Esse `client_id` é o mesmo da SPA (Pattern A). Selecione `User.Read` e `api://.../access_as_user`."
3. Faz login Microsoft → token entra. Cadeado fecha. Chama endpoint protegido → **200 OK** com payload do user.
4. "Recipe 10 — Swagger OAuth implementada no commit 3b88360. Quem quiser replicar: [`app-reg-recipes.md` Recipe 10](../aula/app-reg-recipes.md)."

### Subbloco 6c — Integrar no código (11 min)

#### 🎬 Cues de demo
Abre VS Code com `tftec-auth`. Walkthrough rápido:

1. **`src/config/azure.ts:1-15`** — `AZURE_CONFIG`. Aponta `clientId`, `tenantId`, `audience`. "Lê de env var; default vem de constante. Aluno usa `.env.local` pra trocar pelo dele."
2. **`src/config/msal.ts:1-36`** — `msalConfig`. Aponta `clientId`, `authority` (montado), `redirectUri: window.location.origin`, `cacheLocation: sessionStorage`.
3. **`src/App.tsx:32-46`** — `MsalProvider` + `PublicClientApplication`. "Provider wrapping toda a app."
4. **`api/appsettings.json:9-15`** — `AzureAd` section. Aponta `TenantId: "organizations"` (multi-tenant), `Audience: api://{client-id}`.
5. **`api/Program.cs:51-78`** — `AddMicrosoftIdentityWebApi`. Aponta `ValidateIssuer = false` (multi-tenant), `OnTokenValidated` validando `tid`.
6. **`api/Program.cs:81-98`** — Authorization policies. Aponta `RequireRole("Admin")` (lê claim `roles`) e `RequireAssertion(... "scp" ...)` (lê claim `scp`).

#### Falas-chave
- "Multi-tenant exige `ValidateIssuer = false` + validação custom — Microsoft.Identity.Web não sabe quais tenants vc aceita."
- "Policies em .NET são mecanismo de autorização. `[Authorize(Policy = ...)]` na controller."
- "Frontend não valida JWT — só guarda. Quem valida é o backend."

#### Pergunta rápida
"Olhem `OnTokenValidated`. O que aconteceria se eu removesse essa linha?" → API aceita qualquer tenant. **Falha de segurança em multi-tenant**.

### ➡️ Transition
"Configuramos tudo. Mas e quando quebra? Próximos 15 minutos: vou quebrar a App Reg de propósito 3 vezes. Vocês diagnosticam ANTES de eu revelar."

---

## 🔧 Bloco 7 — Debug AADSTS LIVE adversarial (15 min)

**⏱️ 1:30 → 1:45**
**→ hands-on [Cap 9](../aula/hands-on.md#cap-9--debug-aadsts-5-min)**

### Premissa
Você vai **quebrar a App Reg de propósito** 3 vezes consecutivas. Em cada quebra:
1. Mostra o erro
2. **🙋 Para a turma:** "O que está errado? Sem cola. 30 segundos."
3. Coleta diagnósticos
4. **Revela e conserta**

Esse é o highlight da aula — atenção 100% da turma.

### Quebra 1 — `AADSTS50011` (5 min)

1. Portal → Authentication → **remove** o Redirect URI `http://localhost:5173/`
2. Tenta login no `tftec-auth`. Dá `AADSTS50011: The redirect URI specified in the request does not match...`
3. **🙋 Turma:** "O que aconteceu?" *Coleta respostas.*
4. **Revela:** "Redirect URI foi removida. Vejam a URL exata no erro." Reconfigura. Login volta.

### Quebra 2 — `AADSTS65001` (5 min)

1. Portal → API permissions → **revoga** o `User.Read` admin consent (clique nos 3 pontinhos → Remove permission).
2. Logout/login. Dá `AADSTS65001: The user or administrator has not consented to use the application`.
3. **🙋 Turma:** "Qual o fix?"
4. **Revela:** "Permission perdeu consent." Re-adiciona, dá Grant admin consent. Login volta.

### Quebra 3 — `AADSTS7000215` (5 min)

1. Mexe no backend: edita `appsettings.Development.json` localmente, **muda o `ClientSecret`** pra um valor errado.
2. Reinicia o backend (`dotnet run`). Tenta usar OBO ou client credentials flow.
3. Erro `AADSTS7000215: Invalid client secret provided`.
4. **🙋 Turma:** "Onde mexer?"
5. **Revela:** "Secret errado no backend. Em produção: rotaciona no Portal e atualiza KeyVault/env var." Reverte e mostra funcionando.

### Síntese rápida do bloco
"Padrão de debug: (1) lê o código AADSTS, (2) procura no [cheat-sheet](../aula/cheat-sheet.md) ou [FAQ](../aula/perguntas-frequentes.md), (3) isola onde está a config errada. 30 segundos pro diagnóstico."

### ➡️ Transition
"Bloco final: recap e Q&A. 15 minutos. Levantem perguntas que ficaram."

---

## 🎯 Bloco 8 — Síntese + Q&A (15 min)

**⏱️ 1:45 → 2:00**
**→ hands-on [Apêndices](../aula/hands-on.md#apêndices)**

### Recap (5 min)

Volta no Slide 5 (Mapa). Vai bloco por bloco com 1 frase:

1. **Quadro mental:** Tenant / App Reg / SP / Enterprise App
2. **Criar App Reg:** 3 IDs (Client, Object, Tenant)
3. **URLs:** Redirect, App ID URI, Issuer, Authority — byte a byte
4. **Tokens:** ID/Access/Refresh, `aud` define pra quem
5. **Permissions:** `scp` (delegated) vs `roles` (App Roles)
6. **Credenciais:** Managed Identity > FIC > Cert > Secret
7. **Multi-tenant:** 1 App Object + N SPs; Pattern A vs B
8. **Código:** `src/config/*.ts` + `api/Program.cs` + `api/appsettings.json`
9. **Debug:** AADSTS code → cheat-sheet → fix

### Promise check
"Promessa do início: decodifica AADSTS em 30s. Conseguiram? Quem se sente confiante?"

### Próximos passos (3 min)

Mostra na tela `https://authservice-front-tftec.azurewebsites.net/lab/` (Hub dos labs):

1. [`/lab/recipes`](../../src/pages/lab/Recipes.tsx) — **🎯 vocês saem com isso pra fazer em casa.** 10 receitas hands-on (SPA, Web, Mobile, Daemon Secret, Daemon FIC, B2B, AKS, Custom Claims, Swagger…) cobertas em [`app-reg-recipes.md`](../aula/app-reg-recipes.md). Cada uma com `az` copy-pasta, snippet e validação.
2. [`/lab/demo`](../../src/pages/lab/Demo.tsx) — pratica 4 cenários ao vivo (login, scopes, roles, multi-tenant).
3. [`/lab/tokens`](../../src/pages/lab/Tokens.tsx), [`/lab/fluxos`](../../src/pages/lab/Flows.tsx), [`/lab/topologias`](../../src/pages/lab/Topologias.tsx), [`/lab/permissions-claims`](../../src/pages/lab/PermissionsClaims.tsx), [`/lab/credenciais`](../../src/pages/lab/Credenciais.tsx), [`/lab/multi-app`](../../src/pages/lab/MultiApp.tsx), [`/lab/protocolos`](../../src/pages/lab/Protocolos.tsx) — os outros 7 deep dives interativos.
4. [`from-zero-walkthrough.md`](../aula/from-zero-walkthrough.md) — replica essa aula do zero em qualquer tenant, 100% Cloud Shell.
5. [Roadmap avançado](../aula/roadmap-avancado.md) — Conditional Access, Workload Identity, B2C, OBO chains.

### 💡 Bonus opcional (1 min, se sobrar tempo)
"Curiosidade: o frontend deployed deixa **trocar o `clientId` sem rebuild** — env var `VITE_AZURE_CLIENT_ID` no App Service + restart. Útil pra QA multi-ambiente ou demo em sala diferente sem CI/CD. É a Story 1.21 (runtime config)."

### Q&A (7 min)

**Tem [FAQ](../aula/perguntas-frequentes.md) aberto na tela 2.** Pra cada pergunta:
1. Escuta atentamente
2. Se está no FAQ → ctrl+F, lê resposta na voz alta
3. Se é novo → responde + anota pra adicionar no FAQ depois

### Encerramento

- "Repo público: <https://github.com/tftec-guilherme/entra-auth-gateway>. PR é aceito; teu nome vira contributor."
- "Hands-on.md continua disponível. Estuda no seu ritmo."
- "Obrigado."

---

## 📋 Pós-aula — Anotações pra próxima

| Item | Onde anotar |
|------|-------------|
| Perguntas novas que não estavam no FAQ | Adicionar a `docs/aula/perguntas-frequentes.md` |
| Bloco que rolou mais lento/rápido que o timing | Ajustar timing aqui |
| Cena de quebra que não foi reproduzível | Documentar Plano C |
| Feedback geral dos alunos | `docs/aula/retrospectiva-{data}.md` |

---

## 📚 Referências cross

- [hands-on.md](../aula/hands-on.md) — espinha dorsal conceitual (Caps 0-9 + apêndices)
- [from-zero-walkthrough.md](../aula/from-zero-walkthrough.md) — roteiro paralelo 100% Cloud Shell + Portal, sem app local (default 2026-05+)
- [app-reg-recipes.md](../aula/app-reg-recipes.md) — 10 receitas pós-aula (SPA, Web, Mobile, Daemon×2, B2B, AKS, Custom Claims, Swagger)
- [guia-instrutor-detalhado.md](./guia-instrutor-detalhado.md) — minute-by-minute screen-centric + análises bit-a-bit (Story 1.19); NÃO duplicar
- [slides.md](../aula/slides.md) — 6-7 slides de abertura ([Story 1.6](../stories/epic-1-app-reg-tftec-masters.md#story-16--refactor-de-slidesmd-34--6-7-slides-de-abertura))
- [cheat-sheet](../aula/cheat-sheet.md) — comandos + claims + erros
- [glossario](../aula/glossario.md) — termos
- [perguntas-frequentes](../aula/perguntas-frequentes.md) — Q&A
- [replicar-ambiente](./replicar-ambiente.md) — setup pre-aula completo
- **9 labs LIVE:** `/lab/demo`, `/lab/tokens`, `/lab/fluxos`, `/lab/topologias`, `/lab/permissions-claims`, `/lab/credenciais`, `/lab/multi-app`, `/lab/protocolos`, `/lab/recipes` — em `https://authservice-front-tftec.azurewebsites.net/lab/`
