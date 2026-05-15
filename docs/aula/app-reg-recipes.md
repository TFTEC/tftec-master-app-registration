---
title: "App Registration Recipes — 8 cenários hands-on copy-pasta"
audience: "Aluno TFTEC Masters / Dev criando App Reg pra cenário específico"
duration: "10-20 min por receita executando do zero"
last_updated: 2026-05-13
companion:
  - "hands-on.md Cap 2 (criar App Reg single, base teórica)"
  - "/lab/recipes (versão visual interativa com copy-to-clipboard)"
  - "/lab/topologias (decision tree de topologias)"
  - "/lab/credenciais (decision tree de credenciais)"
  - "/lab/multi-app (Pattern A vs B, multi-tenant, B2B, OBO)"
---

# App Registration Recipes — 8 cenários hands-on

> **Diferença vs `hands-on.md`:** o hands-on cria UMA App Reg (multi-tenant, Pattern A). Este doc tem **8 receitas independentes** pra cada cenário arquitetural — cada uma com `az` commands sequenciais, snippet de código, validação e pitfalls. **Copy-pasta funcional.**

## Pré-requisitos compartilhados

```powershell
# 1) Az CLI autenticado na sub correta
az login
az account set --subscription "<seu-tenant-ou-sub>"

# 2) Tenant ID e seu Object ID prontos (pra Permissions/Owner)
$TENANT_ID = az account show --query tenantId -o tsv
$MY_OBJECT_ID = az ad signed-in-user show --query id -o tsv

# 3) Microsoft Graph App ID (constante global)
$GRAPH_APP_ID = "00000003-0000-0000-c000-000000000000"
```

## Cleanup (qualquer receita)

```powershell
# Lista as App Regs que você criou
az ad app list --filter "startsWith(displayName, 'recipe-')" --query "[].{name:displayName, id:appId}" -o table

# Deleta uma específica
az ad app delete --id <app-id>
```

---

## 📐 Recipe 1 — SPA multi-tenant + API juntos (Pattern A)

> **Igual ao `tftec-auth`.** O ponto de partida pra apps SaaS B2B onde o time controla SPA + API.

### Cenário
Frontend React/Angular/Vue + backend .NET/Node, **MESMA App Reg** atende ambos. SPA pega `access_token` com `aud=api://{client-id}` e chama o backend, que valida com o mesmo `client_id`.

### Quando usar
- ✅ MVP, time único, SaaS multi-tenant simples
- ✅ Você controla os dois lados (SPA e API)
- ❌ API vai ser consumida por OUTROS clients (mobile, parceiros) → use Recipe 2

### Decisões críticas

| Aspecto | Escolha | Por quê |
|---|---|---|
| `signInAudience` | `AzureADMultipleOrgs` | Multi-tenant SaaS |
| Platform | **Single-page application** | SPA precisa de PKCE + CORS no `/token` |
| Credencial | PKCE (sem secret) | Browser não segura secret |
| Permission | `User.Read` (Delegated) | Lê perfil do user logado |

### Setup com `az`

```powershell
$APP_NAME = "recipe-1-spa-multi-tenant-pattern-a"
$REDIRECT_URI = "http://localhost:5173/"

# 1) Criar App Reg multi-tenant
$APP_ID = az ad app create `
  --display-name $APP_NAME `
  --sign-in-audience AzureADMultipleOrgs `
  --query appId -o tsv

# 2) Criar Service Principal no tenant atual
az ad sp create --id $APP_ID

# 3) Adicionar Redirect URI tipo SPA (PKCE + CORS)
az ad app update --id $APP_ID --set spa.redirectUris="['$REDIRECT_URI']"

# 4) Expor a própria API (audience custom)
az ad app update --id $APP_ID --identifier-uris "api://$APP_ID"

# 5) Adicionar scope 'access_as_user' pra delegated permission
# (precisa criar manualmente via Portal OU via Graph API direto — az não cobre 100%)

# 6) Adicionar permission Microsoft Graph User.Read (Delegated)
# guid User.Read = e1fe6dd8-ba31-4d61-89e7-88639da4683d (Scope)
az ad app permission add --id $APP_ID --api $GRAPH_APP_ID `
  --api-permissions e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope

# 7) Grant admin consent (opcional pra User.Read — user pode consentir)
az ad app permission admin-consent --id $APP_ID
```

### Portal completar (passo 5 — scope)

1. Portal → sua App Reg → **Expose an API** → **+ Add a scope**
2. Application ID URI: `api://{APP_ID}` (já preenchido)
3. **Add a scope:**
   - Scope name: `access_as_user`
   - Who can consent: **Admins and users**
   - Admin consent display name: `Access tftec-auth API`
   - State: **Enabled**
4. **Add scope**

### Integração no código

**Frontend (`src/config/azure.ts`):**
```typescript
export const AZURE_CONFIG = {
  tenantId: "organizations",                            // multi-tenant
  clientId: import.meta.env.VITE_AZURE_CLIENT_ID,       // = APP_ID
  audience: `api://${import.meta.env.VITE_AZURE_CLIENT_ID}`,
};
```

**Backend (`appsettings.json`):**
```json
{
  "AzureAd": {
    "TenantId": "organizations",
    "ClientId": "{APP_ID}",
    "Audience": "api://{APP_ID}"
  }
}
```

### Validação

```powershell
# 1) Login no SPA — deve abrir popup Microsoft, autenticar, voltar com session
# Abrir http://localhost:5173 → click Login → ver displayName

# 2) Token tem aud correta?
# DevTools → Application → sessionStorage → procurar 'idtoken-...' → decode em jwt.ms
# Esperado: "aud": "api://{APP_ID}"

# 3) Backend valida o token?
# curl com o access_token → endpoint protegido retorna 200
```

### Pitfalls

- ❌ **AADSTS50011 (Redirect URI mismatch):** registrou `http://localhost:5173` mas SPA acessa `http://localhost:5173/`. Adicione AMBOS.
- ❌ **AADSTS7000229 (Missing SP):** primeiro login dum tenant novo. Solução: usuário acessa `https://login.microsoftonline.com/{tenant}/adminconsent?client_id={APP_ID}` ou admin roda `az ad sp create`.
- ❌ **CORS error no `/token`:** registrou como Web em vez de SPA. Apagar plataforma Web no Portal e adicionar Single-page application.

---

## 🏗️ Recipe 2 — SPA + API separadas (Pattern B)

> **Quando a API ganha o 2º consumidor** (web + mobile + integração externa).

### Cenário
**DUAS App Regs:** uma pra o SPA cliente, outra pra a API. Cliente pede consent pra um scope da API; API valida tokens com `aud=api://{api-app-id}`.

### Quando usar
- ✅ API consumida por 2+ clients (web, mobile, B2B parceiros)
- ✅ Times separados (segregação de credenciais)
- ❌ MVP single-team → começa com Pattern A (Recipe 1)

### Decisões críticas

| Aspecto | API App Reg | Cliente App Reg |
|---|---|---|
| Platform | **(none)** — só expose | Single-page application |
| Expose an API | ✅ scope `access_as_user` | ❌ |
| API permissions | ❌ | ✅ `api://{api}/access_as_user` |
| Credencial | (Cert / Secret pra OBO se quiser) | PKCE |

### Setup com `az`

```powershell
# === API App Reg (servidor) ===
$API_NAME = "recipe-2-api"
$API_APP_ID = az ad app create `
  --display-name $API_NAME `
  --sign-in-audience AzureADMyOrg `
  --query appId -o tsv

az ad sp create --id $API_APP_ID
az ad app update --id $API_APP_ID --identifier-uris "api://$API_APP_ID"
# Scope 'access_as_user' criar via Portal (próximo passo)

# === Cliente App Reg (SPA) ===
$CLIENT_NAME = "recipe-2-client-spa"
$CLIENT_APP_ID = az ad app create `
  --display-name $CLIENT_NAME `
  --sign-in-audience AzureADMyOrg `
  --query appId -o tsv

az ad sp create --id $CLIENT_APP_ID
az ad app update --id $CLIENT_APP_ID `
  --set spa.redirectUris="['http://localhost:5173/']"

# Cliente pede permissão pro scope da API
# (após criar scope no Portal — próximos passos manuais)
```

### Portal — completar

1. **Na API App Reg:** Expose an API → Add a scope → `access_as_user` (como Recipe 1)
2. **Na Cliente App Reg:** API permissions → **+ Add a permission** → **My APIs** → seleciona a `recipe-2-api` → **Delegated** → `access_as_user` → Add.
3. **Grant admin consent** na Cliente App Reg (admin do tenant, raro pra dev).

### Validação

```powershell
# 1) SPA loga, pede consent pro scope da API
# Token resultante tem: "aud": "api://{API_APP_ID}" (NÃO api://{CLIENT_APP_ID})

# 2) API valida — Audience configurado = api://{API_APP_ID}
```

### Pitfalls

- ❌ **AADSTS65001 (Consent not granted):** cliente não pediu permission pro scope da API. Fix: Portal → cliente → API permissions → Add → seleciona scope.
- ❌ **Audience errada:** SPA pega token com `aud=api://{CLIENT}` mas API espera `api://{API}`. Verifica `scope` no MSAL config — deve ser `api://{API_APP_ID}/access_as_user`.

---

## 🌐 Recipe 3 — Web App tradicional ASP.NET MVC

> Server-side rendering com cookie de sessão. Token NUNCA toca o browser.

### Cenário
ASP.NET Core MVC ou Razor Pages. Backend cuida do callback OIDC, token vive no token cache do server, browser só carrega cookie HttpOnly. Pattern enterprise legado/intranet.

### Quando usar
- ✅ Apps intranet enterprise, governo, bancos (token NÃO pode vazar no browser)
- ✅ Sticky sessions ou cache distribuído (Redis) já existe
- ❌ App moderna SPA-first → Recipe 1

### Decisões críticas

| Aspecto | Escolha |
|---|---|
| `signInAudience` | `AzureADMyOrg` (geralmente single tenant) |
| Platform | **Web** |
| Redirect URI | `https://meu-app/signin-oidc` (callback Microsoft.Identity.Web) |
| Front-channel logout | `https://meu-app/signout-callback-oidc` |
| Credencial | Client Secret OU Certificate |

### Setup com `az`

```powershell
$APP_NAME = "recipe-3-webapp-mvc"
$WEB_APP_URL = "https://localhost:5001"   # ou seu domínio prod

$APP_ID = az ad app create `
  --display-name $APP_NAME `
  --sign-in-audience AzureADMyOrg `
  --web-redirect-uris "$WEB_APP_URL/signin-oidc" `
  --enable-id-token-issuance true `
  --query appId -o tsv

az ad sp create --id $APP_ID

# Adicionar logout URL
az ad app update --id $APP_ID `
  --set web.logoutUrl="$WEB_APP_URL/signout-callback-oidc"

# Criar Client Secret (válido 1 ano)
$SECRET = az ad app credential reset --id $APP_ID --years 1 --query password -o tsv
Write-Host "Client Secret (copie agora — não dá pra ver depois):"
Write-Host $SECRET

# User.Read default já vem no template Web; se quiser explicitar:
az ad app permission add --id $APP_ID --api $GRAPH_APP_ID `
  --api-permissions e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope
```

### Integração no código

**`Program.cs` (ASP.NET Core):**
```csharp
builder.Services.AddAuthentication(OpenIdConnectDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApp(builder.Configuration.GetSection("AzureAd"));

builder.Services.AddRazorPages().AddMicrosoftIdentityUI();
```

**`appsettings.json`:**
```json
{
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "Domain": "seu-tenant.onmicrosoft.com",
    "TenantId": "{TENANT_ID}",
    "ClientId": "{APP_ID}",
    "ClientSecret": "{SECRET}",
    "CallbackPath": "/signin-oidc",
    "SignedOutCallbackPath": "/signout-callback-oidc"
  }
}
```

### Validação

```powershell
# 1) Acesse https://localhost:5001 → redirect Microsoft → login → volta com cookie HttpOnly
# 2) DevTools → Application → Cookies → vê 'AspNetCore.Cookies' (HttpOnly + Secure + SameSite=Lax)
# 3) Inspeciona request /authorize — usa scope=openid profile (não scopes de API)
```

### Pitfalls

- ❌ **InvalidOperationException no startup:** `ClientSecret` faltando em `appsettings.Production.json`. Use Key Vault ou env var.
- ❌ **AADSTS50011 com `signin-oidc`:** registrou `https://meu-app/` mas Microsoft.Identity.Web usa `/signin-oidc`. Adicione o sufixo na Redirect URI.

---

## 📱 Recipe 4 — Mobile nativo (Android + MSAL)

> Broker do sistema + biometria. SSO entre apps Microsoft.

### Cenário
App Android ou iOS nativo usando MSAL Mobile SDK. Token cache criptografado device-bound (TPM / Secure Enclave). Login via broker (Microsoft Authenticator no Android, Company Portal no iOS).

### Quando usar
- ✅ Apps corporativos Android/iOS
- ✅ Cenário Intune com device compliance
- ❌ Web SPA dentro de WebView → use Recipe 1

### Decisões críticas

| Aspecto | Escolha |
|---|---|
| `signInAudience` | `AzureADMyOrg` ou `AzureADMultipleOrgs` |
| Platform | **Mobile and desktop applications** (Public client) |
| Redirect URI | `msauth://{bundle-id}/{base64-hash}` |
| Credencial | PKCE + broker token (device-bound) |

### Setup com `az`

```powershell
$APP_NAME = "recipe-4-mobile-android"
$BUNDLE_ID = "com.exemplo.app"           # bundle id do APK
$SIGNATURE_HASH = "AbCdEfG..."           # base64-encoded SHA1 do signing key

$APP_ID = az ad app create `
  --display-name $APP_NAME `
  --sign-in-audience AzureADMyOrg `
  --public-client-redirect-uris "msauth://$BUNDLE_ID/$SIGNATURE_HASH" "msauth://com.microsoft.authenticator/$BUNDLE_ID" `
  --is-fallback-public-client true `
  --query appId -o tsv

az ad sp create --id $APP_ID

# User.Read pra Android template padrão
az ad app permission add --id $APP_ID --api $GRAPH_APP_ID `
  --api-permissions e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope
```

### Como pegar o `$SIGNATURE_HASH`

```bash
# Linux/Mac
keytool -exportcert -alias androiddebugkey -keystore ~/.android/debug.keystore | openssl sha1 -binary | openssl base64
# Output exemplo: 1wIqXV3...
```

### Integração no código (Kotlin — Android)

```kotlin
val msalApp = PublicClientApplication.createSingleAccountPublicClientApplication(
    context, R.raw.msal_config)

val params = AcquireTokenParameters.Builder()
    .startAuthorizationFromActivity(this)
    .withScopes(listOf("User.Read"))
    .withCallback(authCallback)
    .build()

msalApp.acquireToken(params)
```

**`msal_config.json` (res/raw):**
```json
{
  "client_id": "{APP_ID}",
  "authorization_user_agent": "DEFAULT",
  "redirect_uri": "msauth://{BUNDLE_ID}/{SIGNATURE_HASH}",
  "authorities": [{ "type": "AAD", "audience": { "type": "AzureADMyOrg", "tenant_id": "{TENANT_ID}" }}]
}
```

### Validação

- App abre → tap "Login" → Microsoft Authenticator OU Chrome Custom Tab abre → autentica → app recebe token.
- Token cache no app (Android KeyStore) — verificar via `IAccount.getId()` retorna oid.

### Pitfalls

- ❌ **Redirect URI mismatch:** signature hash difere entre debug e release builds. Registre AMBOS no Portal.
- ❌ **Authenticator não instalado:** fallback pra WebView é menos seguro. Doc Microsoft recomenda exigir broker em prod.

---

## 🤖 Recipe 5 — Daemon com Client Secret (MVP)

> Job sem usuário. Cron, background worker, ETL. Client Credentials flow.

### Cenário
Daemon roda 24/7 sem user interativo. Autentica como ELE MESMO via `client_id` + `client_secret`. Pega token com claim `roles` (Application permissions). Audit log mostra `appid`, não user.

### Quando usar
- ✅ MVP, dev local, prototipagem, scripts internos
- ❌ Production crítica → Recipe 6 (FIC) ou Managed Identity

### Decisões críticas

| Aspecto | Escolha |
|---|---|
| `signInAudience` | `AzureADMyOrg` |
| Platform | **(none)** — sem Redirect URI |
| Credencial | Client Secret |
| Permission | **Application** (Mail.Read, User.Read.All, etc.) |
| Admin consent | **Obrigatório** pra Application permissions |

### Setup com `az`

```powershell
$APP_NAME = "recipe-5-daemon-secret"

$APP_ID = az ad app create `
  --display-name $APP_NAME `
  --sign-in-audience AzureADMyOrg `
  --query appId -o tsv

az ad sp create --id $APP_ID

# Client Secret (6 meses pra MVP — produção usa 1-2 anos OU migra pra FIC)
$SECRET = az ad app credential reset --id $APP_ID --years 1 --query password -o tsv
Write-Host "Client Secret:"; Write-Host $SECRET

# User.Read.All (Application) — guid df021288-...
# (Role, não Scope — Application permission)
az ad app permission add --id $APP_ID --api $GRAPH_APP_ID `
  --api-permissions df021288-bdef-4463-88db-98f22de89214=Role

# Admin consent OBRIGATÓRIO pra Application permission
az ad app permission admin-consent --id $APP_ID
```

### Integração no código (Node.js)

```typescript
import { ConfidentialClientApplication } from "@azure/msal-node";

const msalApp = new ConfidentialClientApplication({
  auth: {
    clientId: process.env.APP_ID!,
    clientSecret: process.env.CLIENT_SECRET!,
    authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`,
  },
});

const { accessToken } = await msalApp.acquireTokenByClientCredential({
  scopes: ["https://graph.microsoft.com/.default"],
});

// Chama Graph como o app (não como user)
const res = await fetch("https://graph.microsoft.com/v1.0/users?$top=5", {
  headers: { Authorization: `Bearer ${accessToken}` },
});
```

### Validação

```powershell
# 1) Pegar token via curl (substituir variáveis)
$TENANT_ID = "<seu-tenant>"
$APP_ID = "<seu-app-id>"
$SECRET = "<seu-secret>"

$body = "grant_type=client_credentials&client_id=$APP_ID&client_secret=$SECRET&scope=https%3A%2F%2Fgraph.microsoft.com%2F.default"
$resp = Invoke-RestMethod -Uri "https://login.microsoftonline.com/$TENANT_ID/oauth2/v2.0/token" `
  -Method POST -ContentType "application/x-www-form-urlencoded" -Body $body
$TOKEN = $resp.access_token

# 2) Decodificar — deve ter "roles" (não "scp"), aud=Graph, appid=$APP_ID
# Cole em https://jwt.ms

# 3) Chamar Graph
Invoke-RestMethod -Uri "https://graph.microsoft.com/v1.0/users?\$top=3" `
  -Headers @{ Authorization = "Bearer $TOKEN" }
```

### Pitfalls

- ❌ **AADSTS65001 (consent missing):** esqueceu o `admin-consent`. Application permissions SEMPRE exigem admin.
- ❌ **403 Forbidden no Graph:** permission adicionada mas SP não tem assignment. Após admin consent, isso resolve.
- ❌ **Secret expirado:** secret defaut 6 meses. Rotação manual ou migrar pra Recipe 6 (FIC) / Managed Identity.

---

## 🚀 Recipe 6 — Daemon com FIC (GitHub Actions OIDC)

> **Zero secrets.** Padrão moderno pra CI/CD que deploya em Azure.

### Cenário
GitHub Actions workflow precisa de token pra fazer `az` calls em Azure. Em vez de armazenar `AZURE_CLIENT_SECRET` no GitHub Secrets, o workflow pede id_token via OIDC do próprio GitHub, e Entra ID aceita esse id_token como prova de identidade.

### Quando usar
- ✅ CI/CD que deploya em Azure (GitHub Actions, Azure DevOps, GitLab CI)
- ✅ Padrão recomendado pela Microsoft pra 2024+
- ❌ Daemon rodando em servidor não-CI/CD → Managed Identity (Recipe equivalente em Azure) ou Recipe 5

### Decisões críticas

| Aspecto | Escolha |
|---|---|
| Credencial | **Federated Identity Credential** (zero secret) |
| Subject filter | `repo:{org}/{repo}:ref:refs/heads/main` (ou env / tag) |
| Issuer | `https://token.actions.githubusercontent.com` |
| Audience | `api://AzureADTokenExchange` |

### Setup com `az`

```powershell
$APP_NAME = "recipe-6-daemon-fic-github"
$REPO = "seu-user/seu-repo"     # GitHub repo onde o workflow vive

$APP_ID = az ad app create `
  --display-name $APP_NAME `
  --sign-in-audience AzureADMyOrg `
  --query appId -o tsv

az ad sp create --id $APP_ID

# Federated Credential — confia em id_tokens do GitHub Actions
$ficParams = @{
  name      = "github-actions-main"
  issuer    = "https://token.actions.githubusercontent.com"
  subject   = "repo:${REPO}:ref:refs/heads/main"
  audiences = @("api://AzureADTokenExchange")
} | ConvertTo-Json -Compress

az ad app federated-credential create --id $APP_ID --parameters $ficParams

# Role assignment — dar Contributor na sub que o CI/CD vai mexer
$SUB_ID = az account show --query id -o tsv
$SP_OBJECT_ID = az ad sp show --id $APP_ID --query id -o tsv

az role assignment create `
  --assignee-object-id $SP_OBJECT_ID `
  --assignee-principal-type ServicePrincipal `
  --role Contributor `
  --scope "/subscriptions/$SUB_ID"
```

### Configurar no GitHub Actions

**`.github/workflows/deploy.yml`:**
```yaml
permissions:
  id-token: write      # OBRIGATÓRIO pra OIDC token exchange
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Azure Login (OIDC, zero secrets)
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}            # = APP_ID (não é secret de auth, é GUID público)
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}            # também GUID público
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - run: az group list
```

GitHub Secrets necessários: APENAS GUIDs (não são secrets reais — só facilitam config). Você pode até hardcodar:
- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

### Validação

Faça commit + push pra `main`. Workflow roda. Veja log do step "Azure Login (OIDC)" — deve mostrar:
```
Login successful via OIDC.
```

Se mostrar erro de "subject mismatch", confira que o branch é `main` (não `master`/`develop`) e o repo bate.

### Pitfalls

- ❌ **AADSTS70021 (No matching federated identity record):** subject não bate. Cuidado com `main` vs `master` vs `develop`. Crie FICs separadas por branch se precisar.
- ❌ **AADSTS900150 (Authorization_RequestDenied):** workflow não tem `permissions.id-token: write`. Adicione no YAML.
- ❌ **Workflow funciona em PR mas não em push:** subject de PR é diferente (`refs/pull/123/merge`). Crie FIC adicional pra PRs OU restrinja workflow a `push`.

---

## 🌎 Recipe 7 — B2B SaaS multi-tenant

> Seu SaaS é vendido pra outras empresas. Cada cliente faz login com a conta dele.

### Cenário
App multi-tenant onde cliente A (`tenant-a.onmicrosoft.com`) faz login, App Reg está NO SEU tenant (`tenant-seu.onmicrosoft.com`). Entra ID provisiona um Service Principal no tenant do cliente automaticamente no primeiro consent.

### Quando usar
- ✅ SaaS B2B (Salesforce-like, ERP) com clientes Entra ID corporativos
- ❌ B2C consumer (Gmail, Facebook social login) → Entra External ID for Customers

### Decisões críticas

| Aspecto | Escolha |
|---|---|
| `signInAudience` | `AzureADMultipleOrgs` |
| Verified publisher | **Recomendado** (reduz friction de consent) |
| Permissions | Apenas o mínimo (clientes auditam consent) |
| Branding | Logo + Publisher domain (Portal) |

### Setup com `az`

```powershell
$APP_NAME = "recipe-7-b2b-saas"
$YOUR_DOMAIN = "yourdomain.com"    # domínio do publisher verified

$APP_ID = az ad app create `
  --display-name $APP_NAME `
  --sign-in-audience AzureADMultipleOrgs `
  --web-redirect-uris "https://saas.$YOUR_DOMAIN/signin-oidc" `
  --enable-id-token-issuance true `
  --query appId -o tsv

az ad sp create --id $APP_ID

# Permissions mínimas (clientes vão auditar) — User.Read (Delegated)
az ad app permission add --id $APP_ID --api $GRAPH_APP_ID `
  --api-permissions e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope

# Branding via Portal:
# - Verified Publisher (vinculado ao MPN account) reduz friction
# - Publisher domain (PSV) precisa MX record verificado
```

### Endpoint admin consent (compartilhe com cliente)

```
https://login.microsoftonline.com/common/adminconsent?client_id=APP_ID&redirect_uri=https://saas.YOUR_DOMAIN/admin-consent-callback
```

Admin do tenant cliente clica esse link, vê a lista de permissions, aceita → cria SP no tenant dele.

### Validação

```powershell
# Como cliente (de outro tenant) tenta login:
# 1) https://saas.yourdomain.com/login → redirect Microsoft (common authority)
# 2) Tela "An admin needs to consent" OU consent direto se permission é User-consent-able
# 3) Após aceito: SP aparece em Enterprise applications NO TENANT DO CLIENTE

# Verificar do lado do cliente (no tenant dele):
az ad sp list --filter "appId eq '{APP_ID}'" --query "[].{name:displayName, tid:appOwnerOrganizationId}"
# tid = SEU tenant (publisher)
```

### Pitfalls

- ❌ **AADSTS7000229:** cliente nunca consentiu — sem SP local. Solução: trigger admin consent flow.
- ❌ **"This app requires admin consent" em users normais:** alguma permission marcada como "admin only". Ou reduza permissions, ou eduque cliente a aprovar.
- ❌ **Token validation falha (issuer):** backend precisa aceitar issuer dinâmico (qualquer tenant) — config `ValidateIssuer=false` em Microsoft.Identity.Web + validação manual de tenant na lista de allowed tenants.

---

## ☸️ Recipe 8 — AKS Workload Identity (production k8s)

> Pods Kubernetes autenticam como Service Principal sem secret algum.

### Cenário
App em AKS precisa chamar Graph / KeyVault / Storage. Em vez de mountar Service Principal Secret nos pods, AKS expõe OIDC issuer + cada Pod ServiceAccount → projected token JWT → Entra ID aceita como Federated Credential.

### Quando usar
- ✅ AKS produção, multi-team, compliance heavy
- ✅ Cada workload precisa de identidade separada (audit trail granular)
- ❌ App Service / Function App → use Managed Identity nativa (mais simples)
- ❌ Single-pod simple — overkill

### Decisões críticas

| Aspecto | Escolha |
|---|---|
| AKS feature | **Workload Identity addon** (`--enable-oidc-issuer --enable-workload-identity`) |
| Credencial | Federated Identity Credential trustando ServiceAccount |
| Subject | `system:serviceaccount:{namespace}:{sa-name}` |
| Issuer | `<OIDC URL>` do AKS cluster |

### Setup com `az`

```powershell
$APP_NAME = "recipe-8-aks-workload-identity"
$AKS_RG = "rg-aks"
$AKS_NAME = "aks-prod"
$NAMESPACE = "default"
$SA_NAME = "my-app-sa"

# 1) Habilitar Workload Identity no AKS (se ainda não)
az aks update --resource-group $AKS_RG --name $AKS_NAME `
  --enable-oidc-issuer --enable-workload-identity

# 2) Pegar OIDC issuer do AKS
$AKS_OIDC_ISSUER = az aks show --resource-group $AKS_RG --name $AKS_NAME `
  --query "oidcIssuerProfile.issuerUrl" -o tsv

# 3) Criar App Reg + SP
$APP_ID = az ad app create --display-name $APP_NAME --query appId -o tsv
az ad sp create --id $APP_ID

# 4) Federated Identity Credential — trust no ServiceAccount
$ficParams = @{
  name      = "aks-workload-identity"
  issuer    = $AKS_OIDC_ISSUER
  subject   = "system:serviceaccount:${NAMESPACE}:${SA_NAME}"
  audiences = @("api://AzureADTokenExchange")
} | ConvertTo-Json -Compress

az ad app federated-credential create --id $APP_ID --parameters $ficParams

# 5) Role assignment (KeyVault Secrets User, etc.)
$SP_OBJECT_ID = az ad sp show --id $APP_ID --query id -o tsv
az role assignment create --assignee-object-id $SP_OBJECT_ID `
  --assignee-principal-type ServicePrincipal `
  --role "Key Vault Secrets User" `
  --scope "/subscriptions/$SUB_ID/resourceGroups/$KV_RG/providers/Microsoft.KeyVault/vaults/$KV_NAME"
```

### Kubernetes manifest

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-app-sa
  namespace: default
  annotations:
    azure.workload.identity/client-id: "{APP_ID}"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  selector:
    matchLabels: { app: my-app }
  template:
    metadata:
      labels:
        app: my-app
        azure.workload.identity/use: "true"   # ativa workload identity webhook
    spec:
      serviceAccountName: my-app-sa
      containers:
        - name: app
          image: myacr.azurecr.io/my-app:latest
          # Token JWT é injetado em /var/run/secrets/azure/tokens/azure-identity-token
```

### Integração no código (.NET)

```csharp
// DefaultAzureCredential detecta automaticamente o token projetado
var credential = new DefaultAzureCredential();
var secretClient = new SecretClient(new Uri(vaultUri), credential);
var secret = await secretClient.GetSecretAsync("my-secret");
```

### Validação

```bash
# Dentro do pod:
kubectl exec -it my-app-pod -- env | grep AZURE
# AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_AUTHORITY_HOST, AZURE_FEDERATED_TOKEN_FILE

# Token file deve existir:
kubectl exec -it my-app-pod -- cat /var/run/secrets/azure/tokens/azure-identity-token
# Decode em jwt.ms — issuer = AKS OIDC URL, subject = system:serviceaccount:...
```

### Pitfalls

- ❌ **Webhook não inject env vars:** label `azure.workload.identity/use: "true"` faltando no Pod (não no Deployment).
- ❌ **AADSTS70021 (No matching FIC):** subject errado. Exato: `system:serviceaccount:{ns}:{sa}` — minúsculas, namespace correto.
- ❌ **Pod ainda usa Pod Identity (legacy):** Pod Identity foi deprecated em favor de Workload Identity. Migrar.

---

## 🎭 Recipe 9 — Custom Claims (App Roles + Optional Claims)

> Sua App Reg emite tokens com claims **customizados** — `roles`, `groups`, `email`, ou claims via Claim Mapping Policy.

### Cenário
Backend precisa de claim que NÃO vem no token padrão Entra ID. Exemplos:
- `roles` (App Roles atribuídos via Enterprise applications)
- `groups` (security groups do user)
- `email` (em alguns tenants não vem por padrão no v2 token)
- `ipaddr` (IP de origem — security/audit)
- Custom claim via Claim Mapping Policy (corporate field do AD)

### Quando usar
- ✅ App precisa de RBAC granular usando App Roles próprios
- ✅ Compliance exige claim que prove device/IP
- ✅ Migration de sistema legado que usava SAML attribute customizado
- ❌ Só pra "porque pode" → tokens grandes degradam perf

### Decisões críticas

| Aspecto | Escolha |
|---|---|
| App Roles | Definir no Manifest da App Reg |
| Optional Claims | Editar `optionalClaims` no Manifest |
| Group claim | "Security groups" ou "All groups" (cuidado overflow > 200) |
| Claim Mapping Policy | **Avançado** — extrair custom attribute via Graph PowerShell |

### Setup 1 — App Role customizado

```powershell
$APP_NAME = "recipe-9-custom-claims"
$APP_ID = az ad app create --display-name $APP_NAME --query appId -o tsv
az ad sp create --id $APP_ID

# App Role via Manifest patch
$appRoleId = [guid]::NewGuid().ToString()
$appRole = @{
  id                 = $appRoleId
  isEnabled          = $true
  origin             = "Application"
  allowedMemberTypes = @("User", "Application")
  displayName        = "Approver"
  description        = "Pode aprovar requisicoes"
  value              = "Approver"
}

$current = az ad app show --id $APP_ID --query appRoles -o json | ConvertFrom-Json
$newRoles = @($current + $appRole) | ConvertTo-Json -Compress
az ad app update --id $APP_ID --app-roles $newRoles
```

### Setup 2 — Optional Claims (email, groups, ipaddr)

```powershell
# Optional Claims via Manifest patch
$optionalClaims = @{
  idToken     = @(
    @{ name = "email";  source = $null; essential = $false }
    @{ name = "groups"; source = $null; essential = $false }
  )
  accessToken = @(
    @{ name = "email";  source = $null; essential = $false }
    @{ name = "groups"; source = $null; essential = $false }
    @{ name = "ipaddr"; source = $null; essential = $false }
  )
  saml2Token  = @()
} | ConvertTo-Json -Depth 10 -Compress

az ad app update --id $APP_ID --optional-claims $optionalClaims
```

### Setup 3 — Group claim (Portal)

1. Portal → App Reg → **Token configuration** → **+ Add groups claim**
2. Selecione tipo: **Security groups** ou **Groups assigned to the application**
3. Configure pra ID token + Access token
4. Save

### Token resultado (delegated)

```json
{
  "aud": "api://...",
  "iss": "...",
  "iat": 1715616000,
  "exp": 1715619600,
  "email": "fulano@tenant.com",
  "groups": ["abc-guid-1", "def-guid-2"],
  "ipaddr": "203.0.113.42",
  "roles": ["Approver"],
  "name": "Fulano da Silva",
  ...
}
```

### Validação

```powershell
# Atribuir App Role ao seu user via Enterprise Applications
$ENTERPRISE_APP_OID = az ad sp show --id $APP_ID --query id -o tsv

# (Manual via Portal — Users and groups → + Add user/group → seleciona role)

# Logout + Login no SPA → decode token em jwt.ms
# Esperado: "roles": ["Approver"]
```

### Pitfalls

- ❌ **`groups` claim ausente:** esqueceu de configurar Token configuration. App Roles vêm em `roles`, security groups em `groups` — não confunda.
- ❌ **Token > 1KB:** overflow de groups (>200). Solução: usar Graph `/me/memberOf` em vez do claim, OU filtrar por "Groups assigned to the application".
- ❌ **`email` claim vazio:** user não tem mail attribute no AD. Use `preferred_username` como fallback OU Claim Mapping Policy.
- ❌ **AADSTS9002327 (custom claim):** Claim Mapping Policy mal-configurada. Requer Graph PowerShell + `acceptMappedClaims=true` no manifest.

---

## 📖 Recipe 10 — Swagger UI com OAuth2 + Entra ID

> Sua API tem `/swagger` (Swashbuckle) e você quer que o **botão "Authorize"** do Swagger UI faça login real Entra ID e teste endpoints autenticados.

### Cenário
Backend .NET 8 com Microsoft.Identity.Web + Swashbuckle. Hoje `/swagger` exige token cole-no-campo manualmente. Vamos configurar pra **Swagger fazer Auth Code + PKCE flow direto** — botão Authorize abre popup Microsoft, login, token volta, todas as próximas calls de teste já vão com Bearer.

### Quando usar
- ✅ Time front-end ou parceiros B2B testando API
- ✅ Doc viva — Swagger UI vira ferramenta de exploração
- ❌ API sem usuários (daemon-only Client Credentials) — Swagger vira só doc estática

### Decisões críticas

| Aspecto | Escolha |
|---|---|
| Flow | **Auth Code + PKCE** (Swagger UI 3.x suporta nativo) |
| Redirect URI extra | `https://{api}/swagger/oauth2-redirect.html` |
| Scope | `api://{client-id}/access_as_user` |
| OpenAPI version | 3.0+ (suporte completo a security schemes) |

### Setup — App Reg side

```powershell
$APP_ID = "<seu-app-id-existente-ou-novo>"
$API_URL = "https://localhost:5001"   # ou prod

# 1) Adicionar SPA platform pro Swagger UI (SPA platform pra CORS funcionar)
az ad app update --id $APP_ID `
  --set spa.redirectUris="['$API_URL/swagger/oauth2-redirect.html', 'http://localhost:5173/']"

# Se já tinha redirect URI SPA, mantém ambos
```

### Setup — Código backend (.NET 8 + Swashbuckle)

**`Program.cs`:**
```csharp
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "MinhaAPI", Version = "v1" });

    // OAuth2 security scheme
    c.AddSecurityDefinition("oauth2", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.OAuth2,
        Flows = new OpenApiOAuthFlows
        {
            AuthorizationCode = new OpenApiOAuthFlow
            {
                AuthorizationUrl = new Uri($"https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/authorize"),
                TokenUrl         = new Uri($"https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token"),
                Scopes = new Dictionary<string, string>
                {
                    [$"api://{clientId}/access_as_user"] = "Access API as user"
                }
            }
        }
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id   = "oauth2"
                }
            },
            new[] { $"api://{clientId}/access_as_user" }
        }
    });
});

// Swagger UI config (depois de UseSwagger)
app.UseSwaggerUI(c =>
{
    c.OAuthClientId(clientId);              // PUBLIC, não é secret
    c.OAuthUsePkce();                       // PKCE em vez de implicit
    c.OAuthScopes($"api://{clientId}/access_as_user");
    c.OAuthScopeSeparator(" ");
});
```

### Validação

1. Rodar `dotnet run`, abrir `https://localhost:5001/swagger`
2. Click no botão **🔐 Authorize** (canto superior direito)
3. Modal abre — confirme scope marcado, click **Authorize**
4. Popup Microsoft → login → consent → fecha
5. Modal Swagger mostra ✅ verde. Click **Close**.
6. Expanda qualquer endpoint protegido, click **Try it out** → **Execute**.
7. Request gerado tem `Authorization: Bearer {token}` automático.
8. Response 200 — funcionou.

### Pitfalls

- ❌ **AADSTS9002326 (cross-origin):** registrou como Web em vez de SPA. Swagger UI faz Auth Code + PKCE = precisa SPA platform.
- ❌ **CORS error no /token:** mesmo motivo.
- ❌ **AADSTS65001 (consent):** scope não consentido. Click `Authorize` aceita; se admin-only scope, precisa admin consent prévio.
- ❌ **Token expirou no meio do teste:** Swagger UI não renova silently. Click Authorize de novo (gera token novo).
- ❌ **Em produção:** se Swagger UI exposto público + endpoints sensíveis, considere desabilitar Swagger em prod OU requerer App Role pra acessar `/swagger`.

---

## 📊 Tabela resumo das 10 receitas

| # | Cenário | signInAudience | Credencial | Permission tipo | Complexidade |
|---|---|---|---|---|---|
| 1 | SPA + API juntos (Pattern A) | Multi-tenant | PKCE | Delegated | ⭐ Onboarding |
| 2 | SPA + API separadas (Pattern B) | Single ou Multi | PKCE / Cert | Delegated cross-app | ⭐⭐ Médio |
| 3 | Web App ASP.NET MVC | Single tenant | Secret/Cert | Delegated | ⭐⭐ Médio |
| 4 | Mobile Android+MSAL | Single ou Multi | PKCE + broker | Delegated | ⭐⭐⭐ Avançado |
| 5 | Daemon Client Secret | Single tenant | Secret | Application | ⭐⭐ Médio |
| 6 | Daemon FIC GitHub | Single tenant | **Federated** | RBAC Azure | ⭐⭐⭐ Avançado |
| 7 | B2B SaaS | Multi-tenant | Cert / Secret | Delegated | ⭐⭐⭐ Avançado |
| 8 | AKS Workload Identity | Single tenant | **Federated** | Mix | ⭐⭐⭐⭐ Expert |
| 9 | Custom Claims (App Roles + Optional) | Qualquer | N/A | Delegated/App | ⭐⭐⭐ Avançado |
| 10 | Swagger UI com OAuth2 | Qualquer | PKCE | Delegated | ⭐⭐ Médio |

## 🧭 Quando usar cada conceito — apêndice cross-receitas

### Claims — quando usar quais

| Você precisa de... | Use o claim... | Como obter |
|---|---|---|
| Identidade estável do user | `oid` | Sempre presente |
| Email do user | `email` (v2) ou `upn` (v1) | Habilitar via Optional Claims (Recipe 9) se vazio |
| Identidade do app | `appid` (v1) ou `azp` (v2) | Sempre presente em tokens application |
| Tenant do user | `tid` | Sempre presente |
| Permissions concedidas (Delegated) | `scp` | Configurar scopes em "Expose an API" (Recipe 1, 2) |
| Permissions concedidas (Application) | `roles` | Configurar Application permissions + admin consent (Recipe 5, 6) |
| Roles atribuídos no app | `roles` (mesmo claim!) | App Roles via Manifest (Recipe 9) |
| Security groups do user | `groups` | Token configuration → Add groups claim (Recipe 9) |
| IP de origem (audit) | `ipaddr` | Optional Claims (Recipe 9) |
| Device compliance | `deviceid`, `trustedfordelegation` | Conditional Access policy |
| Custom corporate attribute | Custom claim | Claim Mapping Policy via Graph PowerShell (avançado) |

### Roles — App Roles vs Groups vs Directory Roles

| Mecanismo | Definido em | Claim no token | Quando usar |
|---|---|---|---|
| **App Roles** | App Reg → App roles (Manifest) | `roles` | RBAC do SEU app — default recomendado. Funciona pra users E para Service Principals (daemons). |
| **Security Groups** | Entra ID → Groups | `groups` (após configurar) | RBAC corporativo administrado fora do app. Integra Teams, SharePoint, Dynamics. Cuidado: claim overflow se >200 groups. |
| **Directory Roles** | Entra ID → Roles & admins | `wids` (v1) / `roles` (v2) | Tenant-wide admin (Global Admin, User Admin). Quase nunca pra business app — só pra restringir features de admin. |

**Decisão rápida:** sempre **App Roles** primeiro. Groups quando admin externo precisa atribuir. Directory Roles raro — só pra "este endpoint só Global Admin pode chamar".

📍 Detalhe visual: [`/lab/permissions-claims`](../../src/pages/lab/PermissionsClaims.tsx) Tab 3.

### Swagger / OpenAPI — quando documentar API

| Tipo de API | Swagger sim/não | Notas |
|---|---|---|
| API REST consumida por SPA/mobile próprios | ✅ Sim, com OAuth2 (Recipe 10) | UI vira dev tool |
| API consumida só por daemon próprio | 🟡 Doc estática serve (sem OAuth) | OAuth no Swagger é overkill |
| API B2B (parceiros externos) | ✅ Sim, com OAuth + sandbox tenant | Onboarding de parceiros |
| API GraphQL | ❌ Use GraphQL playground / Apollo Studio | Swagger é REST-first |
| API gRPC | ❌ Use grpcurl + proto files | Swagger não cobre |
| API interna admin-only | 🟡 Talvez (proteja com App Role) | Não exponha público em prod |

📍 Implementação detalhada: Recipe 10 acima.

### Protocolos — quando escolher cada

| Protocolo | Quando usar (HOJE) | Veja receita |
|---|---|---|
| **OIDC** | Default pra apps NOVAS | Recipes 1-4, 7, 10 |
| **OAuth 2.0 puro** | App-to-app sem user (Client Credentials) | Recipes 5, 6 |
| **SAML 2.0** | SaaS legado (Salesforce SSO, ServiceNow corporate) | Não tem receita aqui — config via **Enterprise applications** (não App Reg) |
| **WS-Federation** | ADFS clássico, SharePoint on-prem (raro hoje) | Não tem receita aqui — manter legacy |

**Decisão rápida:**
- App nova → OIDC (default Microsoft Entra ID)
- Integração com app legacy SAML → use Enterprise applications no Portal (Gallery apps OU non-gallery + SAML setup)
- Encontrou WS-Fed → **planeje migrar pra OIDC**

📍 Comparativo visual: [`/lab/protocolos`](../../src/pages/lab/Protocolos.tsx) — 4 tabs deep-dive + decision tree.

### Multi-tenant — quando ser multi vs single

| Cenário | Escolha |
|---|---|
| App interno só da sua empresa | **Single tenant** (`AzureADMyOrg`) |
| SaaS B2B vendido pra empresas | **Multi-tenant** (`AzureADMultipleOrgs`) — Recipe 7 |
| App público com contas pessoais (Hotmail, Outlook) | Multi + personal (`AzureADandPersonalMicrosoftAccount`) |
| App consumer (Xbox-like) | **B2C — produto separado!** (Entra External ID for Customers) |

**Decida no day 1.** Migrar single → multi DEPOIS quebra tokens cached, muda issuer, força re-consent. Custo alto.

📍 Detalhe: [`/lab/multi-app`](../../src/pages/lab/MultiApp.tsx) Tab 2.

## Cross-referências

- [hands-on.md](./hands-on.md) — Cap 2 cria a primeira App Reg (Recipe 1 simplificada)
- [`/lab/topologias`](../../src/pages/lab/Topologias.tsx) — decisão de topologia (mapa pras receitas)
- [`/lab/credenciais`](../../src/pages/lab/Credenciais.tsx) — decisão de credencial (Recipes 5/6/8)
- [`/lab/multi-app`](../../src/pages/lab/MultiApp.tsx) — Pattern A vs B (Recipes 1/2)
- [`/lab/recipes`](../../src/pages/lab/Recipes.tsx) — versão visual + copy-to-clipboard
- [cheat-sheet.md](./cheat-sheet.md) — comandos `az` compactos
- [perguntas-frequentes.md](./perguntas-frequentes.md) — pitfalls cross-receitas
