# 🙋 FAQ — Perguntas Que Vão Aparecer

> Preparação contra "bombardeio" de perguntas em Q&A. **15 perguntas mais prováveis com respostas técnicas precisas.**
>
> **Dica de uso:** mantém este doc aberto na 2ª tela durante a aula. Se aluno faz uma destas, ctrl+F + lê.

---

## 🏗️ Arquitetura & Design

### 1. **"Por que vc usou 1 App Registration em vez de 2 (uma SPA + uma API)?"**

> **Decisão deliberada (Pattern A) pra simplicidade pedagógica e MVP.** SPA e API compartilham o mesmo Client ID. SPA pede `api://{client-id}/access_as_user` e API valida `aud=api://{client-id}`.

**Quando MIGRAR pra Pattern B (2 App Regs):**
- API consumida por OUTROS apps (não só nossa SPA)
- Compliance exige segregação de credenciais
- Releases independentes de SPA/API
- Audit fine-grained

**Resposta curta:** "Depende. Quantos clients consomem a API? Equipes diferentes? Compliance exige? Pra MVP, 1 App Reg é OK."

📚 Detalhe: explicado nos slides Cena 8.

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

**Top 5 erros (memoriza):**

| Erro | Causa | Onde olhar |
|------|-------|------------|
| AADSTS50011 | Redirect URI mismatch | Authentication |
| AADSTS65001 | User consent missing | API permissions → Grant admin |
| AADSTS7000215 | Client secret errado/expirado | Certificates & secrets |
| AADSTS90002 | Tenant não encontrado | URL `/oauth2/v2.0/token` |
| AADSTS50158 | MFA exigido | Conditional Access |

📚 Detalhe: `docs/aula/cheat-sheet.md`.

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

## 📌 Como Usar Este FAQ

**Antes da aula:**
- Lê 1x rapidamente — vc fica com perguntas frescas
- Marca top 5 que mais espera

**Durante a aula:**
- Mantém aberto na 2ª tela
- Q&A: ctrl+F na pergunta → lê resposta com naturalidade

**Pós-aula:**
- Coleta perguntas NOVAS dos alunos
- Adiciona neste arquivo pra próxima turma
- PR welcome (engajamento pós-aula!)

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

---

## 🆘 Última linha de defesa

Pergunta que vc não sabe? **Resposta honesta:**

> "Boa pergunta. Não tenho certeza agora. Vou checar e respondo no Slack/canal da turma. Anota seu nome aí."

**Não improvisa.** Confiança técnica vale MAIS que parecer onisciente.

---

**Última atualização:** 2026-04-29
**Total de perguntas:** 21
**Próxima iteração:** após coletar perguntas reais dos alunos
