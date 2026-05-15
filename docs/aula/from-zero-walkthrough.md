---
title: "From-zero walkthrough — aula 100% Azure, sem rodar nada local"
audience: "Instrutor TFTEC Masters dando aula prática via Cloud Shell + Portal + apps deployed"
duration: "~75min ao vivo (Steps 1-5) + 15min cleanup"
last_updated: 2026-05-13
companion:
  - "docs/playbook/guia-instrutor-detalhado.md (análises bit-a-bit + Plano B)"
  - "docs/aula/app-reg-recipes.md (10 receitas técnicas)"
  - "/lab/recipes (versão visual interativa)"
---

# From-zero walkthrough — aula 100% Azure

> **Princípio:** zero setup local. Tudo via Cloud Shell (terminal Azure já autenticado) + Portal Azure + apps deployed do `tftec-auth`. Aluno chega de notebook só com browser e Microsoft account.

## 🏗️ Arquitetura da aula

```
┌─ Browser do instrutor ─────────────────────────────────────────────┐
│                                                                    │
│  Tela 1: Portal Azure (App Registrations)  ← aqui você cria       │
│  Tela 2: Cloud Shell (PowerShell, az autenticado)  ← aqui roda    │
│  Tela 3: https://authservice-front-tftec.azurewebsites.net/lab/   │
│          recipes (lab visual com copy-to-clipboard)               │
│  Tela 4: https://jwt.ms (decode tokens)                            │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

Aluno acompanha visualmente as 4 telas; opcional segue o `hands-on.md` em segundo monitor.

## 🌐 Ambiente Azure de referência (validado 2026-05-13)

> Recursos JÁ EXISTENTES no tenant TFTEC, sub "Microsoft AS - Github Enterprise - Partner" (`3075a5eb-ed20-4d6e-8884-8be75eedf82f`). Você cria coisas paralelas, NÃO mexe nessas em produção.

| Recurso | Nome | Detalhe |
|---|---|---|
| Resource Group | `rg-tftec-dev-brsouth-001` | Brazil South |
| App Service Plan | `asp-tftec-dev-brsouth-001` | Linux |
| Backend API | `authservice-api-tftec` | https://authservice-api-tftec.azurewebsites.net |
| Frontend SPA | `authservice-front-tftec` | https://authservice-front-tftec.azurewebsites.net |
| App Reg `tftec-auth` | `78345291-...` | Multi-tenant, 9 Delegated Graph perms, 1 Client Secret (exp 2026-10-26) |
| App Reg `sp-tftec-authsvc-cicd-001` | `3b97edd9-...` | CI/CD only, 2 FICs (main + PR) |

**Estado da App Reg `tftec-auth` (importante!):**
- ✅ Multi-tenant + SPA platform com Redirect URIs `http://localhost:8080` e `https://authservice-front-tftec.azurewebsites.net`
- ✅ Client Secret ativo (backend OBO/CC funcionam)
- ❌ **Zero App Roles** — vamos criar a `Admin` no Step 2
- ❌ **Zero Application permissions** — vamos adicionar User.Read.All no Step 3 pra Daemon
- ❌ **Zero FICs nesta App Reg** (a do CI/CD é OUTRA)
- ❌ **Swagger Redirect URI NÃO registrado** — vamos adicionar no Step 4

## 🎯 Pré-aula — instrutor (10min antes)

```powershell
# Cloud Shell (https://shell.azure.com) já abre autenticado.
# Garante sub correta:
az account set --subscription "3075a5eb-ed20-4d6e-8884-8be75eedf82f"
az account show --query name -o tsv
# Esperado: "Microsoft AS - Github Enterprise - Partner"

# Variáveis pra sessão
$TENANT_ID = az account show --query tenantId -o tsv
$GRAPH_APP_ID = "00000003-0000-0000-c000-000000000000"
$MY_OBJECT_ID = az ad signed-in-user show --query id -o tsv
Write-Host "✅ Pronto. Tenant: $TENANT_ID, You: $MY_OBJECT_ID"
```

**Abrir 4 abas do browser** (pre-config):
1. https://portal.azure.com → Entra ID → App registrations
2. https://shell.azure.com → PowerShell (Cloud Shell)
3. https://authservice-front-tftec.azurewebsites.net/lab/recipes (logado com sua conta)
4. https://jwt.ms

## 🎬 Pre-Step 0 — Mostrar o que JÁ existe (3min)

📍 **Tela 1: Portal Azure → App registrations**

| 🎬 Você | 👥 Aluno | Tempo |
|---|---|---|
| "Antes de criar, vejam o que já existe. 3 App Regs aqui no tenant TFTEC." | Vendo a lista | 30s |
| Click `tftec-auth` → Overview. Aponta os 3 IDs (Application/Object/Tenant). | Anotando | 1min |
| "Essa é a App Reg que `https://authservice-front-tftec.azurewebsites.net` usa hoje. Vamos AGORA criar OUTRA igual do zero pra entender CADA decisão." | Pensando | 30s |
| Voltar pra App registrations list. | — | 1min |

> **🔬 Pergunta gancho:** "Quantas App Regs vocês acham que esse projeto tem? 1? 2? 3?". Espera resposta. Mostra que tem `tftec-auth` (a app), `sp-tftec-authsvc-cicd-001` (CI/CD), e TFTEC-Zabbix (não relacionado). "**Cada App Reg = uma identidade no Entra ID**. 1 projeto pode ter N App Regs com funções distintas."

---

## 🎬 Step 1 — Recipe 1: criar App Reg SPA+API (demonstração — não substitui a deployed) (10min)

📍 **Cloud Shell + Portal**

> **Importante:** vamos CRIAR uma App Reg nova `recipe-1-aula-{data}` paralela. NÃO toca na `tftec-auth` deployed (que continua servindo a SPA online). Isso é demonstrativo do processo — frontend não vai apontar pra essa nova (rebuild com novo clientId requer CI/CD ~3min, fora de escopo da aula).

### 1.1 — Cloud Shell: criar App Reg (3min)

```powershell
$DATA_TODAY = Get-Date -Format "yyyyMMdd-HHmm"
$APP_NAME = "recipe-1-aula-$DATA_TODAY"

# 1) Criar App Reg multi-tenant
$APP_ID = az ad app create `
  --display-name $APP_NAME `
  --sign-in-audience AzureADMultipleOrgs `
  --query appId -o tsv

Write-Host "✅ App ID: $APP_ID"

# 2) Criar Service Principal
az ad sp create --id $APP_ID

# 3) SPA platform Redirect URIs (com e sem barra — defesa AADSTS50011)
# ATENCAO: az ad app update --set spa.redirectUris falha na primeira execucao
# ("Couldn't find 'spa' in ''") porque a propriedade spa ainda nao existe.
# Workaround com Graph PATCH:
$OBJECT_ID = az ad app show --id $APP_ID --query id -o tsv
$body = @{ spa = @{ redirectUris = @("http://localhost:8080", "http://localhost:8080/") } } |
        ConvertTo-Json -Depth 5 -Compress
$bodyEscaped = $body -replace '"', '\"'
az rest --method PATCH `
  --uri "https://graph.microsoft.com/v1.0/applications/$OBJECT_ID" `
  --headers "Content-Type=application/json" `
  --body $bodyEscaped

# 4) Expose own API (identifier-uri)
az ad app update --id $APP_ID --identifier-uris "api://$APP_ID"
```

### 1.2 — Portal: mostrar o que apareceu (2min)

📍 **Tela 1 — F5 na lista de App registrations**

🎬 Você:
1. Filtra por `recipe-1` — App Reg nova aparece
2. Click → Overview. Aponta os 3 IDs (mesma estrutura da `tftec-auth`)
3. Authentication → confirma SPA platform com 2 URIs
4. Expose an API → confirma `api://{APP_ID}` no Application ID URI

> **🔬 ANÁLISE BIT-A-BIT:** *"Olha que rápido — 4 comandos `az` e está criado. O Portal só tem CLICKS que fazem essas mesmas chamadas Graph. **`az ad app create` é wrapper sobre `POST https://graph.microsoft.com/v1.0/applications`**. Se vc fizer no Portal, o request é IDÊNTICO — só com UI no meio."*

### 1.3 — Adicionar scope access_as_user (Portal — 2min)

> `az` não cobre 100% scope creation. Faz manual:

1. Portal → recipe-1-aula → **Expose an API** → **+ Add a scope**
2. Application ID URI já está `api://{APP_ID}` (preenchido)
3. **+ Add a scope:**
   - Scope name: `access_as_user`
   - Admins and users
   - Display name: `Access recipe-1 as user`
   - **Add scope**

### 1.4 — Adicionar permission Graph User.Read (1min)

```powershell
# User.Read (Delegated) — guid: e1fe6dd8-ba31-4d61-89e7-88639da4683d
az ad app permission add --id $APP_ID --api $GRAPH_APP_ID `
  --api-permissions e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope

# Grant admin consent (User.Read é user-consent-able, mas demonstrar)
az ad app permission admin-consent --id $APP_ID
```

### 1.5 — Comparação visual com tftec-auth deployed (2min)

📍 **Tela 1: 2 abas Portal lado a lado**
- Aba A: `recipe-1-aula-...` (nova)
- Aba B: `tftec-auth` (deployed)

🎬 Você:
1. Aponta: "Vejam que `tftec-auth` tem MAIS permissions (9 Delegated Graph) — porque a app real precisa de mais coisa. Mas a estrutura é a mesma."
2. Aponta Authentication das duas: ambas SPA platform.
3. Aponta Expose an API: ambas têm `api://...`. **Audience é o que une SPA + API.**

> **🔬 ANÁLISE BIT-A-BIT — quando criar App Reg:**
> *"Pra criar App Reg basta um cenário: a aplicação precisa de IDENTIDADE no Entra ID. Cada uma destas tem identidade própria — `tftec-auth` é a identidade do projeto rodando agora, `recipe-1-aula` é uma cópia experimental. App Reg ≠ aplicação. App Reg = REPRESENTAÇÃO da aplicação no Entra ID."*

**✅ Estado após Step 1:** 4 App Regs no tenant (3 originais + recipe-1-aula-...). Aluno entendeu o que cada campo significa.

---

## 🎬 Step 2 — Recipe 9: Criar App Role + atribuir você (na `tftec-auth` deployed) (7min)

📍 **Cloud Shell + Portal — desta vez MEXENDO na `tftec-auth` deployed**

> **Por quê na deployed?** Pra validar end-to-end depois fazendo logout/login em `https://authservice-front-tftec.azurewebsites.net` e ver `roles: ["Admin"]` no SEU token real.

### 2.1 — Cloud Shell: criar App Role via Manifest patch (2min)

```powershell
$TFTEC_AUTH_APP_ID = "78345291-2586-4691-b1f9-e4e780f55328"

$appRole = @{
  id                 = [guid]::NewGuid().ToString()
  isEnabled          = $true
  origin             = "Application"
  allowedMemberTypes = @("User", "Application")
  displayName        = "Admin"
  description        = "Pode aprovar requisicoes e gerenciar usuarios"
  value              = "Admin"
}

$current = az ad app show --id $TFTEC_AUTH_APP_ID --query appRoles -o json | ConvertFrom-Json
if (-not $current) { $current = @() }
$newRoles = @(@($current) + $appRole) | ConvertTo-Json -Compress -AsArray

az ad app update --id $TFTEC_AUTH_APP_ID --app-roles $newRoles
Write-Host "✅ App Role 'Admin' criado"

# Confirma
az ad app show --id $TFTEC_AUTH_APP_ID --query "appRoles[].{displayName:displayName, value:value}" -o table
```

### 2.2 — Portal: atribuir você ao App Role (2min)

> `az` não cobre assignment direto. Manual:

1. Portal → **Enterprise applications** (lateral) → busca `tftec-auth` → click
2. **Users and groups** → **+ Add user/group**
3. Users: **seu user** (`guilherme.campos@tftec.com.br`)
4. Select a role: **Admin** (deve aparecer agora)
5. **Assign**

### 2.3 — Re-login no SPA deployed pra ver o role no token (3min)

📍 **Tela 3 — https://authservice-front-tftec.azurewebsites.net**

🎬 Você:
1. Logout (botão app OU F12 → Application → sessionStorage → clear)
2. Login de novo (popup Microsoft)
3. Navegar pra `/lab/tokens` → aba **Decoder** → click **Access Token**
4. **Aponta no payload:** `"roles": ["Admin"]` ← **NOVO claim** agora aparece
5. Compara com colega/print do token ANTES (sem `roles`)

> **🔬 ANÁLISE BIT-A-BIT — roles claim:**
> *"Antes deste Step, meu token não tinha o claim `roles`. Agora tem `["Admin"]`. **Não foi mudança no código** da aplicação. Foi mudança no Entra ID (App Role criado + atribuição). Backend já tem policy `RequireAdminRole` que lê esse claim — automaticamente passa a respeitar."*

**✅ Estado após Step 2:** `tftec-auth` deployed agora tem App Role `Admin`. Você está atribuído. Token tem `roles`.

---

## 🎬 Step 3 — Recipe 5: Daemon paralelo (App Reg SEPARADA) (8min)

📍 **Cloud Shell + browser pra jwt.ms**

> **Wow moment:** vai criar Daemon que chama Graph SEM USUÁRIO. Audit log mostra `appid`, não user. Aluno vê na prática a diferença Delegated vs Application.

### 3.1 — Cloud Shell: criar App Reg do Daemon (3min)

```powershell
$DAEMON_NAME = "recipe-5-daemon-aula-$DATA_TODAY"

$DAEMON_APP_ID = az ad app create `
  --display-name $DAEMON_NAME `
  --sign-in-audience AzureADMyOrg `
  --query appId -o tsv

az ad sp create --id $DAEMON_APP_ID

# Client Secret
$DAEMON_SECRET = az ad app credential reset --id $DAEMON_APP_ID --years 1 --query password -o tsv
Write-Host "Daemon Secret (COPIE):"; Write-Host $DAEMON_SECRET

# User.Read.All Application permission — guid: df021288-bdef-4463-88db-98f22de89214
az ad app permission add --id $DAEMON_APP_ID --api $GRAPH_APP_ID `
  --api-permissions df021288-bdef-4463-88db-98f22de89214=Role

# Admin consent OBRIGATÓRIO pra Application permission
az ad app permission admin-consent --id $DAEMON_APP_ID
Write-Host "✅ Daemon configurado"
```

### 3.1.5 — ⚠️ AGUARDAR PROPAGAÇÃO admin-consent (2-5 min!)

**Surpresa real medida em smoke test:** `az ad app permission admin-consent` retorna instantâneo, mas o `appRoleAssignment` no SP leva 2-5 minutos. Se pegar token antes disso, `roles` claim vem **VAZIO** e Graph retorna 403.

Como verificar se propagou:
```powershell
$SP_ID = az ad sp show --id $DAEMON_APP_ID --query id -o tsv
$count = (az rest --method GET `
  --uri "https://graph.microsoft.com/v1.0/servicePrincipals/$SP_ID/appRoleAssignments" `
  --query "value" -o json | ConvertFrom-Json).Count

if ($count -eq 0) {
  Write-Host "Aguardando propagação... (rode esse check em loop até count > 0)"
} else {
  Write-Host "✅ Propagou - $count assignment(s)"
}
```

Pra aula: **fala isso explicitamente** — "agora vou aguardar 3 minutos. Isso é tempo real do Entra ID propagando o consent internamente, não é o `az` lento. Vocês vão ver esse delay em produção também."

### 3.2 — Pegar token via curl (Cloud Shell) (2min)

```powershell
$body = "grant_type=client_credentials&client_id=$DAEMON_APP_ID&client_secret=$DAEMON_SECRET&scope=https%3A%2F%2Fgraph.microsoft.com%2F.default"
$resp = Invoke-RestMethod -Uri "https://login.microsoftonline.com/$TENANT_ID/oauth2/v2.0/token" `
  -Method POST -ContentType "application/x-www-form-urlencoded" -Body $body
$DAEMON_TOKEN = $resp.access_token

# Mostra na tela
Write-Host "Token (cole em jwt.ms):"
Write-Host $DAEMON_TOKEN
```

📍 **Tela 4: jwt.ms** — cola o token, mostra payload

> **🎬 Aponte na tela:**
> - `appid` = `$DAEMON_APP_ID` (não `tftec-auth`)
> - `roles` = `["User.Read.All"]` ← **Application permission!**
> - **NÃO TEM `scp`** ← este é o ponto pedagógico
> - **NÃO TEM `oid` de usuário** ← daemon não é user
> - `aud` = `https://graph.microsoft.com`

> **🔬 ANÁLISE BIT-A-BIT — diferença Delegated vs Application:**
> *"Vejam o token. `roles: ['User.Read.All']`. Quando esse token chamar Graph, **vê TODOS os users do tenant**, não só o user logado. Não tem `scp` porque não tem user. Microsoft escolheu separar — string vs array, scp vs roles — pra ficar EXPLÍCITO o que é delegated e o que é application. Confunde os 2 = bug clássico."*

### 3.3 — Chamar Graph como Daemon (Cloud Shell) (3min)

```powershell
Invoke-RestMethod -Uri "https://graph.microsoft.com/v1.0/users?`$top=5" `
  -Headers @{ Authorization = "Bearer $DAEMON_TOKEN" } | ConvertTo-Json -Depth 5
```

**🎬 Saída esperada:** lista de 5 users do tenant TFTEC (vc, Rafael, outros). **Daemon viu TODO MUNDO.** Compara com SPA logado (que vê só `/me`).

> **🔬 ANÁLISE BIT-A-BIT — auditoria:**
> *"Entra ID → Sign-in logs vai mostrar essa chamada com `appid={DAEMON_APP_ID}`, NÃO com meu user `guilherme.campos`. **Auditoria sabe QUE APP fez, não quem fez.** Pra incident response: 'qual app vazou users?' → audit busca por `appid`."*

**✅ Estado após Step 3:** 2 App Regs criadas na aula (recipe-1 + recipe-5-daemon). Daemon prova chamou Graph e leu users do tenant.

---

## 🎬 Step 4 — Recipe 10: Swagger UI OAuth na `tftec-auth` deployed (5min)

📍 **Cloud Shell + browser deployed**

### 4.1 — Adicionar Redirect URI Swagger (1min)

```powershell
$SWAGGER_REDIRECT = "https://authservice-api-tftec.azurewebsites.net/swagger/oauth2-redirect.html"
$current = az ad app show --id $TFTEC_AUTH_APP_ID --query "spa.redirectUris" -o json | ConvertFrom-Json
if (-not $current) { $current = @() }

if ($current -notcontains $SWAGGER_REDIRECT) {
    $newList = @(@($current) + $SWAGGER_REDIRECT) | ConvertTo-Json -Compress -AsArray
    az ad app update --id $TFTEC_AUTH_APP_ID --set spa.redirectUris=$newList
    Write-Host "✅ Swagger Redirect URI adicionado"
} else {
    Write-Host "Já existe"
}

# Confirma
az ad app show --id $TFTEC_AUTH_APP_ID --query "spa.redirectUris" -o table
```

### 4.2 — Testar Authorize no Swagger deployed (3min)

📍 **Tela 3: https://authservice-api-tftec.azurewebsites.net/swagger**

> **⚠️ Pré-requisito:** o `Program.cs` do backend precisa ter `c.OAuthClientId(...)` + `c.OAuthUsePkce()` no `UseSwaggerUI`. **Estado atual do backend deployed não tem isso configurado** (Story 1.18 só DOCUMENTOU Recipe 10). Sem esse code change + redeploy, o Swagger Authorize NÃO vai funcionar.
>
> **Plano A:** se Swagger Authorize falha, mostra `/swagger` como **doc estática** e diz "implementar OAuth é Recipe 10 ao vivo, fica como follow-up. Vou rodar um deploy depois."
>
> **Plano B (preparação prévia 30min antes da aula):** faz code change + push pra trigger CI/CD. Daí no Step 4 já tá funcional.

🎬 Você:
1. F5 no `/swagger`
2. Click **🔐 Authorize**
3. **Plano A** (sem OAuth ativo): modal vazio. Diga "instalei o Recipe 10 no doc mas faltou ativar no código. Em casa vc consegue fazer."
4. **Plano B** (com OAuth ativo): modal com scopes, click Authorize, popup login, valida → testa endpoint protegido

**✅ Estado após Step 4:** Redirect URI adicionado. Backend precisa de deploy pra OAuth funcionar 100%.

---

## 🎬 Step 5 — Recipe 2: Pattern B (opcional, ~15min)

> Pula este Step se aula está perto do fim. É demonstração de 2 App Regs (Cliente + API separadas) — bom pra cohort 2.

### 5.1 — Criar API App Reg

```powershell
$API_NAME = "recipe-2-api-aula-$DATA_TODAY"
$API_APP_ID = az ad app create `
  --display-name $API_NAME `
  --sign-in-audience AzureADMyOrg `
  --query appId -o tsv

az ad sp create --id $API_APP_ID
az ad app update --id $API_APP_ID --identifier-uris "api://$API_APP_ID"
```

**Portal:** API App Reg → Expose an API → Add scope `access_as_user`.

### 5.2 — Criar Client SPA App Reg

```powershell
$CLIENT_NAME = "recipe-2-client-aula-$DATA_TODAY"
$CLIENT_APP_ID = az ad app create `
  --display-name $CLIENT_NAME `
  --sign-in-audience AzureADMyOrg `
  --query appId -o tsv

az ad sp create --id $CLIENT_APP_ID
az ad app update --id $CLIENT_APP_ID `
  --set spa.redirectUris="['http://localhost:8080/']"
```

**Portal:** Client App Reg → API permissions → + Add permission → My APIs → recipe-2-api → Delegated → access_as_user → Grant admin consent.

### 5.3 — Comparação visual

📍 **Tela 1: 2 App Regs lado a lado**
- Aba A: `recipe-2-api-aula-...` (API only — sem platforms)
- Aba B: `recipe-2-client-aula-...` (Client — SPA platform, pediu scope cross-app)

> **🔬 ANÁLISE BIT-A-BIT — Pattern A vs B:**
> *"Pattern A (Recipe 1) = 1 App Reg pra SPA+API. Pattern B (Recipe 2) = 2 App Regs separadas. Por quê separar? **Quando a API ganha 2º consumidor.** Mobile, integrações externas, outros backends. API tem identidade própria → versionamento de scope independente, audit por API."*

**✅ Estado após Step 5:** 4 App Regs criadas na aula. Pattern B demonstrado (sem rodar — só mostra estrutura).

---

## 🧹 Cleanup pós-aula (3min)

```powershell
# Lista App Regs criadas na aula
az ad app list --filter "startsWith(displayName, 'recipe-')" `
  --query "[].{name:displayName, appId:appId}" -o table

# Confirma com o usuário antes!
# az ad app delete --id <APP_ID>   # uma por uma

# Cleanup all at once (COM CUIDADO — verifica antes)
az ad app list --filter "startsWith(displayName, 'recipe-')" --query "[].appId" -o tsv | `
  ForEach-Object { az ad app delete --id $_ }

# Remove App Role 'Admin' da tftec-auth (se quiser zerar)
az ad app update --id $TFTEC_AUTH_APP_ID --app-roles "[]"

# Remove Swagger Redirect URI (se quiser zerar)
az ad app update --id $TFTEC_AUTH_APP_ID `
  --set spa.redirectUris="['http://localhost:8080', 'https://authservice-front-tftec.azurewebsites.net']"

Write-Host "✅ Cleanup completo"
```

---

## 📊 Tabela resumo — sequência da aula

| Step | Tempo | App Regs criadas | Mudança em `tftec-auth` deployed | Visual ao vivo |
|---|---|---|---|---|
| Pre-0 (mostrar existentes) | 3min | 0 | nenhuma | Portal + comparação 3 App Regs |
| 1 (Recipe 1 demo) | 10min | +1 (`recipe-1-aula`) | nenhuma | Portal cria, compara com tftec-auth |
| 2 (Recipe 9) | 7min | 0 | +1 App Role + atribuição | Logout/login deployed → /lab/tokens mostra role |
| 3 (Recipe 5 Daemon) | 8min | +1 (`recipe-5-daemon-aula`) | nenhuma | Cloud Shell curl Graph /users → jwt.ms |
| 4 (Recipe 10 Swagger) | 5min | 0 | +1 Redirect URI | /swagger Authorize (depende code change) |
| 5 (Recipe 2 Pattern B, opcional) | 15min | +2 | nenhuma | Portal compara estrutura cross-app |
| Cleanup | 3min | -3 (deleta criadas) | reverte 2 mudanças | — |
| **Total núcleo (Steps 1-4)** | **~40min** | **+2 App Regs líquidas** | **+1 App Role + 1 Redirect URI** | — |

## 🆘 Plano B — falha em qualquer Step

| Falha | Sintoma | Fallback |
|---|---|---|
| Cloud Shell travado | "Resolving Cloud Shell..." eterno | F5 OU usa `https://shell.azure.com` em janela anônima |
| `az ad app create` 403 | Permission denied | Verifica sub correta (`az account show`) — deve ser GitHub Enterprise Partner |
| Step 2 Token sem `roles` mesmo após assignment | Cache MSAL antigo | F12 → Application → sessionStorage → clear → F5 → re-login |
| Step 3 Graph /users 403 | Admin consent não propagou | Aguarda 30s OU re-roda `az ad app permission admin-consent` |
| Step 4 Swagger Authorize não abre modal | Backend deployed sem OAuth config | Plano A: mostra `/swagger` como doc estática. Push fix depois. |

---

## 💡 Por que essa abordagem (vs antiga)

**Antes (Turma 02):** instrutor chega com app pronta, mostra resultado, fala teoria — aluno não vê construção.

**Agora:**
1. Aluno VÊ a App Reg sendo criada (4 `az` comandos no Cloud Shell)
2. Aluno VÊ a mesma App Reg APARECER no Portal
3. Aluno VÊ a comparação com a `tftec-auth` deployed (real, funcionando)
4. Aluno VÊ o token MUDAR quando atribui App Role
5. Aluno VÊ Daemon chamar Graph sem user
6. **Aluno SAI sabendo construir do zero.**

**Métrica de sucesso:** se 60% dos alunos conseguem narrar de volta os 5 Steps numa frase cada, foi vitória.

## Referências cruzadas

- [Guia minute-by-minute](../playbook/guia-instrutor-detalhado.md) — análises bit-a-bit + Plano B detalhado
- [10 Recipes técnicas](./app-reg-recipes.md) — versão completa cada cenário
- [`/lab/recipes`](https://authservice-front-tftec.azurewebsites.net/lab/recipes) — versão visual com copy-to-clipboard
- [Cheat-sheet](./cheat-sheet.md) — `az` compacto
