# 🧪 Lab Modules — Status e Roadmap

> Documentação dos 8 módulos do `/lab` no `tftec-auth`.

**Última atualização:** 2026-05-13
**Status atual:** 9 módulos LIVE (8 originais + Recipes bônus), 0 placeholder. Roadmap completo + extra.

---

## 📊 Matriz de Status

| # | Módulo | Rota | Status | Implementação |
|---|--------|------|--------|---------------|
| 1 | **Demo Interativa** | `/lab/demo` | ✅ LIVE | SequencePlayer + EventTimeline + 4 cenários reais com botão "Executar de verdade" |
| 2 | **Tokens & JWT** | `/lab/tokens` | ✅ LIVE | JwtDecoder + 4 tabs (Decoder, Anatomia, v1 vs v2, ID vs Access) |
| 3 | **Fluxos OAuth** | `/lab/fluxos` | ✅ LIVE | 4 simuladores animados (Auth Code+PKCE, CC, OBO, Device Code) |
| 4 | **Protocolos** | `/lab/protocolos` | ✅ LIVE | Matriz comparativa OIDC/OAuth/SAML/WS-Fed + 4 tabs deep-dive (criado em + para que serve + mensagem típica + Mermaid + quando usar + trade-offs + exemplo real) + decision tree no rodapé |
| 5 | **Multi-App Patterns** | `/lab/multi-app` | ✅ LIVE | 4 tabs: Pattern A vs B (com decision tree); Single vs Multi-tenant + AADSTS7000229; B2B External Identities; OBO chains 3+ saltos |
| 6 | **Credenciais** | `/lab/credenciais` | ✅ LIVE | Matriz comparativa + 4 tabs deep-dive (Client Secret / Certificate / FIC / Managed Identity) + workflow real do `tftec-auth` com FIC + decision tree |
| 7 | **Permissions & Claims** | `/lab/permissions-claims` | ✅ LIVE | 5 tabs: Delegated vs Application; `scp` vs `roles` lado-a-lado; App Roles/Groups/Directory Roles matriz; backend validation (snippets reais do `api/Program.cs`); admin consent flow (Mermaid) |
| 8 | **Topologias** | `/lab/topologias` | ✅ LIVE | Galeria visual de 6 arquiteturas (SPA, Web App, Mobile, Daemon, Microservices+APIM, Service Mesh+Workload Identity) — stack, diagrama Mermaid, prós/contras, quando usar |

---

## ✅ Módulos LIVE — O que cada um faz

### 1. Demo Interativa (`/lab/demo`)
**Propósito:** Levar o aluno do diagrama animado pra execução real em 1 click.

**Componentes:**
- 3 colunas: **Cenário** (radio) | **Sequence Player** (Mermaid animado) | **Event Timeline** (log live)
- 4 cenários: spa-login-api, obo, client-credentials, saml (informativo)
- Botão "Executar de verdade" — chama API e Graph reais

**Pedagogia:** Estado-final do aluno depois de completar tópicos teóricos.

### 2. Tokens & JWT (`/lab/tokens`)
**Propósito:** Demystificar JWT.

**Componentes:**
- Tab **Decoder** — JwtDecoder interativo (cole token → vê claims)
- Tab **Anatomia** — header.payload.signature visual
- Tab **v1 vs v2** — tabela comparativa dos 2 endpoints OAuth
- Tab **ID vs Access** — diferença + audience pattern

**Pedagogia:** Após [hands-on Cap 4 — Tokens](./hands-on.md#cap-4--tokens-15-min), aluno usa pra ver claims dos próprios tokens.

### 3. Fluxos OAuth (`/lab/fluxos`)
**Propósito:** Animar os 4 flows mais comuns sem hands-on.

**Componentes:**
- 4 tabs: Auth Code+PKCE, Client Credentials, OBO, Device Code
- Cada um: Mermaid sequence diagram + SequencePlayer (▶ play)
- CTA "Executar de verdade →" leva pra `/lab/demo`

**Pedagogia:** Página de overview/teoria. Demo Interativa é onde se pratica.

> **Diferença Fluxos vs Demo Interativa:** Fluxos é só animação didática. Demo Interativa adiciona execução real + EventTimeline com requests/responses live.

### 4. Topologias (`/lab/topologias`) — LIVE desde 2026-05-13 (Story 1.8)
**Propósito:** Mostrar como Entra ID se encaixa em 6 arquiteturas reais, lado a lado.

**Componentes:**
- Lista lateral com 6 topologias (SPA, Web App tradicional, Mobile nativo, Daemon, Microservices+APIM, Service Mesh+Workload Identity)
- Pra cada uma: Stack, diagrama Mermaid, fluxo de auth (5 passos), prós, trade-offs, quando usar, credencial recomendada, exemplo real (refs ao `tftec-auth`)
- Topologia "Service Mesh + Workload Identity" marcada como ⚡ Avançado

**Pedagogia:** Página complementar ao [hands-on Cap 1](./hands-on.md#cap-1-escolher-tipo-de-aplicação). Cap 1 dá a matriz de decisão; este lab dá o deep-dive visual + trade-offs.

### ✨ Recipes (`/lab/recipes`) — LIVE desde 2026-05-13 (Story 1.18, bônus pós-roadmap)
**Propósito:** Receitas hands-on copy-pasta. Diferente dos outros 8 labs (que **explicam** conceitos), este lab **constrói** — alunos copiam comandos `az` e criam diferentes estilos de App Reg na própria conta.

**Componentes:**
- Sidebar com 10 receitas + badge de complexidade (⭐ a ⭐⭐⭐⭐)
- Detail card: cenário + quando usar / não usar + decisões críticas (tabela) + setup `az` (passos numerados com copy-to-clipboard) + Portal steps + integração no código + validação + pitfalls (3-5 AADSTS por receita)
- Componente reutilizável `<CopyableSnippet>` (clipboard API + toast)
- Apêndice cross-cutting no doc markdown: Claims/Roles/Swagger/Protocolos/Multi-tenant

**10 receitas:**
1. SPA multi-tenant + API juntos (Pattern A) — ⭐
2. SPA + API separadas (Pattern B) — ⭐⭐
3. Web App tradicional ASP.NET MVC — ⭐⭐
4. Mobile nativo Android+MSAL — ⭐⭐⭐
5. Daemon com Client Secret — ⭐⭐
6. Daemon com FIC (GitHub Actions) — ⭐⭐⭐
7. B2B SaaS multi-tenant — ⭐⭐⭐
8. AKS Workload Identity — ⭐⭐⭐⭐
9. Custom Claims (App Roles + Optional) — ⭐⭐⭐
10. Swagger UI com OAuth2 — ⭐⭐

**Pedagogia:** Complementa hands-on Cap 2 (que cria UMA App Reg) com 10 cenários alternativos. Bom material pra próximo passo do aluno: "criei minha primeira App Reg, agora quero criar X específico". Doc markdown: `docs/aula/app-reg-recipes.md` (versão offline/imprimível).

### 4. Protocolos (`/lab/protocolos`) — LIVE desde 2026-05-13 (Story 1.14)
**Propósito:** Comparativo histórico-conceitual dos 4 protocolos de federation que aparecem em integração enterprise — OIDC, OAuth 2.0, SAML 2.0, WS-Fed.

**Componentes:**
- Matriz comparativa inicial (4 colunas: Protocolo, Criado em, Formato, Auth ou Authz?, Status)
- 4 tabs deep-dive (OIDC / OAuth 2.0 / SAML 2.0 / WS-Fed), cada uma com: criado em + por quem, para que serve, quando usar HOJE, mensagem típica (JWT decoded ou XML), Mermaid flow, trade-offs, exemplo real
- Decision tree Mermaid no rodapé: "Cenário → protocolo recomendado"
- Cores semânticas no Mermaid: emerald (recomendado), primary (foundation), amber (enterprise legado), destructive (legacy)

**Pedagogia:** Página complementar ao curso. Não há capítulo no `hands-on.md` dedicado a protocolos (foco do curso é OIDC + OAuth via Entra ID), mas o aluno precisa **reconhecer** SAML/WS-Fed quando aparecem em integrações enterprise. Bom suplemento ao [roadmap-avancado.md](./roadmap-avancado.md).

### 5. Multi-App Patterns (`/lab/multi-app`) — LIVE desde 2026-05-13 (Story 1.9)
**Propósito:** Decompor visualmente as 4 decisões arquiteturais de App Reg que aparecem cedo e doem caro pra reverter.

**Componentes (4 tabs):**
- Tab 1 — **Pattern A vs Pattern B**: 2 cards lado a lado com Mermaid de cada, prós/contras, "quando migrar A→B" + decision tree Mermaid no rodapé. Pattern A cita o `tftec-auth` real (1 App Reg pra SPA+API multi-tenant).
- Tab 2 — **Single vs Multi-tenant**: tabela `signInAudience` (AzureADMyOrg / AzureADMultipleOrgs / etc.); Mermaid mostrando 1 App Object + N SPs; AADSTS7000229 com snippet `az ad sp create`.
- Tab 3 — **B2B External Identities**: Mermaid sequence de invite + login cross-tenant; claims importantes (idp, iss, tid, oid); B2B vs B2C — não confundir.
- Tab 4 — **OBO Chains**: Mermaid sequence de 3+ saltos (Cliente → API1 → API2 → API3); quando usar vs alternativa Client Credentials puro; trade-offs latência/custo/complexidade.

**Pedagogia:** Página complementar ao [hands-on Cap 7](./hands-on.md#cap-7--multi-tenant-e-m%C3%BAltiplos-app-regs-10-min). Cap 7 introduz Single vs Multi + Pattern A vs B; este lab amplia com B2B e OBO chains que não cabem no Cap 7 (10 min apertados).

### 6. Credenciais (`/lab/credenciais`) — LIVE desde 2026-05-13 (Story 1.11)
**Propósito:** Mostrar visualmente as 4 credenciais (Client Secret, Certificate, FIC, Managed Identity), com trade-offs claros e exemplo real do CI/CD do `tftec-auth`.

**Componentes:**
- Matriz comparativa inicial (4 colunas: Tipo, Como autentica, Expiração, Onde usar, Risco)
- 4 tabs deep-dive (1 por credencial): mecanismo, quando usar, snippet de criação `az ad app credential ...`, riscos + mitigations, exemplo real
- Tab FIC inclui workflow real `.github/workflows/deploy-azure.yml` (snippet de `azure/login@v2` com OIDC)
- Tab FIC tem `<MermaidDiagram>` mostrando troca de id_token GitHub OIDC → access_token Entra ID
- Decision tree no rodapé via Mermaid: Azure → Managed Identity / CI-CD → FIC / On-prem → Cert / Dev → Secret

**Pedagogia:** Página complementar ao [hands-on Cap 6](./hands-on.md#cap-6--credenciais-10-min). Cap 6 cria Secret e FIC reais; este lab mostra as 4 opções visualmente + workflow real do `tftec-auth` que usa FIC.

### 5. Permissions & Claims (`/lab/permissions-claims`) — LIVE desde 2026-05-13 (Story 1.10)
**Propósito:** Eliminar a confusão entre Delegated vs Application + `scp` vs `roles` — os dois modelos de permissions que sempre confundem.

**Componentes (5 tabs):**
- Tab 1 — **Delegated vs Application** comparison lado-a-lado (claim, exemplo Graph, audit, risco)
- Tab 2 — **`scp` vs `roles`**: 2 JWTs canônicos exibidos lado-a-lado, claim destacado, diferença string vs array explicada
- Tab 3 — **App Roles vs Groups vs Directory Roles**: matriz 3 cards (definido em, claim, quando usar, exemplo, trade-offs)
- Tab 4 — **Backend valida**: snippet real de `api/Program.cs:80-98` com policies `RequireApiRead/Write` (HasClaim `scp`) vs `RequireAdminRole/UserRole` (RequireRole `roles`)
- Tab 5 — **Admin consent**: decision tree Mermaid + 3 exemplos concretos (User.Read user-OK / User.Read.All delegated admin-only / Mail.Read application admin) + AADSTS65001 ref

**Pedagogia:** Página complementar ao [hands-on Cap 5](./hands-on.md#cap-5--permissions-e-roles-15-min). Cap 5 cria App Role real e atribui; este lab decompõe os 2 modelos visualmente e mostra o backend validando.

---

## ⏳ Módulos Em Breve — Roadmap de Implementação

> **Status do escopo (2026-05-13, Roadmap COMPLETO 8/8):**
> - Lab **4** Protocolos → ✅ LIVE (Story 1.14 entregue 2026-05-13).
> - Lab **5** Multi-App Patterns → ✅ LIVE (Story 1.9 entregue 2026-05-13).
> - Lab **6** Credenciais → ✅ LIVE (Story 1.11 entregue 2026-05-13).
> - Lab **7** Permissions & Claims → ✅ LIVE (Story 1.10 entregue 2026-05-13).
> - Lab **8** Topologias → ✅ LIVE (Story 1.8 entregue 2026-05-13).

### 4. ~~Protocolos~~ → ✅ LIVE (Story 1.14, 2026-05-13). Veja seção LIVE acima.

### 5. ~~Multi-App Patterns~~ → ✅ LIVE (Story 1.9, 2026-05-13). Veja seção LIVE acima.

### 6. ~~Credenciais~~ → ✅ LIVE (Story 1.11, 2026-05-13). Veja seção LIVE acima.

### 7. ~~Permissions & Claims~~ → ✅ LIVE (Story 1.10, 2026-05-13). Veja seção LIVE acima.

### 8. ~~Topologias~~ → ✅ LIVE (Story 1.8, 2026-05-13). Veja seção LIVE acima.

---

## 📅 Sugestão de Ordem de Implementação

Por **valor pedagógico** (mais útil pra próximas turmas TFTEC Masters):

1. ~~🥉 **Topologias**~~ — ✅ LIVE (Story 1.8, 2026-05-13)
2. ~~🥇 **Permissions & Claims**~~ — ✅ LIVE (Story 1.10, 2026-05-13)
3. ~~🥈 **Credenciais**~~ — ✅ LIVE (Story 1.11, 2026-05-13)
4. ~~**Multi-App Patterns**~~ — ✅ LIVE (Story 1.9, 2026-05-13)
5. ~~**Protocolos**~~ — ✅ LIVE (Story 1.14, 2026-05-13)

**Backlog restante:** 0. Roadmap completo 8/8.

---

## 🛠️ Como Implementar um Novo Módulo

Template:

```typescript
// src/pages/lab/MyModule.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SequencePlayer } from "@/components/lab/SequencePlayer";
// ou JwtDecoder, EventTimeline, etc.

export default function LabMyModule() {
  return (
    <div className="space-y-6 max-w-7xl">
      <header>
        <h1 className="text-3xl font-bold">Meu Módulo</h1>
        <p className="text-muted-foreground">Descrição.</p>
      </header>
      {/* Conteúdo */}
    </div>
  );
}
```

Adicionar rota em `src/App.tsx`:
```typescript
import LabMyModule from "./pages/lab/MyModule";
// ...
<Route path="/lab/meu-modulo" element={
  <ProtectedRoute><AppLayout><LabMyModule /></AppLayout></ProtectedRoute>
} />
```

Atualizar Hub em `src/pages/lab/Hub.tsx` — remover badge "em breve" do módulo correspondente.

---

## 🎓 Uso Pedagógico da Aula

**Esta página (`lab-modules-roadmap.md`) é util no [Bloco 8 — Síntese + Q&A](../playbook/roteiro-aula.md#-bloco-8--síntese--qa-15-min) da aula:**

> "Olhem aqui o roadmap. 3 módulos prontos. 5 em breve. **Vc também pode contribuir** — fork o repo, escolhe um módulo e implementa. PR aceito = teu nome no contributors."

**Engajamento pós-aula:** alunos podem se voluntariar pra implementar um módulo pra próxima turma.

---

## 📚 Referências Cross

- Roadmap macro de App Reg: `docs/aula/roadmap-avancado.md`
- Roteiro de aula: [`docs/playbook/roteiro-aula.md`](../playbook/roteiro-aula.md)
- Hands-on principal: [`docs/aula/hands-on.md`](./hands-on.md)
- Replicar ambiente: `docs/playbook/replicar-ambiente.md`
- Code review frontend: `docs/review/code-review-frontend.md`
