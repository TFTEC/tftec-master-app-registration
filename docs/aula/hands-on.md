---
title: "App Registration na prática — Hands-on com tftec-auth"
audience: "TFTEC Masters / devs intermediários"
duration: "~90-100 min de leitura + execução"
last_updated: 2026-05-13
status: Ready
prerequisites:
  - "Conta Microsoft Entra ID (qualquer tenant — pode ser o seu pessoal)"
  - "Azure CLI (`az`) autenticada — `az login` antes de começar"
  - "Node.js 18+ e .NET 8 SDK"
  - "`tftec-auth` clonado e rodando local (ver Pré-flight)"
---

# App Registration na prática — Hands-on com `tftec-auth`

> Tutorial linear hands-on único. Você executa, valida o checkpoint, segue.
> Sem preâmbulo teórico — conceitos só quando viram bloqueio.
> Material de apoio sempre linkado, nunca duplicado aqui.

## Sumário

- [Pré-flight (3 min)](#pré-flight-3-min)
- [Cap 0 — Quadro mental (2 min)](#cap-0--quadro-mental-2-min)
- [Cap 1 — Escolher o tipo de aplicação (5 min)](#cap-1--escolher-o-tipo-de-aplicação-5-min)
- [Cap 2 — Criar a App Reg (10 min)](#cap-2--criar-a-app-reg-10-min)
- [Cap 3 — URLs e URIs (10 min)](#cap-3--urls-e-uris-10-min)
- [Cap 4 — Tokens (15 min)](#cap-4--tokens-15-min)
- [Cap 5 — Permissions e Roles (15 min)](#cap-5--permissions-e-roles-15-min)
- [Cap 6 — Credenciais (10 min)](#cap-6--credenciais-10-min)
- [Cap 7 — Multi-tenant e múltiplos App Regs (10 min)](#cap-7--multi-tenant-e-múltiplos-app-regs-10-min)
- [Cap 8 — Integrar no código (15 min)](#cap-8--integrar-no-código-15-min)
- [Cap 9 — Debug AADSTS (5 min)](#cap-9--debug-aadsts-5-min)
- [Apêndices](#apêndices)

## Como usar este documento

- Cada capítulo termina com um **✅ Checkpoint** — não avance sem ele.
- Termos técnicos linkam pro [glossário](./glossario.md). Não tente decorar — consulte.
- Comandos `az` completos estão no [cheat-sheet](./cheat-sheet.md) — repetimos só o necessário no fluxo.
- Perguntas "mas e se...?" ficam no [FAQ](./perguntas-frequentes.md).
- Quando o texto disser **→ [Lab X]**, é um deep-dive interativo no app `/lab` — os 9 labs estão LIVE (ver [Apêndice C](#c-labs-interativos-lab-no-app-react)).

---

## Pré-flight (3 min)

Faça antes de começar o Cap 0. Se algum item falhar, resolva agora — depois não tem volta sem reiniciar.

### Setup local

```powershell
# 1. Verificar versões
az --version          # azure-cli 2.x+
node --version        # v18+
dotnet --version      # 8.x

# 2. Autenticar Azure CLI no SEU tenant
az login
az account show       # confirme tenantId/userId

# 3. Clonar e instalar
git clone https://github.com/tftec-guilherme/entra-auth-gateway tftec-auth
cd tftec-auth
npm install
dotnet restore api/AuthService.csproj
```

### Rodar `tftec-auth` local

Em **2 terminais separados**:

```powershell
# Terminal 1 — Backend .NET (porta 5000)
# OBS: o default do app é 8080, mas conflita com o Vite. Force outra porta:
cd api
dotnet run --urls http://localhost:5000

# Terminal 2 — Frontend React (porta 8080 — definida em vite.config.ts)
npm run dev
```

Abra `http://localhost:8080` no browser. Você não vai conseguir fazer login ainda — é exatamente isso que vamos consertar nos próximos capítulos.

> 💡 **Por que essas portas?** O `vite.config.ts` fixa o frontend em **8080**. O backend .NET (`api/Program.cs`) tem default `http://+:8080` e por isso precisa ser sobrescrito com `--urls`. Pode usar `5000`, `5001` (HTTPS padrão .NET), `5050` — desde que registre a mesma porta como Redirect URI no Cap 3 quando o backend tiver UI própria (ex.: `/swagger`).

### Materiais que vão estar abertos durante a aula

- Portal Azure: <https://portal.azure.com> → Entra ID → App registrations
- `https://jwt.ms` (decoder de tokens)
- Esta página
- Terminal com `az` autenticado

✅ **Checkpoint Pré-flight:** `az account show` mostra seu user/tenant. Frontend roda em `localhost:8080`. Backend responde em `http://localhost:5000/health` com `Healthy` (ajuste a porta conforme o `--urls` que você usou).

---

## Cap 0 — Quadro mental (2 min)

Quatro conceitos que confundem todo mundo. Lê esta tabela uma vez e segue — vamos usar tudo nos próximos capítulos.

| Conceito | É o quê | Onde mora |
|---|---|---|
| **Tenant** | Sua organização no Entra ID. UUID + domínio (`empresa.onmicrosoft.com`). Sua empresa = 1 tenant. | Entra ID admin center |
| **App Registration** ("App Object") | Template global da sua aplicação. Define quem pode usar, qual flow, qual redirect URI, quais permissions. Criar isso é Cap 2. | Entra ID → App registrations |
| **Service Principal** ("SP") | Instância da App Reg em UM tenant. Multi-tenant = 1 App Object + N SPs (um por tenant que consome). | Entra ID → Enterprise applications |
| **Enterprise Application** | Mesma coisa que Service Principal — só que visto da perspectiva do tenant que consome o app. Confuso, sim. É o portal mostrando duas portas pra mesma sala. | Entra ID → Enterprise applications |

Detalhes em [glossário: identidade & tenancy](./glossario.md#-identidade--tenancy) e [glossário: app registration](./glossario.md#-app-registration).

> 💡 **Por que o portal mostra "App registrations" e "Enterprise applications" separados?**
> A primeira lista o **template** (App Object). A segunda lista as **instâncias** (Service Principals). Em single-tenant elas parecem redundantes — em multi-tenant você vê 1 entrada em App registrations e várias em Enterprise applications (clientes que consentiram).

✅ **Checkpoint Cap 0:** Você sabe diferenciar Tenant / App Registration / Service Principal / Enterprise Application em uma frase cada.

---

## Cap 1 — Escolher o tipo de aplicação (5 min)

Antes de criar a App Reg, decida o tipo. O Portal vai te perguntar, e a decisão muda **redirect URI, flow OAuth, tokens emitidos, secret necessário?, e até o tab onde se configura**.

### Matriz de decisão

| Tipo | Quem usa | Flow OAuth | Tokens | Secret? | Tab no Portal |
|---|---|---|---|---|---|
| **SPA** (Single-Page App) | React, Angular, Vue rodando 100% no browser | Auth Code + **PKCE** | ID + Access | ❌ (PKCE) | Authentication → "Single-page application" |
| **Web** (server-side) | ASP.NET MVC, Node Express, Django renderizando server-side | Auth Code | ID + Access + Refresh | ✅ | Authentication → "Web" |
| **Mobile/Native** | iOS, Android, Electron, console | Auth Code + PKCE (broker recomendado) | ID + Access + Refresh | ❌ | Authentication → "Mobile and desktop applications" |
| **Daemon/Worker** | Cron, background job, sem usuário | **Client Credentials** | Access only | ✅ (ou cert/FIC) | Sem redirect — usa client creds |
| **API protegida** (resource) | ASP.NET Web API, Express API consumida por outras apps | **Não tem flow** — só valida JWT | Recebe access tokens | ❌ pra validar; ✅ se chamar downstream | "Expose an API" |

Para detalhes de cada flow, ver [glossário: authentication flows](./glossario.md#-authentication-flows). Demos animadas em [`/lab/fluxos`](../../src/pages/lab/Flows.tsx) — 4 fluxos OAuth (Auth Code+PKCE, Client Credentials, OBO, Device Code) com animação step-by-step.

> 🧭 **Galeria visual:** Quer ver como cada tipo se encaixa em arquiteturas reais (com stack, prós/contras e quando usar)? Abra [`/lab/topologias`](../../src/pages/lab/Topologias.tsx) no app — 6 arquiteturas: SPA, Web App, Mobile, Daemon, Microservices+APIM, Workload Identity. Cada card tem `TokenClaimSpotlight` que pega TEU token via MSAL e destaca o claim relevante (`aud`, `roles`, `scp`).

### O que vamos construir nos próximos capítulos

**Pattern A** — uma App Reg que serve **simultaneamente** SPA + API (o frontend é SPA, a API é o `tftec-auth` backend). Mais simples pra começar; quando migrar pra Pattern B (2 App Regs) está em [Cap 7](#cap-7--multi-tenant-e-múltiplos-app-regs-10-min) e [FAQ #1](./perguntas-frequentes.md#1-por-que-vc-usou-1-app-registration-em-vez-de-2-uma-spa--uma-api).

✅ **Checkpoint Cap 1:** Você sabe qual tipo de app está construindo (SPA + API protegida no mesmo App Reg) e qual flow vai aparecer (Auth Code + PKCE pro SPA; validação de JWT pra API).

---

## Cap 2 — Criar a App Reg (10 min)

Vamos criar a App Reg que o `tftec-auth` vai consumir. Você vai fazer pelo Portal (visual) e, em paralelo, ver o equivalente em CLI.

### Pelo Portal

1. Entra ID admin center → **App registrations** → **+ New registration**
2. Preencha:
   - **Name:** `tftec-auth-aluno-{seu-nome}` (descritivo; pode mudar depois)
   - **Supported account types:** `Accounts in any organizational directory` (multi-tenant — vamos explorar em [Cap 7](#cap-7--multi-tenant-e-múltiplos-app-regs-10-min))
   - **Redirect URI:** deixe em branco por ora — configuramos no Cap 3
3. Clique **Register**.

### Pelo CLI (paralelo — pode pular se já fez pelo Portal)

```powershell
az ad app create --display-name "tftec-auth-aluno-seu-nome" `
                 --sign-in-audience AzureADMultipleOrgs

# Cria o Service Principal correspondente no SEU tenant
az ad sp create --id <APP_ID_RETORNADO_ACIMA>
```

### Os 3 IDs que você precisa decorar

Na página **Overview** da App Reg, copie e guarde — vão aparecer em quase tudo daqui pra frente:

| ID | Pra que serve | Onde aparece depois |
|---|---|---|
| **Application (client) ID** (`appId`) | Identifica seu app. Vai no código frontend e backend (`clientId`). Não é secreto — pode vazar. | `src/config/azure.ts:8`, `api/appsettings.json:12` |
| **Object ID** | UUID interno do App Object. Diferente do Client ID. Usado em queries Graph (`az ad app show --id $objectId`). | Comandos `az`, raramente em código |
| **Directory (tenant) ID** | Tenant onde a App Reg foi criada. Em multi-tenant, é o "home tenant". | `src/config/azure.ts:12` (ou `organizations` pra multi-tenant) |

### Veja o Service Principal aparecer

Quando você criou a App Reg, o Entra ID criou **automaticamente** um Service Principal no seu tenant:

1. Portal → **Enterprise applications** → filtre por "Application type: All Applications" e procure pelo nome `tftec-auth-aluno-{seu-nome}`.
2. Note que o SP tem **outro Object ID** (diferente do App Object) e o **mesmo Application ID**.

> 🔍 **Por que dois objetos pro mesmo app?** O **App Object** é o template global (mora no home tenant). O **Service Principal** é a "instância local" no tenant — é dele que saem permissions, roles, sign-in logs. Em multi-tenant, cada tenant que consome cria seu próprio SP. Detalhes no [FAQ multi-tenant](./perguntas-frequentes.md#2-single-tenant-vs-multi-tenant--qual-escolher).

✅ **Checkpoint Cap 2:** Você tem **Application ID**, **Object ID** e **Tenant ID** anotados. Você abriu Enterprise applications e viu o SP correspondente.

---

## Cap 3 — URLs e URIs (10 min)

Aqui é onde 90% dos `AADSTS50011` nascem. Cada URL/URI tem **um papel específico** — confundir é o jeito mais rápido de quebrar o login.

### Os 4 que importam

| URL/URI | Pra que serve | Quem configura | Quem valida |
|---|---|---|---|
| **Redirect URI** | Pra onde o Entra ID redireciona o browser **com o code/token** depois do login | Portal → Authentication → "Web" ou "Single-page application" | Entra ID compara byte a byte com o que veio no `/authorize` |
| **App ID URI** | Identifica sua API. Vira o `aud` (audience) dos access tokens emitidos pra ela | Portal → "Expose an API" → "Application ID URI" | Sua API (Microsoft.Identity.Web) compara contra `aud` do token |
| **Issuer** (`iss`) | URL do tenant que emitiu o token | Entra ID emite — você só lê | Sua API valida que veio do tenant esperado |
| **Authority** | URL base que MSAL/Microsoft.Identity.Web usa pra `/authorize` e `/token` | Código cliente (frontend + backend) | Library faz as requests |

### Formato típico

```text
Redirect URI (SPA):        http://localhost:8080/        (Vite — porta do tftec-auth)
Redirect URI (Web):        https://meu-app.azurewebsites.net/signin-oidc
Redirect URI (Mobile):     msal{client-id}://auth   ou  http://localhost  (loopback)

App ID URI (default):      api://78345291-2586-4691-b1f9-e4e780f55328
App ID URI (custom):       https://api.minhaempresa.com

Issuer (v2):               https://login.microsoftonline.com/{tenant-id}/v2.0
Authority (single-tenant): https://login.microsoftonline.com/{tenant-id}
Authority (multi-tenant):  https://login.microsoftonline.com/organizations
Authority (common):        https://login.microsoftonline.com/common
```

### Configure o Redirect URI agora

Pelo Portal → App registration → **Authentication** → **+ Add a platform** → **Single-page application** → adicione:

```text
http://localhost:8080/
http://localhost:8080
```

(Adicionar com e sem trailing slash evita uma classe inteira de `AADSTS50011`. Se você for usar o Swagger do backend deployed, **também** registre `https://authservice-api-tftec.azurewebsites.net/swagger/oauth2-redirect.html` — já feito no App Reg `tftec-auth` oficial.)

### Configure o App ID URI

Portal → App registration → **Expose an API** → **Set** (ao lado de Application ID URI) → aceite o default `api://{client-id}` → **Save**.

Agora **+ Add a scope** → preencha:
- **Scope name:** `access_as_user`
- **Who can consent?:** Admins and users
- **Admin consent display name:** `Access tftec-auth as user`
- **Admin consent description:** `Allows the app to access tftec-auth as the signed-in user`
- **State:** Enabled

Esse scope é o que o frontend vai pedir pra obter um access token destinado à API. O `access_as_user` por convenção significa "acesso delegado, em nome do usuário".

### Onde isso vive no `tftec-auth`

| Conceito | Arquivo | Linha |
|---|---|---|
| `clientId`, `tenantId`, `audience` (= App ID URI) | `src/config/azure.ts` | 8-15 |
| `authority` (montado a partir de `instance + tenantId`) | `src/config/msal.ts` | 7 |
| `redirectUri` (`window.location.origin` → resolve runtime) | `src/config/msal.ts` | 8 |
| `scopes` pro access token da API (`api://{client-id}/access_as_user`) | `src/config/msal.ts` | 60 |
| Backend bind do `AzureAd.Audience` (valida `aud` do token) | `api/appsettings.json` | 14 |
| Backend bind do `AzureAd.Instance + TenantId` | `api/appsettings.json` | 10-12 |

> 💡 **Por que `redirectUri: window.location.origin`?** Funciona em qualquer ambiente (local, deploy preview, produção) **desde que cada URL esteja registrada na App Reg**. Se você fizer deploy em `https://meuapp.azurewebsites.net`, **precisa adicionar essa URL no portal antes** — senão o login quebra.

### Reinicie o frontend pra picar a config

Você tem **2 opções** pra injetar o `clientId` no frontend:

**Opção 1 (recomendada pra dev local) — build-time via `.env.local`:**

```powershell
# Defina seu Client ID no .env.local (na raiz do repo, não em src/)
echo "VITE_AZURE_CLIENT_ID=<SEU_APP_ID>" > .env.local
echo "VITE_AZURE_TENANT_ID=organizations" >> .env.local

# No terminal do npm run dev, Ctrl+C e rode de novo
npm run dev
```

**Opção 2 (usada em produção) — runtime config via `public/config.js`:**
O bundle Vite tem placeholders `__VITE_AZURE_CLIENT_ID__` em `public/config.js` que o startup script do App Service substitui por env vars sem precisar de rebuild. Em dev local você pode editar `public/config.js` direto, mas é mais simples usar `.env.local` (Opção 1). Detalhes da prioridade em `src/config/azure.ts:11-37`: **runtime > build-time > `DEFAULT_CLIENT_ID`**.

Tente fazer login agora em `http://localhost:8080`. Vai abrir popup Microsoft, você loga, e... pode dar erro de permissions (cobertura no Cap 5). Sem problemas — checkpoint abaixo só exige que o popup abra.

✅ **Checkpoint Cap 3:** Popup de login Microsoft abre quando você clica "Sign in". Se ainda falhar com `AADSTS50011`, confira que o Redirect URI no portal é **exatamente** `http://localhost:8080/` (com a barra no final que o MSAL adiciona).

---

## Cap 4 — Tokens (15 min)

Depois do login, sua aplicação recebeu tokens. Três tipos, três papéis distintos.

### ID Token vs Access Token vs Refresh Token

| Token | Pra quem | Pra que | Vida útil |
|---|---|---|---|
| **ID Token** | Para a **aplicação cliente** (SPA, Web app). Diz "este user logou e é quem diz ser". | Identificar o usuário no frontend (`useMsal().accounts[0]`) | ~1h |
| **Access Token** | Para uma **API** (resource). Autoriza chamadas à API alvo. | Frontend envia em `Authorization: Bearer <access>` ao chamar API | ~1h |
| **Refresh Token** | Para a **aplicação cliente**. Troca por novo access token sem novo login. | Renovação silenciosa. SPAs guardam em sessionStorage; Web/Mobile podem usar storage seguro. | ~14-90 dias (configurável) |

> 🔑 **Regra fundamental:** o **audience** (`aud`) do token diz pra **quem** ele é. ID Token tem `aud = clientId`. Access Token tem `aud = App ID URI da API` (ex.: `api://{client-id}`). Misturar isso é o vetor #1 de bugs.

### Anatomia de um JWT

JWT = `header.payload.signature` — 3 partes Base64URL separadas por ponto.

- **Header**: algoritmo (RS256), key ID (`kid`), tipo
- **Payload**: as claims (dados sobre o user + sobre o token)
- **Signature**: assinatura RSA do header+payload — valida que **veio do Entra ID e não foi alterado**

### Claims que você vai ver SEMPRE

| Claim | Valor típico | O que diz |
|---|---|---|
| `iss` | `https://login.microsoftonline.com/{tid}/v2.0` | Quem emitiu o token |
| `aud` | `clientId` (ID Token) ou `api://{client-id}` (Access Token) | Pra quem o token é |
| `sub` | UUID estável | Identificador do user **dentro deste app** (não muda se user mudar email) |
| `oid` | UUID estável | Object ID do user no tenant (estável **cross-app** dentro do tenant) |
| `tid` | UUID | Tenant que emitiu |
| `exp` / `nbf` / `iat` | Unix timestamps | Expira em / válido a partir de / emitido em |
| `scp` | `access_as_user openid profile` | **Delegated scopes** concedidos (User.Read, custom scopes) |
| `roles` | `["Admin"]` | **App Roles** atribuídas (Cap 5) — opcional |
| `appid` | UUID | Client ID do app que pediu o token |
| `upn` / `preferred_username` | `user@empresa.onmicrosoft.com` | Username (não use como ID estável!) |

Tabela completa de claims no [glossário: tokens & claims](./glossario.md#-tokens--claims) e o que **validar** em cada um no [cheat-sheet](./cheat-sheet.md#-claims-jwt--sempre-validar).

### Hands-on: decodifique seu próprio access token

1. No `tftec-auth` rodando local, faça login.
2. Abra DevTools → **Network** → encontre a request pro `/token` endpoint do Entra ID (após o login, no callback).
3. Copie o `access_token` da resposta.
4. Vá em <https://jwt.ms> → cole o token. Você verá o payload decodificado.

Alternativa interativa: use o [`/lab/tokens`](../../src/pages/lab/Tokens.tsx) — tem `JwtDecoder` + tab Anatomia + comparativo v1 vs v2 + ID vs Access. Pra ver **como** os tokens são pedidos passo-a-passo, abra [`/lab/fluxos`](../../src/pages/lab/Flows.tsx) (animação dos 4 fluxos OAuth).

> 🔍 **v1 vs v2 endpoints:** v1 é legado, retorna `aud` diferente, claims diferentes. **Use sempre v2** (`/oauth2/v2.0/`). MSAL.js e Microsoft.Identity.Web já default pra v2.

✅ **Checkpoint Cap 4:** Você decodificou seu access token no jwt.ms e consegue apontar `iss`, `aud`, `tid`, `exp`, `scp` no payload.

---

## Cap 5 — Permissions e Roles (15 min)

Permissions controlam **o que** seu app pode fazer. O Entra ID tem **dois modelos** que sempre confundem.

### Delegated vs Application — escolha a sua

| Aspecto | **Delegated** (em nome do user) | **Application** (sem user) |
|---|---|---|
| Quem o app representa | O usuário logado | O próprio app (worker, daemon) |
| Claim no token | `scp` (scopes) | `roles` (app roles) |
| Exemplo MS Graph | `User.Read` (ler perfil do user logado) | `User.Read.All` (ler perfil de **qualquer** user) |
| Pode ser usado por | SPAs, Web apps, Mobile | Daemons, cron jobs, server-to-server |
| Limita por user? | Sim — só vê o que o user vê | Não — full access ao escopo da permission |

> ⚠️ **Application permissions são poderosas.** `User.Read.All` ou `Mail.ReadWrite.All` aplicação dão acesso ao tenant inteiro. Use só onde realmente precisa, e prefira sempre delegated quando há usuário envolvido.

### App Roles vs Groups vs Directory Roles

Três jeitos de "atribuir um papel" — fazem coisas parecidas mas vêm de lugares diferentes:

| Mecanismo | Definido em | Aparece no token | Quando usar |
|---|---|---|---|
| **App Roles** | App Registration → **App roles** | Claim `roles` | Roles específicas do seu app (`Admin`, `Reader`) |
| **Groups** | Entra ID → Groups | Claim `groups` (opcional, configurar Token configuration) | Granular RBAC corporativo; integra com SharePoint, Teams |
| **Directory Roles** | Entra ID → Roles & admins | Claim `wids` ou `roles` (varia) | Roles globais do tenant (Global Admin, User Admin) — raro num app de negócio |

Decisão rápida: **App Roles é o default pra autorização do seu app**. Groups quando RBAC precisa ser administrado fora do app.

### Hands-on: defina um App Role

1. Portal → sua App Reg → **App roles** → **+ Create app role**
2. Preencha:
   - **Display name:** `Admin`
   - **Allowed member types:** `Users/Groups`
   - **Value:** `Admin` (este é o que entra no claim `roles`)
   - **Description:** `Admin access to tftec-auth`
   - **Do you want to enable this app role?:** Yes
3. **Apply**.

Agora atribua a si mesmo:
1. Portal → **Enterprise applications** → encontre `tftec-auth-aluno-{seu-nome}` → **Users and groups** → **+ Add user/group**
2. Selecione você → escolha role `Admin` → **Assign**.

Faça **logout e login de novo** no `tftec-auth` local (o token cached não tem a role; precisa novo). Decodifique no jwt.ms — você deve ver:

```json
{
  "roles": ["Admin"],
  ...
}
```

### Como o backend `tftec-auth` valida

Em `api/Program.cs:81-98`:

```csharp
options.AddPolicy("RequireAdminRole", policy =>
    policy.RequireRole("Admin", "admin"));

options.AddPolicy("RequireApiRead", policy =>
    policy.RequireAssertion(context =>
        context.User.HasClaim(c => c.Type == "scp" && c.Value.Contains("api.read"))
        ...));
```

Note: `RequireRole` lê `roles` (App Role). `HasClaim("scp", ...)` lê delegated scopes. **São coisas diferentes — não dá pra usar `RequireRole` pra checar `scp`.**

### Admin consent

Algumas permissions exigem **admin do tenant** consentindo, não o user final:
- **Delegated** com `Admin only` (ex.: `User.Read.All` delegated)
- **Todas Application** permissions

Se você adicionou permissions assim, faça: Portal → **API permissions** → **Grant admin consent for {tenant}**. Sem isso → `AADSTS65001`.

Mais detalhes em [`/lab/permissions-claims`](../../src/pages/lab/PermissionsClaims.tsx) (5 tabs: Delegated vs Application, `scp` vs `roles`, App Roles/Groups/Directory, backend validation, admin consent) e [FAQ permissions](./perguntas-frequentes.md).

✅ **Checkpoint Cap 5:** Você criou o App Role `Admin`, atribuiu a si mesmo, fez logout/login e decodificou o token vendo `"roles": ["Admin"]`.

---

## Cap 6 — Credenciais (10 min)

Apps que falam server-to-server (Web apps, daemons, APIs chamando APIs) precisam **se autenticar**. Quatro opções, em ordem crescente de segurança:

| Tipo | Como funciona | Quando usar | Risco |
|---|---|---|---|
| **Client Secret** | String randômica gerada no Portal, expira em 6/12/24 meses | MVP, dev local, baixa criticidade | Vaza fácil em logs, env, código |
| **Certificate** | Self-signed ou CA. Você assina um JWT (`client_assertion`) com a private key | Workloads com gestão de cert | Rotação trabalhosa |
| **Federated Identity Credential** (FIC) | Confia em **outro IdP** (GitHub OIDC, Kubernetes, Azure AD). Sem secret nenhum. | **CI/CD (GitHub Actions, Azure DevOps), AKS** | Configuração inicial |
| **Managed Identity** | Azure-only. Identity atrelada ao recurso Azure (VM, App Service, Function). Sem credential pra gerenciar. | Azure → Azure (App Service → Storage, Function → KeyVault) | Só dentro do Azure |

> 💡 **Default moderno:** **Managed Identity** dentro do Azure, **Federated Identity Credential** no CI/CD, **Certificate** fora do Azure. **Client Secret** só pra dev local e prototipagem.

### Como o `tftec-auth` usa hoje

- **CI/CD (GitHub Actions → Azure deploy):** Federated Identity Credential (OIDC). Sem secret no GitHub Secrets. Trust no issuer `https://token.actions.githubusercontent.com` com subject filtro por branch/ref. Detalhe em [`.github/workflows/`](../../.github/workflows/) e setup completo em [playbook: replicar-ambiente](../playbook/replicar-ambiente.md).
- **Backend `api/Program.cs:13`:** lê `AzureAd.ClientSecret` do config (env var em produção, `appsettings.Development.json` em dev local).

### Hands-on: crie um Client Secret e um FIC

**Client Secret:**

```powershell
# Portal: App registration → Certificates & secrets → + New client secret
# CLI:
az ad app credential reset --id <APP_ID> --years 1
# (gera novo secret e PRINTA NA TELA — copie agora, não dá pra ver depois)
```

**Federated Identity Credential pro GitHub Actions:**

```powershell
$repo = "seu-user/seu-repo"
$appId = "<APP_ID>"

az ad app federated-credential create --id $appId --parameters @"
{
  "name": "github-main",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:$($repo):ref:refs/heads/main",
  "audiences": ["api://AzureADTokenExchange"]
}
"@
```

Agora seu GitHub Actions pode usar `azure/login@v2` com `client-id` + `tenant-id` + `audience: api://AzureADTokenExchange` — sem secret.

Mais detalhes em [`/lab/credenciais`](../../src/pages/lab/Credenciais.tsx) (matriz comparativa + 4 tabs deep-dive das credenciais + workflow real do tftec-auth com FIC + decision tree).

✅ **Checkpoint Cap 6:** Você criou um client secret e um FIC. `az ad app credential list --id <APP_ID>` mostra ambos.

---

## Cap 7 — Multi-tenant e múltiplos App Regs (10 min)

Duas decisões arquiteturais que aparecem cedo e doem caro pra reverter.

### Single-tenant vs Multi-tenant

| Caso | Escolha | Setting `signInAudience` |
|---|---|---|
| App interno só da sua empresa | **Single** | `AzureADMyOrg` |
| SaaS B2B (vende pra outras empresas Entra ID) | **Multi-tenant** | `AzureADMultipleOrgs` |
| App público com contas pessoais (Gmail, Outlook personal) | Multi + personal | `AzureADandPersonalMicrosoftAccount` |
| App de consumo final (Xbox, Skype-like) | **B2C** (produto separado!) | n/a — Entra External ID for Customers |

> ⚠️ **Mudar de single → multi DEPOIS quebra:** tokens cached pelos clients param de funcionar, issuer muda, validation precisa ser ajustada. **Decida no day 1.**

Detalhes em [FAQ Single vs Multi](./perguntas-frequentes.md#2-single-tenant-vs-multi-tenant--qual-escolher) e [FAQ B2C](./perguntas-frequentes.md#3-e-b2c-mesma-coisa).

### Como multi-tenant funciona (1 App Object + N SPs)

```
                    App Object (mora no SEU tenant)
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
  SP no Tenant A    SP no Tenant B    SP no Tenant C
  (cliente 1)       (cliente 2)       (cliente 3)
```

Cada cliente que faz login pela primeira vez, o Entra ID **provisiona um SP no tenant dele**. Sem o SP, o login falha com `AADSTS7000229: The application is missing service principal in the tenant`. Detalhes no [FAQ AADSTS7000229](./perguntas-frequentes.md).

### Pattern A vs Pattern B — quantos App Regs?

**Pattern A** (1 App Reg pra SPA + API juntos) — o que estamos usando no `tftec-auth`:

```
Frontend (SPA)  ─┐
                 ├──► Mesma App Reg ──► access_token (aud=api://{client-id})
Backend (API)  ──┘
```

✅ Mais simples; menos coisa pra configurar
❌ SPA e API compartilham credenciais; release acoplada

**Pattern B** (2 App Regs separadas):

```
Frontend (SPA)   ──► App Reg "Cliente"  ──► consent_for("api://api-app")
                                              │
                                              ▼
Backend (API)    ──► App Reg "API"      ──► valida access_token
```

✅ Segregação de credenciais; releases independentes; API pode ser consumida por **outros** clients
❌ Mais boilerplate; precisa configurar `Expose an API` + `API permissions` cross-app

**Quando migrar pra B?** Quando a API começa a ser consumida por **mais de um cliente** (web + mobile + integração externa). Detalhes em [FAQ Pattern A vs B](./perguntas-frequentes.md#1-por-que-vc-usou-1-app-registration-em-vez-de-2-uma-spa--uma-api).

Mais cenários (Pattern A vs B com decision tree, single vs multi-tenant + AADSTS7000229, B2B External Identities, OBO chains com 3+ saltos) em [`/lab/multi-app`](../../src/pages/lab/MultiApp.tsx) e [roadmap-avancado](./roadmap-avancado.md).

✅ **Checkpoint Cap 7:** Você sabe (1) que sua App Reg é multi-tenant, (2) que cada novo tenant gera um SP, e (3) que está usando Pattern A.

---

## Cap 8 — Integrar no código (15 min)

Tudo que você configurou no Portal precisa estar no código pra funcionar. Vamos percorrer o `tftec-auth` real.

### Frontend — React + MSAL.js

#### 1. Variáveis de ambiente (`.env.local`)

Já criamos no Cap 3. Lembrete:

```bash
VITE_AZURE_CLIENT_ID=<seu-app-id>
VITE_AZURE_TENANT_ID=organizations         # multi-tenant; troque pra <tenant-id> em single
VITE_AZURE_AUDIENCE=api://<seu-app-id>     # opcional, derivado do clientId se omitido
```

#### 2. Config Azure (`src/config/azure.ts:11-44`)

```typescript
const DEFAULT_CLIENT_ID = "78345291-2586-4691-b1f9-e4e780f55328";

// 1. Lê runtime config (public/config.js → window.__APP_CONFIG__)
const runtimeConfig = (window as any).__APP_CONFIG__ || {};

// 2. Detecta placeholders não-substituídos do tipo "__VITE_..." pra cair pro fallback
const isPlaceholder = (v?: string) => !v || v.startsWith("__VITE_") || v.startsWith("__");

// 3. Resolução em cascata: runtime > build-time (import.meta.env.VITE_*) > default
const resolvedClientId = isPlaceholder(runtimeConfig.clientId)
  ? (import.meta.env.VITE_AZURE_CLIENT_ID || DEFAULT_CLIENT_ID)
  : runtimeConfig.clientId!;

export const AZURE_CONFIG = {
  instance: "https://login.microsoftonline.com/",
  tenantId: resolvedTenantId,   // mesma resolução em cascata
  clientId: resolvedClientId,
  audience: resolvedAudience,    // padrão: `api://${resolvedClientId}`
};
```

Pattern importante: 3 fontes em ordem de prioridade — **runtime config (`public/config.js`) > build-time (`VITE_*` em `.env.local`) > `DEFAULT_CLIENT_ID`**. Em produção, o startup script do App Service substitui os placeholders `__VITE_*` em `public/config.js` por env vars sem precisar de rebuild — alunos podem trocar `clientId` no Portal e fazer restart. Em dev local, mais simples usar `.env.local` (Opção 1 do Cap 3).

#### 3. MSAL config (`src/config/msal.ts:1-36`)

```typescript
import { Configuration, LogLevel } from "@azure/msal-browser";
import { AZURE_CONFIG } from "./azure";

export const msalConfig: Configuration = {
  auth: {
    clientId: AZURE_CONFIG.clientId,
    authority: `${AZURE_CONFIG.instance}${AZURE_CONFIG.tenantId}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
  },
  // ... loggerOptions
};
```

Note `cacheLocation: "sessionStorage"` — tokens morrem ao fechar a aba (tradeoff de segurança vs UX). Alternativa: `localStorage` se quiser persistência cross-tab.

#### 4. Scopes pra API protegida (`src/config/msal.ts:59-61`)

```typescript
export const authServiceRequest = {
  scopes: [`${AZURE_CONFIG.audience}/access_as_user`],
};
```

Esse `access_as_user` é o **scope** que você criou no Portal (Cap 3, "Expose an API"). É o que o frontend pede pra obter access token com `aud = api://{client-id}`.

#### 5. MSAL Provider (`src/App.tsx:32-46`)

```typescript
import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "@/config/msal";

const msalInstance = new PublicClientApplication(msalConfig);

const App = () => (
  <MsalProvider instance={msalInstance}>
    <QueryClientProvider client={queryClient}>
      {/* resto da app */}
    </QueryClientProvider>
  </MsalProvider>
);
```

#### 6. Pegar token em componente

```typescript
import { useMsal } from "@azure/msal-react";
import { authServiceRequest } from "@/config/msal";

const { instance, accounts } = useMsal();

const tokenResponse = await instance.acquireTokenSilent({
  ...authServiceRequest,
  account: accounts[0],
});

const token = tokenResponse.accessToken;  // joga em Authorization: Bearer
```

### Backend — .NET 8 + Microsoft.Identity.Web

#### 1. Config (`api/appsettings.json:9-15`)

```json
"AzureAd": {
  "Instance": "https://login.microsoftonline.com/",
  "TenantId": "organizations",
  "ClientId": "78345291-2586-4691-b1f9-e4e780f55328",
  "ClientSecret": "SET_VIA_ENV_OR_KEYVAULT",
  "Audience": "api://78345291-2586-4691-b1f9-e4e780f55328"
}
```

`TenantId: "organizations"` = multi-tenant. `Audience` = App ID URI do Cap 3.

#### 2. Bind config (`api/Program.cs:17`)

```csharp
builder.Services.Configure<AzureAdConfig>(builder.Configuration.GetSection("AzureAd"));
```

#### 3. Authentication middleware (`api/Program.cs:51-78`)

```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(options =>
    {
        builder.Configuration.Bind("AzureAd", options);
        options.TokenValidationParameters.ValidateIssuer = false;  // multi-tenant
        options.TokenValidationParameters.ValidateAudience = true;
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                // Valida tid contra whitelist
                var tid = context.Principal?.FindFirst("tid")?.Value;
                if (!string.IsNullOrEmpty(tid) && !tenantService.IsTenantAllowed(tid))
                    context.Fail("Tenant not allowed");
            }
        };
    }, options => { builder.Configuration.Bind("AzureAd", options); });
```

Note `ValidateIssuer = false` + validação custom no `OnTokenValidated` — pattern multi-tenant. Em single-tenant, `ValidateIssuer = true` e Microsoft.Identity.Web cuida.

#### 4. Authorization policies (`api/Program.cs:81-98`)

```csharp
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireApiRead", policy =>
        policy.RequireAssertion(context =>
            context.User.HasClaim(c => c.Type == "scp" && c.Value.Contains("api.read"))));

    options.AddPolicy("RequireAdminRole", policy =>
        policy.RequireRole("Admin", "admin"));
});
```

Lendo `scp` (delegated scopes) e `roles` (App Roles do Cap 5). Use nas controllers:

```csharp
[Authorize(Policy = "RequireAdminRole")]
[HttpGet("admin/users")]
public IActionResult ListUsers() => ...;
```

#### 5. Pipeline order (`api/Program.cs:204-217`)

```csharp
app.UseCors();              // ANTES de Auth
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
```

#### 6. Swagger UI com OAuth Auth Code + PKCE (Recipe 10)

O backend `tftec-auth` deployed já expõe Swagger UI com **botão Authorize funcional** (login real contra Entra ID):

- **Live:** <https://authservice-api-tftec.azurewebsites.net/swagger>
- **Local:** `http://localhost:5000/swagger` (use a porta que você passou em `--urls`)

Como funciona — em `api/Program.cs:124-202`:

```csharp
c.AddSecurityDefinition("oauth2", new OpenApiSecurityScheme
{
    Type = SecuritySchemeType.OAuth2,
    Flows = new OpenApiOAuthFlows
    {
        AuthorizationCode = new OpenApiOAuthFlow
        {
            AuthorizationUrl = new Uri($"https://login.microsoftonline.com/{swaggerTenantId}/oauth2/v2.0/authorize"),
            TokenUrl = new Uri($"https://login.microsoftonline.com/{swaggerTenantId}/oauth2/v2.0/token"),
            Scopes = new Dictionary<string, string> { [swaggerScope] = "..." }
        }
    }
});
// ...
c.OAuthClientId(swaggerClientId);
c.OAuthUsePkce();   // PKCE em vez de implicit
```

Pré-requisito: o App Reg precisa ter `https://{seu-host}/swagger/oauth2-redirect.html` como Redirect URI (já feito no App Reg `tftec-auth` deployed). Receita completa em [`/lab/recipes`](../../src/pages/lab/Recipes.tsx) → Recipe 10.

✅ **Checkpoint Cap 8:** Você consegue apontar (1) onde o `clientId` é lido no frontend, (2) onde o `aud` é validado no backend, (3) onde a App Role é checada por policy. **Bônus:** clica Authorize no Swagger deployed, completa o login Microsoft, executa `GET /auth/me` e vê seu próprio token validado pela API.

---

## Cap 9 — Debug AADSTS (5 min)

Os top 6 erros que você vai encontrar. Workflow: **ler erro → isolar causa → fix**.

| Código | Significado | Causa típica | Fix |
|---|---|---|---|
| `AADSTS50011` | Redirect URI mismatch | URI no `/authorize` ≠ URI registrada no Portal | Portal → Authentication → adicione a URL **exata** (com/sem trailing slash conta) |
| `AADSTS65001` | User/admin consent required | App pede permission que precisa consent não dado | Portal → API permissions → Grant admin consent. Ou usa `prompt=consent` no `/authorize` |
| `AADSTS7000215` | Invalid client secret | Secret errado/expirado | Portal → Certificates & secrets → New client secret. Atualize env var. |
| `AADSTS90002` | Tenant not found | Tenant ID no `/authorize` errado | Confira `tenantId` no `src/config/azure.ts` (ou `api/appsettings.json`) — pode estar com typo |
| `AADSTS50158` | MFA required | Conditional Access policy exige MFA | User precisa completar MFA. Em dev, simule com `prompt=login`. |
| `AADSTS7000229` | App missing SP in tenant | Multi-tenant + tenant nunca consentiu | User do tenant alvo precisa fazer login uma vez (auto-provisiona SP) ou admin executa consent URL |

Workflow de debug genérico:

1. **Copie o erro completo** — código + descrição + `correlation_id`
2. Procure no FAQ: <https://github.com/tftec-guilherme/entra-auth-gateway/blob/main/docs/aula/perguntas-frequentes.md>
3. Se for `AADSTS50011` ou `90002`: olhe **request URL** que disparou — copie pra um text editor e compare byte a byte com o que está no Portal
4. Se for `65001` ou `7000229`: faça o consent (admin ou user) e tente de novo
5. Se for `50158`: é Conditional Access — fala com admin do tenant; em dev você pode tentar outro user

Lista completa + Postman/curl pra reproduzir em [cheat-sheet](./cheat-sheet.md#-erros-aadsts--diagnóstico-em-30s) e [FAQ](./perguntas-frequentes.md). Reproduza fluxos do zero (login, OBO, Client Credentials) em [`/lab/demo`](../../src/pages/lab/Demo.tsx) — executa cenários reais contra Microsoft Graph.

✅ **Checkpoint Cap 9:** Dado um código AADSTS (digamos `50011`), você consegue dizer em 30s qual é a causa provável e onde olhar no Portal.

---

## Apêndices

### A. Referências do `tftec-auth`

| Arquivo | Conteúdo |
|---|---|
| [`src/config/azure.ts`](../../src/config/azure.ts) | `AZURE_CONFIG`, `AUTHSERVICE_API_URL`, `ENDPOINTS` |
| [`src/config/msal.ts`](../../src/config/msal.ts) | `msalConfig`, `loginRequest`, `authServiceRequest`, `graphScopes` |
| [`src/App.tsx`](../../src/App.tsx) | `MsalProvider` montado em `<App />` |
| [`api/Program.cs`](../../api/Program.cs) | `AddMicrosoftIdentityWebApi`, `OnTokenValidated`, Authorization policies |
| [`api/appsettings.json`](../../api/appsettings.json) | Bind `AzureAd`, `AllowedTenants`, `DownstreamApis` |

### B. Material de apoio

- 📋 [Cheat sheet](./cheat-sheet.md) — 1 página A4 com comandos `az`, claims, AADSTS errors, decision matrix
- 📖 [Glossário](./glossario.md) — 50+ termos categorizados (Identidade, App Reg, Flows, Tokens, Configs, Erros, Tools)
- 🙋 [FAQ — Perguntas frequentes](./perguntas-frequentes.md) — 21 Q&As técnicas das dúvidas mais comuns
- 🗺️ [Roadmap avançado](./roadmap-avancado.md) — 8 tópicos pra próximo nível (Conditional Access, Workload Identity, OBO chains complexas, etc.)

### C. Labs interativos (`/lab/*` no app React)

Todos os 9 labs estão **LIVE**. Acesse o hub em [`/lab`](../../src/pages/lab/Hub.tsx) ou navegue direto:

| Lab | Rota | Cobre | Mapeia pra |
|---|---|---|---|
| Demo Interativa | [`/lab/demo`](../../src/pages/lab/Demo.tsx) | SequencePlayer + cenários OBO/Client Credentials reais executando contra Microsoft Graph | Apêndice (validação end-to-end) |
| Tokens & JWT | [`/lab/tokens`](../../src/pages/lab/Tokens.tsx) | `JwtDecoder` + tabs (Anatomia, v1 vs v2, ID vs Access) | **Cap 4** |
| Fluxos OAuth | [`/lab/fluxos`](../../src/pages/lab/Flows.tsx) | 4 fluxos animados: Auth Code+PKCE, Client Credentials, OBO, Device Code | **Cap 4** |
| Topologias | [`/lab/topologias`](../../src/pages/lab/Topologias.tsx) | 6 arquiteturas (SPA, Web, Mobile, Daemon, Microservices+APIM, Workload Identity) + `TokenClaimSpotlight` | **Cap 1** |
| Permissions & Claims | [`/lab/permissions-claims`](../../src/pages/lab/PermissionsClaims.tsx) | 5 tabs: Delegated vs App, `scp` vs `roles`, App Roles/Groups/Directory, backend validation, admin consent | **Cap 5** |
| Credenciais | [`/lab/credenciais`](../../src/pages/lab/Credenciais.tsx) | 4 credenciais (Secret, Cert, FIC, MI) + decision tree + workflow real do tftec-auth | **Cap 6** |
| Multi-App Patterns | [`/lab/multi-app`](../../src/pages/lab/MultiApp.tsx) | 4 tabs: Pattern A/B, multi-tenant + AADSTS7000229, B2B External Identities, OBO chains 3+ saltos | **Cap 7** |
| Protocolos | [`/lab/protocolos`](../../src/pages/lab/Protocolos.tsx) | OIDC vs OAuth 2.0 vs SAML vs WS-Fed — quando cada um | Apêndice (panorama de protocolos) |
| Recipes | [`/lab/recipes`](../../src/pages/lab/Recipes.tsx) | 10 receitas hands-on App Reg copy-pasta (`az` CLI + Portal + screenshots), com botão copy-to-clipboard | Apêndice (cookbook prático) |

> 📝 Os 4 labs de Phase 2 (Topologias, PermissionsClaims, Credenciais, MultiApp) usam o componente `TokenClaimSpotlight` — adquire seu próprio access token via MSAL e destaca um claim específico (ex.: `aud` em Topologias, `roles` em PermissionsClaims).

### D. Onde reportar problemas

Se algum passo deste hands-on quebrou, abra issue em <https://github.com/tftec-guilherme/entra-auth-gateway/issues> com:
- Capítulo + número do passo
- Comando/click executado
- Mensagem de erro completa (com `correlation_id` se for AADSTS)
- Output de `az account show` e `node --version`

---

**Você terminou.** Próximos passos sugeridos:
1. Use o [`/lab/demo`](../../src/pages/lab/Demo.tsx) pra praticar os cenários reais (login SPA, OBO, Client Credentials) executados contra Microsoft Graph.
2. Abra [`/lab/recipes`](../../src/pages/lab/Recipes.tsx) — 10 receitas copy-pasta cobrindo cenários típicos (multi-tenant, FIC pro GitHub Actions, Swagger UI com OAuth, B2B, App Role assignment, etc).
3. Compare protocolos em [`/lab/protocolos`](../../src/pages/lab/Protocolos.tsx) (OIDC vs OAuth 2.0 vs SAML vs WS-Fed) pra contextualizar quando usar cada um.
4. Leia o [roadmap avançado](./roadmap-avancado.md) pra Conditional Access, Workload Identity, B2C.
