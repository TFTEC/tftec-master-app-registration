# 📖 Glossário — App Registration & Entra ID

> Termos essenciais pra entender App Registration. Use como referência rápida durante a aula e depois.

---

## 🔵 Identidade & Tenancy

### **Tenant**
Instância isolada do Microsoft Entra ID associada a uma organização. Cada tenant tem ID único (UUID), domínio (`tftec.onmicrosoft.com`) e usuários próprios. Sua empresa = 1 tenant.

### **Tenant ID** (`tid`)
UUID que identifica o tenant. Aparece como claim `tid` no token e na URL de auth: `login.microsoftonline.com/{tenant-id}/oauth2/v2.0/...`.

### **Microsoft Entra ID** (anteriormente Azure AD)
Identity Provider (IdP) da Microsoft. Implementa OAuth 2.0, OpenID Connect, SAML 2.0.

### **Multi-tenant**
App configurado pra aceitar logins de **qualquer tenant** Entra ID. Comum em SaaS B2B. Setting: `Supported account types = Accounts in any organizational directory`.

### **Single-tenant**
App restrito a 1 tenant específico. Apps internos da empresa.

### **Home tenant**
Tenant onde o App Registration foi criado. Em multi-tenant, é onde mora o App Object.

---

## 🟣 App Registration

### **App Registration** (App Reg)
Identidade da sua aplicação no Entra ID. Define quem pode usar o app, qual auth flow, redirect URIs, permissions, secrets. Resultado: `Application (client) ID` único.

### **Application Object**
Template global do app. Vive no home tenant. 1 App Object existe.

### **Service Principal (SP)**
Instância do app em UM tenant específico. Em multi-tenant: 1 App Object + N Service Principals (um por tenant onde o app é consumido).

### **Application (Client) ID** (`appId`)
UUID único do App Registration. Aparece no código como `clientId`. NÃO é secreto (pode ir no frontend).

### **Object ID**
UUID interno do Application Object ou Service Principal. Diferente do Client ID. Usado em queries Graph.

### **Application ID URI**
URI única que identifica sua API: `api://{client-id}` (default) ou custom domain. Vira o `audience` (`aud`) dos tokens emitidos pra essa API.

---

## 🟠 Authentication Flows

### **OAuth 2.0**
Protocolo de **autorização** (não autenticação!). Define como uma app pega token pra acessar recursos em nome do usuário.

### **OpenID Connect (OIDC)**
Camada de **autenticação** sobre OAuth 2.0. Adiciona ID Token (info do user) ao access token.

### **Authorization Code Flow**
Flow OAuth padrão pra apps com server-side. SPA hoje usa esse flow + PKCE.

### **PKCE (Proof Key for Code Exchange)**
Extensão obrigatória pra SPAs. Hash do `code_verifier` envia no `/authorize`, verifier original envia no `/token`. Previne interceptação do code.

### **Implicit Flow** (LEGADO — NÃO USE)
Flow antigo pra SPAs. Token retornava direto na URL. Substituído por Auth Code + PKCE.

### **Client Credentials Flow**
Flow pra autenticação **sem usuário** (worker, cron, daemon). App autentica como ele mesmo usando client_secret ou certificate.

### **On-Behalf-Of (OBO)**
Flow pra API trocar um token (recebido de SPA) por outro token destinado a uma API downstream **mantendo a identidade do user original**.

### **Device Code Flow**
Flow pra apps sem browser (CLI, IoT). Usuário pega código em outro device pra autorizar.

---

## 🟡 Tokens & Claims

### **Access Token**
JWT que autoriza acesso a uma API. Curto (~1h). Verificado pela API via assinatura + audience + expiry.

### **ID Token**
JWT com info do usuário (nome, email). Consumido **apenas pelo cliente** que pediu o login. NÃO chama API com ele.

### **Refresh Token**
Token longo (dias/semanas) usado pra obter novos access tokens sem login interativo. Armazenado seguro.

### **JWT (JSON Web Token)**
Token formato `header.payload.signature`. 3 partes em base64url. Pode decodificar em jwt.ms (não revela secret, só conteúdo).

### **Claim**
Campo dentro do JWT payload. Ex: `aud`, `iss`, `sub`, `exp`, `scp`, `roles`, `tid`, `oid`.

### **Audience** (`aud`)
Pra QUEM o token foi emitido. API valida que `aud == sua App ID URI`.

### **Issuer** (`iss`)
Quem emitiu o token (URL do Entra ID + tenant). API valida.

### **Subject** (`sub`)
ID único do user (sem PII). Estável dentro do mesmo App Reg + tenant.

### **Object ID** (`oid`)
ID do user no diretório. Globalmente único em multi-tenant.

### **Scope** (`scp`)
Permissions DELEGADAS (em nome do user). Ex: `User.Read access_as_user`.

### **Role** (`roles`)
Permissions de APLICAÇÃO (sem user, daemon). Ex: `Application.ReadWrite.All`.

---

## 🟢 Configurações Críticas

### **Redirect URI** (Reply URL)
URL pra onde Entra ID manda o usuário após login. Match EXATO com o que o app envia. Erro mais comum: `AADSTS50011`.

### **Platform** (Authentication tab)
Tipo de aplicação: SPA (PKCE), Web (server-side com client_secret), Public client (CLI/desktop). Define o flow permitido.

### **API Permissions**
Permissions que sua app PEDE pra outras APIs (Graph, Office 365, custom).

### **Delegated permissions**
Pra app rodando com user logado. Acesso é AND da permission + acesso do user.

### **Application permissions**
Pra app rodando sem user (Client Credentials). Privilegiado, requer admin consent.

### **Admin Consent**
Aprovação de tenant admin pra permissions privilegiadas. Sem ele: `Authorization_RequestDenied`.

### **Client Secret**
String secreta usada como senha pelo App em flows server-side. Expira (max 24 meses). Rotacionar antes de expirar.

### **Certificate-based credential**
Substituto do client_secret. Mais seguro (chave privada não trafega). Rotação via management.

### **Federated Credential**
Credencial pra OIDC federation (ex: GitHub Actions → Azure). Zero secret. **Recomendado** pra CI/CD moderno.

### **Workload Identity Federation**
Sistema de federated credentials. Permite GitHub/AWS/GCP autenticar no Azure sem client_secret.

---

## 🔴 Erros Comuns (AADSTS)

### `AADSTS50011`
Redirect URI mismatch. Compare URL exata em Authentication.

### `AADSTS65001`
User consent required. Grant admin consent.

### `AADSTS7000215`
Client secret inválido/expirado. Criar novo em Certificates & secrets.

### `AADSTS90002`
Tenant não encontrado. Tenant ID errado na URL `/oauth2/v2.0/token`.

### `AADSTS50158`
External security challenge. MFA exigido + user não fez.

### `Authorization_RequestDenied`
Falta admin consent ou permission insuficiente.

### `Insufficient privileges`
Mesma raiz: permission sem admin consent.

---

## 🛠️ Ferramentas

### **MSAL.js / MSAL.NET**
Microsoft Authentication Library. SDK oficial pra OAuth/OIDC. Lida com PKCE, cache, refresh tokens automaticamente.

### **Microsoft Graph API**
API unificada pra Microsoft 365 (users, groups, mail, calendar, sharepoint, etc.).

### **jwt.ms**
Site da Microsoft pra decodificar JWT visualmente. Cole o token, vê claims. Não envia ao servidor.

### **Microsoft.Identity.Web**
Pacote .NET pra validar tokens Entra ID. Configura JWT validation middleware automaticamente.

---

## 📚 Próximos a estudar

| Termo | Pra quando | Próxima aula |
|-------|------------|--------------|
| Conditional Access | Restringir login por contexto | #1 |
| Authentication Methods Policy | Configurar MFA por user/group | #2 |
| Managed Identity | Auth automática no Azure | #4 |
| App Roles | RBAC custom no app | #7 |
| Custom Claims | Adicionar dados no JWT | #6 |
