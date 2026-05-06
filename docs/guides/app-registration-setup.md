# 🔐 Guia Passo a Passo: Criar App Registration no Azure

> Como configurar o App Registration no Microsoft Entra ID para o AuthService e o Admin Console.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Criar o App Registration](#1-criar-o-app-registration)
3. [Configurar Authentication (Redirect URIs)](#2-configurar-authentication)
4. [Configurar API Permissions (Graph API)](#3-configurar-api-permissions)
5. [Criar Client Secret](#4-criar-client-secret)
6. [Expor uma API (Scope)](#5-expor-uma-api-scope)
7. [Criar o Service Principal (SP) para CI/CD](#6-criar-service-principal-para-cicd)
8. [Resumo dos valores gerados](#7-resumo-dos-valores-gerados)
9. [Troubleshooting](#troubleshooting)

---

## Visão Geral

O projeto utiliza **dois** App Registrations:

| App Registration | Finalidade | Quem usa |
|---|---|---|
| **AuthService App** | Autenticação de usuários + API backend | Frontend (MSAL) e API (.NET) |
| **Service Principal (SP)** | Deploy automatizado via GitHub Actions | CI/CD pipeline |

```
┌─────────────────────────────────────────────────────────┐
│                    Microsoft Entra ID                     │
├─────────────────────────────────────────────────────────┤
│                                                           │
│   ┌─────────────────────┐   ┌─────────────────────────┐ │
│   │  App Registration   │   │   Service Principal     │ │
│   │  (AuthService)      │   │   (GitHub Actions)      │ │
│   │                     │   │                         │ │
│   │  • Client ID        │   │  • SP_CLIENT_ID         │ │
│   │  • Client Secret    │   │  • SP_CLIENT_SECRET     │ │
│   │  • Redirect URIs    │   │  • Contributor Role     │ │
│   │  • Graph Permissions│   │                         │ │
│   └─────────────────────┘   └─────────────────────────┘ │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 1) Criar o App Registration

| # | Passo | Ação |
|---|---|---|
| 1 | **Abrir Entra ID** | Portal Azure → barra de busca → digitar `Microsoft Entra ID` → clicar |
| 2 | **App registrations** | Menu lateral esquerdo → **App registrations** |
| 3 | **Nova registration** | Clicar **+ New registration** |
| 4 | **Name** | Preencher: `AuthService` (ou nome do seu projeto) |
| 5 | **Supported account types** | Selecionar: ✅ **Accounts in any organizational directory (Any Microsoft Entra ID tenant - Multitenant)** |
| 6 | **Redirect URI** | Tipo: `Single-page application (SPA)` — URI: `http://localhost:5173` |
| 7 | **Registrar** | Clicar **Register** |

### Após registro — anotar valores:

| Campo | Onde encontrar | Exemplo |
|---|---|---|
| **Application (client) ID** | Overview → Application (client) ID | `386715b6-b101-4fe4-9209-ee2e92eeca8b` |
| **Directory (tenant) ID** | Overview → Directory (tenant) ID | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |

> 📝 Guarde esses valores — serão usados em `src/config/azure.ts` e `appsettings.json`.

---

## 2) Configurar Authentication

| # | Passo | Ação |
|---|---|---|
| 1 | **Navegar** | App Registration → menu lateral → **Authentication** |
| 2 | **Adicionar plataforma** | Se SPA não aparece, clicar **+ Add a platform** → **Single-page application** |
| 3 | **Redirect URIs** | Adicionar **todos** os URIs necessários: |

### Redirect URIs a configurar:

| URI | Ambiente | Obrigatório? |
|---|---|---|
| `http://localhost:5173` | Desenvolvimento local | ✅ Sim |
| `https://authservice-front-tftec.azurewebsites.net` | Produção (App Service) | ✅ Sim |
| `https://auth-guard-way.lovable.app` | Lovable preview | Opcional |
| `https://SEU-CUSTOM-DOMAIN.com` | Domínio customizado | Se aplicável |

| # | Passo | Ação |
|---|---|---|
| 4 | **Implicit grant** | ⚠️ **NÃO marcar** nenhuma opção (o projeto usa Authorization Code Flow com PKCE) |
| 5 | **Salvar** | Clicar **Save** |

### ⚠️ Erros comuns

| Erro | Causa | Solução |
|---|---|---|
| `redirect_uri_mismatch` | URL exata não cadastrada | A URL deve ser **exatamente igual** (com ou sem `/` no final) |
| `AADSTS50011` | Redirect URI não registrada | Verificar maiúsculas/minúsculas e protocolo (http vs https) |
| Loop infinito de login | URI errada ou tipo de plataforma errado | Deve ser **SPA**, não Web |

---

## 3) Configurar API Permissions

| # | Passo | Ação |
|---|---|---|
| 1 | **Navegar** | App Registration → **API permissions** |
| 2 | **Adicionar permissão** | Clicar **+ Add a permission** |
| 3 | **Microsoft Graph** | Selecionar **Microsoft Graph** |
| 4 | **Tipo** | Selecionar **Delegated permissions** |

### Permissões necessárias:

Adicionar cada permissão uma a uma:

| Permissão | Categoria | Para quê |
|---|---|---|
| `User.Read` | User | Ler perfil do usuário logado |
| `User.ReadWrite.All` | User | CRUD de usuários no Admin Console |
| `Directory.ReadWrite.All` | Directory | Gerenciar diretório (roles, groups) |
| `Application.Read.All` | Application | Listar App Registrations |
| `Application.ReadWrite.All` | Application | Gerenciar secrets de apps |
| `AuditLog.Read.All` | AuditLog | Ler logs de sign-in para o Dashboard |

| # | Passo | Ação |
|---|---|---|
| 5 | **Buscar** | Na barra de busca, digitar o nome da permissão (ex: `User.ReadWrite.All`) |
| 6 | **Selecionar** | Marcar ☑️ a permissão → **Add permissions** |
| 7 | **Repetir** | Repetir passos 2-6 para cada permissão da tabela acima |

### Grant Admin Consent

| # | Passo | Ação |
|---|---|---|
| 8 | **Admin Consent** | Clicar no botão **Grant admin consent for [Tenant Name]** |
| 9 | **Confirmar** | Clicar **Yes** |
| 10 | **Verificar** | Todas as permissões devem mostrar ✅ **Granted for [Tenant]** |

> ⚠️ **Sem Admin Consent**, o Dashboard e a tela de Users **não funcionarão**. O erro será `Insufficient privileges` ou `Authorization_RequestDenied`.

---

## 4) Criar Client Secret

| # | Passo | Ação |
|---|---|---|
| 1 | **Navegar** | App Registration → **Certificates & secrets** |
| 2 | **Novo secret** | Aba **Client secrets** → **+ New client secret** |
| 3 | **Description** | Preencher: `AuthService Production` (ou nome descritivo) |
| 4 | **Expires** | Selecionar duração (recomendado: **12 months** ou **24 months**) |
| 5 | **Add** | Clicar **Add** |
| 6 | **⚠️ COPIAR AGORA** | Copiar o **Value** imediatamente — ele **não será exibido novamente**! |

### Onde usar o Client Secret:

| Local | Variável/Campo |
|---|---|
| App Service (API) | `AzureAd__ClientSecret` |
| GitHub Secrets | `AZURE_CLIENT_SECRET` |
| Key Vault | Secret `AzureAd--ClientSecret` |

> 🔴 **NUNCA** faça commit do Client Secret no código-fonte. Sempre use variáveis de ambiente ou Key Vault.

---

## 5) Expor uma API (Scope)

Necessário para que a API (.NET) valide tokens com a audience correta.

| # | Passo | Ação |
|---|---|---|
| 1 | **Navegar** | App Registration → **Expose an API** |
| 2 | **Application ID URI** | Clicar **Set** → aceitar o padrão `api://CLIENT_ID` ou customizar |
| 3 | **Adicionar scope** | Clicar **+ Add a scope** |
| 4 | **Scope name** | `access_as_user` |
| 5 | **Who can consent** | **Admins and users** |
| 6 | **Display name (admin)** | `Access AuthService as user` |
| 7 | **Description (admin)** | `Allows the app to access AuthService API on behalf of the signed-in user` |
| 8 | **State** | **Enabled** |
| 9 | **Add scope** | Clicar **Add scope** |

### Resultado:

```
Application ID URI: api://386715b6-b101-4fe4-9209-ee2e92eeca8b
Full scope:         api://386715b6-b101-4fe4-9209-ee2e92eeca8b/access_as_user
```

> 💡 Este valor é usado como `AzureAd__Audience` na API .NET.

---

## 6) Criar Service Principal para CI/CD

O Service Principal (SP) é uma identidade separada para o GitHub Actions fazer deploy no Azure.

### 6.1 Criar via Azure CLI

```bash
# Login
az login

# Criar Service Principal com role Contributor
az ad sp create-for-rbac \
  --name "sp-authservice-deploy" \
  --role Contributor \
  --scopes /subscriptions/SEU_SUBSCRIPTION_ID \
  --sdk-auth false

# Output esperado:
# {
#   "appId": "SP_CLIENT_ID",
#   "displayName": "sp-authservice-deploy",
#   "password": "SP_CLIENT_SECRET",
#   "tenant": "SP_TENANT_ID"
# }
```

### 6.2 Criar via Portal (alternativa)

| # | Passo | Ação |
|---|---|---|
| 1 | **Criar App Registration** | Entra ID → App registrations → **+ New registration** |
| 2 | **Name** | `sp-authservice-deploy` |
| 3 | **Account type** | Single tenant |
| 4 | **Register** | Clicar **Register** |
| 5 | **Anotar** | Copiar **Application (client) ID** e **Directory (tenant) ID** |
| 6 | **Criar secret** | Certificates & secrets → **+ New client secret** → copiar **Value** |
| 7 | **Atribuir role** | Portal → **Subscriptions** → sua subscription → **Access control (IAM)** |
| 8 | **Add role assignment** | Clicar **+ Add** → **Add role assignment** |
| 9 | **Role** | Selecionar **Contributor** |
| 10 | **Members** | Selecionar **User, group, or service principal** → buscar `sp-authservice-deploy` |
| 11 | **Review + assign** | Clicar **Review + assign** |

### 6.3 Configurar no GitHub

| GitHub Secret | Valor |
|---|---|
| `AZURE_SP_CLIENT_ID` | `appId` do SP |
| `AZURE_SP_CLIENT_SECRET` | `password` do SP |
| `AZURE_SP_TENANT_ID` | `tenant` do SP |
| `AZURE_SUBSCRIPTION_ID` | ID da subscription Azure |

---

## 7) Resumo dos valores gerados

Ao final deste guia, você terá:

### AuthService App Registration

| Campo | Valor | Usado em |
|---|---|---|
| **Client ID** | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` | `src/config/azure.ts`, `appsettings.json` |
| **Client Secret** | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` | GitHub Secret `AZURE_CLIENT_SECRET`, Key Vault |
| **Tenant ID** | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` | `appsettings.json` |
| **Application ID URI** | `api://CLIENT_ID` | `AzureAd__Audience` na API |

### Service Principal (CI/CD)

| Campo | Valor | Usado em |
|---|---|---|
| **SP Client ID** | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` | GitHub Secret `AZURE_SP_CLIENT_ID` |
| **SP Client Secret** | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` | GitHub Secret `AZURE_SP_CLIENT_SECRET` |
| **SP Tenant ID** | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` | GitHub Secret `AZURE_SP_TENANT_ID` |

---

## Troubleshooting

| Problema | Causa | Solução |
|---|---|---|
| `AADSTS700016: Application not found` | Client ID errado | Verificar `clientId` em `azure.ts` |
| `AADSTS50011: Reply URL mismatch` | Redirect URI não cadastrada | Adicionar URL exata em Authentication |
| `Authorization_RequestDenied` | Falta Admin Consent | Conceder Admin Consent nas API permissions |
| `AADSTS65001: User consent required` | Permissão não consentida | Grant admin consent |
| `insufficient_claims` | Scope não configurada | Verificar Expose an API → scope `access_as_user` |
| `AADSTS7000215: Invalid client secret` | Secret expirado ou errado | Criar novo secret e atualizar onde usado |
| Deploy falha com `AZURE_SP_*` | SP sem permissão | Verificar role Contributor na subscription |

---

<p align="center">
  <i>Guia criado para o workshop AuthService + Admin Console.<br/>
  Para configurar o CI/CD, consulte <a href="cicd-segmented.md">CI/CD Segmentado</a>.<br/>
  Para migração de repositório, consulte <a href="repo-migration.md">Migração de Repo</a>.</i>
</p>
