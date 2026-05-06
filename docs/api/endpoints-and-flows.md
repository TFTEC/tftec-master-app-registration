# 📘 AuthService — Endpoints & Fluxos

> Referência completa dos endpoints da API com exemplos de **request**, **response** e os **fluxos OAuth 2.0 / OIDC** envolvidos.
> Base URL (produção): `https://authservice-api-tftec.azurewebsites.net`
> Base URL (local): `http://localhost:8080`

---

## 📋 Índice

1. [Visão geral dos fluxos](#visão-geral-dos-fluxos)
2. [Convenções](#convenções)
3. [Endpoints públicos](#endpoints-públicos)
   - [GET `/health`](#get-health)
   - [GET `/.well-known/jwks.json`](#get-well-knownjwksjson)
4. [Endpoints autenticados — Identidade](#endpoints-autenticados--identidade)
   - [GET `/auth/me`](#get-authme)
   - [POST `/auth/validate`](#post-authvalidate)
5. [Endpoints autenticados — Tokens](#endpoints-autenticados--tokens)
   - [POST `/auth/exchange` — Token Interno (Modelo 2)](#post-authexchange--token-interno-modelo-2)
   - [POST `/auth/obo` — On-Behalf-Of (Pass-through usuário)](#post-authobo--on-behalf-of-pass-through-usuário)
   - [POST `/auth/client-token` — Client Credentials (S2S)](#post-authclient-token--client-credentials-s2s)
6. [Fluxos completos end-to-end](#fluxos-completos-end-to-end)
   - [Fluxo A — Login via Entra ID + chamada à API](#fluxo-a--login-via-entra-id--chamada-à-api)
   - [Fluxo B — Token interno (JWKS)](#fluxo-b--token-interno-jwks)
   - [Fluxo C — On-Behalf-Of (pass-through como usuário)](#fluxo-c--on-behalf-of-pass-through-como-usuário)
   - [Fluxo D — Client Credentials (serviço a serviço)](#fluxo-d--client-credentials-serviço-a-serviço)
7. [Erros comuns](#erros-comuns)

---

## Visão geral dos fluxos

| # | Fluxo | Tipo | Endpoint principal | Quando usar |
|---|---|---|---|---|
| A | **Entra ID Login (Auth Code + PKCE)** | Usuário interativo | (no SPA, via MSAL) | Login do usuário no frontend |
| B | **Token Interno** | Token exchange | `POST /auth/exchange` | Quando APIs internas validam via JWKS próprio |
| C | **On-Behalf-Of (OBO)** | Pass-through delegado | `POST /auth/obo` | API chama outra API **como o usuário** |
| D | **Client Credentials** | Serviço a serviço | `POST /auth/client-token` | Job/worker sem usuário (ex: cron, daemon) |

```mermaid
flowchart LR
    User([👤 Usuário]) -->|MSAL/PKCE| Entra[Microsoft Entra ID]
    Entra -->|access_token| SPA[React SPA]
    SPA -->|Bearer token| API[AuthService API]
    API -->|/exchange| Internal[(Token Interno<br/>JWKS)]
    API -->|/obo| Downstream1[Graph / API parceira<br/>como usuário]
    API -->|/client-token| Downstream2[API parceira<br/>como serviço]
```

---

## Convenções

- **Header de autenticação**: `Authorization: Bearer <access_token>`
- **Content-Type**: `application/json`
- **Token validado**: Microsoft Entra ID multi-tenant (`tid` deve estar em `AllowedTenants`)
- **Audience esperado**: `api://<AZURE_AD_CLIENT_ID>`
- Todos os endpoints `/auth/*` exigem token, exceto onde indicado.

---

## Endpoints públicos

### `GET /health`

Healthcheck simples para liveness/readiness probes.

**Request**
```http
GET /health HTTP/1.1
Host: authservice-api-tftec.azurewebsites.net
```

**Response — `200 OK`**
```
Healthy
```

---

### `GET /.well-known/jwks.json`

Retorna o **JSON Web Key Set** (JWKS) público usado para validar tokens internos emitidos pelo `/auth/exchange`. Compatível com qualquer biblioteca padrão (`jose`, `jsonwebtoken`, `Microsoft.IdentityModel.Tokens`).

**Request**
```http
GET /.well-known/jwks.json HTTP/1.1
```

**Response — `200 OK`**
```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "auth-service-key-1",
      "alg": "RS256",
      "n": "0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx...",
      "e": "AQAB"
    }
  ]
}
```

> 💡 APIs downstream devem cachear o JWKS (ex: 1h) e revalidar quando o `kid` do token não bater.

---

## Endpoints autenticados — Identidade

### `GET /auth/me`

Retorna as **claims relevantes** do token Entra ID validado. Útil para diagnóstico e para o frontend descobrir quem está logado.

**Request**
```http
GET /auth/me HTTP/1.1
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIs...
```

**Response — `200 OK`**
```json
{
  "authenticated": true,
  "claims": {
    "sub": "AAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE",
    "oid": "11111111-2222-3333-4444-555555555555",
    "tid": "66666666-7777-8888-9999-000000000000",
    "preferred_username": "ana@contoso.com",
    "name": "Ana Souza",
    "roles": "Admin",
    "scp": "access_as_user",
    "aud": "api://386715b6-b101-4fe4-9209-ee2e92eeca8b",
    "iss": "https://login.microsoftonline.com/66666666-7777-8888-9999-000000000000/v2.0",
    "exp": "1735689600",
    "iat": "1735686000"
  }
}
```

**Erros**
| Status | Quando |
|---|---|
| `401 Unauthorized` | Sem token ou token inválido/expirado |
| `401 Unauthorized` (`Tenant not allowed`) | `tid` não está em `AllowedTenants` |

---

### `POST /auth/validate`

Endpoint de diagnóstico que ecoa as claims após validação. **Requer role `Admin`**.

**Request**
```http
POST /auth/validate HTTP/1.1
Authorization: Bearer <token-com-role-Admin>
```

**Response — `200 OK`**
```json
{
  "valid": true,
  "tokenType": "EntraID",
  "claims": { "sub": "...", "tid": "...", "roles": "Admin", "...": "..." },
  "validatedAt": "2026-04-29T14:32:11.123Z"
}
```

**Erros**
| Status | Quando |
|---|---|
| `403 Forbidden` | Token válido mas sem role `Admin` |

---

## Endpoints autenticados — Tokens

### `POST /auth/exchange` — Token Interno (Modelo 2)

Troca o token Entra ID por um **JWT interno** assinado pelo AuthService (RS256). Usado quando APIs downstream confiam apenas no AuthService e validam via JWKS próprio (`/.well-known/jwks.json`).

**Request**
```http
POST /auth/exchange HTTP/1.1
Authorization: Bearer <entra-id-access-token>
Content-Type: application/json
```

Sem body.

**Response — `200 OK`**
```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6ImF1dGgtc2VydmljZS1rZXktMSJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

**Payload do token interno (decodificado)**
```json
{
  "iss": "AuthService",
  "aud": "AuthService-Clients",
  "sub": "AAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE",
  "preferred_username": "ana@contoso.com",
  "name": "Ana Souza",
  "tid": "66666666-7777-8888-9999-000000000000",
  "roles": ["Admin"],
  "iat": 1735686000,
  "exp": 1735689600
}
```

**Quando usar**
- APIs downstream **internas** que não precisam validar diretamente contra o Entra ID
- Quando você quer **claims customizadas** (ex: roles do seu próprio sistema)
- Reduz acoplamento: rotação de Client Secret do Entra não impacta serviços downstream

---

### `POST /auth/obo` — On-Behalf-Of (Pass-through usuário)

Implementa o fluxo **OAuth 2.0 On-Behalf-Of** ([RFC 8693](https://www.rfc-editor.org/rfc/rfc8693)). A API chama uma API downstream **como o usuário original**, preservando identidade e permissões delegadas.

**Request**
```http
POST /auth/obo HTTP/1.1
Authorization: Bearer <entra-id-access-token-do-usuário>
Content-Type: application/json

{
  "targetApi": "https://graph.microsoft.com",
  "scopes": ["User.Read", "Mail.Read"]
}
```

**Response — `200 OK`**
```json
{
  "accessToken": "eyJ0eXAiOiJKV1QiLCJub25jZSI6...",
  "tokenType": "Bearer",
  "expiresIn": 3599
}
```

**Uso típico (chamando Graph)**
```bash
curl -H "Authorization: Bearer <obo-token>" \
     https://graph.microsoft.com/v1.0/me
```

**Quando usar**
- API precisa chamar Graph (ou outra API protegida) **com a identidade do usuário**
- Auditoria deve registrar o usuário, não o serviço
- Permissões delegadas (Delegated permissions) configuradas no App Registration

**Erros**
| Status | Causa |
|---|---|
| `400 Bad Request` | `targetApi` ou `scopes` ausentes |
| `401 Unauthorized` | Token de usuário ausente ou inválido |
| `500` (`AADSTS65001`) | Usuário não consentiu o scope downstream |
| `500` (`AADSTS50013`) | Token original sem `aud` correto para OBO |

---

### `POST /auth/client-token` — Client Credentials (S2S)

Implementa o fluxo **OAuth 2.0 Client Credentials**. Não há usuário envolvido — o AuthService autentica como **ele mesmo** contra o Entra ID e obtém um token para a API downstream. **Requer role `Admin`** no token de quem chama.

**Request**
```http
POST /auth/client-token HTTP/1.1
Authorization: Bearer <entra-id-token-com-role-Admin>
Content-Type: application/json

{
  "targetApi": "https://graph.microsoft.com",
  "scopes": ["https://graph.microsoft.com/.default"]
}
```

> Para Client Credentials no Entra ID, o scope **deve** terminar com `/.default`.

**Response — `200 OK`**
```json
{
  "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIs...",
  "tokenType": "Bearer",
  "expiresIn": 3599
}
```

**Payload do token (decodificado, exemplo)**
```json
{
  "aud": "https://graph.microsoft.com",
  "iss": "https://sts.windows.net/<tenant>/",
  "appid": "386715b6-b101-4fe4-9209-ee2e92eeca8b",
  "roles": ["User.Read.All", "Application.Read.All"],
  "iat": 1735686000,
  "exp": 1735689600
}
```

**Quando usar**
- Jobs em background, workers, daemons sem usuário interativo
- Sincronização batch, webhooks, integrações server-to-server
- Permissões de aplicação (Application permissions, **não** delegadas)

**Erros**
| Status | Causa |
|---|---|
| `400 Bad Request` | `targetApi` ausente |
| `403 Forbidden` | Quem chamou não tem role `Admin` |
| `500` (`AADSTS7000215`) | Client Secret do AuthService inválido/expirado |
| `500` (`AADSTS500011`) | `targetApi` desconhecido pelo Entra ID |

---

## Fluxos completos end-to-end

### Fluxo A — Login via Entra ID + chamada à API

Login interativo do usuário no SPA usando **Authorization Code + PKCE** (via MSAL.js), seguido de chamada à API.

```mermaid
sequenceDiagram
    autonumber
    participant U as 👤 Usuário
    participant SPA as React SPA (MSAL)
    participant Entra as Microsoft Entra ID
    participant API as AuthService API

    U->>SPA: Clica "Entrar"
    SPA->>Entra: /authorize (code + PKCE challenge)
    Entra->>U: Tela de login + consent
    U->>Entra: Credenciais
    Entra->>SPA: Redirect com authorization code
    SPA->>Entra: /token (code + PKCE verifier)
    Entra->>SPA: access_token + id_token
    SPA->>API: GET /auth/me<br/>Authorization: Bearer access_token
    API->>API: Valida assinatura, aud, iss, tid<br/>Verifica AllowedTenants
    API->>SPA: 200 OK { claims }
    SPA->>U: Mostra perfil
```

---

### Fluxo B — Token interno (JWKS)

Frontend troca o token Entra ID por um JWT interno do AuthService, e o usa contra uma API downstream que valida via JWKS.

```mermaid
sequenceDiagram
    autonumber
    participant SPA as React SPA
    participant AS as AuthService API
    participant DS as API Downstream

    SPA->>AS: POST /auth/exchange<br/>Bearer <entra-token>
    AS->>AS: Valida Entra token<br/>Gera JWT RS256 com claims internas
    AS->>SPA: { accessToken (interno), expiresIn: 3600 }

    Note over SPA,DS: Agora o SPA usa o token INTERNO

    SPA->>DS: GET /pedidos<br/>Bearer <internal-token>
    DS->>AS: GET /.well-known/jwks.json (cacheado)
    AS->>DS: { keys: [...] }
    DS->>DS: Valida assinatura (RS256, kid)
    DS->>SPA: 200 OK { dados }
```

---

### Fluxo C — On-Behalf-Of (pass-through como usuário)

A API precisa chamar o Graph **em nome do usuário**.

```mermaid
sequenceDiagram
    autonumber
    participant SPA as React SPA
    participant AS as AuthService API
    participant Entra as Entra ID (token endpoint)
    participant Graph as Microsoft Graph

    SPA->>AS: POST /auth/obo<br/>Bearer <user-token><br/>{ targetApi, scopes }
    AS->>Entra: POST /token<br/>grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer<br/>assertion=<user-token><br/>requested_token_use=on_behalf_of
    Entra->>Entra: Valida user-token + permissões delegadas + consent
    Entra->>AS: { access_token (para Graph) }
    AS->>SPA: { accessToken, expiresIn }
    SPA->>Graph: GET /me<br/>Bearer <obo-token>
    Graph->>SPA: 200 OK { dados do usuário }
```

> 🔒 O token devolvido tem `sub` = usuário original. Auditoria no Graph mostra a **pessoa**, não o serviço.

---

### Fluxo D — Client Credentials (serviço a serviço)

Sem usuário. Job batch precisa listar todos os usuários do tenant.

```mermaid
sequenceDiagram
    autonumber
    participant Worker as 🤖 Worker / Job
    participant AS as AuthService API
    participant Entra as Entra ID (token endpoint)
    participant Graph as Microsoft Graph

    Worker->>AS: POST /auth/client-token<br/>Bearer <admin-token><br/>{ targetApi, scopes:[".default"] }
    AS->>Entra: POST /token<br/>grant_type=client_credentials<br/>client_id + client_secret<br/>scope=https://graph.microsoft.com/.default
    Entra->>Entra: Valida client_secret + Application permissions
    Entra->>AS: { access_token (app-only) }
    AS->>Worker: { accessToken, expiresIn: 3599 }
    Worker->>Graph: GET /users<br/>Bearer <app-token>
    Graph->>Worker: 200 OK { value: [...] }
```

> ⚠️ Token tem `roles` (Application permissions), **não** `scp`. APIs downstream devem checar `roles` para autorização.

---

## Erros comuns

| Status | Body | Causa provável | Ação |
|---|---|---|---|
| `401` | _vazio_ | Header `Authorization` ausente | Adicionar `Bearer <token>` |
| `401` | `WWW-Authenticate: error="invalid_token"` | Token expirado, assinatura inválida ou `aud` errado | Renovar token; conferir audience configurado |
| `401` | log: `Tenant not allowed` | `tid` fora de `AllowedTenants` | Adicionar tenant em `AllowedTenants__Tenants` |
| `403` | _vazio_ | Token válido mas sem role/scope exigido | Conceder role no Entra (`Admin`) ou scope correto |
| `400` | `{ error: "targetApi and scopes are required" }` | Body incompleto em `/auth/obo` | Enviar `targetApi` + `scopes` não vazios |
| `500` | `AADSTS65001: consent required` | Usuário não consentiu o scope no OBO | Frontend pedir consent incremental via MSAL |
| `500` | `AADSTS7000215: invalid client secret` | Secret do AuthService expirou | Rotacionar secret no Entra + atualizar Key Vault |

---

<p align="center">
  <i>Para configuração do App Registration → <a href="../guides/app-registration-setup.md">Guia de App Registration</a></i><br/>
  <i>Para arquitetura completa → <a href="../infrastructure/v1-architecture.md">V1 Architecture</a></i>
</p>
