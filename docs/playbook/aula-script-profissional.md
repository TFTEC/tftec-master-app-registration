---
title: "Script profissional de aula — App Registration na prática"
audience: "Instrutor TFTEC Masters lendo ao vivo durante a aula de 2h"
duration: "120 minutos (2h, sem intervalo)"
format: "Apresentação técnica ao vivo, Cloud Shell + Portal Azure + apps deployed. Sem slides."
last_updated: 2026-05-13
---

# 🎓 Script profissional — App Registration na prática

> **Aula 100% Portal Azure + Cloud Shell.** Sem slides, sem app local. Você lê os parágrafos em 🎤 **Fala**, executa os passos em 📍 **Ação**, e usa as 💡 **Frases-chave** como pontos de impacto.

## 📑 Sumário

| # | Bloco | Min | Onde |
|---|---|---:|---|
| | [🔧 Configuração pré-aula](#-configuração-pré-aula) | -10 | Cloud Shell + 4 abas |
| 1 | [Abertura](#-bloco-1--abertura) | 5 | Portal Azure |
| 2 | [Fundamentos conceituais — mapa da aula](#-bloco-2--fundamentos-conceituais) | 30 | Portal → App registrations + Enterprise apps |
| 3 | [Decisões de arquitetura](#-bloco-3--decisões-de-arquitetura) | 10 | `/lab/topologias` |
| 4 | [Criar App Reg ao vivo (Portal)](#-bloco-4--criar-app-reg-ao-vivo) | 15 | Portal → + New registration |
| 4b | [Configurar App Service correspondente](#-bloco-4b--configurar-app-service-correspondente) | 3 | Portal → App Services |
| 5 | [URLs, URIs e tokens (Swagger OAuth)](#-bloco-5--urls-uris-e-tokens) | 20 | `/lab/tokens` + Swagger |
| 6 | [Permissions, App Roles e Consent](#-bloco-6--permissions-app-roles-e-consent) | 15 | Portal → App roles + Enterprise apps |
| 7 | [Credenciais + Daemon Client Credentials](#-bloco-7--credenciais-e-daemon) | 15 | Portal → Certificates & secrets + Cloud Shell |
| 7c | [Configurar Function/Container do daemon](#-bloco-7c--configurar-function-container-do-daemon) | 3 | Portal → Function App / Container Apps |
| 8 | [Multi-tenant + Pattern A vs B](#-bloco-8--multi-tenant-e-padrões) | 10 | `/lab/multi-app` |
| 8a | [Demo Recipe 7 ao vivo (tenant externo)](#-bloco-8a--demo-recipe-7-ao-vivo) | 5 | Cloud Shell em outro tenant |
| 9 | [Integração no código](#-bloco-9--integração-no-código) | 10 | VSCode / GitHub |
| 10 | [Diagnóstico AADSTS](#-bloco-10--diagnóstico-aadsts) | 5 | — |
| 11 | [Fechamento](#-bloco-11--fechamento) | 5 | `/lab` Hub |

**Apêndices:** [A. Q&A pré-redigida](#-apêndice-a--qa-pré-redigida) · [B. Plano B](#-apêndice-b--plano-b) · [C. Equivalentes CLI](#-apêndice-c--equivalentes-cli) · [D. Cleanup pós-aula](#-apêndice-d--cleanup-pós-aula)

### Convenções

| | |
|---|---|
| 📍 **Ação** | Passo a passo numerado — você executa no Portal/Cloud Shell |
| 🎤 **Fala** | Texto pronto pra ler em voz alta |
| 💡 **Frase-chave** | Linha de impacto pra plantar conceito |
| ⚠️ **Atenção** | Pegadinha real (validada em smoke test) |
| 🔬 **Análise** | Aprofundamento técnico (opcional) |
| ✅ **Resultado** | O que deve aparecer na tela |
| ➡️ **Transição** | Conector pro próximo bloco |

---

## 🔧 Configuração pré-aula

**10 minutos antes.** Faça antes da turma chegar — não tenta improvisar.

### 📍 Ação

1. **Cloud Shell** em `https://shell.azure.com` (PowerShell):

   ```powershell
   az account set --subscription "3075a5eb-ed20-4d6e-8884-8be75eedf82f"
   $TENANT_ID = az account show --query tenantId -o tsv
   $GRAPH_APP_ID = "00000003-0000-0000-c000-000000000000"
   $TFTEC_AUTH_APP_ID = "78345291-2586-4691-b1f9-e4e780f55328"
   $MY_OBJECT_ID = az ad signed-in-user show --query id -o tsv
   ```

2. **4 abas pré-organizadas:**
   - **Tela 1:** `https://portal.azure.com` → Entra ID → App registrations
   - **Tela 2:** Cloud Shell (PowerShell)
   - **Tela 3:** `https://authservice-front-tftec.azurewebsites.net/lab/recipes` (logado)
   - **Tela 4:** `https://jwt.ms`

### ✅ Checks rápidos

```powershell
# Endpoints deployed
curl https://authservice-api-tftec.azurewebsites.net/health           # esperado: Healthy
curl -o /dev/null -w "%{http_code}" https://authservice-front-tftec.azurewebsites.net/  # esperado: 200
```

Se algum falhar, vá pro [Apêndice B — Plano B](#-apêndice-b--plano-b).

---

## 🎤 Bloco 1 — Abertura

**5 min** · **Tela 1:** Portal Azure com lista de App registrations

### 📍 Ação
Compartilha a tela 1 (Portal). Nada de IDE/Cloud Shell ainda.

### 🎤 Fala

> "Boa noite. Hoje cobrimos App Registration no Microsoft Entra ID de ponta a ponta. Em duas horas, vocês saem entendendo o que é uma App Registration, como ela se diferencia de Service Principal e Enterprise Application, quais decisões arquiteturais tomar quando cria uma, como diagnosticar os erros mais comuns de autenticação Microsoft, e como integrar isso no código real, seja front-end ou back-end."

> "Vou trabalhar 100% no Azure. Não vamos rodar nada localmente. Tudo via Cloud Shell, Portal, e as aplicações já deployadas — `authservice-front-tftec.azurewebsites.net`. Lá tem nove laboratórios interativos que vocês podem voltar depois para consolidar."

> "Estrutura: primeiro fundamentos conceituais. Depois decisão arquitetural — SPA, Web, Mobile, Daemon. No meio da aula entramos em criação ao vivo, decodificação de tokens reais, Client Credentials chamando Graph, Swagger OAuth. No final, diagnóstico de AADSTS — porque no dia a dia vocês passam mais tempo debugando esses erros do que criando App Registrations."

> "Perguntem a qualquer momento. Não esperem o final. Em identity, uma dúvida não resolvida no Bloco 2 vira três confusões no Bloco 5."

### ➡️ Transição

> "Vamos começar pelos fundamentos conceituais. Tela 1 comigo."

---

## 🎤 Bloco 2 — Fundamentos conceituais

**30 min** · **Tela 1:** Portal → App registrations + Enterprise apps

> Este bloco é o **mapa teórico da aula inteira** — denso e pedagógico de propósito. Cobrimos App Reg, Enterprise App, OIDC, SAML, OAuth 2.0, todos os flows, PKCE bit-a-bit, JWT crypto, App Roles vs Groups vs Scopes, consent framework, multi-tenant, Conditional Access, MFA, CAE. Cada conceito tem **analogia + por que existe + bit-a-bit + onde aplicamos**. Não decora — entende a relação entre eles.

### 🧠 Como vou ensinar este bloco

> "Vou usar uma estrutura repetida pra cada conceito. Primeiro **analogia do mundo real** — pra vocês criarem âncora mental. Depois **o problema histórico que esse conceito resolve** — pra vocês entenderem por que existe. Depois **o bit-a-bit técnico** — pra vocês debugarem em produção. Por fim, **onde aplicamos na aula** — pro link com a prática."

> "Identity é uma das poucas áreas de software onde **decorar nome de coisa não funciona**. Tem 200 termos parecidos: scope, role, claim, permission, scope, app role, app permission, delegated... Decorar é impossível. **Entender a relação** entre eles, sim. Esse é o objetivo deste bloco."

### 📍 Ação geral

1. Portal → Entra ID → **App registrations** → click `tftec-auth`
2. Manter essa tela visível durante todo o Bloco 2 — vamos referenciar campos do Overview, menu lateral, manifest
3. Em momentos específicos, abrir abas paralelas (Enterprise apps, Endpoints, jwt.ms)

---

### 2a — Os 3 objetos do Entra ID (App Reg, SP, Enterprise App)

**Tempo:** 4 min

#### 🥖 Analogia — Receita e o bolo

> "Pensem numa **receita de bolo**. A receita está escrita num livro — só uma. Mas dezenas de padarias seguem essa receita, e cada padaria tem seu bolo assado, vendido, com cliente. **A receita é a App Object.** Cada **bolo assado em cada padaria é um Service Principal**. E quando o vendedor da padaria descreve o produto pro cliente — 'esse aqui é o bolo da padaria, pode atribuir o vendedor X' — isso é a **Enterprise Application view**."

> "Quando a Microsoft mudou o nome 'Enterprise Application', muita gente achou que era objeto novo. Não é. É a mesma SP, vista pelo olhar do admin (atribuir users, configurar SSO, MFA), em vez do olhar do dev (registrar URIs, manifest, App Roles)."

#### 🕰️ Por que existem 3 objetos

> "Multi-tenant. Quando você cria uma App Registration no seu tenant TFTEC, ela vira **identidade global**. Cliente A do tenant dele consente: aparece um SP no tenant do Cliente A — com as permissions que **aquele admin** consentiu, com Conditional Access do **tenant dele**, com users do **tenant dele** atribuídos ao role Admin. Sem essa separação, **multi-tenant seria impossível**: você teria que criar App Reg por tenant, o que destrói toda a ideia de SaaS."

#### 📍 Ação
1. Tela com `tftec-auth` aberta — apontar Application ID, Object ID, Directory ID no Overview
2. Click **Endpoints** (topo) → mostrar `/authorize`, `/token`, `/.well-known/openid-configuration`, SAML metadata URL
3. Menu lateral → **Manifest** → mostrar JSON real (modo Microsoft Graph App Manifest)
4. Menu lateral → Entra ID → **Enterprise applications** → filtrar `tftec-auth` → confirmar mesmo `appId`

#### 🎤 Fala (bit-a-bit)

> "Toda aplicação que conversa com Entra ID existe em **três representações no Microsoft Graph**. No banco do Microsoft é literalmente isso: dois endpoints distintos, três views de Portal."

| Objeto | Graph endpoint | Schema | Mutável? |
|---|---|---|---|
| **App Object** | `/applications/{objectId}` | `appId`, `signInAudience`, `appRoles[]`, `requiredResourceAccess[]`, `web.redirectUris[]`, `spa.redirectUris[]`, `passwordCredentials[]`, `keyCredentials[]`, `federatedIdentityCredentials[]`, `optionalClaims{}`, `api.oauth2PermissionScopes[]` | Sim — vale em todos os tenants |
| **Service Principal** | `/servicePrincipals/{objectId}` | `appId` (FK pro App Object), `appRoleAssignments[]`, `oauth2PermissionGrants[]`, `appOwnerOrganizationId` | Sim — local ao tenant |
| **Enterprise App** | (mesma `/servicePrincipals/{objectId}`) | view de admin sobre o SP | — |

#### 🔬 Campo `signInAudience` — 4 valores possíveis

| Valor | Quem pode logar | Issuer no token | Authority MSAL |
|---|---|---|---|
| `AzureADMyOrg` | Só users do tenant home | `https://login.microsoftonline.com/{tid}/v2.0` | `/{tenantId}` |
| `AzureADMultipleOrgs` | Users de qualquer tenant Entra ID (B2B) | `https://login.microsoftonline.com/{tid}/v2.0` (varia por user) | `/organizations` |
| `AzureADandPersonalMicrosoftAccount` | Tenants + contas Microsoft pessoais (Outlook, Hotmail) | issuer especial `https://login.microsoftonline.com/9188040d-.../v2.0` para MSA | `/common` |
| `PersonalMicrosoftAccount` | Só MSA | issuer fixo | `/consumers` |

> "Esses 4 valores controlam **autoritativamente** quem pode logar. Mudar `signInAudience` mudaria todo o comportamento de auth. Por isso o Portal não deixa mudar de single → multi sem revalidar."

**→ Aplicamos em:** Bloco 4 (escolher audience na criação), Bloco 8 (Pattern A/B), Bloco 8a (provisionar SP em tenant externo).

---

### 2b — OAuth 2.0, OIDC, SAML, WS-Fed — os 4 protocolos do Entra ID

**Tempo:** 3 min

#### 🏨 Analogia — Hotel + cofre + recepcionista

> "Pensem num hotel. **OAuth 2.0** é o **cofre** com seu cartão de acesso — vocês têm autorização pra abrir certas portas (scopes), mas o cofre não sabe seu nome. **OIDC** é o **recepcionista** que confere seu nome no check-in — sabe quem você é (autenticação) **e** te dá o cartão (autorização). **SAML** é o jeito antigo: você chega com uma **carta de recomendação selada em XML** que o porteiro decifra e valida no carimbo. **WS-Fed** é o jeito ainda mais antigo, mesmo conceito mas com chave-mestra em formato proprietário."

> "Por que importa essa analogia? Porque numa empresa real **os quatro coexistem**. App nova usa OAuth+OIDC. Salesforce SSO via SAML. Sharepoint legado via WS-Fed. Tudo isso conversa com o **mesmo Entra ID** — Entra ID é poliglota nos protocolos."

#### 🕰️ Por que evolução foi nessa ordem

> "**1990s**: cada app tinha login próprio. Pesadelo de senha por todo lado. **2001-2005**: SAML 2.0 inventado pra federação enterprise — funciona, mas baseado em XML, parser complexo, mobile não roda bem. **2008-2012**: OAuth 2.0 emerge da indústria mobile/SPA — JSON, simples, ágil. **2014**: OpenID Connect padroniza a parte de autenticação que OAuth não fazia, em cima de OAuth 2.0. **2026**: OAuth+OIDC dominam apps novas; SAML segue vivo em SaaS legado/enterprise; WS-Fed em retirement."

#### 🎤 Fala

> "Entra ID fala **4 protocolos de identidade**. Vocês precisam saber quando cada um aparece. Não é trivia — o protocolo escolhido determina formato do token, endpoint, validação, e até a versão do Microsoft Graph que vocês podem usar."

| Protocolo | Padroniza | Token | Quando aparece em 2026 |
|---|---|---|---|
| **OAuth 2.0** | RFC 6749 — Autorização ("app A pode chamar API B?") | Access Token (opaque OU JWT) | Default em **toda** API moderna Microsoft (Graph, Azure ARM, suas APIs) |
| **OIDC (OpenID Connect)** | OpenID Foundation, construído em cima de OAuth 2.0 — Autenticação ("quem é o user?") | ID Token (JWT) + Access Token | Default em login de user moderno (SPA, Web, Mobile) |
| **SAML 2.0** | OASIS SAML 2.0 — Federação enterprise (SSO) | SAML Assertion (XML signed) | Apps enterprise legadas (ServiceNow, Salesforce, SAP), federation B2B antiga |
| **WS-Federation** | OASIS WS-Trust — Federação pré-SAML era | Security Token (XML, formato proprietário) | ADFS legado, .NET Framework antigo. Em retirement. |

#### 🔬 OAuth 2.0 vs OIDC — a relação técnica

> "OIDC **não substitui** OAuth 2.0. É uma extensão. Toda interação OIDC é também uma interação OAuth 2.0. A diferença está em três coisas:"

| Aspecto | OAuth 2.0 puro | OIDC (= OAuth 2.0 + extensões) |
|---|---|---|
| Pergunta que responde | "Posso chamar API?" | "Quem é o user?" + "Posso chamar API?" |
| Token retornado | `access_token` | `access_token` + `id_token` (este é JWT obrigatório) |
| Scope mágico | — | `openid` (obrigatório), `profile`, `email` |
| Endpoint extra | — | `/userinfo`, `/.well-known/openid-configuration` |
| Validação ID Token | N/A | RFC OIDC Core 1.0 §3.1.3.7 — 11 passos obrigatórios |

> "Quando vocês logam no `authservice-front-tftec` e Microsoft mostra a tela com o nome do user, foto, email — isso é OIDC. O `id_token` é o que carrega esses claims. O `access_token` que vai junto é OAuth 2.0 puro."

#### 🔬 SAML — quando vocês vão encontrar

> "SAML não morreu. Em projetos enterprise vocês vão ver SAML SSO pra apps SaaS terceirizadas. No Portal: **Enterprise applications → New application → escolhe app do catálogo → Single sign-on → SAML**. Diferenças críticas vs OIDC:"

| | OIDC (recomendado pra apps novas) | SAML (legacy mas vivo) |
|---|---|---|
| Formato do token | JWT (JSON, compacto) | SAML Assertion (XML, ~5x maior) |
| Binding | HTTP redirect/POST com URL | HTTP-POST tipicamente (form com `SAMLResponse` base64) |
| Assinatura | RS256/RS384/RS512 ou ES256 | XML DSig com XPath canonicalization (complexo) |
| Discovery | `/.well-known/openid-configuration` | SAML metadata XML em `/federationmetadata/2007-06/federationmetadata.xml` |
| Logout | RP-Initiated Logout (OIDC §5) | SAML Single Logout (SLO) — opcional, raramente implementado bem |

> "Regra prática: app **nova** → OIDC. App **catálogo** ou **legacy** → SAML. Misturar é normal: tenant tem dezenas de apps SAML pra SaaS e dezenas de apps OIDC pras suas próprias."

**→ Aplicamos em:** Toda a aula é sobre OAuth 2.0 + OIDC. SAML mencionado pra contextualizar; demo só de OIDC.

---

### 2c — Os 5+1 OAuth Flows (com ASCII)

**Tempo:** 3 min

#### 🎫 Analogia — Tipos de ingresso

> "Pensem em **ingressos pra um evento**. **Authorization Code + PKCE** é o ingresso que você comprou pelo celular: vem um QR code que só é válido quando combinado com o **CPF que você cadastrou** — alguém roubar o QR code não adianta. Isso é o `code_verifier` do PKCE."

> "**Client Credentials** é o **passe vitalício de um funcionário** — não precisa ter user no fluxo, o cartão tem chip próprio, você usa pra entrar sozinho. Daemon."

> "**On-Behalf-Of** é o **mordomo do hotel**: você dá um vale pra ele comprar coisas em seu nome, ele troca por outros vales nas lojas que aceitam (backend chamando outro backend)."

> "**Device Code** é o **celular do amigo logado no Netflix da TV**: TV não tem teclado, mostra um código, você loga no celular digitando o código, TV recebe o token. CLI, SmartTV, IoT."

#### 🕰️ Por que tantos flows

> "Cada tipo de aplicação tem **restrições físicas diferentes**: SPA não pode guardar secret (DevTools mostra tudo). Daemon não tem user pra logar interativo. CLI roda em terminal sem browser. Cada flow foi projetado pra **uma combinação específica** de restrição. Não é Microsoft sendo complicada — é OAuth resolvendo casos reais."

> "Escolha de flow é **determinada pelo tipo de aplicação e onde o secret mora**. Cinco flows ativos + um deprecated."

#### Flow 1 — Authorization Code + PKCE (SPA, Mobile)

```
Browser/Mobile         Entra ID              Backend(opcional)        API
     │                    │                         │                  │
     │  1. /authorize?    │                         │                  │
     │   code_challenge=X │                         │                  │
     │  ────────────────► │                         │                  │
     │                    │ 2. Login + consent      │                  │
     │  ◄──── redirect    │                         │                  │
     │     code=abc       │                         │                  │
     │                    │                         │                  │
     │  3. /token?        │                         │                  │
     │   code=abc         │                         │                  │
     │   code_verifier=Y  │                         │                  │
     │  ────────────────► │                         │                  │
     │                    │ 4. SHA256(Y) ?= X ✓     │                  │
     │  ◄── access_token  │                         │                  │
     │      id_token      │                         │                  │
     │      refresh_token │                         │                  │
     │                    │                         │                  │
     │  5. Bearer access_token                                          │
     │  ─────────────────────────────────────────────────────────────► │
```

#### Flow 2 — Client Credentials (Daemon)

```
Daemon                Entra ID                  API
  │                      │                       │
  │  1. /token           │                       │
  │   grant_type=        │                       │
  │   client_credentials │                       │
  │   client_id+secret   │                       │
  │   scope=API/.default │                       │
  │  ──────────────────► │                       │
  │  ◄── access_token    │                       │
  │      (roles claim)   │                       │
  │                      │                       │
  │  2. Bearer access_token                      │
  │  ────────────────────────────────────────►   │
```

#### Flow 3 — On-Behalf-Of (Backend → Backend)

```
Browser    Backend A (sua API)       Entra ID         Backend B (Graph)
  │            │                        │                    │
  │  token A   │                        │                    │
  │ ─────────► │                        │                    │
  │            │ /token grant_type=     │                    │
  │            │ jwt-bearer             │                    │
  │            │ assertion=tokenA       │                    │
  │            │ scope=Graph/.default   │                    │
  │            │ ─────────────────────► │                    │
  │            │ ◄── token B (aud=Graph)│                    │
  │            │                        │                    │
  │            │ Bearer token B                              │
  │            │ ──────────────────────────────────────────► │
```

#### Flow 4 — Device Code (CLI, IoT, SmartTV)

```
Device              Entra ID            User's phone
  │                    │                     │
  │ POST /devicecode   │                     │
  │ ─────────────────► │                     │
  │ ◄── user_code      │                     │
  │     device_code    │                     │
  │     verification_uri                     │
  │                    │                     │
  │ "Vai em            │                     │
  │  microsoft.com/    │                     │
  │  devicelogin e     │                     │
  │  digita ABCD-1234" │                     │
  │                    │ Login + user_code   │
  │                    │ ◄────────────────── │
  │                    │                     │
  │ POLL /token        │                     │
  │ ─────────────────► │                     │
  │ ◄── access_token   │                     │
```

#### Flow 5 — Resource Owner Password Credentials (ROPC) ⚠️

> "User entrega senha pro app, app envia direto pra `/token`. **Não use.** Não funciona com MFA, não funciona com Conditional Access, não funciona com FIDO2. Existe pra migração de apps legadas. Em 2026, se vocês precisarem disso, refatorem o app."

#### Flow 6 — Implicit (DEPRECATED)

> "Era flow recomendado pra SPA até 2019. Token vinha direto no fragment (`#access_token=...`). Não tem PKCE, sem refresh token, vulnerável a token theft via XSS. **Deprecated pela OAuth 2.0 Security BCP (RFC 9700)**. MSAL.js v2+ não suporta mais."

**→ Aplicamos em:** Bloco 3 (decidir qual flow), Bloco 5 (Auth Code+PKCE no Swagger), Bloco 7 (Client Credentials).

---

### 2d — PKCE bit-a-bit (RFC 7636)

**Tempo:** 2 min

#### 🔒 Analogia — Cadeado com chave gerada na hora

> "Imagine que vocês vão estacionar bicicleta na rua. **Sem PKCE**, seria: você vai numa loja, compra um cadeado, prende a bike, vai embora. Se alguém **clona seu cadeado** (intercepta o `code`), abre e leva. **Com PKCE**, é diferente: você fabrica o cadeado **na hora**, joga a chave no bolso, prende a bike, e mostra o **molde do cadeado** (o `code_challenge`, que é o hash) pro guarda. Quando você volta, mostra a chave (o `code_verifier` original), o guarda confere que o hash da chave bate com o molde, e te libera. **Clonar o molde não te dá a chave** — porque hash é one-way."

> "PKCE é o que faz SPA segura sem precisar de client secret. Vou mostrar o math literal — vocês entendendo isso, **nenhum aluno mais nessa sala se enrola com SPA auth**."

#### 🕰️ Por que PKCE foi inventado

> "Em 2012-2015, SPAs usavam **Implicit Flow** — token vinha direto na URL após login. Problema: XSS no SPA roubava token; refresh tokens não eram suportados; tokens vazavam pra logs e proxies via fragment. Em 2015, OAuth 2.0 for Native Apps (RFC 8252) propôs PKCE como solução: SPA usa Authorization Code Flow (mais seguro) **sem precisar de client secret**. Em 2020, OAuth 2.0 Security BCP (que virou RFC 9700) **declarou Implicit deprecated** e mandou todos usarem Auth Code+PKCE. Vocês podem ainda ver Implicit em código antigo — refatorem."

#### O problema que PKCE resolve

> "SPA roda 100% no browser. Não tem onde guardar client secret. Sem secret, atacante que intercepte o `code` na URL de redirect pode trocar por token. PKCE adiciona um **segredo dinâmico por sessão**: o `code_verifier`."

#### O algoritmo, passo a passo

```
1. SPA gera code_verifier
   - String aleatória [A-Z][a-z][0-9]-._~
   - 43-128 caracteres (RFC 7636 §4.1)
   - Entropia mínima recomendada: 256 bits (32 bytes random)
   - Exemplo: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"

2. SPA calcula code_challenge
   - method = "S256" (SHA-256, recomendado)
   - code_challenge = BASE64URL(SHA256(code_verifier))
   - Exemplo: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"

   ⚠️ BASE64URL ≠ BASE64:
      base64:    "+", "/", padding "="
      base64url: "-", "_", sem padding

3. SPA chama /authorize
   GET /oauth2/v2.0/authorize?
       client_id={appId}&
       redirect_uri=http://localhost:8080/&
       response_type=code&
       scope=openid profile api://{appId}/access_as_user&
       code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&
       code_challenge_method=S256&
       state={csrf_token}&
       nonce={oidc_nonce}

4. Entra ID guarda code_challenge associado ao código emitido
   Redireciona pra http://localhost:8080/?code=abc&state=...

5. SPA chama /token com code_verifier ORIGINAL
   POST /oauth2/v2.0/token
   grant_type=authorization_code&
   code=abc&
   client_id={appId}&
   redirect_uri=http://localhost:8080/&
   code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk

6. Entra ID valida:
   BASE64URL(SHA256(code_verifier_recebido)) == code_challenge_guardado?
   Sim → emite access_token + id_token + refresh_token
   Não → AADSTS50148 (code_verifier does not match challenge)
```

#### 🎤 Por que isso é seguro

> "**SHA-256 é one-way.** Atacante intercepta o `code_challenge` no `/authorize` e o `code` no redirect — não consegue derivar `code_verifier` a partir disso. Sem o `verifier`, o `/token` retorna AADSTS50148. PKCE não exige secret pré-compartilhado: o segredo é gerado por sessão, dura segundos, e nunca viaja na rede em forma utilizável por atacante."

**→ Aplicamos em:** Bloco 5b (Swagger OAuth com PKCE — DevTools mostra esses params reais), Bloco 3 (SPA).

---

### 2e — Cripto e o flow: como o token é assinado (JWT bit-a-bit)

**Tempo:** 2 min

#### ✉️ Analogia — Carta lacrada com selo do reino

> "Imagine que vocês recebem uma **carta selada com brasão do reino**. A carta diz quem você é, o que pode fazer, até quando vale. **Qualquer um pode ler a carta** — ela não está criptografada, apenas codificada em base64 (que não é segredo, é só formato). O que protege é o **selo**: pra falsificar a carta, atacante precisaria do **sinete do rei** (private key da Microsoft). E pra **conferir o selo**, qualquer guarda pode usar a **réplica pública** do sinete (public key publicada no JWKS). Hash one-way + assinatura assimétrica = atacante não consegue forjar, mas qualquer um pode validar."

> "Por isso a galera às vezes pergunta 'JWT é seguro? Eu consigo ler o conteúdo!'. **Sim, qualquer um lê** — o conteúdo é público. O que importa é **a assinatura**: se o backend valida e bate, o conteúdo é confiável. Se atacante mudar uma vírgula no payload, a assinatura quebra."

#### 🕰️ Por que JWT venceu SAML em apps novas

> "SAML usa XML DSig — assinatura XML com canonicalization. Complexo de implementar, vulnerabilidades históricas (XML Signature Wrapping, etc). JWT usa **JSON + base64url + RSA-SHA256** — biblioteca de 200 linhas em qualquer linguagem. Mobile e SPA precisam disso. SAML continua dominando enterprise SSO antigo, mas pra **apps novas em 2026**, JWT é o padrão."

#### Anatomia

```
eyJhbGciOiJSUzI1NiIs...  .  eyJhdWQiOiJhcGk6Ly8...  .  Mml-...
└── HEADER (base64url) ─┘    └── PAYLOAD (b64url) ─┘    └── SIGNATURE ─┘
```

#### Header — escolha do algoritmo

```json
{
  "alg": "RS256",       // RSA-SHA256 (default Microsoft)
  "kid": "abc123...",   // Key ID — qual chave do JWKS usar
  "typ": "JWT",
  "x5t": "..."          // SHA-1 thumbprint do cert (compat v1)
}
```

| Algoritmo | Usado em | Trade-off |
|---|---|---|
| RS256 | Microsoft Entra ID (default) | Assimétrico — public key validável por qualquer um, private key só no Microsoft |
| RS384 / RS512 | Opcional, configurável | Hash maior, assinatura maior |
| ES256 | Crescendo (FIDO2, mais moderno) | ECDSA curva P-256 — assinaturas menores |
| HS256 (HMAC) | **Não usado** por Entra ID | Simétrico — quem valida precisa do segredo. Não dá pra distribuir |
| none | **REJEITADO** | Token sem assinatura. CVE histórico. Sempre rejeitem `alg: none` |

#### Como o backend valida (5 passos)

```
1. Decodifica HEADER (base64url decode):
   { "alg": "RS256", "kid": "abc123..." }

2. Fetch JWKS do issuer (cacheia 24h):
   GET https://login.microsoftonline.com/{tenant}/discovery/v2.0/keys
   →  { "keys": [
         { "kid": "abc123...", "kty": "RSA", "n": "...", "e": "AQAB", "x5c": [...] },
         { "kid": "def456...", "kty": "RSA", "n": "...", "e": "AQAB", "x5c": [...] }
      ]}

3. Encontra chave pública por kid

4. RSA_Verify(public_key, "header.payload", signature)
   - Hash: SHA-256(base64url(header) + "." + base64url(payload))
   - Validação RSA pública confere se hash = decrypt(signature, public_key)

5. Validação de claims:
   - iss == issuer esperado
   - aud == client_id da minha API
   - exp > now
   - nbf < now (ou ausente)
   - tid no allowed list (multi-tenant)
```

#### 🔬 JWKS — rotação e cache

> "Microsoft rotaciona as chaves de assinatura periodicamente (~6 semanas). Por isso o JWKS retorna **múltiplas keys**: a ativa + a próxima + a recente. Backend cacheia o JWKS por 24h. Quando aparece `kid` desconhecido, força refresh do JWKS imediatamente — `Microsoft.Identity.Web` faz isso automaticamente. Sem isso, rotação quebra todos os tokens."

**→ Aplicamos em:** Bloco 5 (decode JWT real em jwt.ms), Bloco 9 (validação em `Program.cs`).

---

### 2f — Claims relevantes do JWT (referência)

**Tempo:** 1 min

| Claim | RFC | Significa | Onde usar |
|---|---|---|---|
| `aud` | RFC 7519 §4.1.3 | Audience | Validar no backend — rejeitar se ≠ minha API |
| `iss` | RFC 7519 §4.1.1 | Issuer | Validar — `https://login.microsoftonline.com/{tid}/v2.0` |
| `sub` | RFC 7519 §4.1.2 | Subject opaco | **NÃO** usar pra lógica — varia por app |
| `oid` | Microsoft | Object ID do user no tenant | **Use isso** — estável dentro do tenant |
| `tid` | Microsoft | Tenant ID | Multi-tenant: filtra por tenant autorizado |
| `scp` | OIDC | Scopes delegados | String com espaços — `"User.Read api://x/read"` |
| `roles` | Microsoft | App Roles ou Application permissions | Array |
| `groups` | Microsoft | Group Object IDs | Array — só se opcional claim ativado |
| `appid` (v1) / `azp` (v2) | OAuth/OIDC | Authorized party | Quem chamou — App Reg |
| `idp` | Microsoft | Identity provider | Em B2B guest, mostra IdP externo |
| `acr` | OIDC | Authentication context class | `1` = senha, `2` = MFA (varia) |
| `amr` | OIDC | Authentication methods | `["pwd","mfa","fido"]` etc |
| `exp`, `nbf`, `iat` | RFC 7519 | Tempos Unix | Validação automática |
| `wids` | Microsoft | Well-known IDs de Entra roles | Global Admin, etc — IDs fixos da Microsoft |
| `roles`+ `hasgroups` | Microsoft | Overage indicator | Quando user tem > 150 groups, vem só `hasgroups: true` — consulta Graph |

**→ Aplicamos em:** Bloco 5 (decode JWT em jwt.ms), Bloco 6 (`scp` vs `roles`), Bloco 9 (validação).

---

### 2g — Glossário de URLs e URIs

**Tempo:** 2 min · **Profundidade total:** Bloco 5

#### 🎤 Fala

> "Entra ID confunde de propósito com nomes parecidos. Lembrem dessa tabela — economiza 30 min de debug quando o AADSTS50011 aparecer."

| Termo | O que é | Exemplo |
|---|---|---|
| **Authority** | URL base do tenant pro Entra ID. MSAL aponta pra cá | `https://login.microsoftonline.com/{tenantId}` |
| **Redirect URI / Reply URL** | Onde Entra ID redireciona após login. Registrado na App Reg, comparado **byte-a-byte** | `http://localhost:8080/`, `https://app.com/signin-oidc` |
| **Application ID URI** | Identifica a API que sua App Reg expõe. Vira `aud` dos tokens | `api://{appId}`, `api://custom.com` |
| **Scope (delegated)** | Permission solicitada por SPA/Web/Mobile. Aparece em `scp` | `User.Read`, `api://{appId}/access_as_user` |
| **App Role (application)** | Permission usada por daemon. Aparece em `roles` | `User.Read.All`, `Admin` |
| **OIDC Discovery** | Endpoint JSON com toda a config do tenant — JWKS, issuer, endpoints | `/{tenant}/.well-known/openid-configuration` |
| **JWKS** | JSON com chaves públicas pra validar JWT | `/{tenant}/discovery/v2.0/keys` |

> "**Redirect URI é case-sensitive no path, conta trailing slash, conta porta.** `http://localhost:8080` ≠ `http://localhost:8080/`. AADSTS50011 vem disso."

**→ Aplicamos em:** Bloco 4 (registra Redirect URI), Bloco 5 (discovery + JWKS no Swagger), Bloco 10 (AADSTS50011 debug).

---

### 2h — Delegated vs Application permissions

**Tempo:** 1 min

#### 🚗 Analogia — Procuração vs CNH própria

> "**Delegated** é **procuração**: o user (dono do carro) dá permissão pra app dirigir em nome dele. App só consegue ir aonde o user pode ir. Auditoria mostra o **dono** + a app. **Application** é **CNH própria da empresa**: app é uma entidade independente, com poderes próprios consentidos pelo admin. Não tem user no flow. Auditoria mostra só a app."

> "Bug típico de produção: dev usa Application quando deveria usar Delegated, e descobre 6 meses depois que o backend está lendo dados de **todos os users do tenant** em vez de só do user logado. LGPD respira fundo."

| Eixo | **Delegated** | **Application** |
|---|---|---|
| Tem user no flow? | Sim | Não |
| Claim no token | `scp` (string com espaços) | `roles` (array) |
| Manifest field | `requiredResourceAccess.resourceAccess.type: "Scope"` | `requiredResourceAccess.resourceAccess.type: "Role"` |
| Flow OAuth | Auth Code+PKCE / Auth Code | Client Credentials |
| Consent necessário | User ou admin (depende do scope) | Admin **sempre** |
| Visibilidade no token | Recortado pelo permission do user | Sempre o conjunto consentido pelo admin |
| Escopo do dado | Só o que o user pode ver | Tenant inteiro (tipicamente) |
| Auditoria mostra | `oid` do user + `appid` | Só `appid` (e `oid` do SP) |
| Exemplo Graph | `User.Read` (lê o próprio user) | `User.Read.All` (lê todos os users do tenant) |

> "Mesma App Reg pode declarar os dois tipos. Backend escolhe qual flow usar pra cada operação."

**→ Aplicamos em:** Bloco 6 (Delegated vs Application), Bloco 7 (Daemon = Application).

---

### 2i — App Roles, Groups e Scopes — a tríade do RBAC

**Tempo:** 2 min

#### 🏢 Analogia — Empresa, departamento, função

> "Pensem numa empresa. **Group** é o departamento (Engenharia, Vendas, RH) — agrupa pessoas. **App Role** é a função dentro de um sistema específico (Admin do CRM, Aprovador do ERP) — diz o que você pode fazer naquele app. **Scope** é a procuração de um sistema pra outro (CRM pode chamar ERP em meu nome com poder X). **Directory Role** é a chefia do RH/TI corporativos (Global Admin) — manda no Entra ID em si, não nas suas apps."

> "Erro clássico: dev coloca 'permitir Group X' no código quando deveria ser App Role. Resultado: usuários que entram no grupo automaticamente ganham acesso ao app, sem ninguém revisar. Quando alguém é demitido e fica no grupo por engano, vaza dado. **App Role explícito é mais auditável que Group**."

> "Três conceitos diferentes que aparecem juntos no RBAC do Entra ID. Confundir custa dia de debug."

| Conceito | Definido por | Atribuído a | Aparece no token como | Quando usar |
|---|---|---|---|---|
| **Scope (Delegated permission)** | Sua API (Expose an API → Add scope) | App cliente (via API permissions + consent) | `scp` | Permission delegada — "user X concedeu app Y para chamar minha API com poder Z" |
| **App Role (Application permission)** | Sua API (App roles → Both / Applications only) | App daemon (via API permissions admin consent) | `roles` | Permission de aplicação — "daemon Y autorizado a chamar minha API sem user" |
| **App Role (RBAC de usuário)** | Sua API (App roles → Users/Groups / Both) | User OU Group (via Enterprise apps → Users and groups → Add) | `roles` | RBAC interno da sua app — "user X é Admin desta aplicação" |
| **Group** | Entra ID (Groups blade) | Membros são users / SPs / groups | `groups` (Object IDs) — só se opcional claim ativado | Agrupar users; pode ser security group ou Microsoft 365 group |
| **Directory Role (Entra role)** | Microsoft (fixos: Global Admin, User Admin, etc) | User no Entra ID | `wids` (well-known IDs) | Permissions de **administração do Entra ID**, não da sua app |

#### 🔬 Decisão prática

```
Pergunta:                              Use:
  Quem pode fazer X na minha app?  →  App Role (atribuído a User ou Group)
  Quais APIs minha app pode chamar?→  Scope (delegated) ou App Role (application) — em outra API
  Agrupar users genericamente?     →  Group (e atribui App Role pro group)
  Admin do tenant?                 →  Directory Role (Entra role, claim wids)
```

#### ⚠️ Pegadinha — overage claim

> "Se um user pertence a **mais de 150 groups**, o claim `groups` no JWT vem como `hasgroups: true` em vez da lista. Backend tem que consultar `GET /me/transitiveMemberOf` no Graph pra resolver. Doc Microsoft chama isso de **groups overage claim**."

**→ Aplicamos em:** Bloco 6b (criar e atribuir App Role), Bloco 6c (consent), Bloco 9 (RequireRole no ASP.NET).

---

### 2j — Consent framework — 4 tipos

**Tempo:** 1 min

#### 📝 Analogia — Pedir VS receber autorização

> "Declarar permission é igual **escrever um pedido**: 'eu, app X, gostaria de ler emails'. **Consentir** é o **carimbo de aprovação** num pedido. O carimbo pode vir do **próprio user** (user consent, pra coisas leves), do **admin** (admin consent, pra coisas amplas), ou pode ser **dispensado** (pre-authorization, quando duas apps confiam mutuamente)."

> "Bug clássico: dev adiciona permission no Portal achando que está pronto. Roda o app, recebe AADSTS65001 e fica confuso. **Adicionar permission ≠ permission ativa**. Sempre que adicionar, clica em Grant admin consent. Em apps multi-tenant, cada tenant precisa do seu carimbo."

> "Declarar permission ≠ consentir permission. `AADSTS65001` no Bloco 10 vem dessa distinção."

| Etapa | O que acontece | Onde mora | Quem dispara |
|---|---|---|---|
| **Declaração** | Permission listada em `requiredResourceAccess` do App Object | App Object (template global) | Dev na App Reg |
| **User consent** | User clica 'Aceitar' no primeiro login. Cria `oauth2PermissionGrant` (`consentType: Principal`) | SP local do tenant | User no consent prompt |
| **Admin consent** | Admin aceita pra todos. Cria `oauth2PermissionGrant` (`consentType: AllPrincipals`) — **único** caminho pra Application permissions | SP local do tenant | Admin no Portal OU `/adminconsent` endpoint |
| **Pre-authorization** | App A confia em App B explicitamente. Lista em `preAuthorizedApplications` do App Object da A | App Object da API | Dev da API |

#### Quem pode consentir o quê (default policy)

- **User consent**: só permissions marcadas como "user-consent-able" no Graph permissions reference. Em 2026, Microsoft deixou default mais restritivo — apps de **publishers verificados** + scopes low-risk.
- **Admin consent**: qualquer permission. Necessário pra Application permissions, pra high-privilege Delegated (Directory.ReadWrite.All, etc), e quando user-consent foi desabilitado pelo admin.

#### Endpoints relevantes

```
User consent prompt   → /{tenant}/oauth2/v2.0/authorize?prompt=consent
Admin consent prompt  → /{tenant}/adminconsent?client_id={appId}
Programmatic grant    → POST /v1.0/oauth2PermissionGrants (Graph) — só admin
```

**→ Aplicamos em:** Bloco 4 (Grant admin consent), Bloco 6c, Bloco 8a (consent programático).

---

### 2k — Credenciais — 4 formas

**Tempo:** 1 min

#### 🔑 Analogia — Chave de cofre vs cartão biométrico

> "**Client Secret** é igual **chave fixa de cofre**: existe, alguém pode copiar, tem que trocar regularmente. **Certificate** é **chave mais forte com travas mecânicas**: difícil de copiar mas existe fisicamente. **FIC e Managed Identity** são **leitor biométrico**: não tem chave física, o cofre verifica **quem é você** (via Microsoft, via GitHub OIDC, via metadata do Azure). Não tem o que vazar. Não tem o que rotacionar."

> "A indústria está toda migrando pra biométrico (FIC/MI). Em 2026, ver um Client Secret em produção é red flag de auditoria. tftec-auth ainda usa Secret no backend (por causa de OBO/CC), mas o CI/CD já usa FIC contra GitHub OIDC. Esse é o caminho."

| Credencial | Segurança | Rotação | Use quando |
|---|---|---|---|
| **Client Secret** | ⭐ | 6-24 meses, manual | Dev local, MVP |
| **Certificate** | ⭐⭐⭐ | Manual, CA workflow | Produção on-prem ou híbrido |
| **Federated Identity Credential (FIC)** | ⭐⭐⭐⭐⭐ | Zero (sem secret) | CI/CD GitHub Actions, AKS Workload Identity |
| **Managed Identity** | ⭐⭐⭐⭐⭐ | Zero (Azure gerencia) | Workload em Azure (App Service, Function, VM, AKS) |

> "Ordem de preferência em 2026: **MI > FIC > Cert > Secret**. Azure → MI. CI/CD externo → FIC. Híbrido com cert PKI → Cert. Dev local → Secret."

**→ Aplicamos em:** Bloco 7.

---

### 2l — Multi-tenant — o modelo distribuído

**Tempo:** 1 min

#### 🏪 Analogia — Franquia

> "Multi-tenant é igual **franquia de fast food**. A **marca matriz** (App Object no seu tenant) define o cardápio, padrão de qualidade, identidade visual. Cada **franqueado** (SP em tenant cliente) tem a **loja local**: funcionários próprios (users do cliente), regras locais (Conditional Access do cliente), assinatura local (consent específico daquele tenant). Quando um cliente novo abre franquia, **um SP novo aparece** no tenant dele. Mesma marca, lojas independentes."

> "Erro comum em multi-tenant é validar issuer como **um valor fixo** no backend. Cada login vem com **tid** diferente. Backend tem que ter allowlist de tenants OU aceitar qualquer tenant Entra ID. Microsoft.Identity.Web tem helper pra isso — `Program.cs:55-78` mostra como."

> "**1 App Object no tenant home, N Service Principals nos tenants consumidores.** Cada cliente novo que loga, Entra ID provisiona SP no tenant dele e pede consent. É isso."

| Authority MSAL | Resolução de issuer | Quem aceita | Quando usar |
|---|---|---|---|
| `/organizations` | Token issuer = tenant do user (varia) | Qualquer tenant Entra ID | SaaS B2B multi-tenant |
| `/{tenantId}` | Token issuer fixo no tenant especificado | Só users daquele tenant | Single-tenant ou tenant alvo específico |
| `/common` | Token issuer = tenant do user OU MSA | Tenants + MSA pessoais | Apps híbridas (raro em B2B) |
| `/consumers` | Token issuer = MSA Microsoft fixo | Só MSA pessoais | Apps consumer-only (raríssimo em B2B) |

> "Validação de issuer em multi-tenant é o ponto que mais quebra. Backend tem que aceitar issuers de **N tenants diferentes**, não um issuer fixo. `Microsoft.Identity.Web` faz isso via custom validator que confere `tid` contra allowlist."

**→ Aplicamos em:** Bloco 8 (Patterns A/B), Bloco 8a (provisionar SP em tenant externo), Bloco 9 (custom issuer validator no `Program.cs`).

---

### 2m — Identity Protection — Conditional Access, MFA, CAE

**Tempo:** 2 min

#### 🚪 Analogia — Porteiro inteligente do prédio

> "Imagine um prédio. **Autenticação OIDC** é o **leitor de cartão da entrada** — confere se você tem cartão válido. **Conditional Access** é o **porteiro inteligente** que olha o cartão, mas também olha **se você está sóbrio, se chegou em horário comercial, se a senha foi trocada essa semana, se vem do bairro habitual ou de outro estado**. Mesmo com cartão válido, o porteiro pode **negar entrada** ou **pedir reforço** (MFA). Cartão = token. Porteiro = engine de CA."

> "**Continuous Access Evaluation (CAE)** é o porteiro **mandar mensagem pelas portas internas**: 'Aquele cara que entrou às 10h teve cartão revogado agora, expulsem'. Pré-CAE, depois que entrou no andar, ninguém te tira até o cartão vencer naturalmente. Com CAE, em <5 min a notificação chega nas APIs e te expulsam."

> "Por que isso importa? **Token válido ≠ usuário autorizado AGORA.** Em 2026, todo backend novo deveria suportar CAE — caso contrário, perde signal de revogação."

> "Tudo até aqui foi sobre **identidade**. Identity Protection é o que decide se aquele user, naquele device, naquela hora, pode logar. Mesmo com token válido."

#### Conditional Access (CA)

> "Engine de políticas do Entra ID. Cada login passa por uma chain de policies. Cada policy tem: **assignment** (quem e quando aplicar) e **access controls** (block / grant / require). O Entra ID computa, em tempo real, se concede o token ou não."

| Componente CA | Exemplos |
|---|---|
| Users / Groups | `All users except Break-Glass account` |
| Cloud apps | `Microsoft Graph`, `Office 365`, sua App Reg específica |
| Conditions | Sign-in risk (ML), User risk, Location (IP), Device platform, Client app (browser/native/legacy) |
| Grant controls | Require MFA, Require compliant device (Intune), Require approved app, Require Terms of Use, Require password change |
| Session controls | Sign-in frequency (force re-auth a cada X horas), Persistent browser disabled, Conditional Access App Control |

#### MFA — métodos em ordem de segurança

> "FIDO2 (passkey) > Authenticator passwordless > Authenticator push > TOTP app > SMS. SMS é phishable e o Microsoft desencoraja desde 2024."

#### Token Lifetimes

| Token | Default | Configurável |
|---|---|---|
| Access token | 60-90 min | Sim — Conditional Access App Control |
| Refresh token | 90 dias (rolling) | Sim — Token Lifetime Policies (deprecated em favor de CA) |
| ID token | Lifetime do access token | Sim |
| Primary Refresh Token (PRT) | 14 dias (renovável) | Não — broker do device |

#### Continuous Access Evaluation (CAE) — 2026

> "Pré-CAE: token válido durante toda sua lifetime, mesmo se admin desativar user. CAE muda isso. Quando admin desativa user / revoga sessions / muda CA policy, Microsoft Graph e algumas APIs **revogam tokens existentes em <5 min** via signal CAE. Backend que suporta CAE recebe `WWW-Authenticate: Bearer realm="", error="insufficient_claims"`, MSAL pega o `claims challenge` e pede token novo."

**→ Aplicamos em:** Bloco 10 (AADSTS50158 = CA failure), Apêndice A (Q&A sobre MFA / token lifetime).

---

### 2n — AADSTS — diagnóstico (preview)

**Tempo:** 30 seg

> "Erros do Entra ID têm formato `AADSTS{5-7 dígitos}`. O range diz o estágio do flow. Detalhamos no Bloco 10."

| Range | Estágio | Top erro |
|---|---|---|
| 50000-50299 | Authorize / consent UI | 50011 (Redirect mismatch), 50158 (CA failure) |
| 65000-65099 | Consent | 65001 (Consent required) |
| 70000-70099 | Token endpoint | 70021 (FIC subject no match) |
| 90000-90999 | Generic | 90014 (Required field missing) |
| 7000000+ | App-specific | 7000229 (Multi-tenant SP missing) |

---

### 💡 Frase-chave do Bloco 2

> *"3 objetos · 4 protocolos · 5 flows · 4 credenciais · 2 tipos de permission · 3 conceitos de RBAC · 4 tipos de consent · 1 engine de Conditional Access. Toda a complexidade do Entra ID cabe nesses números. O resto da aula é vocês vendo isso acontecer ao vivo."*

### ⚠️ Pegadinhas conceituais que confundem aluno novo

- **`appId` ≠ `objectId`** — App Object e SP têm Object IDs diferentes, mesmo `appId`.
- **App Role ≠ Application permission** — App Role é definido **pela sua API** (pra ser atribuído); Application permission é declarada pela **sua App cliente** apontando pra API alheia. Ambos viram claim `roles`. Mesma palavra, dois lados da equação.
- **Scope ≠ App Role** — Scope tem `scp` (delegated, em nome do user). App Role tem `roles` (sem user OU RBAC interno). Mesma palavra "permission" cobre os três.
- **Tenant ID ≠ Directory ID** — São a mesma coisa. Microsoft inconsistente.
- **base64 ≠ base64url** — Padding `=` e chars `+/` no base64; sem padding e `-_` no base64url. JWT usa base64url. Confundir quebra parsing.
- **OIDC issuer v1 ≠ v2** — `sts.windows.net/{tid}/` (v1) vs `login.microsoftonline.com/{tid}/v2.0` (v2). Backend precisa aceitar o issuer correto da versão do token.
- **`scp` é string, `roles` é array** — Validar como array em `scp` falha (você tem `"User.Read api.write"`, espera split por espaço).
- **`groups` overage** — User com >150 groups vem `hasgroups: true`, não array. Consulta Graph pra resolver.
- **CAE invalida token "válido"** — Token com `exp` no futuro pode ser revogado em <5 min via CAE. Backend que não suporta CAE perde esse signal.

### ➡️ Transição

> "Mapa teórico denso entregue. Sabendo isso, **toda decisão prática faz sentido**. Próximo: que tipo de aplicação vocês têm? Isso determina o flow, a credencial, o Redirect URI. Tela 3, `/lab/topologias`."

---

## 🎤 Bloco 3 — Decisões de arquitetura

**10 min** · **Tela 3:** `/lab/topologias`

### 📍 Ação

1. Abrir `/lab/topologias` na Tela 3 — 6 arquiteturas lado a lado
2. Navegar pelos cards (SPA, Web App, Mobile, Daemon, Microservices, AKS Workload Identity)
3. Em cada card, apontar: Stack, Mermaid diagram, Pros/Cons, Credential

### 🎤 Fala (sem ler tudo — escolher pontos por audiência)

> "Quando vocês criam uma App Registration, o Portal pergunta o tipo. SPA, Web, Mobile, Daemon. Essa pergunta determina cinco coisas: flow OAuth, necessidade de client secret, tokens recebidos, onde o Redirect URI vai parar, estratégia anti-interceptação."

**SPA (Single-Page Application):**
> "React, Angular, Vue rodando 100% no navegador. O `authservice-front-tftec` é SPA. Sem lugar seguro pra client secret — qualquer um abre DevTools. Solução: **PKCE**. SPA gera `code_verifier` aleatório, calcula SHA256 → `code_challenge`, envia challenge no `/authorize`, envia verifier no `/token`. Entra ID confere o hash. Atacante que intercepte o code não tem o verifier — troca falha."

**Web tradicional:**
> "ASP.NET MVC, Django, Express server-side. Token nunca chega no browser — fica no token cache do servidor. Browser carrega só cookie HttpOnly. Como existe servidor, existe lugar pra client secret. Flow Auth Code clássico, sem PKCE obrigatório. Redirect URI tipicamente `/signin-oidc`."

**Mobile:**
> "Híbrido. Tecnicamente público como SPA, usa PKCE. Mas adiciona o broker do SO (Authenticator no Android, Company Portal no iOS). Quando broker está instalado, intercepta login e o token cache fica encriptado pelo TPM ou Secure Enclave — atrelado ao hardware, não à aplicação."

**Daemon:**
> "Sem usuário. Cron, worker, microservice. Autentica como ela mesma via flow **Client Credentials**. Token tem claim `roles` (não `scp`). Auditoria mostra `appid`, não `oid` de usuário. Requer admin consent — Application permissions são amplas (User.Read.All lê tenant inteiro)."

### 💡 Frase-chave

> *"Delegated = a aplicação age em nome do usuário. Application = a aplicação age como ela mesma. Mesma App Reg pode usar os dois — depende do flow."*

### ➡️ Transição

> "Com os tipos claros, agora criamos uma App Registration ao vivo. Pelo Portal — visualmente."

---

## 🎤 Bloco 4 — Criar App Reg ao vivo

**15 min** · **Tela 1:** Portal Azure → App registrations

### 📍 Ação — passo a passo Portal

| # | Onde | Click |
|---|---|---|
| 1 | Portal → Entra ID → App registrations | **+ New registration** |
| 2 | Form Register an application | Preencher: |
|   | **Name** | `recipe-1-aula-{data-de-hoje}` |
|   | **Supported account types** | **Accounts in any organizational directory** (multi-tenant) |
|   | **Redirect URI** → dropdown | **Single-page application** |
|   | **Redirect URI** → URL | `http://localhost:8080` (sem barra agora, defesa AADSTS50011 fica pro Bloco 5) |
| 3 | Final do form | **Register** |
| 4 | Overview da App Reg criada | Copiar **Application (client) ID** |
| 5 | Menu lateral → Entra ID → Enterprise applications | Filtrar por nome → confirmar SP apareceu |
| 6 | Voltar à App Reg → menu lateral | **Expose an API** |
| 7 | Expose an API | **Add** ao lado de "Application ID URI" → aceitar `api://{appId}` sugerido → **Save** |
| 8 | Expose an API | **+ Add a scope** |
| 9 | Form Add a scope | Scope name `access_as_user` · Admins and users · Enabled · **Add scope** |
| 10 | Menu lateral | **API permissions** |
| 11 | API permissions | Confirmar `User.Read` Delegated (auto-adicionado) |
| 12 | API permissions topo | **Grant admin consent for {tenant}** → Yes |

### 🎤 Fala

**Antes de criar:**
> "Vou criar uma App Registration nova, separada da `tftec-auth` em produção. Vai se chamar `recipe-1-aula-{data}`. Não vou mexer na deployed para não interromper o serviço."

**Ao explicar Supported account types:**
> "Quatro opções aqui. *This organizational directory only* é single-tenant — `signInAudience: AzureADMyOrg`. *Any organizational directory* é multi-tenant — `AzureADMultipleOrgs`, SaaS B2B. Vou marcar multi-tenant porque é o que o `tftec-auth` deployed usa."

**Ao explicar Redirect URI:**
> "O campo Redirect URI tem dois sub-campos: plataforma e URL. A plataforma muda o flow OAuth — Single-page application força PKCE e habilita CORS. Web exige client_secret, sem CORS. Mobile aceita PKCE sem CORS. Essa escolha não é cosmética — afeta o flow."

**Ao mostrar Overview:**
> "Três GUIDs aqui. **Application (client) ID** vira `client_id` no código MSAL. **Object ID** é o identificador interno desta App Registration no Graph. **Directory (tenant) ID** identifica o tenant. Application ID é público; pode vazar sem problema porque sozinho não autentica."

**Ao mostrar SP em Enterprise apps:**
> "Criamos a App Reg via Portal e o Service Principal foi criado automaticamente. Application ID idêntico nos dois lugares. Em App registrations vocês configuram. Em Enterprise applications vocês atribuem usuários."

**Ao explicar Expose an API:**
> "Aplicação ID URI define o `aud` dos tokens emitidos. Convenção `api://{appId}`. Scope `access_as_user` é o nome convencional Microsoft — vocês poderiam criar `api.read`, `api.write`. Para genérico, `access_as_user` basta. Marco *Admins and users* — usuário pode consentir no primeiro login."

**Ao explicar Grant admin consent:**
> "User.Read é user-consent-able, mas demonstro porque vão precisar no Bloco 7 com Application permissions."

### ⚠️ Pegadinhas reais (validadas)

- **Admin consent propagação:** Portal mostra status verde em segundos, mas o `appRoleAssignment` no SP leva **2-5 min** para propagar. Para Delegated User.Read é rápido. Para Application permissions, vocês veem isso no Bloco 7.
- **Scope é case-sensitive** — `Access_As_User` ≠ `access_as_user`. Mantenha minúsculas.

### 💡 Frase-chave

> *"Em quatro telas do Portal — Register, Expose an API, Add scope, Grant admin consent — vocês têm uma App Registration completa. A `tftec-auth` em produção tem exatamente essa estrutura, só com mais permissões."*

### ➡️ Transição

> "Antes de explorar o que essa App Reg emite, vou mostrar onde ela se conecta. Toda App Reg é usada por uma aplicação rodando em algum lugar — App Service. Vamos ver os 4 cliques de configuração do App Service que linkam a App Reg ao runtime."

---

## 🎤 Bloco 4b — Configurar App Service correspondente

**5 min** · **Tela 1:** Portal → App Services · **Tela 3:** frontend deployed

> Esta seção tem **demo ao vivo de troca** — vocês saem da aula tendo visto uma App Registration nova substituir a antiga **em produção**, sem rebuild.

### 4b.1 — Backend API (`authservice-api-tftec`)

#### 📍 Ação Portal — backend

| # | Onde | Click |
|---|---|---|
| 1 | Portal → App Services → `authservice-api-tftec` | menu lateral **Settings → Environment variables** |
| 2 | Tab **App settings** | Localizar `AzureAd__ClientId` |
| 3 | `AzureAd__ClientId` row | **Edit** → trocar pelo Application ID da App Reg criada no Bloco 4 |
| 4 | Mesmo trabalho pra `AzureAd__Audience` | Trocar pra `api://{novo-appId}` |
| 5 | Botão topo | **Apply** → confirma |
| 6 | App Service Overview | **Restart** (botão topo) |

#### 🎤 Fala

> "Microsoft.Identity.Web lê estas 5 vars no startup via `IConfiguration`. O duplo underscore é o separador hierárquico padrão do .NET — `AzureAd__ClientId` na env var vira `AzureAd:ClientId` na seção do `appsettings.json`."

> "Mudei `AzureAd__ClientId`. Restart aplicou. Backend agora valida tokens emitidos pra App Reg NOVA. Tokens emitidos pra App Reg antiga? Backend rejeita com 401 — `aud` mismatch."

#### ✅ Mapping App Reg → Env vars do backend

| Env var | Valor da App Reg |
|---|---|
| `AzureAd__Instance` | `https://login.microsoftonline.com/` (constante) |
| `AzureAd__TenantId` | `organizations` (multi) ou GUID do tenant (single) |
| `AzureAd__ClientId` | **Application ID da App Reg** |
| `AzureAd__ClientSecret` | Gerado em Certificates & secrets (Key Vault em prod) |
| `AzureAd__Audience` | `api://{Application ID}` |

> "O `Audience` parece redundante com o `ClientId`. Não é — é o `aud` do JWT que o backend valida. Em multi-tenant o backend pode aceitar tokens de várias clients (Pattern B), e `Audience` é o que ele confere. Em Pattern A onde backend = client, são iguais."

---

### 4b.2 — Frontend SPA (`authservice-front-tftec`) — A PEGADINHA DO VITE

#### 🧠 O conceito

> "Frontend Vite faz **build-time injection**. Quando `npm run build` roda no CI/CD, as `VITE_*` viram **strings literais no bundle JS**. Trocar a env var no Portal depois e dar Restart **NÃO afeta o bundle** — o JS gerado já tem `clientId='78345291-...'` hardcoded. Pra trocar, precisaria rebuild — 3 min via GitHub Actions."

> "Pra DEMO AO VIVO em aula, isso é inviável. Por isso o `tftec-auth` tem feature de **runtime config**: arquivo `public/config.js` com placeholders, e startup-file do App Service substitui os placeholders pelos valores das env vars **no momento que o container sobe**. Vou mostrar."

#### 📍 Ação Portal — frontend

| # | Onde | Click |
|---|---|---|
| 1 | Portal → App Services → `authservice-front-tftec` | menu lateral **Settings → Configuration** → tab **General settings** |
| 2 | Apontar **Startup Command** | Valor atual (já configurado): `sh -c "sed -i \"s\|clientId: \\\".*\\\"\|clientId: \\\"$VITE_AZURE_CLIENT_ID\\\"\|\" /home/site/wwwroot/config.js; ...; exec npx serve -s /home/site/wwwroot -l 8080"` |
| 3 | menu lateral **Settings → Environment variables** | tab **App settings** |
| 4 | `VITE_AZURE_CLIENT_ID` row | **Edit** → trocar pelo Application ID da App Reg nova |
| 5 | Trocar `VITE_AZURE_AUDIENCE` também | `api://{novo-appId}` |
| 6 | **Apply** | (App Service reinicia automático) |
| 7 | Aguardar ~15s | Refresh `/config.js` (Tela 3 com cache-bust) |
| 8 | ✅ Resultado | `window.__APP_CONFIG__.clientId = "{novo-appId}"` — substituído ao vivo |
| 9 | Refresh `/lab/tokens` (logout + login) | Token novo vem com `aud = api://{novo-appId}` |

#### 🎤 Fala

**Mostrando o Startup Command:**
> "Olhem isso. O startup do App Service não é só `npx serve`. Tem um `sed` antes — comando Unix que faz substituição em texto. Lê `/home/site/wwwroot/config.js` e troca o valor de cada campo pelo conteúdo da env var correspondente. Quando vocês trocam `VITE_AZURE_CLIENT_ID` no Portal e o container reinicia, esse sed roda **antes** de servir o frontend. Resultado: `config.js` servido pro browser tem o valor novo."

**Antes de trocar (mostrar config.js atual):**
> "Tela 3, abro DevTools → Network → recarrego. Vejam `/config.js` — `clientId: \"c24b6af2-...\"`. Esse é o valor que `azure.ts` vai usar pra MSAL."

**Após Apply + 15s:**
> "Refresh `/config.js` com cache-bust. `clientId` agora é `{novo-appId}`. Zero rebuild. Zero CI/CD. **Trocou de App Reg em 15 segundos.**"

> "Por que isso importa: vocês podem fazer canary de App Reg, A/B test de tenant, rotação de clientId em caso de incident, **sem pipeline de build**. Em produção real, vocês ainda precisariam revisar e versionar, mas a mecânica está aqui."

#### 🔬 Como funciona — explicado pedagogicamente

```
┌──────────────────────────────────────────────────────────────┐
│ 1. BUILD (CI/CD)                                              │
│    public/config.js (template com placeholders) → dist/config.js
│    Bundle JS ainda tem VITE_AZURE_CLIENT_ID embed (legacy)    │
└──────────────────────────────────────────────────────────────┘
                            ↓ deploy
┌──────────────────────────────────────────────────────────────┐
│ 2. STARTUP (container do App Service)                         │
│    sh -c "sed -i 's|clientId: \".*\"|clientId: \"$VITE_AZURE_CLIENT_ID\"|' /home/site/wwwroot/config.js; npx serve ..."
│    sed substitui placeholder pelo valor da env var REAL       │
└──────────────────────────────────────────────────────────────┘
                            ↓ container ready
┌──────────────────────────────────────────────────────────────┐
│ 3. RUNTIME (browser do user)                                  │
│    index.html → <script src="/config.js"></script>            │
│    config.js seta window.__APP_CONFIG__                       │
│    src/config/azure.ts lê window.__APP_CONFIG__ PRIMEIRO,     │
│    cai pra build-time só se placeholder não-substituído       │
└──────────────────────────────────────────────────────────────┘
                            ↓ MSAL inicializa
                          Login com clientId NOVO
```

#### ⚠️ Pegadinhas REAIS (validadas em smoke test 2026-05-13)

- **`.sh` no filesystem pode estar com CRLF.** Se vocês usarem o script `replace-runtime-config.sh` ao invés de inline sed, garante line endings LF (`.gitattributes` no repo força isso). Exit code 127 + cold start failure = CRLF no .sh. Solução validada: **inline sed no startup-file** (não depende de file system).
- **Cache do browser.** Após trocar, hard refresh (Ctrl+Shift+R) OU cache-bust (`?cb=timestamp`) — senão vocês veem o `config.js` antigo.
- **Token cached no MSAL.** Frontend troca config, mas MSAL guarda tokens no sessionStorage. Logout/login pra forçar novo token com `clientId` novo.
- **`AzureAd__Audience` no backend tem que casar.** Se frontend pede token pra `api://{novo}` mas backend espera `api://{antigo}`, JWT validation falha com 401.

#### ✅ Mapping App Reg → Env vars do frontend

| Env var | Valor |
|---|---|
| `VITE_AZURE_CLIENT_ID` | Application ID da App Reg |
| `VITE_AZURE_TENANT_ID` | `organizations` ou GUID |
| `VITE_AZURE_AUDIENCE` | `api://{Application ID}` |
| `VITE_AUTHSERVICE_URL` | `https://authservice-api-tftec.azurewebsites.net` |

### 💡 Frases-chave

> *"App Reg é o quê. App Service é o onde. Sem essas env vars, o backend não sabe de qual App Reg validar tokens, e o frontend não sabe pra qual App Reg pedir token. Auth é configuração, não código."*

> *"Build-time injection é o default do Vite. Pra demo ao vivo, runtime config via startup-file vence. Em produção real, ambos coexistem — runtime pra emergência, build-time pra performance."*

### ➡️ Transição

> "Configuração feita. Frontend e backend agora apontam pra App Reg nova. Próximo: o que essa App Reg emite — tokens reais."

---

## 🎤 Bloco 5 — URLs, URIs e tokens

**20 min** · **Tela 3:** `/lab/tokens` + **Tela 1:** Swagger deployed

### Subbloco 5a — Token JWT (10 min)

#### 📍 Ação

1. Tela 3: `https://authservice-front-tftec.azurewebsites.net` → Login Microsoft
2. Navegar `/lab/tokens` → click **Access Token**
3. Apontar claims na tela: `aud`, `iss`, `iat`, `exp`, `scp`, `oid`, `tid`
4. Copiar access_token → colar em **jwt.ms** (Tela 4) → comparar
5. Tab Anatomia (no `/lab/tokens`) → mostrar header/payload/signature

#### 🎤 Fala

> "JWT tem três partes separadas por ponto. Header (base64url) com `alg` e `kid`. Payload (base64url) com os claims. Signature (bytes) que prova emissão pelo Entra ID."

**Claims principais:**
- `aud`: audiência — pra qual API o token foi emitido. Se SPA usa esse token contra Graph, Graph rejeita por `aud` mismatch.
- `iss`: issuer. `https://login.microsoftonline.com/{tenant}/v2.0` na versão 2.0.
- `scp`: scopes delegados. **STRING** com espaços (não array).
- `oid`: Object ID do usuário no tenant. Identificador estável.
- `tid`: tenant ID — em multi-tenant, varia por cliente.

> "Backend recebe o token e Microsoft.Identity.Web faz cinco coisas: (1) decodifica header → pega `kid`. (2) Fetch JWKS — cacheado 24h. (3) Acha chave pública por `kid`. (4) RSA-Verify(public_key, payload, signature). (5) Valida `iss`, `aud`, `exp`, `nbf`. Se passar, cria `ClaimsPrincipal`."

> "Sobre Redirect URI: Entra ID faz comparação **literal byte-a-byte**. Case-sensitive no path. Trailing slash importa. Porta importa. AADSTS50011 vem daqui — registre múltiplas variantes para defesa."

### Subbloco 5b — Swagger OAuth (10 min)

#### 📍 Ação

1. Abrir `https://authservice-api-tftec.azurewebsites.net/swagger`
2. Click **🔐 Authorize** (canto superior direito)
3. Modal abre → confirmar scope `api://78345291-.../access_as_user` marcado
4. Click **Authorize** → popup Microsoft → login → consent
5. Modal fica verde → Close
6. Expandir `GET /auth/me` → **Try it out** → **Execute**
7. ✅ Resultado: HTTP 200 com claims do usuário

#### 🎤 Fala

> "Swagger UI no backend está configurado com OAuth Auth Code + PKCE direto contra Entra ID. Botão Authorize, popup, login, e qualquer endpoint testado depois carrega Bearer automaticamente."

> "Tecnicamente o Swagger UI **é uma SPA**. Por isso o Redirect URI `/swagger/oauth2-redirect.html` está registrado como SPA platform na App Reg `tftec-auth`. Configuração em código: `c.OAuthClientId(clientId)` e `c.OAuthUsePkce()` no `Program.cs` linhas 200-210."

### 💡 Frase-chave

> *"O Swagger UI vira ferramenta de exploração da API — vocês testam todos os endpoints autenticados sem montar cliente. Em produção, proteger ou desabilitar."*

### ⚠️ Pegadinhas

- Swagger Authorize falha com `AADSTS9002326` (cross-origin) se a App Reg está registrada como **Web platform** em vez de SPA. Confirme em Authentication.
- Token do Swagger fica em memória, não localStorage. Se a página reload, perde — clica Authorize de novo.

### ➡️ Transição

> "Próximo: como o token sabe que o usuário pode fazer X? Permissions e claims."

---

## 🎤 Bloco 6 — Permissions, App Roles e Consent

**15 min** · **Tela 1:** Portal → App registrations + Enterprise apps · **Tela 3:** `/lab/permissions-claims`

### Subbloco 6a — Delegated vs Application (5 min)

#### 📍 Ação

1. Tela 3: `/lab/permissions-claims` → Tab 1 (Delegated vs Application)
2. Apontar tabela comparativa
3. Tab 2 (scp vs roles) → 2 JWTs lado a lado
4. Tab 4 (Backend valida) → snippet real do `api/Program.cs:80-98`

#### 🎤 Fala

> "Delegated permissions: usadas com usuário interativo. Claim `scp`. SPA, Web, Mobile. Conteúdo do `scp` é a interseção entre o que a App Reg pediu e o que o usuário consentiu."

> "Application permissions: sem usuário. Claim `roles` (array). Daemon/CC flow. Conteúdo é o que o admin consentiu."

> "Backend ASP.NET: `RequireRole('Admin')` mapeia automaticamente do claim `roles`. Já validar `scp` precisa de `HasClaim('scp', value => value.Contains('api.read'))` — `scp` é string com espaços, não array."

### Subbloco 6b — App Roles na prática (5 min)

#### 📍 Ação Portal — Parte 1: Criar role

| # | Onde | Click |
|---|---|---|
| 1 | Portal → App registrations → `tftec-auth` → menu lateral | **App roles** |
| 2 | App roles | **+ Create app role** |
| 3 | Form Create app role | Display name `Admin` · Allowed member types **Both** · Value `Admin` · Description livre · Yes (Enabled) · **Apply** |

#### 📍 Ação Portal — Parte 2: Atribuir role

| # | Onde | Click |
|---|---|---|
| 4 | Menu lateral → Entra ID → Enterprise applications → buscar `tftec-auth` → click | (entra no SP) |
| 5 | Menu lateral do SP | **Users and groups** |
| 6 | Users and groups topo | **+ Add user/group** |
| 7 | Form | Users *None Selected* → procura seu user → Select |
| 8 | Form | Select a role *None Selected* → escolhe **Admin** → Select |
| 9 | Final | **Assign** |

#### 📍 Ação — Parte 3: Validar no token

10. Tela 3: `authservice-front-tftec.azurewebsites.net` → Logout (botão app OU `sessionStorage.clear()` em DevTools)
11. Login novamente
12. Navegar `/lab/tokens` → click **Access Token**
13. ✅ Apontar: agora aparece `"roles": ["Admin"]` no payload

#### 🎤 Fala

> "Vou criar um App Role na `tftec-auth` e atribuir a mim mesmo. Dois lugares no Portal: **App registrations** para criar o role, **Enterprise applications** para atribuir a usuários. Reflete o modelo: role definido na aplicação (App Object), atribuído a usuários no tenant (Service Principal)."

> "Form Create app role tem cinco campos. **Allowed member types: Both** porque quero que usuários humanos e Service Principals — daemons — possam receber o role. **Value: Admin** é o valor exato que aparece no claim `roles` do JWT — string match exato com `RequireRole('Admin')` no ASP.NET."

> "Criar role não atribui. Atribuir é via Enterprise applications → Users and groups. Aluno errado fica aqui — cria role, espera ver no token, e nada aparece. **Atribuição é o passo separado**."

> "Logout/login. Token cached não tem o role porque foi emitido antes da atribuição. Agora aparece `roles: ['Admin']`. Não mudei uma linha de código — só configuração no Entra ID."

### Subbloco 6c — Consent framework (5 min)

#### 🎤 Fala (conceitual, sem ação Portal aqui)

> "Existe **declaração** de permission e **consent**. Adicionar permission em API permissions é declarar. O consent acontece no Service Principal."

> "Três tipos de consent: **User consent** (user clica 'Aceitar' no primeiro login — permissions user-consent-able), **Admin consent** (admin aceita pra todos — obrigatório pra Application permissions), **Pre-authorization** (app confia em outro app explicitamente)."

> "`AADSTS65001` literalmente significa: 'permission declarada na App Reg mas não consentida no Service Principal local'. Fix: Grant admin consent."

> "Em multi-tenant esse erro aparece muito — cada tenant precisa consentir separadamente. Solução elegante: endpoint admin consent `https://login.microsoftonline.com/{tenant}/adminconsent?client_id={appId}`."

### 💡 Frase-chave

> *"Permission na App Reg = DECLARAÇÃO. Consent = ATIVAÇÃO. Sem ativação no SP local do tenant, token vem sem o claim. Daí o AADSTS65001."*

### ⚠️ Pegadinha REAL (validada em smoke test)

`Grant admin consent` no Portal mostra status verde em segundos, MAS o `appRoleAssignment` no SP leva **2-5 min** para propagar. Token Client Credentials pego antes disso vem com `roles` vazio e Graph retorna 403.

### ➡️ Transição

> "Próximo: credenciais. Como a aplicação prova quem é. Quatro formas em ordem crescente de segurança."

---

## 🎤 Bloco 7 — Credenciais e Daemon

**15 min** · **Tela 1:** Portal · **Tela 4:** jwt.ms · **Tela 2:** Cloud Shell

### Subbloco 7a — Quatro credenciais (5 min)

#### 📍 Ação

1. Tela 3: `/lab/credenciais` — matriz comparativa
2. Navegar pelas 4 tabs (Secret, Certificate, FIC, Managed Identity)
3. Apontar decision tree no final

#### 🎤 Fala (resumo)

- **Client Secret:** string gerada, válida 6-24 meses. MVP, dev local. Vaza fácil em produção.
- **Certificate:** JWT assinado com private key. Secret nunca viaja. Rotação trabalhosa.
- **Federated Identity Credential:** zero secret. App Reg confia em OIDC issuer externo (GitHub, K8s SA). Estado da arte 2024-2025.
- **Managed Identity:** Azure-only. Recurso ganha identidade gerenciada. Sem credencial pra rotacionar.

> "tftec-auth hoje: CI/CD usa FIC contra `sp-tftec-authsvc-cicd-001`. Backend runtime ainda usa Client Secret por causa de OBO/CC. Migração para MI federation está em branch."

### Subbloco 7b — Demo Daemon Client Credentials (10 min)

#### 📍 Ação Portal — criar Daemon

| # | Onde | Click |
|---|---|---|
| 1 | Portal → App registrations | **+ New registration** |
| 2 | Form | Name `recipe-5-daemon-aula-{data}` · **Accounts in this organizational directory only** (single) · Redirect URI **VAZIO** · **Register** |
| 3 | Overview | Copiar Application ID |
| 4 | Menu lateral | **Certificates & secrets** |
| 5 | Tab Client secrets | **+ New client secret** → Description `daemon-aula-secret` · Expires 6 meses · **Add** |
| 6 | ⚠️ **CRÍTICO** | Copiar **Value** AGORA — Microsoft só mostra uma vez |
| 7 | Menu lateral | **API permissions** |
| 8 | API permissions | Remover `User.Read` Delegated (não é daemon) → `...` → **Remove** |
| 9 | API permissions | **+ Add a permission** → **Microsoft Graph** → **Application permissions** → busca `User.Read.All` → check → **Add permissions** |
| 10 | API permissions topo | **Grant admin consent for {tenant}** → Yes |

#### 📍 Ação Cloud Shell — aguardar propagação

```powershell
$DAEMON_APP_ID = "{Application-ID-copiado}"
$SP_ID = az ad sp show --id $DAEMON_APP_ID --query id -o tsv

# Loop até propagação completa (2-5 min)
while ((az rest --method GET `
  --uri "https://graph.microsoft.com/v1.0/servicePrincipals/$SP_ID/appRoleAssignments" `
  --query "value" -o json | ConvertFrom-Json).Count -eq 0) {
  Write-Host "Aguardando propagação..."
  Start-Sleep 15
}
Write-Host "OK Propagou"
```

#### 📍 Ação Cloud Shell — pegar token + chamar Graph

```powershell
$DAEMON_SECRET = "{secret-copiado-do-Portal-step-6}"
$TENANT_ID = az account show --query tenantId -o tsv

$body = "grant_type=client_credentials" +
        "&client_id=$DAEMON_APP_ID" +
        "&client_secret=$DAEMON_SECRET" +
        "&scope=https%3A%2F%2Fgraph.microsoft.com%2F.default"

$resp = Invoke-RestMethod `
  -Uri "https://login.microsoftonline.com/$TENANT_ID/oauth2/v2.0/token" `
  -Method POST -ContentType "application/x-www-form-urlencoded" -Body $body

$DAEMON_TOKEN = $resp.access_token
$DAEMON_TOKEN | clip   # copiar pra clipboard

# Tela 4: jwt.ms — colar token

# Validar claim do Graph
Invoke-RestMethod -Uri "https://graph.microsoft.com/v1.0/users?`$top=5" `
  -Headers @{ Authorization = "Bearer $DAEMON_TOKEN" }
```

#### 🎤 Fala (resumida)

> "Daemon difere do SPA em três coisas no Portal: single tenant (uso interno), Redirect URI vazio (não loga interativo), Certificates & secrets em vez de PKCE."

> "Reparem que removi `User.Read` Delegated. Daemon não usa Delegated. Adicionei `User.Read.All` como **Application permission** — sufixo Role no manifest, claim `roles` no token. Application permission é ampla — `User.Read.All` lê o tenant inteiro. Por isso admin consent obrigatório."

**Ao mostrar o token em jwt.ms:**
> "Sem `scp` — não tem usuário. Tem `roles: ['User.Read.All']`. `appid` = GUID do daemon, não da `tftec-auth`. Sem `oid` de usuário, tem `oid` do Service Principal do daemon. Audiência `https://graph.microsoft.com`."

**Ao chamar Graph /users:**
> "Cinco usuários do tenant. **Daemon viu o tenant inteiro**, não só o user logado — porque não tem user. Auditoria mostra `appid={daemon-id}`. Incident response: 'qual app leu dados ontem?' → busca por `appid`."

### ⚠️ Pegadinhas REAIS (validadas)

- **Client Secret aparece UMA vez.** Não copiou na hora? Tem que gerar outro.
- **Propagação admin-consent = 2-5 min reais.** Não é 30s. Token pego antes vem com `roles` vazio.
- **`User.Read.All` requer Microsoft Graph Application — não Delegated.** Tem Delegated com mesmo nome e vocês acabam consumindo o errado.

### 💡 Frase-chave

> *"Application permissions = aplicação age sozinha, vê tenant inteiro. Delegated = aplicação age em nome do usuário, vê só o que o user vê. Auditoria sabe a diferença: `appid` vs `oid`."*

### ➡️ Transição

> "Antes de cair em código real, mais uma demo: como configurar o Function App / Container que vai rodar esse daemon."

---

## 🎤 Bloco 7c — Configurar Function/Container do Daemon

**3 min** · **Tela 1:** Portal → Function App / Container Apps / AKS

### 📍 Ação (demonstrativa — sem alterar nada em prod)

| # | Onde | Action |
|---|---|---|
| 1 | Portal → Function App OU Container App OU AKS pod | menu Settings → **Environment variables** |
| 2 | Mostrar 3 env vars típicas: | `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET` |
| 3 | Hipotético: edit → trocar valores pelos do daemon recém-criado | (não execute em prod) |
| 4 | Save → Restart | (não execute) |

### 🎤 Fala

> "Daemon não roda em App Service web típico. Geralmente Function App agendada, Container App, ou pod AKS. O comum: três env vars que o código MSAL lê."

> "Function App: Settings → Environment variables. Container App: Containers → Edit → Environment variables. AKS: `env:` no Deployment OU `secretRef` para Secret do Kubernetes."

### 📋 Mapping

| Env var | Origem |
|---|---|
| `AZURE_CLIENT_ID` | Application ID do daemon |
| `AZURE_TENANT_ID` | GUID do tenant (single) |
| `AZURE_CLIENT_SECRET` | Secret copiado em Certificates & secrets |

### ⚠️ Pegadinha

Em produção, NUNCA hardcode secret. Padrões:
- Function/Container App: referência Key Vault — `@Microsoft.KeyVault(SecretUri=https://...)`
- AKS: Secret do Kubernetes via `secretRef`, OU **Workload Identity** (Recipe 8) — abandona secret.

### 💡 Frase-chave

> *"Prefixos diferem por SDK: `AzureAd__*` em .NET (Microsoft.Identity.Web), `AZURE_*` em Node/Python (Azure SDK). Não é regra técnica — é convenção por linguagem."*

### ➡️ Transição

> "Próximo: multi-tenant. Pattern A vs Pattern B, B2B, AADSTS7000229."

---

## 🎤 Bloco 8 — Multi-tenant e padrões

**10 min** · **Tela 3:** `/lab/multi-app` → Tab 1

### 📍 Ação

1. Tela 3: `/lab/multi-app` Tab 1 (Pattern A vs B)
2. Apontar diagrama Pattern A — 1 App Reg pra SPA + API (igual `tftec-auth`)
3. Mostrar diagrama Pattern B — 2 App Regs separadas
4. Tab 2 (Single vs Multi-tenant) — tabela `signInAudience`
5. Tab 3 (B2B) — claims `idp`, `tid`, `oid` em guest users

### 🎤 Fala

> "Multi-tenant: `signInAudience = AzureADMultipleOrgs`. Aplicação aceita login de usuários de qualquer tenant Entra ID. Cliente A do tenant dele, cliente B do tenant dele — mesma App Registration."

**Pattern A vs B:**
> "Pattern A: 1 App Reg pra SPA + API. Mais simples. Funciona MVP, time único. tftec-auth usa isso."

> "Pattern B: 2 App Regs separadas. API com Expose an API. Cliente com API permissions cross-app. Token tem `appid` do cliente e `aud` da API. Auditoria fina, múltiplos clientes na mesma API. Boilerplate maior."

> "Quando migrar A → B? Quando aparecer o segundo consumidor. Antes disso, Pattern A é suficiente."

**AADSTS7000229:**
> "Erro em multi-tenant: 'The application is missing service principal in the tenant'. Acontece quando user de tenant novo tenta logar e o SP nunca foi provisionado lá. Solução: admin do tenant cliente roda `az ad sp create --id {appId}`, OU acessa endpoint admin consent."

### 💡 Frase-chave

> *"1 App Object no seu tenant, N Service Principals nos tenants dos clientes. Multi-tenant é literalmente isso."*

### ➡️ Transição

> "Quero mostrar isso em prática agora — vou provisionar SP da `tftec-auth` num tenant externo de verdade."

---

## 🎤 Bloco 8a — Demo Recipe 7 ao vivo

**5 min** · **Tela 2:** Cloud Shell em tenant externo

> **Pré-requisito:** ter feito `az login --tenant {external-tenant-id}` antes da aula. Validado real em smoke test: `Integração e mensageria` (`4fd61b65-04be-4716-a1d6-2440c795a06c`).

### 📍 Ação Cloud Shell

```powershell
# 1) Trocar pro tenant externo (se ainda não estiver)
az account set --subscription "{sub-id-do-tenant-externo}"
az account show --query "{name:name, tenantId:tenantId}" -o table

# 2) Provisionar SP da tftec-auth no tenant externo
az ad sp create --id 78345291-2586-4691-b1f9-e4e780f55328

# 3) Confirmar SP criado
az ad sp list --filter "appId eq '78345291-2586-4691-b1f9-e4e780f55328'" `
  --query "[0].{id:id, appId:appId, owner:appOwnerOrganizationId}" -o table

# 4) Admin consent programático para todas as permissions Delegated
$SP_EXTERNAL = "{SP-Object-ID-do-passo-3}"
$GRAPH_SP_ID = az ad sp list --filter "appId eq '00000003-0000-0000-c000-000000000000'" --query "[0].id" -o tsv

$body = @{
  clientId    = $SP_EXTERNAL
  consentType = "AllPrincipals"
  resourceId  = $GRAPH_SP_ID
  scope       = "User.Read User.ReadWrite.All Directory.ReadWrite.All Application.Read.All Application.ReadWrite.All AuditLog.Read.All openid profile offline_access"
} | ConvertTo-Json -Compress
$bodyEsc = $body -replace '"', '\"'

az rest --method POST `
  --uri "https://graph.microsoft.com/v1.0/oauth2PermissionGrants" `
  --headers "Content-Type=application/json" --body $bodyEsc

# 5) Validar grants
az rest --method GET `
  --uri "https://graph.microsoft.com/v1.0/oauth2PermissionGrants?`$filter=clientId eq '$SP_EXTERNAL'" `
  --query "value[].{consent:consentType, scopes:scope}" -o table
```

### 🎤 Fala

> "Tenho dois tenants Entra ID separados: TFTEC, onde a `tftec-auth` vive, e `Integração e mensageria`, completamente independente. Vamos provisionar o SP da `tftec-auth` no tenant externo via Graph API e fazer admin consent programaticamente."

**Ao mostrar SP criado:**
> "Reparem três campos: `id` é Object ID **local** ao tenant externo — diferente do Object ID do SP no tenant home. `appId` é igual em ambos — identidade global. `appOwnerOrganizationId` aponta pro tenant home (TFTEC), indicando que esse SP é instância local de App Reg que vive em outro lugar."

**Ao explicar admin consent programático:**
> "`oauth2PermissionGrant` com `consentType: AllPrincipals` é o equivalente programático do botão 'Grant admin consent' do Portal. AllPrincipals = admin consent for all users of the tenant. Em automação de onboarding B2B, vocês fazem exatamente isso quando provisionam um cliente novo."

### ⚠️ Pegadinha REAL (descoberta no smoke test)

URL admin consent (`https://login.microsoftonline.com/{external}/adminconsent?client_id=...`) **pode falhar silenciosamente** se a conta admin tem outro tenant como home. Entra ID resolve a conta pro tenant home, o consent acaba acontecendo lá em vez do tenant alvo. Resultado: você vê 'sucesso' mas o SP no tenant alvo continua não existindo.

**Solução validada:** provisionar SP via `az ad sp create` no contexto do tenant externo (após `az login --tenant {external}`). Funciona sempre.

### 💡 Frase-chave

> *"Admin consent programático é o que SaaS B2B faz quando onboarding cliente novo. Job pega tenant ID do cliente, provisiona SP, consente automático. Tudo via Graph."*

### ➡️ Transição

> "Próximo: como tudo isso conecta no código do tftec-auth."

---

## 🎤 Bloco 9 — Integração no código

**10 min** · **Tela:** VSCode ou GitHub.com com `tftec-auth`

### Subbloco 9a — Front-end (5 min)

#### 📍 Ação
1. Abrir `src/config/azure.ts` em VSCode/GitHub
2. Apontar 3 fontes em cascata (runtime → build-time → default)
3. Abrir `src/config/msal.ts` — `PublicClientApplication` config
4. Abrir `src/App.tsx` linha do `MsalProvider`
5. Abrir `src/hooks/useAuthService.ts` — uso do `acquireTokenSilent`

#### 🎤 Fala

> "Frontend usa MSAL.js. Config em três arquivos: `src/config/azure.ts` lê `clientId`/`tenantId`/`audience` de três fontes em ordem — runtime config (`window.__APP_CONFIG__`), build-time (`import.meta.env.VITE_*`), default hardcoded."

> "`src/config/msal.ts` configura `PublicClientApplication` com instance, authority, redirectUri. Passa como prop pro `MsalProvider` em `src/App.tsx`."

> "Qualquer componente que precisa de token: `useMsal()` hook → `acquireTokenSilent(scopes)`. MSAL cuida do refresh silencioso. Se silent falha (consent necessário), joga `InteractionRequiredAuthError` — fallback `acquireTokenPopup`."

### Subbloco 9b — Back-end (5 min)

#### 📍 Ação
1. Abrir `api/Program.cs` linha `AddMicrosoftIdentityWebApi`
2. Apontar bind de `AzureAd` section
3. Linhas 80-98 — 4 policies (RequireApiRead, RequireApiWrite, RequireAdminRole, RequireUserRole)
4. Linhas 55-78 — multi-tenant validation custom

#### 🎤 Fala

> "Microsoft.Identity.Web faz tudo. Uma linha:

```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));
```

> "Lê config da seção AzureAd. Configura JWT Bearer authentication. Conecta com metadata do Entra ID. Cacheia JWKS. Adiciona middleware que valida em cada request."

> "Policies em `Program.cs:80-98`. Duas baseadas em scope delegado (`HasClaim('scp', ...)`). Duas baseadas em role (`RequireRole`). Padrão: declarar policies explícitas, aplicar `[Authorize(Policy='...')]` nos controllers."

**Multi-tenant trick:**
> "`Microsoft.Identity.Web` por default valida issuer contra lista fixa — quebra multi-tenant. Solução em `Program.cs:55-78`: desliga validação built-in, valida `tid` claim manualmente contra lista de tenants permitidos."

### 💡 Frase-chave

> *"Microsoft.Identity.Web abstrai 99% do trabalho de validação JWT. Vocês escrevem policies; o framework valida assinatura, claims, JWKS cache. Reinventar isso é desnecessário."*

### ➡️ Transição

> "Último bloco: troubleshooting. AADSTS por estágio do flow."

---

## 🎤 Bloco 10 — Diagnóstico AADSTS

**5 min** · **Tela:** Portal Sign-in logs OU print de erro real

### 🎤 Fala

> "Erro Entra ID tem formato `AADSTS` + 5-7 dígitos. Não é random — range indica o estágio do flow onde falhou."

### 📋 Ranges principais

| Range | Estágio | Exemplos |
|---|---|---|
| **50000-50299** | Authorize (login UI / consent) | 50011 (redirect mismatch), 50194 (single tenant + user externo) |
| **65000-65099** | Consent stage | 65001 (consent required), 65004 (user declined) |
| **70000-70099** | Token stage (`/token`) | 70008 (code expired), 70021 (FIC no match) |
| **90000-90999** | Generic | 90014 (required field missing), 90094 (admin consent required) |
| **7000000+** | App-specific | 7000218, 7000229 (multi-tenant SP missing) |

### 🔧 Workflow de debug em 30s

1. Pegue o número AADSTS
2. Identifique o estágio (range)
3. Reproduza com Network tab aberto — vê qual request falhou
4. Leia `error_description` no response (Entra ID é verboso em erros de config)

### 📋 Top 5 erros prático

- **50011** (Redirect mismatch): `redirect_uri` no request difere de `replyUrls[]`. Trailing slash, case, porta — tudo conta.
- **65001** (Consent missing): permission declarada mas não consentida no SP. Fix: Grant admin consent.
- **7000229** (SP missing): multi-tenant + tenant cliente não tem SP local. Fix: `az ad sp create` no tenant cliente.
- **9002326** (Cross-origin): App Reg registrada como Web em vez de SPA. Fix: re-registrar como SPA platform.
- **70021** (FIC no match): subject id_token GitHub não bate com FIC. Confira branch (`main` vs `master`), repo exato.

### 💡 Frase-chave

> *"Entra ID é verboso em erros de configuração porque eles são intencionais pra developer. Confiem na mensagem — `error_description` é específico."*

---

## 🎤 Bloco 11 — Fechamento

**5 min** · **Tela 3:** `/lab` Hub

### 📍 Ação
1. Tela 3: `/lab` Hub mostra os 9 labs
2. Apontar `/lab/recipes` (10 receitas com copy-to-clipboard)
3. Mostrar URL do repo público no GitHub

### 🎤 Fala (resumo da aula)

> "Em duas horas: três objetos fundamentais (App Object, SP, Enterprise App). Cinco tipos de aplicação. Criação ao vivo via Portal — 4 telas. Modelo de tokens JWT. Diferença Delegated vs Application. Quatro credenciais. Multi-tenant Patterns A/B. Integração MSAL.js + Microsoft.Identity.Web. Diagnóstico AADSTS por estágio."

> "O `authservice-front-tftec.azurewebsites.net` continua acessível. Nove labs interativos. Em ordem de relevância pra estudo:"

- `/lab/recipes` — 10 receitas hands-on com `az` copy-pasta. Bookmark.
- `/lab/demo` — execução real contra Graph. OBO chains, Client Credentials, SPA.
- `/lab/tokens` — JWT decoder integrado MSAL. Cola token, vê claims.
- `/lab/permissions-claims` — Delegated vs Application com mais profundidade.
- `/lab/credenciais` — 4 credenciais com decision tree.

> "Repositório público no GitHub: código + `docs/aula/hands-on.md` (10 capítulos, 90 min de leitura) + `docs/aula/app-reg-recipes.md` (referência longa) + FAQ com 30 perguntas comuns."

> "Perguntas?"

---

## 📚 Apêndice A — Q&A pré-redigida

> Use Ctrl+F durante o Bloco 11. 14 perguntas que vão aparecer.

### "Como diferencio App Object de Service Principal na linha de comando?"

App Object usa `az ad app`. Service Principal usa `az ad sp`. Cada um tem `id` próprio (Object ID distinto). Ambos compartilham `appId` (Application ID). `az ad app --id` aceita tanto Application ID quanto Object ID do App. `az ad sp --id` aceita ambos do SP. Graph REST `GET /applications/{id}` exige Object ID do App.

### "Posso usar o mesmo client_id em duas aplicações?"

Não. `client_id` = `appId`, único globalmente. Duas opções para apps compartilharem identidade: (a) usar a mesma App Reg (Pattern A), (b) criar duas App Regs com pre-authorization entre elas.

### "Por que App Registration tem dois Object IDs?"

Graph data model: `/applications/{id}` armazena App Object (Object ID próprio). `/servicePrincipals/{id}` armazena SP (Object ID próprio). Os dois Object IDs são GUIDs distintos. `appId` é compartilhado. Modificar manifest/app roles → Object ID do App. Atribuir users/consent → Object ID do SP.

### "Como faço App Reg visível para outros tenants?"

Não há configuração explícita. `signInAudience = AzureADMultipleOrgs` basta. Primeiro user de outro tenant que tenta logar, Entra ID resolve via `appId` no `/authorize`, mostra consent, ao consentir provisiona SP no tenant dele. Se quiser provisionar antes: endpoint admin consent `https://login.microsoftonline.com/{tenant}/adminconsent?client_id={appId}`.

### "Posso ter Client Secret e Certificate na mesma App Registration?"

Sim. App Reg aceita múltiplas credenciais simultaneamente — vários secrets, certificados, FICs. Útil para rotação sem downtime: gera novo, deploya, valida, revoga antigo.

### "FIC funciona para workflows que rodam em PR ou só push?"

Ambos, mas subject do id_token difere. Push em main: `repo:org/repo:ref:refs/heads/main`. PR: `repo:org/repo:pull_request`. Crie FICs separadas. Sem wildcards.

### "Como troco o `clientId` da aplicação deployed sem fazer rebuild?"

Frontend Vite faz build-time injection. Padrão antigo: rebuild via CI/CD, 3 min. Padrão novo (Story 1.21): `public/config.js` com placeholders + startup script do App Service substitui por env vars. Trocar = update env var no Portal + Restart. 30 segundos.

### "Posso usar Managed Identity em vez de Client Secret no backend?"

Para Azure→Azure (Storage, KeyVault, SQL): sim, direto via `DefaultAzureCredential`. Para Graph ou OIDC: precisa MI como **Federated Credential** da App Reg. MI gera id_token, usado como `client_assertion` para autenticar como a App Reg. Branch `feat/fic-end-to-end` tem isso preparado.

### "Onde fica o token cache em produção multi-instância?"

Microsoft.Identity.Web suporta cache distribuído. `tftec-auth` `Program.cs:31-47`: se `Redis:ConnectionString` setada, usa StackExchangeRedisCache; senão, `AddDistributedMemoryCache` in-process. Produção com load balancer: Redis. Senão, cada instância pede token próprio, rate limit Microsoft.

### "Como descubro qual permission ID corresponde a uma scope/role no Graph?"

`az ad sp show --id 00000003-0000-0000-c000-000000000000 --query "oauth2PermissionScopes" -o table` (Delegated). Trocar pra `appRoles` (Application). Doc Microsoft Graph permissions reference também lista todos com GUIDs.

### "Multi-tenant e B2C são a mesma coisa?"

Não. Multi-tenant aceita users de outros tenants Entra ID (empresas). B2C / External ID for Customers aceita consumer (Gmail, Facebook, email). Produtos diferentes. SaaS empresa = multi-tenant. App consumer = External ID for Customers (Azure AD B2C está em retirement).

### "Por que vejo `azp` em vez de `appid` em alguns tokens?"

Versão. Tokens v1 usam `appid`. v2 usa `azp` (authorized party). `tftec-auth` configura v2 — você vê `azp`. Código compatível: valida o que existir.

### "Como debug FIC quando workflow falha com AADSTS70021?"

Logue o id_token GitHub antes do `azure/login`:

```yaml
- name: Debug OIDC
  run: |
    IDTOKEN=$(curl -H "Authorization: bearer $ACTIONS_ID_TOKEN_REQUEST_TOKEN" \
      "$ACTIONS_ID_TOKEN_REQUEST_URL&audience=api://AzureADTokenExchange" | jq -r .value)
    echo "$IDTOKEN" | cut -d'.' -f2 | base64 -d | jq .
```

Compare subject, repo, ref exatos com o subject configurado na FIC.

### "Por que admin consent demora pra propagar?"

Eventual consistency entre os sistemas Entra ID. `Grant admin consent` cria o `appRoleAssignment` instantâneo no metadata, mas a propagação até o sistema de emissão de tokens leva 2-5 min. Token Client Credentials pego antes vem com `roles` vazio. Aguardar OU loop check em `GET /servicePrincipals/{id}/appRoleAssignments` até count > 0.

---

## 🆘 Apêndice B — Plano B

> Cenários de falha durante a aula + fallbacks executáveis.

| Sintoma | Bloco afetado | Fallback |
|---|---|---|
| Cloud Shell trava / pede storage | Início ou meio | PowerShell local com `az login`. Mesmos comandos. |
| Portal Azure lento (>5s/click) | Qualquer | Faça via `az` (cheat-sheet em `docs/aula/cheat-sheet.md`). |
| `authservice-front-tftec` retorna 5xx | Bloco 6, 9 | Use `/swagger` deployed pra demo de tokens. Skipa logout/login. |
| App Reg `tftec-auth` quebrada | Bloco 6 | Use `tftec-auth-DEMO-BACKUP` OU faça App Role numa `recipe-*` criada na aula. |
| Swagger Authorize falha cross-origin | Bloco 5b | Confirma Redirect URI `/swagger/oauth2-redirect.html` como **SPA** (não Web). |
| Token sem `roles` mesmo após atribuir App Role | Bloco 6b | Cache MSAL. F12 → Application → Session Storage → clear → F5 → relogin. |
| Daemon Client Credentials retorna 403 Graph | Bloco 7 | **2-5 min** de propagação após admin-consent. Loop check: `az rest --method GET /servicePrincipals/{sp-id}/appRoleAssignments`. Não 30s. |
| URL admin consent pra tenant externo "logou" mas SP não apareceu | Bloco 8a | Conta admin tem outro tenant como home. Entra ID resolveu lá. **Workaround:** `az ad sp create --id {appId}` no contexto do tenant externo via `az login --tenant {ext}`. |
| `az ad app update --set spa.redirectUris=...` falha | Apêndice C (CLI) | Bug — `spa` é null em App Reg nova. Use `az rest --method PATCH` direto no Graph. |
| `az ad app update --app-roles=...` falha JSON quoting | Apêndice C (CLI) | PowerShell remove aspas. Use arquivo: `az ad app update --app-roles @file.json` OU `az rest PATCH`. |

---

## 💻 Apêndice C — Equivalentes CLI

> Cada operação que vocês fazem clicando no Portal tem equivalente em `az`. Para automação CI/CD.

### Bloco 4 — Criar App Registration SPA

```powershell
# 1) Criar App Reg multi-tenant
$APP_ID = az ad app create `
  --display-name "minha-app" `
  --sign-in-audience AzureADMultipleOrgs `
  --query appId -o tsv

# 2) Criar Service Principal
az ad sp create --id $APP_ID

# 3) SPA Redirect URI — workaround do bug `--set spa.redirectUris`
$OBJECT_ID = az ad app show --id $APP_ID --query id -o tsv
$body = @{ spa = @{ redirectUris = @("http://localhost:8080/") } } | ConvertTo-Json -Depth 5 -Compress
$bodyEsc = $body -replace '"', '\"'
az rest --method PATCH `
  --uri "https://graph.microsoft.com/v1.0/applications/$OBJECT_ID" `
  --headers "Content-Type=application/json" --body $bodyEsc

# 4) Identifier URI
az ad app update --id $APP_ID --identifier-uris "api://$APP_ID"

# 5) Permission Graph User.Read (Delegated)
$GRAPH_APP_ID = "00000003-0000-0000-c000-000000000000"
az ad app permission add --id $APP_ID --api $GRAPH_APP_ID `
  --api-permissions e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope

# 6) Admin consent
az ad app permission admin-consent --id $APP_ID
```

> Scope `access_as_user` via CLI = Graph PATCH em `api.oauth2PermissionScopes` (manual). Recomendo Portal pra essa parte.

### Bloco 6b — Criar e atribuir App Role

```powershell
# Workaround do bug `--app-roles` em PowerShell (JSON quoting): via Graph PATCH
$OBJECT_ID = az ad app show --id $APP_ID --query id -o tsv
$body = @{
  appRoles = @(@{
    id                 = [guid]::NewGuid().ToString()
    isEnabled          = $true
    origin             = "Application"
    allowedMemberTypes = @("User", "Application")
    displayName        = "Admin"
    description        = "Pode aprovar"
    value              = "Admin"
  })
} | ConvertTo-Json -Depth 10 -Compress
$bodyEsc = $body -replace '"', '\"'
az rest --method PATCH `
  --uri "https://graph.microsoft.com/v1.0/applications/$OBJECT_ID" `
  --headers "Content-Type=application/json" --body $bodyEsc

# Atribuir user ao role
$SP_ID = az ad sp show --id $APP_ID --query id -o tsv
$USER_ID = az ad user show --id "user@tenant" --query id -o tsv
$ROLE_ID = "{appRoleId-criado-acima}"

$assignBody = @{ principalId = $USER_ID; resourceId = $SP_ID; appRoleId = $ROLE_ID } | ConvertTo-Json -Compress
$assignBodyEsc = $assignBody -replace '"', '\"'
az rest --method POST `
  --uri "https://graph.microsoft.com/v1.0/servicePrincipals/$SP_ID/appRoleAssignedTo" `
  --headers "Content-Type=application/json" --body $assignBodyEsc
```

### Bloco 7b — Criar Daemon

```powershell
# 1) App Reg single-tenant
$DAEMON_APP_ID = az ad app create `
  --display-name "daemon-app" --sign-in-audience AzureADMyOrg `
  --query appId -o tsv
az ad sp create --id $DAEMON_APP_ID

# 2) Client Secret
$SECRET = az ad app credential reset --id $DAEMON_APP_ID --years 1 --query password -o tsv

# 3) Application permission Graph User.Read.All
az ad app permission add --id $DAEMON_APP_ID --api $GRAPH_APP_ID `
  --api-permissions df021288-bdef-4463-88db-98f22de89214=Role

# 4) Admin consent
az ad app permission admin-consent --id $DAEMON_APP_ID

# 5) AGUARDAR propagação (2-5 min)
$SP_ID = az ad sp show --id $DAEMON_APP_ID --query id -o tsv
while ((az rest --method GET `
  --uri "https://graph.microsoft.com/v1.0/servicePrincipals/$SP_ID/appRoleAssignments" `
  --query "value" -o json | ConvertFrom-Json).Count -eq 0) {
  Start-Sleep 15
}

# 6) Token Client Credentials + Graph call
$TENANT_ID = az account show --query tenantId -o tsv
$body = "grant_type=client_credentials&client_id=$DAEMON_APP_ID&client_secret=$SECRET&scope=https%3A%2F%2Fgraph.microsoft.com%2F.default"
$TOKEN = (Invoke-RestMethod -Uri "https://login.microsoftonline.com/$TENANT_ID/oauth2/v2.0/token" `
  -Method POST -ContentType "application/x-www-form-urlencoded" -Body $body).access_token

Invoke-RestMethod -Uri "https://graph.microsoft.com/v1.0/users?`$top=5" `
  -Headers @{ Authorization = "Bearer $TOKEN" }
```

### Bloco 8a — Provisionar SP em tenant externo (Recipe 7)

```powershell
# 1) Logar no tenant externo
az login --tenant "{external-tenant-id}"

# 2) Provisionar SP da App Reg do tenant home (que vive em outro lugar)
az ad sp create --id "{appId-do-tenant-home}"

# 3) Admin consent programático
$SP_EXT = az ad sp list --filter "appId eq '{appId}'" --query "[0].id" -o tsv
$GRAPH_SP = az ad sp list --filter "appId eq '00000003-0000-0000-c000-000000000000'" --query "[0].id" -o tsv

$body = @{
  clientId = $SP_EXT; consentType = "AllPrincipals"; resourceId = $GRAPH_SP
  scope = "User.Read openid profile offline_access"
} | ConvertTo-Json -Compress
$bodyEsc = $body -replace '"', '\"'
az rest --method POST `
  --uri "https://graph.microsoft.com/v1.0/oauth2PermissionGrants" `
  --headers "Content-Type=application/json" --body $bodyEsc
```

### Custom Claims (Optional Claims via Manifest)

```powershell
# Workaround do bug `--optional-claims` em PowerShell: via Graph PATCH
$OBJECT_ID = az ad app show --id $APP_ID --query id -o tsv
$body = @{
  optionalClaims = @{
    idToken     = @(
      @{ name = "email";  source = $null; essential = $false; additionalProperties = @() }
      @{ name = "groups"; source = $null; essential = $false; additionalProperties = @() }
    )
    accessToken = @(
      @{ name = "ipaddr"; source = $null; essential = $false; additionalProperties = @() }
    )
    saml2Token  = @()
  }
} | ConvertTo-Json -Depth 10 -Compress
$bodyEsc = $body -replace '"', '\"'

az rest --method PATCH `
  --uri "https://graph.microsoft.com/v1.0/applications/$OBJECT_ID" `
  --headers "Content-Type=application/json" --body $bodyEsc
```

---

## 🧹 Apêndice D — Cleanup pós-aula

```powershell
# Listar tudo que foi criado durante a aula
az ad app list --filter "startsWith(displayName, 'recipe-')" `
  --query "[].{name:displayName, appId:appId}" -o table

# Deletar uma específica
az ad app delete --id "{appId}"

# Deletar TODAS de uma vez (CUIDADO — confirme a lista antes)
az ad app list --filter "startsWith(displayName, 'recipe-')" --query "[].appId" -o tsv | `
  ForEach-Object { az ad app delete --id $_ }

# Remover App Role criado durante a aula na tftec-auth
$OBJECT_ID = az ad app show --id "78345291-2586-4691-b1f9-e4e780f55328" --query id -o tsv
$body = '{"appRoles":[]}'
az rest --method PATCH `
  --uri "https://graph.microsoft.com/v1.0/applications/$OBJECT_ID" `
  --headers "Content-Type=application/json" --body $body

# Remover SP da tftec-auth de tenant externo (se criou pra Recipe 7)
az login --tenant "{external-tenant-id}"
$SP_EXT = az ad sp list --filter "appId eq '78345291-2586-4691-b1f9-e4e780f55328'" --query "[0].id" -o tsv
az ad sp delete --id $SP_EXT

Write-Host "OK Cleanup completo"
```
