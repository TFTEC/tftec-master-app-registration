# 🎯 Cheat Sheet — App Registration

> 1 página A4. Imprime, gruda no monitor, consulta sempre. Tudo que cai numa entrevista ou debug ao vivo.

---

## ⚡ Comandos `az` essenciais

```bash
# Criar App Registration
az ad app create --display-name "MeuApp"

# Criar SP a partir de App
az ad sp create --id <app-id>

# Criar App + SP + role (CI/CD com client_secret)
az ad sp create-for-rbac --name "sp-deploy" --role Contributor \
  --scopes /subscriptions/<sub-id>

# Resetar client secret no nível APP (não SP!)
az ad app credential reset --id <app-id>

# Adicionar federated credential (OIDC sem secret)
az ad app federated-credential create --id <app-id> --parameters '{
  "name":"github-main","issuer":"https://token.actions.githubusercontent.com",
  "subject":"repo:OWNER/REPO:ref:refs/heads/main","audiences":["api://AzureADTokenExchange"]
}'

# Listar credentials
az ad app credential list --id <app-id>

# Role assignment (use REST API direto se Git Bash bug)
az role assignment create --assignee-object-id <sp-obj-id> \
  --assignee-principal-type ServicePrincipal --role Contributor \
  --scope /subscriptions/<sub-id>
```

## 🔑 Claims JWT — sempre validar

| Claim | Valida o quê |
|-------|--------------|
| `iss` | Issuer == `https://login.microsoftonline.com/{tid}/v2.0` |
| `aud` | Audience == sua App ID URI (`api://<client-id>`) |
| `exp` | Não expirou (Unix timestamp) |
| `nbf` | Já é válido (Not Before) |
| `tid` | Tenant esperado (multi-tenant: lista whitelist) |
| `signature` | RSA contra JWKS público do Entra ID |

> 🚨 **Pular qualquer um = vulnerabilidade.** Use Microsoft.Identity.Web (.NET) ou MSAL.js (browser).

## 📊 OAuth Flows — quando usar

| Flow | Quem | Token | Secret? |
|------|------|-------|---------|
| **Auth Code + PKCE** | SPA / Web app com user | Access + ID + Refresh | Não (PKCE) |
| **OBO** | API → API com user identity | Novo Access | Sim |
| **Client Credentials** | Daemon/worker, sem user | Access only | Sim ou cert ou OIDC |
| **Device Code** | CLI, IoT, sem browser | Access + ID | Não (PKCE) |

## 🚨 Erros AADSTS — diagnóstico em 30s

| Erro | Causa | Fix |
|------|-------|-----|
| `50011` | Redirect URI mismatch | Authentication tab → adicionar URL exata |
| `65001` | Consent required | API permissions → Grant admin consent |
| `7000215` | Client secret inválido | Certificates & secrets → New secret |
| `90002` | Tenant não existe | Verifique tenant ID no `/oauth2/v2.0/token` |
| `50158` | MFA exigido | Conditional Access ou ativar MFA no user |
| `Authorization_RequestDenied` | Permission sem consent | Mesmo que 65001 |

## 🛠️ Ferramentas

- 🔍 **jwt.ms** — decodifica JWT visualmente
- 🔍 **Postman** ou `curl` — testar tokens
- 📊 **Azure Portal** → Entra ID → Sign-in logs — auditar tentativas
- 📊 **Azure Portal** → Entra ID → App registrations → Authentication → Test → "Verify identity"

## 📐 Decision matrix — escolha rápida

| Cenário | Configuração |
|---------|-------------|
| SPA (React/Vue/Angular) | Platform: **SPA** + PKCE |
| MVC/Razor app server-side | Platform: **Web** + client secret |
| Mobile app (iOS/Android) | Platform: **Public client** + PKCE |
| API call com user identity | OBO flow |
| API call sem user (m2m) | Client Credentials + cert preferred |
| CI/CD GitHub Actions | **OIDC federated credentials** (zero secret) |
| App acessível qualquer org | Multi-tenant + `tid` validation |
| Apenas usuários da empresa | Single-tenant |

## 🔒 Segurança — mantras

1. **Nunca commit client_secret** — sempre Key Vault ou env var
2. **Rotacione secrets** antes de expirar (90d antes)
3. **Use OIDC federation** em vez de secret quando possível
4. **Multi-tenant valida `tid` whitelist** se for negócio
5. **Tokens em `sessionStorage`** (não `localStorage`) pra SPA
6. **HTTPS-only** em produção (App Service: `httpsOnly = true`)
7. **CORS restritivo** (lista exata de origins)
8. **CSP headers** pra prevenir XSS em SPA

## 🔗 Links de ouro

- 📚 https://aka.ms/aadid (toda doc Entra ID)
- 🔍 https://jwt.ms (decoder oficial Microsoft)
- 📖 https://learn.microsoft.com/azure/active-directory/develop/v2-oauth2-auth-code-flow
- 📖 https://learn.microsoft.com/entra/identity-platform/scenario-web-app-call-api-overview
- ⚙️ https://aka.ms/portal-msapps (App registrations atalho)
- 🛡️ https://learn.microsoft.com/entra/identity-platform/security-tokens

---

> 💡 **Mantra final:** Quando achar que é bug no código, é configuração. Quando achar que é configuração, é o código.
