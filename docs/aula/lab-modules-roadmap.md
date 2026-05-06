# 🧪 Lab Modules — Status e Roadmap

> Documentação dos 8 módulos do `/lab` no `tftec-auth`.

**Última atualização:** 2026-04-29
**Status atual:** 3 módulos LIVE, 5 placeholder ("em breve")

---

## 📊 Matriz de Status

| # | Módulo | Rota | Status | Implementação |
|---|--------|------|--------|---------------|
| 1 | **Demo Interativa** | `/lab/demo` | ✅ LIVE | SequencePlayer + EventTimeline + 4 cenários reais com botão "Executar de verdade" |
| 2 | **Tokens & JWT** | `/lab/tokens` | ✅ LIVE | JwtDecoder + 4 tabs (Decoder, Anatomia, v1 vs v2, ID vs Access) |
| 3 | **Fluxos OAuth** | `/lab/fluxos` | ✅ LIVE | 4 simuladores animados (Auth Code+PKCE, CC, OBO, Device Code) |
| 4 | **Protocolos** | `/lab/protocolos` | ⏳ Em breve | OIDC, OAuth 2.0, SAML 2.0, WS-Federation |
| 5 | **Multi-App Patterns** | `/lab/multi-app` | ⏳ Em breve | Quando separar apps: cliente vs API, multi-tenant, B2B, OBO, Workload Identity |
| 6 | **Credenciais** | `/lab/credenciais` | ⏳ Em breve | Secret vs Certificate vs Federated Identity (demo Graph live) |
| 7 | **Permissions & Claims** | `/lab/permissions-claims` | ⏳ Em breve | Delegated vs Application, scp vs roles, App Roles, Groups, Directory Roles |
| 8 | **Topologias** | `/lab/topologias` | ⏳ Em breve | Galeria de arquiteturas: SPA, Web App, Daemon, Mobile, Microservices+APIM |

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

**Pedagogia:** Após Cena 5 (Deep Dive Teórico), aluno usa pra ver claims dos próprios tokens.

### 3. Fluxos OAuth (`/lab/fluxos`)
**Propósito:** Animar os 4 flows mais comuns sem hands-on.

**Componentes:**
- 4 tabs: Auth Code+PKCE, Client Credentials, OBO, Device Code
- Cada um: Mermaid sequence diagram + SequencePlayer (▶ play)
- CTA "Executar de verdade →" leva pra `/lab/demo`

**Pedagogia:** Página de overview/teoria. Demo Interativa é onde se pratica.

> **Diferença Fluxos vs Demo Interativa:** Fluxos é só animação didática. Demo Interativa adiciona execução real + EventTimeline com requests/responses live.

---

## ⏳ Módulos Em Breve — Roadmap de Implementação

### 4. Protocolos (`/lab/protocolos`) — Estimativa: 6-8h
**Conteúdo previsto:**
- Comparativo OIDC vs OAuth 2.0 vs SAML 2.0 vs WS-Federation
- Quando usar cada um (decision tree)
- Cenários reais: B2C com OIDC, legado com SAML, federation enterprise com WS-Fed
- Diagrama animado de cada um

**Por quê não tem:** Lovable focou nos 3 LIVE (mais valor pedagógico imediato pra workshop).

### 5. Multi-App Patterns (`/lab/multi-app`) — Estimativa: 8-10h
**Conteúdo previsto:**
- Padrões: 1 App Reg p/ SPA+API vs 2 separadas
- Multi-tenant configurations
- B2B (External Identities)
- OBO chains com 3+ APIs
- Workload Identity Federation (a gente já usa!)

**Por quê não tem:** Conteúdo arquitetural denso, requer múltiplos diagramas.

### 6. Credenciais (`/lab/credenciais`) — Estimativa: 5-7h
**Conteúdo previsto:**
- Comparativo Client Secret vs Certificate vs Federated Identity (OIDC) vs Managed Identity
- Demo live de cada um chamando Graph
- Trade-offs: rotação, segurança, complexidade

**Por quê não tem:** Implementação requer setup de Certificate auth + Managed Identity.

### 7. Permissions & Claims (`/lab/permissions-claims`) — Estimativa: 7-9h
**Conteúdo previsto:**
- Delegated permissions vs Application permissions
- `scp` (scopes) vs `roles` (app roles) vs Groups vs Directory Roles
- Custom claims via Claim Mapping Policy
- Decisão: quando usar cada modelo?

**Por quê não tem:** Conteúdo abstrato, requer múltiplos exemplos práticos.

### 8. Topologias (`/lab/topologias`) — Estimativa: 6-8h
**Conteúdo previsto:**
- Galeria visual: SPA, Web App tradicional, Mobile, Daemon, Microservices+APIM, Service Mesh + Workload Identity
- Pra cada um: stack, fluxo, prós, contras, quando usar
- Wallpaper de referência

**Por quê não tem:** Trabalho de design + curadoria.

---

## 📅 Sugestão de Ordem de Implementação

Por **valor pedagógico** (mais útil pra próximas turmas TFTEC Masters):

1. 🥇 **Permissions & Claims** — diferença scp/roles/groups confunde TODO mundo
2. 🥈 **Credenciais** — Workload Identity Federation é tema atual, vc já usa
3. 🥉 **Topologias** — visualização visual ajuda alunos
4. **Protocolos** — denso, mas comparativo SAML é demanda real enterprise
5. **Multi-App Patterns** — avançado, melhor pra cohort 2 ou 3

**Total backlog:** ~32-42 horas. Implementável em 4-6 sprints (1-2 módulos por sprint).

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

**Esta página (`lab-modules-roadmap.md`) é util na Cena 8 da aula:**

> "Olhem aqui o roadmap. 3 módulos prontos. 5 em breve. **Vc também pode contribuir** — fork o repo, escolhe um módulo e implementa. PR aceito = teu nome no contributors."

**Engajamento pós-aula:** alunos podem se voluntariar pra implementar um módulo pra próxima turma.

---

## 📚 Referências Cross

- Roadmap macro de App Reg: `docs/aula/roadmap-avancado.md`
- Demo Class Script: `docs/playbook/demo-class.md`
- Replicar ambiente: `docs/playbook/replicar-ambiente.md`
- Code review frontend: `docs/review/code-review-frontend.md`
