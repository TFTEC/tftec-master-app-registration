# 🔁 Replicar o Ambiente `tftec-auth` — Guia para Alunos TFTEC Masters

> **Objetivo:** Vc termina esta aula tendo:
> 1. Repositório clonado e rodando localmente
> 2. App Registration própria criada via Portal Azure
> 3. Frontend + API conectados e funcionando local
> 4. (Opcional) Deploy próprio no Azure
>
> **Pré-requisitos:** Conta Microsoft Entra ID (TFTEC ou pessoal), Visual Studio Code, Git, Node 20+, .NET 8 SDK.
> **Tempo estimado:** 45-60 minutos (sem deploy Azure) / 90-120min (com deploy).

---

## 📋 Índice

1. [Clonar o Repositório](#1-clonar-o-repositório)
2. [Pré-requisitos no seu Computador](#2-pré-requisitos-no-seu-computador)
3. [Criar App Registration no Portal Azure](#3-criar-app-registration-no-portal-azure)
4. [Configurar Authentication (Redirect URIs)](#4-configurar-authentication-redirect-uris)
5. [Configurar API Permissions + Admin Consent](#5-configurar-api-permissions--admin-consent)
6. [Criar Client Secret](#6-criar-client-secret)
7. [Expose an API (Application ID URI + Scope)](#7-expose-an-api-application-id-uri--scope)
8. [Atualizar Configurações no Código](#8-atualizar-configurações-no-código)
9. [Rodar Frontend e API Localmente](#9-rodar-frontend-e-api-localmente)
10. [Validação Final — Login Microsoft](#10-validação-final--login-microsoft)
11. [(Opcional) Deploy Próprio no Azure](#11-opcional-deploy-próprio-no-azure)
12. [Troubleshooting](#troubleshooting)

---

## 1. Clonar o Repositório

```bash
# Cria pasta de trabalho
mkdir C:\Projetos
cd C:\Projetos

# Clona
git clone https://github.com/tftec-guilherme/entra-auth-gateway.git tftec-auth
cd tftec-auth

# Confere
git status
git log --oneline -5
```

✅ **Resultado esperado:** pasta `tftec-auth/` com `api/`, `src/`, `docs/`, `package.json`.

---

## 2. Pré-requisitos no seu Computador

### Verifique o que você tem
```bash
node --version          # esperado: v20.x ou superior
npm --version           # esperado: 10.x
dotnet --version        # esperado: 8.x
git --version           # qualquer versão recente
```

### Se faltar algo
| Ferramenta | Como instalar (Windows) |
|------------|--------------------------|
| Node 20 | https://nodejs.org/ — baixe LTS |
| .NET 8 SDK | https://dotnet.microsoft.com/download/dotnet/8.0 |
| Git | https://git-scm.com/download/win |
| VS Code (opcional) | https://code.visualstudio.com/ |

### Instale dependências do frontend
```bash
cd C:\Projetos\tftec-auth
npm install
```
*(~2-3 min na primeira vez)*

✅ **Resultado:** pasta `node_modules/` aparece, comando termina sem erro.

### Instale dependências da API
```bash
cd api
dotnet restore
cd ..
```

✅ **Resultado:** "Restauração concluída" sem erros.

---

## 3. Criar App Registration no Portal Azure

> 💡 **Nada no Portal Azure custa dinheiro neste passo.** Criar App Registration é FREE.

### Acessar o Portal
1. Abra https://portal.azure.com no browser
2. Login com sua conta Microsoft (TFTEC ou pessoal)
3. Na barra de busca topo, digite **`Microsoft Entra ID`** → Enter
4. Menu lateral esquerdo → **App registrations**
5. Click **+ New registration** (botão azul, topo)

### Preencher os campos

| Campo | Valor |
|-------|-------|
| **Name** | `tftec-auth-<seu-nome>` (ex: `tftec-auth-joao`) |
| **Supported account types** | **Accounts in any organizational directory (Multitenant)** ⭐ |
| **Redirect URI** | Platform: **Single-page application (SPA)**, URI: `http://localhost:5173` |

> ⚠️ **CRÍTICO:** Marque MULTITENANT, não single-tenant. **Trocar depois pode quebrar tokens em cache.**

6. Click **Register**

### Anotar valores principais
Após criar, vc cai no **Overview** da App Reg. **Anote estes 2 valores** (vc vai usar no passo 8):

| Campo | Onde encontrar | Exemplo |
|-------|----------------|---------|
| **Application (client) ID** | Overview → Application (client) ID | `78345291-2586-4691-b1f9-e4e780f55328` |
| **Directory (tenant) ID** | Overview → Directory (tenant) ID | `5e0359c1-7b10-463e-b064-b424568db5e9` |

✅ **Resultado:** App Registration `tftec-auth-<seu-nome>` aparece na lista.

---

## 4. Configurar Authentication (Redirect URIs)

### Adicionar URIs adicionais
1. App Registration que vc criou → menu lateral → **Authentication**
2. Em **Single-page application** (já tem `http://localhost:5173`):
3. Click **Add URI** → adicionar:
   - `http://localhost:3000` (se quiser portas alternativas)
   - URLs de produção (se for fazer deploy)

### Configurações importantes (no fundo da página)
| Setting | Valor |
|---------|-------|
| **Allow public client flows** | **No** (default — não mexa) |
| **Implicit grant** | **NÃO marcar** (PKCE substitui — não precisa) |
| **Front-channel logout URL** | (deixe vazio) |

4. Click **Save** (topo)

✅ **Resultado:** "Authentication updated" toast.

### ⚠️ Erros comuns
- `AADSTS50011 redirect_uri_mismatch` → URL EXATA. Conferir trailing slash, http vs https.
- Login funciona em 5173 mas não em 3000 → adicionar 3000 explicitamente.

---

## 5. Configurar API Permissions + Admin Consent

### Adicionar permissions Microsoft Graph
1. App Registration → menu lateral → **API permissions**
2. Click **+ Add a permission** (centro topo)
3. Click **Microsoft Graph**
4. Click **Delegated permissions** (não Application!)

### Permissions necessárias (uma por vez)

| Permission | Categoria |
|------------|-----------|
| `User.Read` | User |
| `User.ReadWrite.All` | User |
| `Directory.ReadWrite.All` | Directory |
| `Application.Read.All` | Application |
| `Application.ReadWrite.All` | Application |
| `AuditLog.Read.All` | AuditLog |

5. **Para cada uma:**
   - Use a barra de busca pra digitar o nome
   - Marque o checkbox da permission
   - Click **Add permissions**
   - Repita

### Grant admin consent
6. Após adicionar TODAS, click **Grant admin consent for <SeuTenant>** (botão verde, em cima da tabela)
7. Click **Yes** na confirmação
8. **Verifique:** todas as linhas devem mostrar **✅ Granted for <Tenant>**

> ⚠️ **Sem admin consent**, login dá `Authorization_RequestDenied` ou `AADSTS65001`. Sintoma típico: dashboard vazio após login.

✅ **Resultado:** 6 permissions com status "Granted" verde.

---

## 6. Criar Client Secret

> ⚠️ **VOCÊ SÓ VAI VER O VALOR UMA VEZ.** Copie imediatamente.

1. App Registration → menu lateral → **Certificates & secrets**
2. Aba **Client secrets** (selecionada por default)
3. Click **+ New client secret**
4. Preencha:
   - **Description**: `tftec-auth-local-dev`
   - **Expires**: `12 months` (ou 24 meses)
5. Click **Add**

### COPIE AGORA o valor!
Após criar, aparece a tabela com:
| Description | Expires | Value | Secret ID |
|-------------|---------|-------|-----------|
| tftec-auth-local-dev | 2027-04-29 | **`<valor longo, 40 chars>`** ← COPIE | (uuid) |

6. **Click no ícone de copiar** ao lado do **Value**
7. **Cole em algum lugar seguro** (notepad, password manager). NÃO no código diretamente.

> 🔴 **Se vc clicar fora ou recarregar:** o valor SOME pra sempre. Vc tem que criar OUTRO secret.

✅ **Resultado:** secret criado, valor copiado.

---

## 7. Expose an API (Application ID URI + Scope)

### Definir Application ID URI
1. App Registration → menu lateral → **Expose an API**
2. No topo: **Application ID URI** → click **Add** (ou **Set**)
3. Aceita o default: `api://78345291-...` (com SEU client ID)
4. Click **Save**

### Adicionar scope
5. Click **+ Add a scope**
6. Preencha:
   - **Scope name**: `access_as_user`
   - **Who can consent?**: `Admins and users`
   - **Admin consent display name**: `Access AuthService as user`
   - **Admin consent description**: `Allows the app to access AuthService API on behalf of the signed-in user`
   - **State**: `Enabled`
7. Click **Add scope**

### Resultado
Agora vc tem:
```
Application ID URI: api://78345291-2586-4691-b1f9-e4e780f55328
Full scope:         api://78345291-2586-4691-b1f9-e4e780f55328/access_as_user
```

✅ **Resultado:** scope `access_as_user` aparece na lista.

---

## 8. Atualizar Configurações no Código

### Frontend — usar `.env.local` (recomendado, sem editar código!)

⭐ **Recomendado:** crie `.env.local` na raiz do projeto (nunca commitado, está no `.gitignore`):

```bash
# .env.local
VITE_AZURE_CLIENT_ID=<seu-client-id>
VITE_AZURE_TENANT_ID=organizations
VITE_AZURE_AUDIENCE=api://<seu-client-id>
VITE_AUTHSERVICE_URL=http://localhost:8080
```

Vite carrega automaticamente esses valores em `src/config/azure.ts` (fallback pros valores TFTEC default se não definidos).

### Alternativa: editar `src/config/azure.ts` direto
Se preferir hardcoded (não recomendado pra time):
```typescript
const DEFAULT_CLIENT_ID = "<COLE_SEU_CLIENT_ID>";  // ← substitui esta constante
```

### `api/appsettings.Development.json` (API local)
Crie o arquivo se não existir:

```json
{
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "organizations",
    "ClientId": "<COLE_SEU_CLIENT_ID>",
    "ClientSecret": "<COLE_SEU_CLIENT_SECRET_DO_PASSO_6>",
    "Audience": "api://<COLE_SEU_CLIENT_ID>"
  },
  "AllowedTenants": {
    "AllowAll": true,
    "TenantIds": []
  },
  "InternalJwt": {
    "Issuer": "AuthService",
    "Audience": "AuthService-Clients",
    "SigningKey": "<RODE-O-COMANDO-ABAIXO>",
    "ExpiryMinutes": 60
  }
}
```

### Gerar SigningKey
Em PowerShell:
```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Ou em bash:
```bash
openssl rand -base64 32
```

Cole o output em `InternalJwt.SigningKey`.

> 🚨 **NUNCA commit `appsettings.Development.json` ou Client Secret.** O `.gitignore` já cobre `*.local` e `.env`. Confira que `appsettings.Development.json` está gitignored OU adicione você mesmo.

✅ **Resultado:** ambos arquivos com seus valores.

---

## 9. Rodar Frontend e API Localmente

### Terminal 1 — API .NET
```bash
cd api
dotnet run
```
Aguarda até ver:
```
AuthService starting on http://+:8080
Now listening on: http://localhost:8080
Application started.
```

### Terminal 2 — Frontend React
Em OUTRO terminal:
```bash
cd C:\Projetos\tftec-auth
npm run dev
```
Aguarda até ver:
```
  VITE v5.4.x  ready in 250 ms
  ➜  Local:   http://localhost:5173/
```

### Smoke test (Terminal 3)
```bash
curl http://localhost:8080/health        # esperado: 200 (healthy)
curl http://localhost:8080/swagger/      # esperado: 200 (Swagger UI)
curl -i http://localhost:8080/auth/me    # esperado: 401 (sem token, correto)
```

✅ **Resultado:** API e frontend ambos rodando, smoke tests passando.

---

## 10. Validação Final — Login Microsoft

### Teste E2E
1. Abra **http://localhost:5173** no browser (Chrome/Edge anônimo recomendado)
2. Click **"Login com Microsoft"**
3. Loga com sua conta TFTEC ou Microsoft
4. **Após login:** dashboard `tftec-auth` carrega
5. Click no menu sidebar → **`/lab`** → vê os módulos
6. Click `/lab/demo` → escolhe cenário "spa-login-api" → click **Executar de verdade**
7. Timeline mostra: MSAL → Entra ID → Graph com seu nome real

### Se algo deu errado
Veja [Troubleshooting](#troubleshooting) abaixo.

✅ **Resultado:** vc está logado com SUA App Registration, vendo SEUS dados reais via Graph API.

🎉 **PARABÉNS!** Vc replicou o ambiente.

---

## 11. (Opcional) Deploy Próprio no Azure

> Esta seção é OPCIONAL. Se vc só quer estudar local, pula.

### Pré-requisitos
- Subscription Azure ativa (sponsorship, MSDN, ou trial)
- Permission de criar Resource Group + App Service na subscription
- Azure CLI instalado: `az --version`

### Quick Deploy via Azure CLI

```bash
# 1. Login
az login

# 2. Set subscription
az account set --subscription "<seu-subscription-id>"

# 3. Criar Resource Group
az group create --name rg-tftec-auth-<seu-nome> --location brazilsouth

# 4. Criar App Service Plan
az appservice plan create \
  --name asp-tftec-auth-<seu-nome> \
  --resource-group rg-tftec-auth-<seu-nome> \
  --location brazilsouth \
  --sku B1 --is-linux

# 5. Criar Web App pra API
az webapp create \
  --name tftec-auth-api-<seu-nome> \
  --resource-group rg-tftec-auth-<seu-nome> \
  --plan asp-tftec-auth-<seu-nome> \
  --runtime "DOTNETCORE:8.0"

# 6. Criar Web App pro Frontend
az webapp create \
  --name tftec-auth-front-<seu-nome> \
  --resource-group rg-tftec-auth-<seu-nome> \
  --plan asp-tftec-auth-<seu-nome> \
  --runtime "NODE:20-lts"

# 7. Deploy API
cd api
dotnet publish -c Release -o ./publish
az webapp deploy \
  --name tftec-auth-api-<seu-nome> \
  --resource-group rg-tftec-auth-<seu-nome> \
  --src-path ./publish \
  --type folder

# 8. Configurar app settings da API com seus valores
az webapp config appsettings set \
  --name tftec-auth-api-<seu-nome> \
  --resource-group rg-tftec-auth-<seu-nome> \
  --settings \
    AzureAd__ClientId=<seu-client-id> \
    AzureAd__ClientSecret=<seu-secret> \
    AzureAd__Audience=api://<seu-client-id> \
    InternalJwt__SigningKey=<sua-jwt-key> \
    Cors__AllowedOrigins__0=https://tftec-auth-front-<seu-nome>.azurewebsites.net \
    Cors__AllowedOrigins__1=http://localhost:5173

# 8b. Build frontend com SEU client ID embedded (Vite env vars)
VITE_AZURE_CLIENT_ID=<seu-client-id> \
VITE_AZURE_TENANT_ID=organizations \
VITE_AZURE_AUDIENCE=api://<seu-client-id> \
VITE_AUTHSERVICE_URL=https://tftec-auth-api-<seu-nome>.azurewebsites.net \
npm run build

# 9. Build + deploy frontend
cd ..
npm run build
cd dist
zip -r ../dist.zip *
cd ..
az webapp deploy \
  --name tftec-auth-front-<seu-nome> \
  --resource-group rg-tftec-auth-<seu-nome> \
  --src-path ./dist.zip \
  --type zip

# 10. Adicionar URL de produção em Authentication da App Reg (Portal)
# Authentication → Add URI → https://tftec-auth-front-<seu-nome>.azurewebsites.net
```

### Custo estimado
- App Service Plan B1: ~$13 USD/mês = ~R$70/mês
- 2 Web Apps: incluído no plano
- **Total**: ~R$70/mês idle. Demo workshop: < R$1.

### Cleanup pra zerar custo
```bash
az group delete --name rg-tftec-auth-<seu-nome> --yes --no-wait
```

✅ **Resultado:** dois Web Apps live. URLs:
- API: `https://tftec-auth-api-<seu-nome>.azurewebsites.net/swagger`
- Frontend: `https://tftec-auth-front-<seu-nome>.azurewebsites.net`

---

## 🆘 Troubleshooting

| Problema | Causa | Fix |
|----------|-------|-----|
| `AADSTS50011 redirect_uri_mismatch` | URL não bate exato | Authentication → Add URI exata |
| `AADSTS65001 consent required` | Falta admin consent | Permissions → Grant admin consent |
| `AADSTS7000215 invalid client secret` | Secret errado/expirado | Certificates & secrets → New |
| `AADSTS90002 tenant not found` | Tenant ID errado em URL | Confere `tenantId` em `azure.ts` |
| `Authorization_RequestDenied` | Permission sem consent | Permissions → Grant admin |
| `npm install` falha | Node version | Atualizar pra Node 20 LTS |
| `dotnet run` falha | .NET 8 não instalado | Instalar SDK 8 |
| API responde 500 | Faltam env vars | Conferir `appsettings.Development.json` |
| Login funciona mas dashboard vazio | Sem permissions | Volta passo 5 + Grant admin consent |
| `localhost:5173` não abre | Vite não startou | Em outro terminal: `npm run dev` (não em background) |
| Erro CORS no browser | Frontend porta diferente | API trata `5173` e `3000` por default. Outras portas: edita `Program.cs` |
| Token decoder não mostra claims | Token expirou | Logout → login de novo |

### Comandos de diagnóstico

```bash
# Verifica processos rodando
netstat -an | findstr "5173"     # frontend
netstat -an | findstr "8080"     # API

# Limpa cache MSAL (se token virou stale)
# DevTools → Application → Storage → Clear site data

# Vê logs API local
# Terminal onde rodou dotnet run mostra logs em tempo real

# Vê logs Vite
# Terminal onde rodou npm run dev mostra logs
```

### Pedir ajuda
- 📚 Docs Microsoft: https://learn.microsoft.com/entra/identity-platform/
- 💬 GitHub Issues: https://github.com/tftec-guilherme/entra-auth-gateway/issues
- 📧 guilherme.campos@tftec.com.br

---

## 📚 Próximos Passos

| Tópico | Onde estudar |
|--------|--------------|
| Conditional Access | `docs/aula/roadmap-avancado.md` §1 |
| MFA & Authentication Methods | §2 |
| Workload Identity Federation | §3 (já usado neste repo!) |
| Managed Identity | §4 |
| Code review do sistema | `docs/review/security-audit.md` |

🎓 **Workshop completo:** [`docs/playbook/roteiro-aula.md`](./roteiro-aula.md) (roteiro narrativo 2h) + [`docs/aula/hands-on.md`](../aula/hands-on.md) (tutorial linear hands-on)

---

**Última atualização:** 2026-04-29
**Versão analisada:** commit `a344843` ou superior
