# 🙋 FAQ — Perguntas Que Vão Aparecer

> Preparação contra "bombardeio" de perguntas em Q&A. **30+ perguntas mais prováveis com respostas técnicas precisas.**
>
> **Dica de uso:** mantém este doc aberto na 2ª tela durante a aula. Se aluno faz uma destas, ctrl+F + lê.
>
> **Como navegar:** cada Q&A é AUTÔNOMA — leia fora de ordem. Use ctrl+F por palavra-chave (ex: `AADSTS65001`, `App Roles`, `B2C`).

---

## 🏗️ Arquitetura & Design

### 0. **"Quando preciso criar uma App Registration?"** (resposta-padrão Diego/Turma 02)

**App Registration = identidade da sua aplicação no Entra ID.** Sem ela, sua app "não existe" pro Microsoft — não pede, não recebe, não valida tokens.

**Você PRECISA quando:**
1. App precisa **identificar usuários** do Entra ID (login Microsoft / SSO corporativo)
2. App precisa **chamar APIs Microsoft** (Graph, SharePoint, Teams) em nome do user OU do próprio app
3. App precisa **gerenciar acesso** baseado em roles/groups do Entra ID
4. Você está construindo uma **API protegida** que outras apps consomem
5. Você quer **gestão centralizada** (em vez de banco de senhas próprio)

**Você NÃO precisa quando:**
- App 100% pública sem login (blog estático)
- App usa OUTRO IdP exclusivo (Auth0/Cognito sem Microsoft)
- Backend interno sem usuários nem API externa autenticada
- App rodando NO Azure que só fala com recursos Azure → use **Managed Identity** (mais simples)

**Exemplos concretos:**
| Cenário | App Reg? |
|---|---|
| SPA React + API .NET com login Microsoft | ✅ Sim (Recipe 1, Pattern A) |
| Cron job que lê Graph | ✅ Sim (Recipe 5, Daemon flow) |
| CI/CD que deploya no Azure | ✅ Sim (Recipe 6, FIC) — SIM, CI/CD também |
| App Service que só lê Key Vault | ❌ Não — use Managed Identity |
| SSO corporativo Microsoft | ✅ Sim + claim mapping |

📚 `docs/playbook/guia-instrutor-detalhado.md` Bloco 2 (análise bit-a-bit completa) · `docs/aula/app-reg-recipes.md` Recipe 1.

---

### 1. **"Por que vc usou 1 App Registration em vez de 2 (uma SPA + uma API)?"**

> **Decisão deliberada (Pattern A) pra simplicidade pedagógica e MVP.** SPA e API compartilham o mesmo Client ID. SPA pede `api://{client-id}/access_as_user` e API valida `aud=api://{client-id}`.

**Quando MIGRAR pra Pattern B (2 App Regs):**
- API consumida por OUTROS apps (não só nossa SPA)
- Compliance exige segregação de credenciais
- Releases independentes de SPA/API
- Audit fine-grained

**Resposta curta:** "Depende. Quantos clients consomem a API? Equipes diferentes? Compliance exige? Pra MVP, 1 App Reg é OK."

📚 Detalhe: ver [hands-on.md Cap 7 — Multi-tenant e múltiplos App Regs](./hands-on.md#cap-7--multi-tenant-e-múltiplos-app-regs-10-min).

---

### 2. **"Single-tenant vs Multi-tenant — qual escolher?"**

| Caso | Escolha | Por quê |
|------|---------|---------|
| App interno só TFTEC | Single | Menor superfície, simples |
| SaaS B2B (clientes empresas) | **Multi-tenant** | Aceita logins de qualquer org Entra ID |
| App público com Gmail/Outlook personal | Multi + personal | Adiciona consumer accounts |
| App de cliente final (Xbox/Skype) | B2C (produto separado!) | Stack diferente |

⚠️ **Trocar single→multi DEPOIS pode quebrar tokens cached.** Decida no day 1.

---

### 3. **"E B2C? Mesma coisa?"**

**NÃO.** B2C = **Microsoft Entra External ID for Customers** (produto separado).

- **Entra ID** (Workforce): users de organizações Microsoft 365
- **Entra External ID for Customers** (B2C): users com email pessoal (Gmail, Yahoo), redes sociais (Facebook, Google), ou contas locais

Stack diferente, portal diferente, API diferente.

---

### 4. **"Posso usar o MESMO App Reg pra dev e prod?"**

❌ **Tecnicamente sim, MÁ PRÁTICA.** Sempre 1 App Reg por ambiente:
- Redirect URIs DEV (localhost) ≠ PROD (HTTPS)
- Secrets vazados em dev → não comprometem prod
- Admin consent separado por ambiente
- Teste de breaking change isolado

✅ **Boa prática:** `myapp-dev`, `myapp-staging`, `myapp-prod`.

---

### 4b. **"Qual a diferença entre App Registration, Service Principal e Enterprise Application?"** (confusão recorrente)

**São 3 objetos distintos no Microsoft Graph data model — mas só 2 telas no Portal:**

| Conceito | Endpoint Graph | Onde vive | Quem cria |
|---|---|---|---|
| **App Registration / App Object** | `/applications/{id}` | **APENAS no tenant home** (onde foi criado) | Você (developer) |
| **Service Principal (SP)** | `/servicePrincipals/{id}` | **EM CADA tenant** que usa o app | Auto no 1º consent OU `az ad sp create` |
| **Enterprise Application** | (VIEW no Portal sobre `/servicePrincipals/{id}`) | Mesma coisa que SP | Idem |

**Mind-blow:** "Enterprise applications" no Portal é literalmente uma TELA DIFERENTE sobre o mesmo objeto que "App registrations" mostra do outro lado. Microsoft separou pra clarear PERSPECTIVAS:
- **App registrations** = visão do DEV (código, secrets, scopes, app roles)
- **Enterprise applications** = visão do ADMIN (consent, users/groups, conditional access)

**Multi-tenant:** quando cliente B faz login no seu SaaS, Entra ID provisiona auto um SP NOVO no tenant B referenciando seu `appId`. Você NÃO consegue editar — é local ao tenant B.

📚 `docs/playbook/guia-instrutor-detalhado.md` Bloco 2 (análise bit-a-bit) · `/lab/multi-app` Tab 2.

---

### 4c. **"Por que escolher 'Single-page application' e não 'Web' platform na App Reg?"**

**SPA platform = PKCE obrigatório, sem secret, com CORS configurado pra public client.**

**Web platform = secret obrigatório (confidential client), sem CORS pra OAuth redemption.**

| Aspecto | SPA platform | Web platform |
|---|---|---|
| Public/Confidential | Public client (sem secret) | Confidential client (secret/cert) |
| Token redemption | Browser direto via fetch + PKCE | Backend trocando code por token |
| CORS allowlist | ✅ Configurado pra `/token` endpoint | ❌ Negado (cross-origin redemption) |
| Auth Code Flow | + PKCE (obrigatório) | + client_secret (obrigatório) |

**Se você registrar SPA como Web:**
- Browser tenta `POST /token` com PKCE → Entra ID rejeita CORS
- Erro: **`AADSTS9002326: Cross-origin token redemption is permitted only for the 'Single-Page Application' client-type`**
- Fix: troca a plataforma pra SPA no Portal → Authentication

**Quando usar Web:** ASP.NET MVC tradicional, server-rendered apps, qualquer app onde backend pode guardar secret (Recipe 3).

**Quando usar SPA:** React/Vue/Angular puro no browser, **Swagger UI** (Recipe 10 — sim, Swagger é SPA!).

📚 `docs/aula/app-reg-recipes.md` Recipe 1 (SPA) vs Recipe 3 (Web) · `docs/playbook/guia-instrutor-detalhado.md` Recipe 10.

---

## 🔐 OAuth & Tokens

### 5. **"Diferença OAuth 2.0 vs OpenID Connect (OIDC)?"**

| Aspecto | OAuth 2.0 | OpenID Connect |
|---------|-----------|----------------|
| Propósito | **Autorização** ("o que pode fazer") | **Autenticação** ("quem é") |
| Token retornado | Access Token | ID Token + Access Token |
| Built on top of | Standalone | OAuth 2.0 + OIDC layer |
| Use case | API access | Login user |

**Resposta curta:** "OIDC é OAuth 2.0 + camada de autenticação. Quando vc loga com Microsoft/Google = OIDC. Quando sua API valida access token = OAuth 2.0."

---

### 6. **"Por que NÃO usar Implicit Flow?"**

❌ **Implicit Flow é DEPRECATED desde OAuth 2.1.**

Razões:
- Token vinha pela URL (#access_token=...) → ficava em browser history, logs, referer header
- Sem refresh token → user reauth a cada 1h
- Vulnerável a token leakage

✅ **Auth Code + PKCE é o substituto** — mesma usabilidade, MUITO mais seguro.

---

### 7. **"Por que `sessionStorage` e não `localStorage` pra tokens MSAL?"**

🔒 **Segurança vs Persistência:**

| | sessionStorage | localStorage |
|---|----------------|--------------|
| Persiste | Só na tab | Cross-tabs, persiste após close |
| XSS attack | Acessível por JS na mesma origem | ⚠️ Mesmo, mas TODOS os tabs vazam |
| MSAL default | ✅ Recomendado | Permite mas avisa |

**Resposta curta:** "sessionStorage limita escopo do leak. localStorage permite XSS comprometer SESSÕES de outros tabs. MSAL default = sessionStorage."

📚 BCP: nunca tokens em cookies sem `HttpOnly + Secure + SameSite=Strict`.

---

### 8. **"Quanto tempo dura o token? Como aumentar?"**

**Padrão:**
- Access Token: **1 hora** (60 min)
- Refresh Token: **24 horas** sliding (até 90 dias absolute)
- ID Token: 1 hora

**Como mudar:**
- Tenant-level via **Token Lifetime Policies** (PowerShell ou Graph)
- App-level: limitado, geralmente Microsoft força padrões

⚠️ **Não diminuir TLP sem motivo** — refresh contínuo aumenta latência. Não aumentar muito — janela de exposição se token vazar.

---

### 9. **"O que faz cada claim do JWT?"**

| Claim | Significa | Validar? |
|-------|-----------|----------|
| `iss` | Issuer (URL Entra ID + tenant) | ✅ Sempre |
| `aud` | Audience (pra QUEM o token foi emitido) | ✅ Sempre |
| `exp` | Expiry (Unix timestamp) | ✅ Sempre |
| `nbf` | Not Before (válido a partir de) | ✅ Sempre |
| `sub` | Subject (ID único user, sem PII) | Identificação |
| `oid` | Object ID (ID user no diretório) | Identificação multi-tenant |
| `tid` | Tenant ID | ✅ Multi-tenant |
| `scp` | Scopes (delegated permissions) | Authorization |
| `roles` | Application permissions (CC flow) | Authorization |
| `azp` | Authorized Party (qual cliente pediu) | Audit |

⚠️ **Pular validação de qualquer essencial = vulnerabilidade.**

---

### 9b. **"O access_token contém credenciais? Pode ser usado pra logar como o user?"** (Juan, Turma 02)

**NÃO. Access token NÃO carrega credenciais.** É uma **prova de autorização emitida pelo Entra ID** com escopo, validade e audiência específicos.

**O que o token TEM:**
- Identificadores (`oid`, `sub`, `tid`) — IDs do user/tenant, sem senha
- Scopes/Roles (`scp`, `roles`) — o que o portador pode fazer
- Assinatura RS256 — prova que Entra ID emitiu, ninguém forjou

**O que o token NÃO TEM:**
- Senha do user
- Refresh token (esse é separado, fica com o cliente)
- Permissão pra emitir NOVOS tokens — token é "consume-only"

**Diferença Delegated vs Client Credentials (chave da confusão):**

| Tipo | Quem age | User envolvido? | Token tem | Identidade no `Authorize` |
|---|---|---|---|---|
| **Delegated (Auth Code + PKCE)** | App + User | ✅ Sim (loga) | `scp`, `oid` do user | "App agindo EM NOME do user" |
| **Client Credentials (Daemon)** | App sozinha | ❌ Não | `roles`, sem `oid` user | "App agindo COMO ELA MESMA" |

**Por que isso importa pra segurança:**
- Token roubado = ataque sobre AQUELE SCOPE em AQUELA AUDIENCE até `exp` (1h padrão)
- Não dá pra "logar como user" em outro app — `aud` impede
- Não dá pra estender — sem refresh token, expira e fim

📚 `docs/playbook/guia-instrutor-detalhado.md` Bloco 5a · `/lab/permissions-claims` Tab 1.

---

### 9c. **"Por que meu access_token NÃO tem o claim `roles`?"**

**Top 3 causas (em ordem de frequência):**

1. **App Role definido mas NÃO ATRIBUÍDO via Enterprise applications → Users and groups.** Declarar `appRoles[]` no manifest é só DECLARAÇÃO. Sem assignment, sem claim no token.
2. **Cache MSAL servindo token antigo** (assignment foi DEPOIS do último login). Fix: `sessionStorage.clear()` + logout/login.
3. **Pediu Application permission mas usou Auth Code Flow** (Delegated). `roles` Application só vem com `grant_type=client_credentials`.

**Como debugar:**
```javascript
// DevTools Console no /lab/tokens
JSON.parse(atob(token.split('.')[1]))
// procura "roles". Se ausente, vai pro Portal:
// App Reg → App roles (definido?) →
// Enterprise apps → mesmo app → Users and groups (assigned?)
```

⚠️ **`roles` é o MESMO claim pra App Roles (Delegated assignment) E Application permissions (Daemon).** ASP.NET Core `RequireRole("Admin")` trata ambos sem distinção.

📚 `docs/playbook/guia-instrutor-detalhado.md` Bloco 5a + Recipe 9 · `/lab/permissions-claims` Tab 2/Tab 4.

---

### 9d. **"Quando usar App Roles vs Groups vs Directory Roles?"**

**3 mecanismos DIFERENTES de autorização — confusão recorrente.**

| Mecanismo | Onde define | Escopo | Claim no token | Quem atribui |
|---|---|---|---|---|
| **App Roles** | Manifest da App Reg (`appRoles[]`) | **Específico da app** | `roles: ["Admin", "Approver"]` | Admin via Enterprise apps → Users and groups |
| **Groups (security/M365)** | Entra ID → Groups (tenant-wide) | **Tenant inteiro** | `groups: ["guid-1", "guid-2"]` (precisa habilitar Token configuration) | Admin via Groups → Members |
| **Directory Roles** | Built-in Entra ID (Global Admin, User Admin, etc.) | **Administração do TENANT** | `wids: ["guid-role-template"]` (well-known IDs) | Privileged Admin |

**Quando usar cada:**
- **App Roles** → autorização DENTRO da sua app ("Admin do meu sistema"). RBAC fine-grained específico. **DEFAULT recomendado.**
- **Groups** → reuso entre VÁRIAS apps ("Departamento Financeiro" usa AppA, AppB, AppC). Cuidado: `groups` claim explode em users de 100+ groups → use `hasgroups` overage indicator.
- **Directory Roles** → autorizar admins do PRÓPRIO Entra ID (criar users, gerenciar apps). NÃO use pra app authz comum.

**Mind-blow:** `roles` claim é compartilhado entre **App Roles atribuídos** E **Application permissions** (CC flow). Mesma string no ClaimsPrincipal.

📚 `docs/playbook/guia-instrutor-detalhado.md` Recipe 9 · `/lab/permissions-claims` Tab 2.

---

## 🛠️ Operação & DevOps

### 10. **"Como rotacionar Client Secret sem downtime?"**

**Procedimento canônico (overlap):**
1. Portal → Certificates & secrets → **+ New client secret** (segundo secret válido em paralelo)
2. Atualiza app deploy com NOVO secret
3. Aguarda confirmação que NEW secret está em uso (logs)
4. Portal → **Delete** old secret
5. Idealmente: schedule deletion 7 dias antes do expiry

**Pra produção:** automatizar via Azure Key Vault + Managed Identity (zero rotação manual).

---

### 11. **"Como fazer CI/CD sem committar Client Secret?"**

⭐ **Workload Identity Federation (OIDC)** — exatamente o que `tftec-auth` usa hoje:

```yaml
# .github/workflows/deploy-azure.yml
permissions:
  id-token: write   # OIDC token
  contents: read

- uses: azure/login@v2
  with:
    client-id: ${{ secrets.AZURE_CLIENT_ID }}
    tenant-id: ${{ secrets.AZURE_TENANT_ID }}
    subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
    # NO client-secret! ✨
```

**Federated Credential** liga GitHub Actions ao SP via `subject = repo:OWNER/REPO:ref:refs/heads/main`. Zero secret pra girar.

📚 Detalhe: `docs/aula/roadmap-avancado.md` §3.

---

### 12. **"Como debugar AADSTS errors?"**

**Metodologia 5 perguntas:**
1. **Qual o erro EXATO?** Copia o código `AADSTS_____`
2. **Em qual etapa do flow?** /authorize, /token, ou chamada API?
3. **Token tá válido?** Cole em jwt.ms — verifica `aud`, `iss`, `exp`
4. **Config do App Reg bate com código?** clientId, redirect URI, audience
5. **Existe admin consent?** 90% dos casos misteriosos

**Top 10 erros (memoriza):**

| Erro | Causa | Onde olhar |
|------|-------|------------|
| AADSTS50011 | Redirect URI mismatch (byte-a-byte) | Authentication |
| AADSTS50194 / AADSTS50058 | User de OUTRO tenant logando em app **single-tenant** | App Reg → Authentication → "Supported account types" |
| AADSTS65001 | User/Admin consent missing pra essa permission | API permissions → Grant admin consent |
| AADSTS7000215 | Client secret errado/expirado | Certificates & secrets |
| AADSTS7000229 | App multi-tenant SEM SP provisionado no tenant do client | URL admin consent OU `az ad sp create` (ver Q22) |
| AADSTS90002 | Tenant não encontrado | URL `/oauth2/v2.0/token` |
| AADSTS90014 / AADSTS90094 | Admin consent required pra Application permission | Enterprise apps → admin consent |
| AADSTS9002326 | Swagger/SPA registrado como **Web** em vez de **SPA** → cross-origin redemption bloqueada | App Reg → Authentication → Platform (ver Q4c) |
| AADSTS70021 | FIC subject não bate com o que GitHub Actions emite | Federated credentials → Subject identifier (ver Q24) |
| AADSTS50158 | MFA exigido | Conditional Access |

📚 Detalhe: `docs/aula/cheat-sheet.md` · `docs/playbook/guia-instrutor-detalhado.md` Bloco 7 (debug AADSTS LIVE).

---

### 12b. **"Como debugo `AADSTS65001` passo a passo?"**

**Erro literal:** "The user or administrator has not consented to use the application."

**Cadeia mental — Permission na App Reg = DECLARAÇÃO. Consent = ATIVAÇÃO no SP.**

```
App Reg pede User.Read.All (declaração)
        ↓
User loga
        ↓
SP precisa de oauth2PermissionGrants (Delegated)
   OU appRoleAssignments (Application)
        ↓
SEM grant ativo no SP local do tenant
        ↓
→ AADSTS65001
```

**Checklist em 5 passos:**

1. **Confirma permission no Portal:** App Reg → API permissions → permission listada?
2. **Confirma tipo (Delegated vs Application):** ícone na coluna "Type"
3. **Status do grant:** coluna "Status" deve estar **verde "Granted for {tenant}"**. Se cinza/amarelo → falta consent.
4. **Click "Grant admin consent for {tenant}"** (Global Admin only) OU envie URL pro admin do cliente:
   ```
   https://login.microsoftonline.com/{TENANT}/adminconsent?client_id={APP_ID}
   ```
5. **Limpa cache MSAL:** `sessionStorage.clear()` + logout/login. Senão pega token cached sem o claim.

**Caso especial multi-tenant:** Pra cada tenant CLIENTE, o admin DESSE tenant precisa consentir. Você (dono da App Reg) NÃO consente "pra todo mundo".

📚 `docs/playbook/guia-instrutor-detalhado.md` Bloco 5a (consent framework análise bit-a-bit) · `/lab/permissions-claims` Tab 5 (Mermaid decision tree).

---

### 13. **"Como ver os Sign-in Logs?"**

Portal Azure → Microsoft Entra ID → **Sign-in logs**:
- Filtros: user, app, status, IP, location, conditional access result
- Mostra cada login attempt com `correlationId` (vc passa pra Microsoft Support)
- Útil pra debug user-specific (ex: "user X não consegue logar")

Programmatic via Graph API: `GET /auditLogs/signIns` (precisa permission `AuditLog.Read.All`).

---

## 🔒 Segurança & Authorization

### 14. **"Diferença `scp` vs `roles` (Delegated vs Application permissions)?"**

| Tipo | Quem age | Token claim | Quando |
|------|----------|-------------|--------|
| **Delegated** | App + User | `scp` | User logado faz requests |
| **Application** | App sozinha | `roles` | Daemon/cron sem user |

**Auth no .NET:**
```csharp
[Authorize(Policy = "RequireApiRead")]   // checa scp == "api.read"
[Authorize(Policy = "RequireAdminRole")] // checa roles == "Admin"
```

📚 No `tftec-auth/api/Program.cs` linhas 81-98 vc vê os 2 padrões.

---

### 15. **"Como adicionar custom claims no token (ex: department do RH)?"**

**Claim Mapping Policy** + **Microsoft Graph Token Issuance Policies**:

```bash
# Cria policy
az rest --method post \
  --url "https://graph.microsoft.com/v1.0/policies/claimsMappingPolicies" \
  --body '{
    "definition": ["{\"ClaimsMappingPolicy\":{\"Version\":1,\"IncludeBasicClaimSet\":true,\"ClaimsSchema\":[{\"Source\":\"user\",\"ID\":\"department\",\"JwtClaimType\":\"department\"}]}}"],
    "displayName": "DepartmentClaim",
    "isOrganizationDefault": false
  }'
```

⚠️ **Limitações:**
- Algumas claims protegidas (security claims) — não pode override
- Custom claims ficam no token v2.0 apenas
- Tenant admin precisa habilitar `acceptMappedClaims` no manifest do App Reg

📚 Tópico avançado — `docs/aula/roadmap-avancado.md` §6.

---

### 16. **"E Conditional Access? Como bloqueio login fora do horário?"**

Portal → Microsoft Entra ID → **Conditional Access** → New Policy:

| Condition | Block / Require |
|-----------|-----------------|
| Sign-in risk = High | **Block** |
| Location ≠ Brasil | **Block** ou Require MFA |
| Device ≠ Compliant | **Block** |
| Day/Hour fora 9-18 | **Block** ou Require strong auth |

⚠️ **Sempre teste em "Report-only"** antes de "Enabled" — uma policy mal configurada bloqueia TODO mundo.

⭐ **Break-glass account** (admin sem CA policy) é OBRIGATÓRIO pra recuperação.

📚 Próxima aula sugerida.

---

### 17. **"Posso usar Managed Identity em vez de Client Secret no Azure?"**

✅ **SIM e RECOMENDADO.** Melhor opção pra apps rodando NO Azure (App Service, Function, VM, AKS).

**System-assigned Managed Identity:**
- Identity vinculada ao recurso (App Service)
- Auto-rotação de credentials
- Zero secret no código

```csharp
// .NET: usa DefaultAzureCredential
var credential = new DefaultAzureCredential();
var client = new GraphServiceClient(credential, scopes);
```

⚠️ **Não funciona localmente** — só no Azure. Pra dev local, fallback pra `AzureCliCredential` (auth como user).

📚 `docs/aula/roadmap-avancado.md` §4.

---

## 🤖 SDK & Implementação

### 18. **"Por que MSAL.js e não fetch direto?"**

**MSAL.js abstrai 100+ detalhes do OAuth flow:**
- Geração de `code_verifier` + `code_challenge` (PKCE)
- Cache de tokens (sessionStorage/localStorage)
- Refresh token rotation
- Multi-tenant authority resolution
- Error handling padronizado (InteractionRequired, Network, Service)
- Logout + cleanup
- Account management (multiple)

**Fazer manual:** ~500 linhas de código. **MSAL:** 5 linhas.

```typescript
// Manual OAuth code flow:
// 1. Generate verifier + challenge
// 2. Redirect to /authorize
// 3. Capture code from redirect
// 4. POST /token
// 5. Cache result
// 6. Track expiry
// 7. Refresh logic
// 8. ... (50 more)

// MSAL:
const result = await instance.acquireTokenSilent({ scopes: [...], account });
```

🎯 **Use MSAL.** Sempre.

---

### 19. **"E se eu quiser fazer login sem MSAL (vanilla)?"**

Possível, mas:
- ❌ Vc vai recriar tudo que MSAL já faz
- ❌ Errors comuns (PKCE incorreto, refresh leak) ressurgem
- ✅ Útil só pra **entender** o flow ou casos super-customizados

**Library alternativas (se não quiser MSAL):**
- `oidc-client-ts` (genérico OIDC, não Microsoft-specific)
- `@azure/identity` (server-side .NET/Node)
- Direct REST se SAML/legacy

📚 No tftec-auth uso MSAL.js (browser) + Microsoft.Identity.Web (.NET).

---

## 🎓 Pra Mostrar Ao Vivo

### 20. **"Mostra um exemplo prático de OBO?"**

Vai pra `/lab/demo` → cenário **OBO** → click ▶ Reproduzir → click **Executar de verdade** → mostra timeline:
1. MSAL pega token1 (aud=AuthService)
2. SPA → POST /auth/obo
3. AuthService troca via OBO no Entra ID
4. AuthService → token2 (aud=Graph)
5. **Mesma identidade preservada (oid igual)**

📚 Já está implementado no `/lab/demo`.

---

### 21. **"Como vc decoda esse token sem invadir o servidor?"**

JWT é só **Base64URL-encoded** (não criptografado). Anyone pode decodar:
1. Cole em https://jwt.ms (Microsoft) — decoder visual
2. Ou em `/lab/tokens` → tab Decoder (mesmo, dentro do app)
3. Ou em DevTools console: `JSON.parse(atob(token.split('.')[1]))`

⚠️ **Decodar ≠ Validar.** Pra validar precisa da public key (JWKS) e bibliotecas (jose, Microsoft.IdentityModel).

🚨 **Lição:** **NUNCA coloque PII sensível em claims** — qualquer um que pegar o token decoda.

---

### 22. **"Recebi `AADSTS7000229: missing service principal in the tenant`. O que é?"**

**Contexto:** Vc tentou Client Credentials Flow num app multi-tenant, mas user/SP é de OUTRO tenant.

**Causa técnica:**
- App Object vive no tenant home (criação)
- Service Principal precisa EXISTIR no tenant do consumer
- **Auth Code Flow:** SP cria automaticamente no consent
- **Client Credentials:** SEM consent flow → SP precisa ser provisionado MANUALMENTE

**Fix:**
1. **Mesmo tenant:** logue com user do tenant home (ex: `@tftec.com.br` se App é da TFTEC)
2. **Outro tenant:** admin do outro tenant clica em URL de admin consent:
   ```
   https://login.microsoftonline.com/{TENANT-DO-CLIENTE}/adminconsent?client_id={SEU-CLIENT-ID}
   ```
   Isso "instala" o SP no tenant do cliente. Depois Client Credentials funciona.

**Lição pedagógica:** isso É multi-tenant na prática. Auth Code "espalha" SP via consent. Client Credentials precisa provisioning explícito.

📚 `docs/playbook/guia-instrutor-detalhado.md` Plano B "Cenário: AADSTS7000229" · `/lab/multi-app` Tab 2.

---

## 🆕 Tópicos cross-cutting (Stories 1.18-1.21 + Recipes 8-10)

### 23. **"Como migrar de Azure AD B2C pra Entra External ID for Customers?"** (Turma 02 ficou no escuro)

**Estado atual (mai/2026):** Microsoft anunciou retirement gradual do Azure AD B2C — **não cria mais tenants B2C novos**. Existing tenants continuam funcionando (data firme ainda não anunciada).

| Produto | Status | Tenant model |
|---|---|---|
| **Azure AD B2C** (legacy) | 🟡 No new tenants | **TENANT SEPARADO** com `.onmicrosoft.com` próprio |
| **Microsoft Entra External ID for Customers** | ✅ Atual recomendado | **MESMO tenant** workforce + `tenantType=CIAM` flag |

**Diferença arquitetural FUNDAMENTAL:**
- B2C criava 2 tenants distintos (workforce + B2C) → confusão clássica (cliente provisionava VM no tenant errado)
- External ID coexiste no MESMO tenant — sem duplicação

**Path de migração:**
1. Avalie quais user flows / IEF custom policies você usa
2. Crie External ID tenant (`tenantType=CIAM`)
3. Migre users via Graph API (não há "import direto" — re-cadastro ou social-login linking)
4. Atualize URLs MSAL: `b2clogin.com` → `ciamlogin.com`
5. Reescreva policies em **Microsoft Graph** (External ID não tem IEF custom policies XML — pesadelo do B2C resolvido)

**Decisão rápida:**
- JÁ tenho B2C em prod → mantém + planeja quando MS anunciar deadline firme
- Começando hoje → **External ID for Customers, ponto.** Não crie B2C novo (path fechado).
- B2B parceiros corporativos → NÃO é nem B2C nem External ID — usa **multi-tenant standard** (Recipe 7)

📚 `docs/playbook/guia-instrutor-detalhado.md` Bloco 9 BÔNUS "B2C vs External ID" · Recipe 7 (B2B alternativo).

---

### 24. **"FIC funciona pra workflow de PR ou só pra push em branch?"** (subject patterns)

**Funciona pra ambos — mas o `subject` é DIFERENTE pra cada cenário.** GitHub Actions emite `sub` claim distinto por contexto, e o FIC no Entra ID compara byte-a-byte.

**Subject patterns mais comuns:**

| Cenário GitHub Actions | Subject identifier no FIC |
|---|---|
| Push em branch específica (ex: main) | `repo:OWNER/REPO:ref:refs/heads/main` |
| Push em tag | `repo:OWNER/REPO:ref:refs/tags/v1.0.0` |
| Pull request | `repo:OWNER/REPO:pull_request` |
| Environment (ex: production) | `repo:OWNER/REPO:environment:production` |
| Job em reusable workflow | `repo:OWNER/REPO:job_workflow_ref:OWNER/REPO/.github/workflows/foo.yml@refs/heads/main` |

⚠️ **Erro `AADSTS70021: No matching federated identity record found`** = subject mismatch. Causas:
- FIC cadastrado pra `main` mas workflow rodou em PR (`pull_request`)
- FIC pra branch errada (`master` vs `main`)
- Workflow disparou via tag mas FIC só pra branch

**Fix:** crie **1 FIC por cenário** (pode ter até 20 por App Reg). Não tente regex — não é suportado, é match literal.

**Recipe 6 pattern:** registra 2 FICs — um pra `refs/heads/main` (deploy), um pra `pull_request` (smoke test em PR).

📚 `docs/aula/app-reg-recipes.md` Recipe 6 · `docs/playbook/guia-instrutor-detalhado.md` Bloco 5b (FIC trust mechanism bit-a-bit).

---

### 25. **"Vite faz build-time injection — como troco `clientId` em runtime sem rebuild?"**

**Problema real:** `import.meta.env.VITE_CLIENT_ID` é **substituído em build-time** pelo Vite. Pra trocar tenant/clientId entre DEV/STAGING/PROD você teria que **rebuildar a SPA pra cada ambiente** → péssimo pra CI/CD único + multi-deploy.

**Solução: runtime config via `/config.json` servido pelo host.**

```typescript
// src/config/runtime.ts
let cachedConfig: RuntimeConfig | null = null;

export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  if (cachedConfig) return cachedConfig;
  const res = await fetch('/config.json', { cache: 'no-store' });
  cachedConfig = await res.json();
  return cachedConfig;
}

// main.tsx
const config = await loadRuntimeConfig();
const msalInstance = new PublicClientApplication({
  auth: {
    clientId: config.clientId,
    authority: `https://login.microsoftonline.com/${config.tenantId}`,
    redirectUri: window.location.origin,
  },
});
```

**Trade-offs:**

| Build-time (Vite default) | Runtime (`/config.json`) |
|---|---|
| ✅ Sem latência extra (config inline) | ❌ +1 round-trip antes do MSAL init |
| ❌ Rebuild por ambiente | ✅ 1 build, N deploys |
| ✅ Sem risco de "config faltando" em runtime | ❌ Precisa garantir `/config.json` no static host |
| Use pra: prototype, single-env | Use pra: SaaS multi-env, container imutável |

**Deploy pattern:** `config.json` é gerado pelo IaC/script de deploy no momento do release (não commitado no repo).

📚 Story 1.21 (roadmap) cobre implementação completa com tests.

---

### 26. **"OBO encadeado 3+ saltos é viável? Quais os custos?"**

**Tecnicamente sim, com cuidados.** SPA → API1 (OBO) → API2 (OBO) → API3 é suportado pelo Entra ID, mas cada salto adiciona:

| Custo | Impacto |
|---|---|
| **Latência** | +50-300ms por salto (round-trip pro Entra ID) |
| **Token lifetime** | Cada novo token expira em ~1h — refresh em chain falhar invalida toda a cadeia |
| **Audit complexity** | Sign-in logs mostram N entries por request — correlation via `correlationId` é OBRIGATÓRIO |
| **Throttling risk** | Entra ID tem rate limits por SP — 50K req/5min é o teto comum |
| **Failure surface** | Cada salto pode 401 — error handling cresce N vezes |

**Quando vale:**
- Microservices que REALMENTE precisam preservar identidade end-to-end (compliance, audit, RBAC fine-grained na API3)
- Não tem alternativa viável (ex: API3 é third-party que exige token em nome do user)

**Quando NÃO vale (refatore):**
- Audit não exige identidade preservada → API1 usa Client Credentials pra falar com API2 (sem OBO)
- API3 só precisa "alguma identity" → emite token-de-serviço próprio
- Chain > 3 saltos → quase sempre indica acoplamento ruim, considere mensageria (queue) entre serviços

**Cache obrigatório:** distribuído (Redis), keyed por `(user_oid, target_audience)`. Sem cache, latência explode.

📚 `/lab/demo` cenário OBO mostra 1 salto. Para chain real, ver roadmap-avancado.md §2.

---

### 27. **"Token cache distribuído — quando preciso?"**

**Resposta curta:** quando seu backend roda em MAIS de 1 instância E faz Client Credentials/OBO.

**Por quê:** o token cache (`Microsoft.Identity.Web` ou MSAL.NET) guarda tokens emitidos pra evitar bater no Entra ID a cada request. Se cache for **in-memory** e você roda 3 instâncias:
- Instance A pega token X (cache local)
- Instance B recebe próxima request → cache MISS → pede token NOVO (desperdício)
- Resultado: 3x mais requests ao Entra ID, throttling risk, latência variável

**Opções de cache distribuído:**

| Backend | Pacote | Recomendado pra |
|---|---|---|
| **Redis** | `Microsoft.Extensions.Caching.StackExchangeRedis` | Multi-instance production padrão |
| **SQL Server** | `Microsoft.Extensions.Caching.SqlServer` | Já tem SQL no stack, sem Redis |
| **Azure Cache for Redis** | Mesmo Redis | App Service / AKS no Azure |
| **In-memory** (default) | Builtin | Single instance / dev |

**Configuração `.NET` (1 linha de troca):**
```csharp
// In-memory (single instance)
builder.Services.AddTokenAcquisition().AddInMemoryTokenCaches();

// Distributed (Redis)
builder.Services.AddStackExchangeRedisCache(opts => opts.Configuration = "...");
builder.Services.AddTokenAcquisition().AddDistributedTokenCaches();
```

⚠️ **Sem cache distribuído em multi-instance, OBO chains ficam imprevisíveis** (latência aleatória conforme cache HIT/MISS por instance).

📚 `tftec-auth/api/Program.cs` usa in-memory hoje (single instance) — migração pra Redis é roadmap.

---

### 28. **"Como adicionar OAuth2 no Swagger UI?"** (Recipe 10)

**Swagger UI é literalmente uma SPA dentro do `/swagger`** — Auth Code + PKCE + CORS aplicam. Por isso registre como **SPA platform** (não Web → senão pega AADSTS9002326).

**Setup mínimo em 3 passos:**

1. **App Reg → Authentication:** adicione `https://{api-host}/swagger/oauth2-redirect.html` como **SPA Redirect URI**:
   ```bash
   az ad app update --id $APP_ID \
     --set spa.redirectUris="['https://api.example.com/swagger/oauth2-redirect.html']"
   ```

2. **`Program.cs`** configura SwaggerGen com security definition:
   ```csharp
   builder.Services.AddSwaggerGen(c => {
       c.AddSecurityDefinition("oauth2", new OpenApiSecurityScheme {
           Type = SecuritySchemeType.OAuth2,
           Flows = new OpenApiOAuthFlows {
               AuthorizationCode = new OpenApiOAuthFlow {
                   AuthorizationUrl = new Uri($"https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/authorize"),
                   TokenUrl = new Uri($"https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token"),
                   Scopes = new Dictionary<string,string> {
                       { $"api://{clientId}/access_as_user", "Access API" }
                   }
               }
           }
       });
   });
   ```

3. **`UseSwaggerUI`** habilita PKCE:
   ```csharp
   app.UseSwaggerUI(c => {
       c.OAuthClientId(clientId);
       c.OAuthUsePkce();         // PKCE obrigatório pra SPA platform
       c.OAuthScopes($"api://{clientId}/access_as_user");
   });
   ```

**Fluxo runtime:** Click "Authorize" → popup MSAL-like → login Microsoft → token salvo em memory (NÃO localStorage). Próximas chamadas "Try it out" injetam `Authorization: Bearer {token}` automático.

**Pitfall #1:** registrar como Web platform → `AADSTS9002326` (cross-origin redemption bloqueada). **Fix:** mude pra SPA platform.

**Pitfall #2:** esquecer de habilitar PKCE → `AADSTS9002327` ou similar. PKCE é obrigatório em SPA platform.

📚 `docs/aula/app-reg-recipes.md` Recipe 10 · `docs/playbook/guia-instrutor-detalhado.md` Recipe 10 bit-a-bit.

---

### 29. **"Conditional Access vs API Permissions — qual é qual?"**

**São camadas COMPLETAMENTE diferentes do controle de acesso. Não substituem uma à outra.**

| Aspecto | API Permissions (App Reg) | Conditional Access (CA) |
|---|---|---|
| Pergunta que responde | "Esse APP pode fazer X?" | "Esse USER pode logar AGORA daqui?" |
| Onde configura | App Reg → API permissions | Microsoft Entra ID → Conditional Access |
| Escopo | Por App Registration | Por user/group/app/condition |
| Falha emite | `AADSTS65001` (consent missing) | `AADSTS50158` (MFA/CA required) ou block silencioso |
| Quem gerencia | Dev (declara) + Admin (consente) | Security/Identity admin |
| Camada do fluxo | **Authorization** (o que pode fazer) | **Authentication-time** (pode logar?) |

**Exemplo combinado:**
- API Permission: app pede `Mail.Read` → admin consente → token vem com `scp=Mail.Read` ✅
- CA Policy: "Users do grupo Finance só logam de IP corporativo" → user fora do IP → bloqueado ANTES do token sair
- **Ambos têm que passar.** CA pode bloquear mesmo com permission ativa.

**Pegadinhas:**
- CA não está no App Reg — admin pode bloquear seu app sem você saber
- "Application Access Policy" (Exchange Online) é ainda outra camada — específica de Exchange
- Break-glass account (sem CA policy) é OBRIGATÓRIO pra recuperação se CA fechar todo mundo

📚 `docs/playbook/guia-instrutor-detalhado.md` (próxima aula sugerida) · referência Q16 deste FAQ.

---

### 30. **"Token lifetime e refresh — por que SPA tem 24h fixo?"**

**Tokens MSAL SPA têm comportamento DIFERENTE de tokens server-side por design.**

| Token type | Lifetime padrão | Configurável? | Onde fica |
|---|---|---|---|
| **Access Token** | 1 hora (60min) | ✅ Token Lifetime Policy (1h-24h) | sessionStorage / localStorage |
| **Refresh Token (Web/Daemon)** | 24h sliding, 90d absolute | ✅ TLP | sessionStorage / cookie |
| **Refresh Token (SPA)** | **24h FIXO** — não dá pra estender | ❌ **Single Page Apps token lifetime é hardcoded** | sessionStorage |
| **ID Token** | 1h | ✅ TLP | sessionStorage |

**Por que SPA é 24h fixo:** OAuth 2.1 BCP recomenda refresh token rotation pra browsers (alto risco XSS). Microsoft implementa rotation curta (24h max) E gera novo refresh token a cada uso ("rotating refresh tokens"). Mesmo se token vazar, janela é limitada.

**Como user "fica logado por semanas" então?**
- MSAL faz **silent SSO** via `acquireTokenSilent` — usa cookie `ESTSAUTH` do `login.microsoftonline.com` (que dura mais)
- Se silent falhar (cookie expirou), MSAL faz `acquireTokenSilent` → fallback `acquireTokenRedirect/Popup` → user re-loga sem digitar senha (SSO)

**Implicação prática:**
- ❌ Não tente "aumentar refresh token de SPA pra 30 dias" — Microsoft não permite
- ✅ Confie em silent SSO + handle `InteractionRequiredAuthError` redirecionando pra login interativo
- ✅ Se UX exige "lembrar por 30 dias", isso é responsabilidade do **Entra ID sign-in frequency** (CA policy), não do refresh token da app

📚 MSAL.js docs · `/lab/tokens` mostra access token decoded.

---

## 📌 Como Usar Este FAQ

**Antes da aula:**
- Lê 1x rapidamente — vc fica com perguntas frescas
- Marca top 5 que mais espera

**Durante a aula:**
- Mantém aberto na 2ª tela (Bloco 8 — Q&A)
- ctrl+F na palavra-chave (`AADSTS65001`, `App Roles`, `B2C`, `Swagger`) → lê resposta com naturalidade

**Pós-aula:**
- Coleta perguntas NOVAS dos alunos
- Adiciona neste arquivo pra próxima turma
- PR welcome (engajamento pós-aula!)

---

## 🆘 Última linha de defesa

Pergunta que vc não sabe? **Resposta honesta:**

> "Boa pergunta. Não tenho certeza agora. Vou checar e respondo no Slack/canal da turma. Anota seu nome aí."

**Não improvisa.** Confiança técnica vale MAIS que parecer onisciente.

---

**Última atualização:** 2026-05-13
**Total de perguntas:** 30+ (numeradas 0-30, incluindo 4b, 4c, 9b-9d, 12b)
**Cobertura:** AADSTS 50011/50194/50058/65001/7000215/7000229/9002326/70021/90014/90094/50158, Pattern A/B, App Object vs SP vs Enterprise App, App Roles vs Groups vs Directory Roles, Delegated vs Client Credentials, Conditional Access vs API Permissions, B2C vs External ID, FIC subject patterns (branch/PR/env), Vite runtime config, OBO chains, token cache distribuído, Swagger OAuth setup, SPA token lifetime
**Próxima iteração:** após coletar perguntas reais dos alunos (Turma 03+)
