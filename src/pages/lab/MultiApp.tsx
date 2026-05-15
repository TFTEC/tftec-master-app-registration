import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MermaidDiagram } from "@/components/lab/MermaidDiagram";
import { TokenClaimSpotlight } from "@/components/lab/TokenClaimSpotlight";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Boxes, Globe2, UserPlus2, GitBranch, AlertTriangle, CheckCircle2, Sparkles, Play } from "lucide-react";

const PATTERN_A_DIAGRAM = `graph LR
  SPA[Frontend SPA] -->|access_token| AR[App Reg unica<br/>tftec-auth-aluno]
  API[Backend API] -->|valida JWT| AR
  AR -.->|aud=api://client-id<br/>scp=api.read api.write| Token[Mesmo App Reg<br/>serve as duas]
  style AR fill:#1e293b,stroke:#3b82f6`;

const PATTERN_B_DIAGRAM = `graph LR
  SPA[Frontend SPA] -->|access_token| ClientAR[App Reg Cliente<br/>sem Expose an API]
  ClientAR -.->|API permissions:<br/>api://api-app/Scopes| APIAR[App Reg API<br/>Expose an API]
  API[Backend API] -->|valida JWT| APIAR
  APIAR -.->|aud=api://api-app| Token[Cliente e API<br/>App Regs separadas]
  style ClientAR fill:#1e293b,stroke:#3b82f6
  style APIAR fill:#1e293b,stroke:#10b981`;

const MULTI_TENANT_DIAGRAM = `graph TD
  Home[Seu tenant<br/>onde voce CRIOU a App Reg] --> AO[App Object<br/>so existe aqui]
  AO --> SP1[Service Principal<br/>tenant A]
  AO --> SP2[Service Principal<br/>tenant B]
  AO --> SP3[Service Principal<br/>tenant C]
  SP1 -.->|criado no primeiro<br/>consent ou az ad sp create| Cli1[Cliente 1 logando]
  SP2 -.->|sem SP = AADSTS7000229| Cli2[Cliente 2 logando]
  style AO fill:#3b82f6,stroke:#3b82f6,color:#fff
  style SP2 fill:#ef4444,stroke:#ef4444,color:#fff`;

const B2B_DIAGRAM = `sequenceDiagram
  participant U as Usuario guest<br/>tenant origem
  participant H as Tenant host<br/>seu app
  participant E as Entra ID host
  participant A as App
  U->>H: Convite por email aceito
  H->>H: Cria guest user object<br/>user@origem.com#EXT#@host.onmicrosoft.com
  U->>A: Tentativa de login
  A->>E: /authorize tenant=host
  E->>U: Redirect para tenant origem (auth)
  U->>E: Login no tenant origem
  E->>A: id_token com claims<br/>iss=host, idp=origem, oid=guest_id`;

const OBO_CHAIN_DIAGRAM = `sequenceDiagram
  participant C as Cliente SPA
  participant A1 as API1 Gateway
  participant E as Entra ID
  participant A2 as API2 Servico
  participant A3 as API3 Graph
  C->>A1: Bearer token1 aud=A1
  A1->>E: /token jwt-bearer + token1
  E->>A1: token2 aud=A2 mesma identidade
  A1->>A2: Bearer token2
  A2->>E: /token jwt-bearer + token2
  E->>A2: token3 aud=A3 mesma identidade
  A2->>A3: Bearer token3
  A3->>A2: Dados do Graph
  A2->>A1: Resposta agregada
  A1->>C: 200`;

const AADSTS_SP_CREATE_SNIPPET = `# Erro: AADSTS7000229
# "The application is missing service principal in the tenant."
# Significa: App Reg eh multi-tenant, mas o tenant atual nunca consentiu
# nenhuma permission, entao nao tem Service Principal local.

# Solucao 1 (admin): criar SP manualmente no tenant
az ad sp create --id <APP_ID>

# Solucao 2 (programatica): trigger consent flow primeiro
# https://login.microsoftonline.com/{tenant}/adminconsent?client_id=<APP_ID>

# Solucao 3 (no codigo): MSAL detecta e redireciona pro adminconsent endpoint`;

const PATTERN_A_VS_B_DECISION = `graph TD
  Start[Quantos clients<br/>vao consumir essa API?] --> Q1{Mais de 1?}
  Q1 -->|Nao SPA + API juntos| A[Pattern A<br/>1 App Reg pra ambos]
  Q1 -->|Sim multiplos clients ou<br/>integracoes externas| B[Pattern B<br/>App Reg separadas]
  A --> Pros1[Simples menos config<br/>OK pra MVP]
  B --> Pros2[Segregacao<br/>API reusavel<br/>releases independentes]
  A -.->|Quando a API ganhar<br/>outro consumidor| Migrate[Migrar A para B]
  style A fill:#1e293b,stroke:#3b82f6
  style B fill:#1e293b,stroke:#10b981`;

interface TabConfig {
  id: string;
  title: string;
  shortName: string;
  icon: typeof Boxes;
}

const tabs: TabConfig[] = [
  { id: "pattern-a-b", title: "Pattern A vs B", shortName: "Pattern A/B", icon: Boxes },
  { id: "multi-tenant", title: "Single vs Multi-tenant", shortName: "Multi-tenant", icon: Globe2 },
  { id: "b2b", title: "B2B External Identities", shortName: "B2B", icon: UserPlus2 },
  { id: "obo", title: "OBO Chains", shortName: "OBO chains", icon: GitBranch },
];

export default function LabMultiApp() {
  const [tab, setTab] = useState("pattern-a-b");

  return (
    <div className="space-y-6 max-w-7xl">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Multi-App Patterns</h1>
        <p className="text-muted-foreground">
          Pattern A vs B, multi-tenant, B2B, OBO chains — 4 decisões arquiteturais que aparecem cedo e doem caro pra reverter.
        </p>
        <div className="text-xs px-3 py-2 rounded bg-primary/5 border border-primary/20">
          📚 <strong>Esta página é visual/conceitual.</strong> Pro hands-on de configurar Pattern A multi-tenant veja{" "}
          <a
            href="https://github.com/tftec-guilherme/entra-auth-gateway/blob/main/docs/aula/hands-on.md#cap-7--multi-tenant-e-m%C3%BAltiplos-app-regs-10-min"
            target="_blank"
            rel="noreferrer"
            className="underline text-primary"
          >
            hands-on Cap 7
          </a>
          .
        </div>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-4 h-auto">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <TabsTrigger key={t.id} value={t.id} className="text-xs md:text-sm">
                <Icon className="w-3.5 h-3.5 mr-1.5" />
                {t.shortName}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* TAB 1 — Pattern A vs Pattern B */}
        <TabsContent value="pattern-a-b" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-primary" />
                Pattern A vs Pattern B — quantos App Regs?
              </CardTitle>
              <CardDescription>
                A pergunta mais frequente: "uso 1 App Reg pra SPA + API, ou separo em 2?" Resposta depende de quantos clients vão consumir a API.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-primary/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Badge variant="default">Pattern A</Badge>
                      <span className="text-muted-foreground text-sm font-normal">1 App Reg pra tudo</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-md border border-border bg-card/40 p-3">
                      <MermaidDiagram chart={PATTERN_A_DIAGRAM} />
                    </div>
                    <Pros items={["Mais simples — menos config", "Menos credenciais pra rotacionar", "OK pra MVP, demos, single-client"]} />
                    <Cons items={["SPA e API compartilham credenciais", "Release acoplada", "Difícil expor a API pra OUTROS clients"]} />
                    <p className="text-xs text-muted-foreground border-t border-border pt-2">
                      <strong className="text-foreground">Exemplo real:</strong> o próprio <code className="px-1 py-0.5 rounded bg-muted text-[0.9em]">tftec-auth</code> usa
                      Pattern A — uma App Reg multi-tenant serve tanto o SPA (Auth Code + PKCE) quanto a API (.NET 8 Microsoft.Identity.Web validando o mesmo{" "}
                      <code className="px-1 py-0.5 rounded bg-muted text-[0.9em]">{"aud=api://{client-id}"}</code>).
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-emerald-500/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Badge variant="outline" className="border-emerald-500/60 text-emerald-500">
                        Pattern B
                      </Badge>
                      <span className="text-muted-foreground text-sm font-normal">App Regs separadas</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-md border border-border bg-card/40 p-3">
                      <MermaidDiagram chart={PATTERN_B_DIAGRAM} />
                    </div>
                    <Pros items={["Segregação de credenciais", "API consumível por N clients (web + mobile + B2B)", "Releases independentes"]} />
                    <Cons items={["Mais boilerplate (`Expose an API`, `API permissions` cross-app)", "Mais credenciais pra gerenciar", "Overhead pra MVP simples"]} />
                    <p className="text-xs text-muted-foreground border-t border-border pt-2">
                      <strong className="text-foreground">Quando migrar A → B:</strong> quando aparecer o SEGUNDO consumidor da API (mobile app, integração externa,
                      outro time). Migração não é trivial — token audience muda, clients precisam re-consent.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" /> Decision tree
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border border-border bg-card/40 p-3">
                    <MermaidDiagram chart={PATTERN_A_VS_B_DECISION} />
                  </div>
                </CardContent>
              </Card>

              <TokenClaimSpotlight
                source="authservice"
                highlight="aud"
                title="Veja o aud do SEU token (Pattern A em ação)"
                description="No tftec-auth (Pattern A), a App Reg única emite tokens com aud=api://{client-id} — mesmo audience pra SPA e API. Se fosse Pattern B, aud apontaria pra App Reg separada da API."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2 — Single vs Multi-tenant */}
        <TabsContent value="multi-tenant" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-primary" /> Single vs Multi-tenant
              </CardTitle>
              <CardDescription>
                Setting <code className="px-1 py-0.5 rounded bg-muted text-[0.9em]">signInAudience</code> decide quem pode logar — e mudar depois quebra tudo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 text-muted-foreground text-xs uppercase tracking-wide">Caso</th>
                      <th className="text-left py-2 px-2 text-muted-foreground text-xs uppercase tracking-wide">Escolha</th>
                      <th className="text-left py-2 px-2 text-muted-foreground text-xs uppercase tracking-wide">signInAudience</th>
                    </tr>
                  </thead>
                  <tbody className="text-foreground/90">
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-2">App interno só da sua empresa</td>
                      <td className="py-2 px-2 font-semibold">Single</td>
                      <td className="py-2 px-2 font-mono text-xs">AzureADMyOrg</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-2">SaaS B2B (vende pra outras empresas)</td>
                      <td className="py-2 px-2 font-semibold text-primary">Multi-tenant</td>
                      <td className="py-2 px-2 font-mono text-xs">AzureADMultipleOrgs</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-2">App público + contas pessoais (Gmail, Outlook)</td>
                      <td className="py-2 px-2 font-semibold">Multi + personal</td>
                      <td className="py-2 px-2 font-mono text-xs">AzureADandPersonalMicrosoftAccount</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2">App consumer (Xbox-like)</td>
                      <td className="py-2 px-2 font-semibold">B2C (produto separado!)</td>
                      <td className="py-2 px-2 font-mono text-xs text-muted-foreground">Entra External ID</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="rounded-md bg-amber-500/5 border border-amber-500/30 p-3 text-sm flex gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-foreground/90">
                  <strong>Single → Multi-tenant DEPOIS quebra:</strong> tokens cached param de funcionar, issuer muda (`https://login.microsoftonline.com/{`{tenant-id}`}/v2.0`
                  vs `https://login.microsoftonline.com/{"{tenant-do-cliente}"}/v2.0`), validação de issuer no backend precisa ser ajustada. <strong>Decida no day 1.</strong>
                </p>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Como multi-tenant funciona: 1 App Object + N Service Principals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border border-border bg-card/40 p-3">
                    <MermaidDiagram chart={MULTI_TENANT_DIAGRAM} />
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed mt-3">
                    Cada cliente novo que faz login, Entra ID provisiona um <strong>Service Principal no tenant dele</strong>. Sem o SP, login falha com{" "}
                    <code className="px-1 py-0.5 rounded bg-muted text-[0.9em]">AADSTS7000229</code>.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-4 h-4" /> AADSTS7000229 — como resolver
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted/40 border border-border rounded-md p-3 text-xs overflow-auto leading-relaxed">
                    <code>{AADSTS_SP_CREATE_SNIPPET}</code>
                  </pre>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3 — B2B */}
        <TabsContent value="b2b" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus2 className="w-5 h-5 text-primary" /> B2B External Identities
              </CardTitle>
              <CardDescription>
                Convidar usuários de outros tenants Entra ID pra acessar seu app — sem migrar a conta deles.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-foreground/85 leading-relaxed">
                B2B (Business-to-Business) = você convida um usuário de outra organização (outro tenant Entra ID). Entra ID cria um{" "}
                <strong>guest user object</strong> no SEU tenant, mas a autenticação acontece no tenant ORIGINAL do convidado — sem migrar credenciais.
              </p>

              <div className="rounded-md border border-border bg-card/40 p-3">
                <MermaidDiagram chart={B2B_DIAGRAM} />
              </div>

              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
                  <h4 className="font-semibold text-primary mb-2">Claims importantes no token do guest</h4>
                  <ul className="space-y-1 text-foreground/85 text-xs">
                    <li>
                      • <code className="px-1 py-0.5 rounded bg-muted text-[0.9em]">iss</code>: tenant que ASSINOU o token (seu)
                    </li>
                    <li>
                      • <code className="px-1 py-0.5 rounded bg-muted text-[0.9em]">tid</code>: tenant de RECURSO (seu)
                    </li>
                    <li>
                      • <code className="px-1 py-0.5 rounded bg-muted text-[0.9em]">idp</code>: tenant de ORIGEM do guest (cliente)
                    </li>
                    <li>
                      • <code className="px-1 py-0.5 rounded bg-muted text-[0.9em]">oid</code>: ID do guest user object no SEU tenant
                    </li>
                  </ul>
                </div>

                <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
                  <h4 className="font-semibold text-amber-500 mb-2">B2B vs B2C — não confunda</h4>
                  <ul className="space-y-1 text-foreground/85 text-xs">
                    <li>
                      • <strong>B2B</strong>: convidados são users de OUTROS tenants Entra ID (corporativo). Usa o mesmo Entra ID.
                    </li>
                    <li>
                      • <strong>B2C</strong>: produto SEPARADO (Entra External ID for Customers). Pra consumer final (Gmail, Facebook social login).
                    </li>
                    <li>• Mesma App Reg NÃO atende ambos — escolha cedo.</li>
                  </ul>
                </div>
              </div>

              <div className="rounded-md bg-primary/5 border border-primary/20 p-3 text-sm">
                <strong className="text-primary">Quando usar B2B:</strong> SaaS B2B (você vende pra outras empresas), parcerias entre orgs (consultores externos com
                conta corporativa deles), supply chain. <strong>Quando NÃO usar:</strong> apps consumer (B2C), apps internos só da sua empresa (Single tenant).
              </div>

              <TokenClaimSpotlight
                source="id-token"
                highlight="tid"
                title="Veja o tid do SEU ID Token (se você é guest, idp também aparece)"
                description="tid é o tenant de RECURSO (onde o app vive). Se você logou como guest de outro tenant, vai ter também o claim idp apontando pro seu tenant original. Pra users do home tenant, idp não aparece."
                visibleClaims={["aud", "iss", "tid", "oid", "idp", "name", "preferred_username", "ver"]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4 — OBO chains */}
        <TabsContent value="obo" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-primary" /> OBO Chains — preservar identidade através de N APIs
              </CardTitle>
              <CardDescription>
                On-Behalf-Of permite que uma API troque o token recebido por outro, mantendo a identidade do usuário original. Encadeia através de microservices.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border border-border bg-card/40 p-3">
                <MermaidDiagram chart={OBO_CHAIN_DIAGRAM} />
              </div>

              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
                  <h4 className="font-semibold text-emerald-500 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Quando usar OBO
                  </h4>
                  <ul className="space-y-1 text-foreground/85 text-xs leading-snug">
                    <li>• Microservices chain onde auditoria precisa preservar QUEM iniciou (compliance)</li>
                    <li>• API intermediária precisa chamar Graph com identidade do usuário (não da própria API)</li>
                    <li>• Permissões precisam ser limitadas pelo que o USER pode (não pelo que a API pode)</li>
                  </ul>
                </div>

                <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
                  <h4 className="font-semibold text-amber-500 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Trade-offs
                  </h4>
                  <ul className="space-y-1 text-foreground/85 text-xs leading-snug">
                    <li>• Latência: cada salto = 1 round-trip ao Entra ID (mitigar com token cache distribuído)</li>
                    <li>• Custos: muitos tokens emitidos (quota /token endpoint)</li>
                    <li>• Complexidade: cada API precisa de App Reg com `Expose an API` + `API permissions` cross-app</li>
                  </ul>
                </div>
              </div>

              <div className="rounded-md bg-primary/5 border border-primary/20 p-3 text-sm">
                <strong className="text-primary">Alternativa quando OBO custa demais:</strong> Client Credentials puro (cada API valida o user pelo token original e usa
                MI/cert pra chamar downstream com identidade da App). Funciona se auditoria não exige user-real através da chain. <strong>Trade-off:</strong> auditoria
                vê <code className="px-1 py-0.5 rounded bg-muted text-[0.9em]">appid</code>, não <code className="px-1 py-0.5 rounded bg-muted text-[0.9em]">oid</code>.
              </div>

              <div className="rounded-md border border-primary/30 bg-primary/5 p-3 flex items-center justify-between flex-wrap gap-2">
                <div className="text-sm">
                  <strong className="text-primary">Ver OBO executando de verdade?</strong> O cenário OBO em <code>/lab/demo</code> faz o flow contra o backend{" "}
                  <code className="px-1 py-0.5 rounded bg-muted text-[0.9em]">tftec-auth</code>.
                </div>
                <Link to="/lab/demo">
                  <Button size="sm" variant="default">
                    <Play className="w-3.5 h-3.5 mr-1.5" /> Abrir Demo
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Pros({ items }: { items: string[] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-emerald-500 mb-1.5 flex items-center gap-1">
        <CheckCircle2 className="w-3.5 h-3.5" /> Prós
      </h4>
      <ul className="space-y-0.5 text-xs">
        {items.map((p, i) => (
          <li key={i} className="text-foreground/85 leading-snug">
            • {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Cons({ items }: { items: string[] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-amber-500 mb-1.5 flex items-center gap-1">
        <AlertTriangle className="w-3.5 h-3.5" /> Trade-offs
      </h4>
      <ul className="space-y-0.5 text-xs">
        {items.map((c, i) => (
          <li key={i} className="text-foreground/85 leading-snug">
            • {c}
          </li>
        ))}
      </ul>
    </div>
  );
}
