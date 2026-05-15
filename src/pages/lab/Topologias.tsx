import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MermaidDiagram } from "@/components/lab/MermaidDiagram";
import { TokenClaimSpotlight } from "@/components/lab/TokenClaimSpotlight";
import { Link } from "react-router-dom";
import {
  Globe,
  Server,
  Smartphone,
  Terminal,
  Network,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

interface Topology {
  id: string;
  title: string;
  icon: typeof Globe;
  oneLiner: string;
  advanced?: boolean;
  stack: string[];
  chart: string;
  flow: string[];
  pros: string[];
  cons: string[];
  whenToUse: string;
  credential: string;
  realExample?: string;
}

const topologies: Topology[] = [
  {
    id: "spa",
    title: "SPA",
    icon: Globe,
    oneLiner: "Frontend público no browser, token vive client-side.",
    stack: ["React (ou Angular/Vue)", "MSAL.js", "API .NET / Node atrás", "Entra ID"],
    chart: `sequenceDiagram
  participant U as Usuário
  participant S as SPA (browser)
  participant E as Entra ID
  participant A as API
  U->>S: Abre app
  S->>E: /authorize (code_challenge)
  E->>U: Login + consent
  U->>E: Credenciais + MFA
  E->>S: code (redirect)
  S->>E: /token (code + verifier)
  E->>S: access_token + id_token
  S->>A: Bearer access_token
  A->>S: 200`,
    flow: [
      "SPA detecta sessão ausente e redireciona para `/authorize` com `code_challenge`",
      "Entra ID hospeda o login (Microsoft cuida de senha + MFA + Conditional Access)",
      "Browser recebe `code` via redirect (single-use, ~10 min)",
      "SPA troca o code por tokens enviando o `code_verifier` original (PKCE)",
      "Token fica em memória (sessionStorage opcional) — nunca em localStorage",
    ],
    pros: [
      "Sem servidor de sessão — login totalmente delegado ao Entra ID",
      "MSAL.js cuida de refresh silencioso + cache de tokens",
      "Padrão moderno (PKCE substitui client_secret)",
    ],
    cons: [
      "Token visível no browser — XSS pode vazar (mitigado por CSP forte + SameSite cookies)",
      "Refresh tokens em SPA têm restrições (rotativos, lifetime curto)",
    ],
    whenToUse:
      "Aplicação 100% client-side (React, Angular, Vue) onde o usuário interage diretamente — dashboards, admin tools, plataformas educacionais. Token de curta duração + refresh silencioso resolvem UX sem comprometer segurança.",
    credential: "PKCE (Authorization Code + PKCE). Sem client_secret no browser.",
    realExample:
      "O próprio `tftec-auth` (este app): `src/config/msal.ts` + `MsalProvider` em `src/App.tsx`. Veja [hands-on Cap 8](../aula/hands-on.md#cap-8--integrar-no-código-15-min).",
  },
  {
    id: "webapp",
    title: "Web App tradicional",
    icon: Server,
    oneLiner: "Server-side rendering, sessão em cookie, token fica no servidor.",
    stack: ["ASP.NET Core MVC / Razor Pages", "Microsoft.Identity.Web", "Cookie session", "Entra ID"],
    chart: `sequenceDiagram
  participant U as Usuário (browser)
  participant W as Web App (server)
  participant E as Entra ID
  participant A as API downstream
  U->>W: GET /admin
  W->>U: 302 → Entra ID
  U->>E: Login
  E->>U: code (redirect → W)
  U->>W: GET /signin-oidc?code=...
  W->>E: /token (code + client_secret)
  E->>W: access_token + id_token
  W->>U: 302 + Set-Cookie (sessão)
  U->>W: GET /admin (cookie)
  W->>A: Bearer access_token (server-side)
  A->>W: 200`,
    flow: [
      "Server detecta usuário não autenticado → redirect para Entra ID",
      "Microsoft.Identity.Web cuida do callback `/signin-oidc` automaticamente",
      "Token NUNCA volta pro browser — fica no token cache do servidor (Distributed Cache / Redis em prod)",
      "Browser só carrega cookie de sessão (HttpOnly + Secure + SameSite=Lax)",
      "Chamadas a APIs downstream usam token cacheado no server",
    ],
    pros: [
      "Token nunca exposto ao browser (XSS não consegue roubar)",
      "Compatível com firewalls/zero-trust enterprise (servidor é trust boundary)",
      "Refresh transparente sem MSAL.js no client",
    ],
    cons: [
      "Precisa de sticky sessions ou cache distribuído (Redis) em escala horizontal",
      "Client_secret precisa rotacionar (ou migrar pra Certificate / Federated Credential)",
    ],
    whenToUse:
      "Apps enterprise legados (intranet, portais admin), apps que renderizam HTML server-side com lógica sensível, cenários onde token NÃO pode vazar no browser. Comum em bancos, seguradoras, governo.",
    credential: "Client Secret OU Certificate (recomendado em prod) OU Federated Identity.",
    realExample:
      "Backend do `tftec-auth` (.NET 8 + Microsoft.Identity.Web). Veja `Program.cs` + `appsettings.json`.",
  },
  {
    id: "mobile",
    title: "Mobile nativo",
    icon: Smartphone,
    oneLiner: "App Android/iOS, broker do sistema cuida de SSO + biometria.",
    stack: ["MSAL Android / MSAL iOS", "System broker (Authenticator / Company Portal)", "Biometria local", "API .NET / Node"],
    chart: `sequenceDiagram
  participant A as App nativo
  participant B as Broker (sistema)
  participant E as Entra ID
  participant API as API
  A->>B: acquireToken(scope)
  B->>E: /authorize (PKCE + device claims)
  E->>B: tokens + device-bound key
  B->>A: access_token (via IPC)
  A->>API: Bearer access_token
  API->>A: 200
  Note over B: Token cache <br/>(criptografado por device)`,
    flow: [
      "App chama `acquireToken()` da MSAL Mobile",
      "MSAL delega ao broker do sistema (Microsoft Authenticator no Android, Company Portal no iOS)",
      "Broker abre login fora do app (segurança: app não vê senha) — pode usar biometria",
      "Broker armazena token cache criptografado, bound ao device (TPM/Secure Enclave)",
      "App nunca toca em refresh_token diretamente — pede novo access via broker",
    ],
    pros: [
      "SSO entre apps Microsoft (Outlook, Teams, Edge usam o mesmo broker)",
      "Biometria + device compliance via Intune integrados",
      "Token cache device-bound (mais difícil de exfiltrar)",
    ],
    cons: [
      "Requer broker instalado (Authenticator app) — fallback para WebView é menos seguro",
      "Deep linking de redirect URI precisa ser configurado certo (`msauth.{bundle-id}://auth`)",
    ],
    whenToUse:
      "Apps corporativos Android/iOS, apps que precisam de SSO com outros apps Microsoft, cenários BYOD onde Intune Conditional Access exige device compliance.",
    credential: "PKCE + broker token (device-bound). Sem secret no app.",
  },
  {
    id: "daemon",
    title: "Daemon / Background Job",
    icon: Terminal,
    oneLiner: "Sem usuário — app autentica como ele mesmo (Client Credentials).",
    stack: ["Job scheduler (cron / Hangfire / Functions)", "Microsoft.Identity.Client / MSAL Node", "API downstream / Microsoft Graph", "Entra ID"],
    chart: `sequenceDiagram
  participant D as Daemon
  participant E as Entra ID
  participant G as Graph / API
  D->>E: /token (client_credentials)
  Note right of D: scope=https://graph.microsoft.com/.default
  E->>D: access_token (roles claims)
  D->>G: Bearer access_token
  G->>D: 200
  Note over D,G: Audit log mostra<br/>appid, não usuário`,
    flow: [
      "Job dispara (cron, Function Timer, Hangfire schedule)",
      "Requesta token via `grant_type=client_credentials` + `scope=...default`",
      "Token vem com claim `roles` (Application permissions), sem `scp` (sem usuário)",
      "App tem acesso amplo ao que admin consentiu — auditoria mostra `appid`, não user",
    ],
    pros: [
      "Roda 24/7 sem usuário interativo",
      "Permissões granulares via App Roles (Mail.Read.All, Files.Read.All)",
      "Federated Identity Credential elimina secret rotation",
    ],
    cons: [
      "Application permissions = acesso amplo (geralmente tenant-wide) — admin consent obrigatório",
      "Sem contexto de usuário — não dá pra rastrear ação por pessoa, só por app",
    ],
    whenToUse:
      "Jobs noturnos chamando Graph (sync usuários, exportar dados), microservices de backend, integrações server-to-server, agentes que processam fila sem usuário (ETL, AI agents).",
    credential: "Federated Identity Credential (preferido) > Certificate > Client Secret (legacy).",
    realExample:
      "O CI/CD do `tftec-auth` usa Workload Identity Federation pra deploy sem secret — veja `.github/workflows/`.",
  },
  {
    id: "microservices",
    title: "Microservices + APIM",
    icon: Network,
    oneLiner: "Gateway centraliza validação JWT, propaga ou re-assina entre serviços.",
    stack: ["Azure API Management (ou Kong / Envoy)", "Backend services (.NET / Node / Go)", "Microsoft.Identity.Web em cada svc", "OBO flow entre APIs"],
    chart: `sequenceDiagram
  participant C as Cliente (SPA/Mobile)
  participant G as API Gateway (APIM)
  participant S1 as Service A
  participant E as Entra ID
  participant S2 as Service B
  C->>G: Bearer token (aud=API)
  G->>G: Validate JWT (JWKS cache)
  G->>S1: Bearer token (propagado)
  S1->>E: OBO /token (jwt-bearer + token1)
  E->>S1: token2 (aud=ServiceB)
  S1->>S2: Bearer token2
  S2->>S1: 200
  S1->>G: 200
  G->>C: 200`,
    flow: [
      "Gateway (APIM) faz a primeira validação JWT — JWKS cacheado, assinatura verificada",
      "Token original é propagado para Service A (`audience` é a API agregadora)",
      "Service A precisa chamar Service B → usa OBO para trocar token mantendo identidade do usuário",
      "Service B vê o usuário real (não a Service A) — auditoria preserva quem disparou a ação",
      "Cada serviço pode ter App Reg própria ou compartilhar (Pattern A vs Pattern B)",
    ],
    pros: [
      "Centraliza validação no gateway (services internos não duplicam lógica de auth)",
      "OBO preserva identidade real através da chain (auditoria correta)",
      "Permite rate limit, throttle, transformação no gateway",
    ],
    cons: [
      "OBO chains longas (3+ saltos) têm latência e custo de tokens emitidos",
      "Pattern A (1 App Reg pra tudo) vira gargalo de permissions — Pattern B (1 por svc) é mais limpo mas precisa de descoberta",
    ],
    whenToUse:
      "Backends distribuídos com 3+ serviços, cenários multi-team onde cada time owna seu serviço, sistemas que precisam preservar identidade do usuário através de várias APIs (compliance, audit).",
    credential: "Cada serviço: Federated Identity (no AKS/Functions) ou Certificate. APIM valida JWT só com JWKS pública.",
  },
  {
    id: "workload-identity",
    title: "Service Mesh + Workload Identity",
    icon: Boxes,
    advanced: true,
    oneLiner: "Pods AKS recebem token via OIDC federation — zero secrets no cluster.",
    stack: ["AKS + Workload Identity addon", "ServiceAccount + projected token", "Federated Identity Credential", "Azure SDK / MSAL"],
    chart: `sequenceDiagram
  participant P as Pod (workload)
  participant SA as ServiceAccount
  participant K as Kubernetes API
  participant E as Entra ID
  participant A as Azure resource
  K->>SA: Mounta projected token (OIDC JWT)
  P->>SA: Lê /var/run/secrets/.../token
  P->>E: /token (jwt-bearer + projected token + federated credential)
  Note right of E: Trust: Entra ID confia<br/>no issuer do AKS (OIDC)
  E->>P: access_token (aud=Azure resource)
  P->>A: Bearer access_token
  A->>P: 200`,
    flow: [
      "AKS cluster expõe um OIDC issuer público (`https://oidc.prod-aks.azure.com/...`)",
      "App Reg no Entra ID tem `Federated Identity Credential` confiando nesse issuer + subject (namespace+SA)",
      "Pod ganha ServiceAccount → Kubernetes injeta projected token JWT no filesystem do pod",
      "Pod troca esse JWT por access_token Entra ID (sem secret, sem certificate)",
      "Funciona igual para GitHub Actions, GitLab CI, qualquer OIDC provider externo",
    ],
    pros: [
      "ZERO secrets no cluster — não há nada pra rotacionar ou vazar",
      "Auditoria granular: cada Pod ServiceAccount = identidade Entra ID separada",
      "Funciona idêntico em CI/CD (GitHub Actions OIDC) — mesma mental model",
    ],
    cons: [
      "Curva de aprendizado: OIDC federation + Kubernetes RBAC + Entra ID App Roles juntos",
      "Debug é mais opaco (token vem de 3 sistemas) — precisa entender cada camada",
    ],
    whenToUse:
      "AKS produção com workloads multi-tenant, cenários compliance-heavy (PCI, HIPAA) onde rotacionar secret é caro, CI/CD enterprise que não pode ter `AZURE_CLIENT_SECRET` em GitHub Secrets.",
    credential:
      "Federated Identity Credential (OIDC). É o padrão atual recomendado pela Microsoft para qualquer workload em Azure.",
    realExample:
      "O deploy do `tftec-auth` no Azure App Service usa OIDC federation entre GitHub Actions e Entra ID — sem `AZURE_CLIENT_SECRET` no repo. Padrão idêntico ao AKS Workload Identity.",
  },
];

export default function LabTopologias() {
  const [activeId, setActiveId] = useState<string>(topologies[0].id);
  const active = topologies.find((t) => t.id === activeId) ?? topologies[0];

  return (
    <div className="space-y-6 max-w-7xl">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Topologias com Entra ID</h1>
        <p className="text-muted-foreground">
          Galeria visual de 6 arquiteturas reais — stack, fluxo, prós, contras e quando usar cada uma.
        </p>
        <div className="text-xs px-3 py-2 rounded bg-primary/5 border border-primary/20">
          📚 <strong>Esta página é visual/conceitual.</strong> Para o hands-on de escolha real veja{" "}
          <a
            href="https://github.com/tftec-guilherme/entra-auth-gateway/blob/main/docs/aula/hands-on.md#cap-1--escolher-tipo-de-aplicação-5-min"
            target="_blank"
            rel="noreferrer"
            className="underline text-primary"
          >
            hands-on Cap 1
          </a>{" "}
          (matriz SPA vs Web vs Mobile vs Daemon).
        </div>
      </header>

      <div className="grid lg:grid-cols-[260px_1fr] gap-4">
        <nav aria-label="Lista de topologias" className="space-y-1">
          {topologies.map((t) => {
            const Icon = t.icon;
            const isActive = t.id === activeId;
            return (
              <button
                key={t.id}
                onClick={() => setActiveId(t.id)}
                className={`w-full text-left px-3 py-2.5 rounded-md border transition flex items-start gap-2.5 ${
                  isActive
                    ? "bg-primary/10 border-primary/40 text-foreground"
                    : "bg-card/50 border-border hover:border-primary/30 hover:bg-card"
                }`}
              >
                <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-sm">{t.title}</span>
                    {t.advanced && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        ⚡ Avançado
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug mt-0.5">{t.oneLiner}</p>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <active.icon className="w-6 h-6 text-primary" />
                    {active.title}
                    {active.advanced && (
                      <Badge variant="outline" className="text-xs">
                        ⚡ Avançado
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">{active.oneLiner}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <section>
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Stack</h3>
                <div className="flex flex-wrap gap-1.5">
                  {active.stack.map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs">
                      {s}
                    </Badge>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Diagrama</h3>
                <div className="rounded-md border border-border bg-card/40 p-3">
                  <MermaidDiagram chart={active.chart} />
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Fluxo de autenticação</h3>
                <ol className="space-y-1.5 list-decimal list-inside text-sm">
                  {active.flow.map((step, i) => (
                    <li key={i} className="text-foreground/90 leading-relaxed">
                      <span className="text-foreground/80" dangerouslySetInnerHTML={{ __html: renderInlineCode(step) }} />
                    </li>
                  ))}
                </ol>
              </section>

              <div className="grid md:grid-cols-2 gap-4">
                <section>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-emerald-500">
                    <CheckCircle2 className="w-4 h-4" />
                    Prós
                  </h3>
                  <ul className="space-y-1 text-sm">
                    {active.pros.map((p, i) => (
                      <li key={i} className="text-foreground/85 leading-snug">
                        • <span dangerouslySetInnerHTML={{ __html: renderInlineCode(p) }} />
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-amber-500">
                    <AlertTriangle className="w-4 h-4" />
                    Trade-offs
                  </h3>
                  <ul className="space-y-1 text-sm">
                    {active.cons.map((c, i) => (
                      <li key={i} className="text-foreground/85 leading-snug">
                        • <span dangerouslySetInnerHTML={{ __html: renderInlineCode(c) }} />
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              <section className="rounded-md bg-primary/5 border border-primary/20 p-3">
                <h3 className="text-sm font-semibold mb-1.5 flex items-center gap-1.5 text-primary">
                  <Sparkles className="w-4 h-4" />
                  Quando usar
                </h3>
                <p className="text-sm text-foreground/90 leading-relaxed">{active.whenToUse}</p>
              </section>

              <section className="text-sm">
                <span className="font-semibold text-muted-foreground">Credencial recomendada: </span>
                <span dangerouslySetInnerHTML={{ __html: renderInlineCode(active.credential) }} />
              </section>

              {active.realExample && (
                <section className="text-xs text-muted-foreground border-t border-border pt-3">
                  <span className="font-semibold">Exemplo real: </span>
                  <span dangerouslySetInnerHTML={{ __html: renderInlineCode(active.realExample) }} />
                </section>
              )}

              {active.id === "spa" && (
                <TokenClaimSpotlight
                  source="authservice"
                  highlight="aud"
                  title="Veja o aud do token desta SPA"
                  description="Esta página JÁ é a topologia SPA (frontend público, token no browser). O claim aud mostra qual API este token autoriza."
                />
              )}
            </CardContent>
          </Card>

          <Card className="bg-muted/20 border-dashed">
            <CardContent className="pt-5 pb-5 text-sm text-muted-foreground flex items-center justify-between gap-3">
              <span>
                Quer ver o flow OAuth de cada topologia executar passo-a-passo? Use{" "}
                <Link to="/lab/fluxos" className="underline text-primary">
                  /lab/fluxos
                </Link>
                .
              </span>
              <Link to="/lab/demo">
                <Button variant="secondary" size="sm">
                  Demo Interativa →
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function renderInlineCode(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const withCode = escaped.replace(
    /`([^`]+)`/g,
    '<code class="px-1 py-0.5 rounded bg-muted text-foreground/90 text-[0.9em]">$1</code>'
  );
  return withCode.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noreferrer" class="underline text-primary hover:text-primary/80">$1</a>'
  );
}
