---
title: "Pré-requisitos da Demo Interativa — OBO e Client Credentials"
audience: "Aluno TFTEC Masters configurando própria App Reg pra reproduzir /lab/demo"
last_updated: 2026-05-13
related: ["hands-on.md Cap 5 (Permissions)", "hands-on.md Cap 6 (Credenciais)"]
---

# Pré-requisitos da Demo Interativa

Os 4 cenários do `/lab/demo` têm dependências diferentes da configuração da App Reg + backend AuthService:

| Cenário | Permissions da App Reg | Backend precisa | Funciona out-of-the-box? |
|---|---|---|---|
| SPA login + API | Microsoft Graph **User.Read** (Delegated) — user pode consentir no login | — | ✅ Sim |
| OBO (chain) | Microsoft Graph **User.Read** (Delegated) — admin OK também | **ClientSecret** OU **Certificate** configurado | ⚠️ Se o backend deployed tiver secret, sim |
| Client Credentials | Microsoft Graph **User.Read.All** (Application) — **admin consent obrigatório** | **ClientSecret** OU **Certificate** configurado | ⚠️ Sem admin consent, retorna 403 do Graph |
| SAML | n/a — conceitual | — | ❌ Não executa, só animação |

## Como configurar OBO + Client Credentials no SEU tenant

### 1. Adicionar permissions na App Reg

**Portal:**
1. Entra ID admin center → **App registrations** → sua App Reg
2. **API permissions** → **+ Add a permission** → **Microsoft Graph**
3. Adicionar 2 permissions:
   - **Delegated** → `User.Read` (geralmente já tem do login)
   - **Application** → `User.Read.All`
4. **Grant admin consent for {tenant}** ← obrigatório pra Application permission

**CLI alternativa:**
```powershell
$appId = "<seu-client-id>"
$graphAppId = "00000003-0000-0000-c000-000000000000"  # Microsoft Graph

# User.Read (Delegated) — geralmente já existe via login
# User.Read.All (Application) — guid: df021288-bdef-4463-88db-98f22de89214 (Role)
az ad app permission add --id $appId --api $graphAppId --api-permissions df021288-bdef-4463-88db-98f22de89214=Role

# Grant admin consent
az ad app permission admin-consent --id $appId
```

### 2. Configurar Client Secret no backend

Backend AuthService usa `AzureAd:ClientSecret` (production) ou `appsettings.Development.json` (local dev).

**Production (Azure App Service):**
- Já configurado se você seguiu o `deploy-azure.yml` — secret vem de `${{ secrets.AZURE_AUTHSERVICE_CLIENT_SECRET }}`.

**Local dev:**
```json
// api/appsettings.Development.json
{
  "AzureAd": {
    "ClientSecret": "seu-client-secret-aqui"
  }
}
```

> ⚠️ Não comite `appsettings.Development.json` com secret real. Está no `.gitignore`.

### 3. Validar

```powershell
# 1) Token user com aud=AuthService
$token = "<seu-access-token-da-spa>"

# 2) Testar OBO endpoint
curl -X POST https://authservice-api-tftec.azurewebsites.net/auth/obo `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{"targetApi":"graph","scopes":["https://graph.microsoft.com/User.Read"]}'

# 3) Testar Client Credentials endpoint
curl -X POST https://authservice-api-tftec.azurewebsites.net/auth/client-token `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{"targetApi":"graph","scopes":["https://graph.microsoft.com/.default"]}'
```

## Como `/lab/demo` se comporta com configuração incompleta

A página `/lab/demo` agora **fecha o loop**: depois de pegar o token via backend, ela CHAMA o Graph e mostra a resposta na EventTimeline. Cada erro vem com hint do que verificar:

| Erro | Causa provável | O que checar |
|---|---|---|
| 401 do AuthService | Token do user não é audience da AuthService API | Verifique `authServiceRequest.scopes` em `src/config/msal.ts` |
| 500 do AuthService no OBO | ClientSecret missing ou User.Read não consentido | Backend logs + App Reg permissions |
| 200 do AuthService + 403 do Graph (CC) | Admin consent não dado pra User.Read.All Application | Portal → API permissions → Grant admin consent |
| MsalUiRequiredException | OBO consent missing | Refresh user login no SPA |

## Referências

- [hands-on Cap 5](./hands-on.md#cap-5--permissions-e-roles-15-min) — Delegated vs Application
- [hands-on Cap 6](./hands-on.md#cap-6--credenciais-10-min) — Como criar Client Secret
- [`/lab/permissions-claims`](../../src/pages/lab/PermissionsClaims.tsx) — Visualização dos claims
- [`/lab/credenciais`](../../src/pages/lab/Credenciais.tsx) — As 4 credenciais detalhadas
- `api/Controllers/TokenController.cs:72,127` — Endpoints OBO + Client Credentials
- `api/Services/OboTokenService.cs` + `ClientCredentialsService.cs` — Implementação
