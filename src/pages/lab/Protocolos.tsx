import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MermaidDiagram } from "@/components/lab/MermaidDiagram";
import { Network, Key, FileCode, Building2, AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";

const OIDC_FLOW = `sequenceDiagram
  participant U as Usuario
  participant C as Cliente OIDC<br/>SPA / Web App
  participant E as Entra ID OIDC Provider
  participant A as API
  U->>C: Abre app
  C->>E: /authorize PKCE + scope=openid
  E->>U: Tela login
  U->>E: Credenciais MFA
  E->>C: code redirect
  C->>E: /token code + verifier
  E->>C: id_token + access_token
  C->>C: Valida id_token JWKS<br/>extrai claims sub, name, email
  C->>A: Bearer access_token
  A->>C: 200`;

const OAUTH2_FLOW = `sequenceDiagram
  participant C as Cliente
  participant R as Resource Owner<br/>Usuario ou App
  participant AS as Authorization Server
  participant API as Resource Server API
  C->>R: Quer acessar recurso
  R->>AS: Autoriza cliente
  AS->>C: authorization_code OU access_token<br/>(varia por grant_type)
  C->>API: Bearer access_token
  API->>API: Valida token<br/>checa scope authorize
  API->>C: 200 ou 403
  Note over AS,API: Sem id_token<br/>OAuth NAO autentica<br/>so autoriza`;

const SAML_FLOW = `sequenceDiagram
  participant U as Usuario
  participant SP as Service Provider<br/>Salesforce, SharePoint
  participant IdP as Identity Provider<br/>ADFS, Okta, Entra ID
  U->>SP: Acessa app
  SP->>U: Redirect com SAMLRequest XML
  U->>IdP: GET com SAMLRequest
  IdP->>U: Tela login
  U->>IdP: Credenciais
  IdP->>IdP: Cria SAMLResponse<br/>com assertion XML + assinatura
  IdP->>U: HTML form POST SAMLResponse
  U->>SP: POST SAMLResponse
  SP->>SP: Valida assinatura XML<br/>extrai claims do assertion
  SP->>U: Sessao criada cookie`;

const WSFED_FLOW = `sequenceDiagram
  participant U as Usuario
  participant App as App ASP.NET<br/>SharePoint, ADFS-aware
  participant STS as Security Token Service<br/>ADFS, Entra ID legado
  U->>App: Acessa /admin
  App->>U: Redirect /adfs/ls<br/>wa=wsignin1.0 + wtrealm + wreply
  U->>STS: GET com query params
  STS->>U: Tela login
  U->>STS: Credenciais
  STS->>STS: Cria SAML 1.1 token<br/>envelope WS-Trust
  STS->>U: HTML form POST com token
  U->>App: POST wresult com token
  App->>App: Valida assinatura<br/>cria cookie .NET FedAuth
  App->>U: Acesso concedido`;

const DECISION_TREE = `graph TD
  Start[Que protocolo usar?] --> Q1{Cenario}
  Q1 -->|App moderno SPA mobile API| OIDC[OIDC<br/>Entra ID OAuth2 + id_token]
  Q1 -->|Apenas autorizar acesso a API| OAuth[OAuth 2.0 puro<br/>Client Credentials Auth Code]
  Q1 -->|App SaaS antigo Salesforce<br/>SharePoint Online enterprise| SAML[SAML 2.0<br/>via Enterprise Applications]
  Q1 -->|App ASP.NET legado<br/>SharePoint on-prem ADFS classico| WSF[WS-Federation<br/>raro hoje so legacy]
  OIDC --> Best[Default moderno<br/>recomendado pra novos apps]
  OAuth --> Best
  SAML --> Migrate[Considere migrar pra OIDC<br/>se o SP suportar]
  WSF --> Deprecated[Deprecated em apps novos<br/>so mantenha legado]
  style OIDC fill:#1e293b,stroke:#10b981
  style OAuth fill:#1e293b,stroke:#3b82f6
  style SAML fill:#1e293b,stroke:#f59e0b
  style WSF fill:#1e293b,stroke:#ef4444`;

const OIDC_MESSAGE = `// id_token (JWT) — Header + Payload (signature omitida)
{
  "alg": "RS256",
  "kid": "abc123...",
  "typ": "JWT"
}
.
{
  "iss": "https://login.microsoftonline.com/{tid}/v2.0",
  "aud": "{client_id}",       // pra quem o id_token foi emitido
  "sub": "AAAAAAAAAAAAAA...", // subject estavel
  "iat": 1715616000,
  "exp": 1715619600,
  "name": "Fulano da Silva",
  "preferred_username": "fulano@tenant.onmicrosoft.com",
  "oid": "8a4d3b21-...",
  "tid": "{tenant-id}",
  "nonce": "anti-replay-value",
  "ver": "2.0"
}`;

const OAUTH2_MESSAGE = `// access_token bruto (opaque OU JWT)
// Em Entra ID, sempre vem como JWT — payload tipico:
{
  "iss": "https://sts.windows.net/{tid}/",
  "aud": "api://my-app",     // pra qual API
  "iat": 1715616000,
  "exp": 1715619600,
  "scp": "api.read api.write",  // delegated
  "roles": ["Admin"],            // application (raro em delegated)
  "oid": "8a4d3b21-...",
  "appid": "{client_id}",
  "ver": "2.0"
  // Nao tem 'name' nem 'email' garantidos
  // OAuth nao autentica — nao deve ser usado como identidade
}`;

const SAML_MESSAGE = `<!-- SAMLResponse — assertion XML assinada (raiz simplificada) -->
<samlp:Response Version="2.0" IssueInstant="2026-05-13T10:00:00Z">
  <saml:Issuer>https://sts.windows.net/{tid}/</saml:Issuer>
  <ds:Signature>...</ds:Signature>
  <saml:Assertion ID="_abc123" Version="2.0">
    <saml:Subject>
      <saml:NameID Format="...emailAddress">fulano@tenant.com</saml:NameID>
    </saml:Subject>
    <saml:Conditions NotBefore="..." NotOnOrAfter="...">
      <saml:AudienceRestriction>
        <saml:Audience>https://salesforce.com/SAML2</saml:Audience>
      </saml:AudienceRestriction>
    </saml:Conditions>
    <saml:AuthnStatement AuthnInstant="2026-05-13T10:00:00Z">
      <saml:AuthnContext>
        <saml:AuthnContextClassRef>...PasswordProtectedTransport</saml:AuthnContextClassRef>
      </saml:AuthnContext>
    </saml:AuthnStatement>
    <saml:AttributeStatement>
      <saml:Attribute Name="emailAddress">
        <saml:AttributeValue>fulano@tenant.com</saml:AttributeValue>
      </saml:Attribute>
    </saml:AttributeStatement>
  </saml:Assertion>
</samlp:Response>
<!-- ~5-15 KB inflados em base64, vai num form POST -->`;

const WSFED_MESSAGE = `<!-- wresult (POST body do callback) — envelope WS-Trust com SAML 1.1 dentro -->
<t:RequestSecurityTokenResponse xmlns:t="http://schemas.xmlsoap.org/ws/2005/02/trust">
  <t:Lifetime>
    <wsu:Created>2026-05-13T10:00:00Z</wsu:Created>
    <wsu:Expires>2026-05-13T11:00:00Z</wsu:Expires>
  </t:Lifetime>
  <wsp:AppliesTo>
    <a:EndpointReference>
      <a:Address>urn:sharepoint:internal</a:Address>
    </a:EndpointReference>
  </wsp:AppliesTo>
  <t:RequestedSecurityToken>
    <Assertion MajorVersion="1" MinorVersion="1" Issuer="ADFS-internal">
      <Conditions NotBefore="..." NotOnOrAfter="..."/>
      <AuthenticationStatement AuthenticationMethod="...PasswordProtectedTransport"
                               AuthenticationInstant="2026-05-13T10:00:00Z">
        <Subject>
          <NameIdentifier Format="...UPN">fulano@tenant.local</NameIdentifier>
        </Subject>
      </AuthenticationStatement>
      <ds:Signature>...</ds:Signature>
    </Assertion>
  </t:RequestedSecurityToken>
</t:RequestSecurityTokenResponse>
<!-- SAML 1.1 dentro de envelope WS-Trust — formato mais antigo, raro em apps modernos -->`;

interface Protocol {
  id: string;
  title: string;
  shortName: string;
  icon: typeof Key;
  badge: "Moderno" | "Foundation" | "Enterprise" | "Legacy";
  badgeColor: "default" | "outline";
  borderClass: string;
  createdYear: string;
  createdBy: string;
  purpose: string;
  whenUse: string;
  tradeOffs: string[];
  realExample: string;
  message: string;
  flow: string;
}

const protocols: Protocol[] = [
  {
    id: "oidc",
    title: "OpenID Connect (OIDC)",
    shortName: "OIDC",
    icon: Key,
    badge: "Moderno",
    badgeColor: "default",
    borderClass: "border-emerald-500/40",
    createdYear: "2014",
    createdBy: "OpenID Foundation (Google, Microsoft, PayPal, Salesforce et al.)",
    purpose:
      "Camada de **autenticação** construída SOBRE OAuth 2.0. Adiciona o `id_token` (JWT) que diz QUEM é o usuário. É o protocolo de SSO moderno — Entra ID, Google, Auth0, Okta todos suportam nativamente.",
    whenUse:
      "Qualquer cenário NOVO de login: SPA, Web App, Mobile, Daemon. Suporta todos os flows OAuth (Auth Code+PKCE, CC, OBO, Device Code) + autenticação via id_token. O `tftec-auth` é OIDC end-to-end.",
    tradeOffs: [
      "Pró: padrão da indústria, JWT fácil de inspecionar, JWKS público",
      "Pró: integração trivial (MSAL, Microsoft.Identity.Web, qualquer SDK moderno)",
      "Contra: pra apps SaaS antigos que só falam SAML, precisa de bridge (Enterprise Applications no Entra)",
    ],
    realExample:
      "tftec-auth (este app), Microsoft 365 sign-in, Auth0/Okta SSO, Google Workspace sign-in",
    message: OIDC_MESSAGE,
    flow: OIDC_FLOW,
  },
  {
    id: "oauth2",
    title: "OAuth 2.0",
    shortName: "OAuth 2.0",
    icon: Network,
    badge: "Foundation",
    badgeColor: "default",
    borderClass: "border-primary/40",
    createdYear: "2012 (RFC 6749)",
    createdBy: "IETF OAuth Working Group",
    purpose:
      "Protocolo de **autorização** — não autentica usuário, apenas autoriza acesso a recursos via `access_token`. É a fundação do OIDC. Define 4 grant types: Authorization Code, Implicit (legado), Client Credentials, Resource Owner Password (anti-pattern).",
    whenUse:
      "OAuth puro (sem id_token) faz sentido pra **autorização machine-to-machine** (Client Credentials) onde NÃO há usuário. Pra qualquer fluxo de login humano, prefira OIDC.",
    tradeOffs: [
      "Pró: especificação madura, todos os providers suportam",
      "Contra: OAuth NÃO autentica — usar `access_token` como prova de identidade é antipattern e abre brecha",
      "Contra: não há claim padronizado pra identidade no `access_token` Microsoft (depende de campos como `oid`, `appid`)",
    ],
    realExample:
      "GitHub OAuth (auth de OAuth Apps), Slack OAuth Apps. Em Entra ID, Client Credentials flow puro entre microservices.",
    message: OAUTH2_MESSAGE,
    flow: OAUTH2_FLOW,
  },
  {
    id: "saml",
    title: "SAML 2.0",
    shortName: "SAML",
    icon: FileCode,
    badge: "Enterprise",
    badgeColor: "outline",
    borderClass: "border-amber-500/40",
    createdYear: "2005 (OASIS standard)",
    createdBy: "OASIS Security Services Technical Committee",
    purpose:
      "Federation enterprise baseado em **XML assinado**. Conceito de Identity Provider (IdP) e Service Provider (SP) — IdP emite SAMLResponse com assertion XML, SP valida e cria sessão. Foi o padrão dos anos 2005-2015 antes de OIDC dominar.",
    whenUse:
      "Apps SaaS antigos que SÓ falam SAML (Salesforce com configuração legacy, Workday em alguns cenários, parceria B2B onde tenant remoto exige SAML). Em Entra ID, configurado via **Enterprise Applications** (não App Registrations).",
    tradeOffs: [
      "Pró: maduro, suportado por TODO ERP/CRM enterprise nos anos 2010s",
      "Contra: XML pesado (~5-15 KB), POST forms em vez de redirects diretos, mais difícil de debugar que JWT",
      "Contra: native browser não consegue manipular SAML (precisa de redirect HTML form) — apps SPAs/mobile não conseguem ser SP nativamente",
    ],
    realExample:
      "Salesforce SSO (configuração com Entra ID via Enterprise Applications), ServiceNow corporate SSO, SharePoint Online com SAML federation",
    message: SAML_MESSAGE,
    flow: SAML_FLOW,
  },
  {
    id: "wsfed",
    title: "WS-Federation",
    shortName: "WS-Fed",
    icon: Building2,
    badge: "Legacy",
    badgeColor: "outline",
    borderClass: "border-destructive/40",
    createdYear: "2003 (Microsoft + IBM + outros)",
    createdBy: "OASIS WSFED Technical Committee (driven por Microsoft)",
    purpose:
      "Federation passive baseado em **SAML 1.1 dentro de envelope WS-Trust**. Foi o protocolo nativo do **ADFS clássico** (Active Directory Federation Services) e do **SharePoint on-premise**. Predecessor histórico de SAML 2.0/OIDC no ecossistema Microsoft.",
    whenUse:
      "**Quase nunca em apps novos.** Mantém-se apenas em sistemas legados Microsoft: ADFS pre-2016 (federation com apps internos), SharePoint on-prem, aplicações ASP.NET WebForms antigas integradas via `<system.identityModel>`.",
    tradeOffs: [
      "Pró: integração nativa com `WindowsIdentityFoundation` (.NET Framework legado)",
      "Contra: SAML 1.1 é mais limitado que SAML 2.0 — não suporta logout federation moderno, claims menos flexíveis",
      "Contra: Microsoft está direcionando deprecation gradual; ADFS sendo substituído por Entra ID com OIDC/SAML 2.0",
    ],
    realExample:
      "ADFS 2.0/3.0 (Windows Server 2012/2016) federando com SharePoint 2013/2016 on-prem. Migrações modernas vão pra Entra ID + OIDC.",
    message: WSFED_MESSAGE,
    flow: WSFED_FLOW,
  },
];

export default function LabProtocolos() {
  const [tab, setTab] = useState("oidc");
  const active = protocols.find((p) => p.id === tab) ?? protocols[0];

  return (
    <div className="space-y-6 max-w-7xl">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Protocolos de Federation</h1>
        <p className="text-muted-foreground">
          OIDC vs OAuth 2.0 vs SAML 2.0 vs WS-Fed — 4 protocolos, 20 anos de evolução. Saber reconhecer cada um vale ouro em integração enterprise.
        </p>
        <div className="text-xs px-3 py-2 rounded bg-primary/5 border border-primary/20">
          📚 <strong>Esta página é visual/conceitual.</strong> O <code className="px-1 py-0.5 rounded bg-muted text-[0.9em]">tftec-auth</code> usa OIDC + OAuth 2.0
          (Microsoft Entra ID). SAML/WS-Fed aparecem aqui pra você reconhecer quando integrar com sistemas legados.
        </div>
      </header>

      {/* Matriz comparativa inicial */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Comparativo rápido
          </CardTitle>
          <CardDescription className="text-xs">4 protocolos lado a lado. Em geral: OIDC &gt; OAuth puro pra login; SAML ainda existe em enterprise; WS-Fed é legacy.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-muted-foreground text-xs uppercase tracking-wide">Protocolo</th>
                  <th className="text-left py-2 px-2 text-muted-foreground text-xs uppercase tracking-wide">Criado em</th>
                  <th className="text-left py-2 px-2 text-muted-foreground text-xs uppercase tracking-wide">Formato</th>
                  <th className="text-left py-2 px-2 text-muted-foreground text-xs uppercase tracking-wide">Auth ou Authz?</th>
                  <th className="text-left py-2 px-2 text-muted-foreground text-xs uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="text-foreground/90">
                <tr className="border-b border-border/50">
                  <td className="py-2 px-2 font-semibold">OIDC</td>
                  <td className="py-2 px-2">2014</td>
                  <td className="py-2 px-2 font-mono text-xs">JWT</td>
                  <td className="py-2 px-2">Authentication + Authorization</td>
                  <td className="py-2 px-2 text-emerald-500 font-medium">🟢 Moderno (recomendado)</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-2 font-semibold">OAuth 2.0</td>
                  <td className="py-2 px-2">2012 (RFC 6749)</td>
                  <td className="py-2 px-2 font-mono text-xs">JWT ou opaque</td>
                  <td className="py-2 px-2">Authorization only</td>
                  <td className="py-2 px-2 text-primary font-medium">🔵 Foundation</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-2 font-semibold">SAML 2.0</td>
                  <td className="py-2 px-2">2005</td>
                  <td className="py-2 px-2 font-mono text-xs">XML assinado</td>
                  <td className="py-2 px-2">Authentication (federation)</td>
                  <td className="py-2 px-2 text-amber-500 font-medium">🟡 Enterprise legado</td>
                </tr>
                <tr>
                  <td className="py-2 px-2 font-semibold">WS-Fed</td>
                  <td className="py-2 px-2">2003</td>
                  <td className="py-2 px-2 font-mono text-xs">SAML 1.1 + WS-Trust XML</td>
                  <td className="py-2 px-2">Authentication (passive)</td>
                  <td className="py-2 px-2 text-destructive font-medium">🔴 Legacy (deprecated novo)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tabs deep-dive */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-4 h-auto">
          {protocols.map((p) => {
            const Icon = p.icon;
            return (
              <TabsTrigger key={p.id} value={p.id} className="text-xs md:text-sm">
                <Icon className="w-3.5 h-3.5 mr-1.5" />
                {p.shortName}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {protocols.map((p) => (
          <TabsContent key={p.id} value={p.id} className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <p.icon className="w-5 h-5 text-primary" />
                      {p.title}
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs">
                      Criado em <strong className="text-foreground">{p.createdYear}</strong> · {p.createdBy}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={p.badgeColor}
                    className={
                      p.badge === "Enterprise"
                        ? "border-amber-500/60 text-amber-500"
                        : p.badge === "Legacy"
                        ? "border-destructive/60 text-destructive"
                        : ""
                    }
                  >
                    {p.badge}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <section>
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Para que serve</h3>
                  <p className="text-sm text-foreground/90 leading-relaxed">{p.purpose}</p>
                </section>

                <section className="rounded-md bg-primary/5 border border-primary/20 p-3">
                  <h3 className="text-sm font-semibold mb-1.5 flex items-center gap-1.5 text-primary">
                    <Sparkles className="w-4 h-4" /> Quando usar HOJE
                  </h3>
                  <p className="text-sm text-foreground/90 leading-relaxed">{p.whenUse}</p>
                </section>

                <section>
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Mensagem típica</h3>
                  <pre className="bg-muted/40 border border-border rounded-md p-3 text-[11px] overflow-auto max-h-96 leading-relaxed font-mono">
                    <code>{p.message}</code>
                  </pre>
                </section>

                <section>
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Fluxo de autenticação</h3>
                  <div className="rounded-md border border-border bg-card/40 p-3">
                    <MermaidDiagram chart={p.flow} />
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-amber-500">
                    <AlertTriangle className="w-4 h-4" /> Trade-offs
                  </h3>
                  <ul className="space-y-1 text-sm">
                    {p.tradeOffs.map((t, i) => (
                      <li key={i} className="text-foreground/85 leading-snug">
                        • {t}
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="text-xs text-muted-foreground border-t border-border pt-3">
                  <span className="font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Exemplo real:
                  </span>
                  <p className="mt-1 text-foreground/85">{p.realExample}</p>
                </section>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Decision tree no rodapé */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Qual escolher?
          </CardTitle>
          <CardDescription className="text-xs">Decision tree por cenário.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border bg-card/40 p-3">
            <MermaidDiagram chart={DECISION_TREE} />
          </div>
          <div className="mt-3 text-sm text-foreground/85 leading-relaxed">
            <strong className="text-foreground">Resumo:</strong> Pra apps novos →{" "}
            <strong className="text-emerald-500">OIDC</strong> (é OAuth 2.0 + identidade). Apenas autorização machine-to-machine → <strong className="text-primary">OAuth 2.0</strong> puro
            (Client Credentials). Integração com SaaS legado → <strong className="text-amber-500">SAML 2.0</strong> via Enterprise Applications. ADFS clássico /
            SharePoint on-prem → <strong className="text-destructive">WS-Fed</strong>, mas planeje migrar.
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            <strong className="text-foreground">Ativo agora:</strong>{" "}
            <span className={active.id === "oidc" || active.id === "oauth2" ? "text-emerald-500" : active.id === "saml" ? "text-amber-500" : "text-destructive"}>
              {active.title} ({active.badge})
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
