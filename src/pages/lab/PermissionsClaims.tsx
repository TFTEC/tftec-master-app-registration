import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MermaidDiagram } from "@/components/lab/MermaidDiagram";
import { TokenClaimSpotlight } from "@/components/lab/TokenClaimSpotlight";
import { AlertTriangle, CheckCircle2, ShieldCheck, Users, Building2, Code2 } from "lucide-react";

const SCP_TOKEN_PAYLOAD = {
  aud: "api://tftec-auth-aluno-fulano",
  iss: "https://login.microsoftonline.com/{tenant-id}/v2.0",
  iat: 1715616000,
  exp: 1715619600,
  oid: "8a4d3b21-...",
  tid: "{tenant-id}",
  appid: "{client-id-do-spa}",
  scp: "api.read api.write User.Read",
  name: "Fulano da Silva",
  preferred_username: "fulano@tenant.onmicrosoft.com",
  ver: "2.0",
};

const ROLES_TOKEN_PAYLOAD = {
  aud: "api://tftec-auth-aluno-fulano",
  iss: "https://login.microsoftonline.com/{tenant-id}/v2.0",
  iat: 1715616000,
  exp: 1715619600,
  oid: "{service-principal-oid}",
  tid: "{tenant-id}",
  appid: "{client-id-do-daemon}",
  appidacr: "1",
  roles: ["api.admin", "User.Read.All"],
  ver: "2.0",
};

const POLICY_SNIPPET = `// api/Program.cs:80-98
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireApiRead", policy =>
        policy.RequireAssertion(context =>
            context.User.HasClaim(c => c.Type == "scp" && c.Value.Contains("api.read")) ||
            context.User.HasClaim(c => c.Type == "http://schemas.microsoft.com/identity/claims/scope" && c.Value.Contains("api.read"))));

    options.AddPolicy("RequireApiWrite", policy =>
        policy.RequireAssertion(context =>
            context.User.HasClaim(c => c.Type == "scp" && c.Value.Contains("api.write")) ||
            context.User.HasClaim(c => c.Type == "http://schemas.microsoft.com/identity/claims/scope" && c.Value.Contains("api.write"))));

    options.AddPolicy("RequireAdminRole", policy =>
        policy.RequireRole("Admin", "admin"));

    options.AddPolicy("RequireUserRole", policy =>
        policy.RequireRole("User", "user", "Admin", "admin"));
});`;

const CONSENT_FLOW = `graph TD
  Start[Permission adicionada na App Reg] --> Type{Tipo?}
  Type -->|Application| AdminConsent[Admin consent OBRIGATÓRIO]
  Type -->|Delegated| AdminOnly{Marcada como<br/>'Admin only'?}
  AdminOnly -->|Sim ex: User.Read.All delegated| AdminConsent
  AdminOnly -->|Não ex: User.Read| UserConsent[User pode consentir<br/>no primeiro login]
  AdminConsent --> Grant[Portal: API permissions<br/>→ Grant admin consent]
  Grant --> Token[Token emitido com claim]
  UserConsent --> Token
  Type -.->|Sem consent| Err[AADSTS65001 no login]`;

export default function LabPermissionsClaims() {
  const [tab, setTab] = useState("delegated-vs-app");

  return (
    <div className="space-y-6 max-w-7xl">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Permissions & Claims</h1>
        <p className="text-muted-foreground">
          Delegated vs Application, <code className="px-1 py-0.5 rounded bg-muted text-foreground/90 text-[0.9em]">scp</code> vs{" "}
          <code className="px-1 py-0.5 rounded bg-muted text-foreground/90 text-[0.9em]">roles</code>, App Roles vs Groups vs Directory Roles —
          os 5 mecanismos que sempre confundem.
        </p>
        <div className="text-xs px-3 py-2 rounded bg-primary/5 border border-primary/20">
          📚 <strong>Esta página é visual/conceitual.</strong> Pro hands-on de criar App Role real e ver claim no token veja{" "}
          <a
            href="https://github.com/tftec-guilherme/entra-auth-gateway/blob/main/docs/aula/hands-on.md#cap-5--permissions-e-roles-15-min"
            target="_blank"
            rel="noreferrer"
            className="underline text-primary"
          >
            hands-on Cap 5
          </a>
          .
        </div>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto">
          <TabsTrigger value="delegated-vs-app" className="text-xs md:text-sm">
            Delegated vs App
          </TabsTrigger>
          <TabsTrigger value="scp-vs-roles" className="text-xs md:text-sm">
            <code>scp</code> vs <code>roles</code>
          </TabsTrigger>
          <TabsTrigger value="approles-groups" className="text-xs md:text-sm">
            App Roles / Groups
          </TabsTrigger>
          <TabsTrigger value="backend" className="text-xs md:text-sm">
            Backend valida
          </TabsTrigger>
          <TabsTrigger value="consent" className="text-xs md:text-sm">
            Admin consent
          </TabsTrigger>
        </TabsList>

        {/* TAB 1 — Delegated vs Application */}
        <TabsContent value="delegated-vs-app" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Delegated vs Application
              </CardTitle>
              <CardDescription>
                Dois modelos para autorizar seu app — escolha mudou em quase tudo: claim no token, flow, audit, risco.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-primary/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Badge variant="default">Delegated</Badge>
                      <span className="text-muted-foreground text-sm font-normal">"Em nome do user"</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <Row label="Quem o app representa" value="O usuário logado" />
                    <Row label="Claim no token" value="scp (space-separated string)" mono />
                    <Row label="Exemplo Graph" value="User.Read — lê só o perfil do user logado" />
                    <Row label="Quem usa" value="SPAs, Web apps, Mobile" />
                    <Row label="Limita por user?" value="Sim — só vê o que o user vê" />
                    <Row label="Exemplo tftec-auth" value="api.read, api.write (scopes definidos na sua App Reg)" mono />
                  </CardContent>
                </Card>

                <Card className="border-amber-500/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Badge variant="outline" className="border-amber-500/60 text-amber-500">
                        Application
                      </Badge>
                      <span className="text-muted-foreground text-sm font-normal">"Sem user"</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <Row label="Quem o app representa" value="O próprio app (daemon, worker)" />
                    <Row label="Claim no token" value="roles (array de strings)" mono />
                    <Row label="Exemplo Graph" value="User.Read.All — lê perfil de QUALQUER user" />
                    <Row label="Quem usa" value="Daemons, cron jobs, server-to-server" />
                    <Row label="Limita por user?" value="Não — full access ao escopo da permission" />
                    <Row label="Exemplo tftec-auth" value="api.admin (App Role atribuído a um SP de outro app)" mono />
                  </CardContent>
                </Card>
              </div>

              <div className="mt-4 rounded-md bg-amber-500/5 border border-amber-500/30 p-3 text-sm flex gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-foreground/90">
                  <strong>Application permissions são poderosas.</strong>{" "}
                  <code className="px-1 py-0.5 rounded bg-muted text-[0.9em]">User.Read.All</code> aplicação dá acesso ao tenant inteiro. Use só onde realmente precisa, e
                  prefira sempre Delegated quando há usuário envolvido.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2 — scp vs roles */}
        <TabsContent value="scp-vs-roles" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-primary" /> <code>scp</code> vs <code>roles</code> no token
              </CardTitle>
              <CardDescription>
                Mesmo "permission" emite claims de tipos diferentes — string vs array. Backend valida cada um com método específico.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <TokenCard
                  badge="Delegated"
                  badgeVariant="default"
                  title="Token de SPA logado"
                  description="Usuário clicou login → MSAL pediu token → SPA chama API com este token."
                  payload={SCP_TOKEN_PAYLOAD}
                  highlightKey="scp"
                  note="scp é STRING space-separated. Para checar 'api.read' você precisa de .Contains('api.read') ou Split."
                />
                <TokenCard
                  badge="Application"
                  badgeVariant="outline"
                  title="Token de daemon (Client Credentials)"
                  description="Daemon pediu token via /token com client_credentials → não tem user → claim roles em vez de scp."
                  payload={ROLES_TOKEN_PAYLOAD}
                  highlightKey="roles"
                  note="roles é ARRAY de strings. RequireRole(...) do ASP.NET lê este claim direto."
                />
              </div>

              <div className="mt-4 grid md:grid-cols-2 gap-3 text-xs text-muted-foreground">
                <p>
                  <strong className="text-foreground">Quando ambos existem?</strong> Raro — geralmente um token é Delegated OU Application, não os dois. Microsoft.Identity.Web
                  mapeia automaticamente.
                </p>
                <p>
                  <strong className="text-foreground">appidacr=1</strong> no token Application indica autenticação via secret/cert (não broker). Útil pra auditoria.
                </p>
              </div>

              <TokenClaimSpotlight
                source="authservice"
                highlight="scp"
                title="Veja o claim scp do SEU token real"
                description="Você está logado no tftec-auth via SPA (Delegated). Clique pra pegar SEU access_token e ver o claim scp — vai ser uma string com os scopes consentidos."
                emptyHint="Se scp não aparecer, talvez o token requested seja pra Graph (loginRequest) em vez de AuthService — esta página força audience=api://{client-id} pra mostrar scp da SUA API."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3 — App Roles vs Groups vs Directory Roles */}
        <TabsContent value="approles-groups" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" /> App Roles vs Groups vs Directory Roles
              </CardTitle>
              <CardDescription>
                Três jeitos de "atribuir um papel" — fazem coisas parecidas mas vêm de lugares diferentes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <MechCard
                  icon={ShieldCheck}
                  title="App Roles"
                  definedIn="App Registration → App roles"
                  claim="roles"
                  whenToUse="Roles específicas DO SEU app (Admin, Reader, Approver). Default pra autorização de business app."
                  example='{ "roles": ["Admin"] }'
                  pros="Definição vive junto com a app. RBAC simples. Funciona pra users E para outros apps (Service Principals)."
                  recommended
                />
                <MechCard
                  icon={Users}
                  title="Groups"
                  definedIn="Entra ID → Groups"
                  claim="groups (opcional — configurar Token configuration)"
                  whenToUse="RBAC corporativo administrado fora do app. Integra com SharePoint, Teams, Dynamics."
                  example='{ "groups": ["{group-guid}"] }'
                  pros="Granular, centralizado. Mas: claim limit 200 groups → overage ao chamar Graph; usa GUIDs (precisa resolver)."
                />
                <MechCard
                  icon={Building2}
                  title="Directory Roles"
                  definedIn="Entra ID → Roles & admins"
                  claim="wids (v1) ou roles (v2, varia)"
                  whenToUse="Roles GLOBAIS do tenant (Global Admin, User Admin). Raro num app de negócio — geralmente é admin do tenant, não user do app."
                  example='{ "wids": ["62e90394-..."] }'
                  pros="Built-in (62 roles pré-definidas). Usa pra restringir features admin only. NÃO usa pra business RBAC."
                />
              </div>

              <div className="mt-4 rounded-md bg-primary/5 border border-primary/20 p-3 text-sm">
                <strong className="text-primary">Decisão rápida:</strong> App Roles é o default pra autorização do seu app. Groups quando RBAC precisa
                ser administrado fora do app (Teams admin atribui, não o app). Directory Roles é admin de tenant — quase nunca seu uso.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4 — Backend validation */}
        <TabsContent value="backend" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-primary" /> Como o backend tftec-auth valida
              </CardTitle>
              <CardDescription>
                Snippet real de <code>api/Program.cs</code> — note como cada policy lê um claim diferente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <pre className="bg-muted/40 border border-border rounded-md p-3 text-xs overflow-auto leading-relaxed">
                <code>{POLICY_SNIPPET}</code>
              </pre>

              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-1.5">
                  <h4 className="font-semibold flex items-center gap-1.5 text-emerald-500">
                    <CheckCircle2 className="w-4 h-4" /> RequireApiRead / Write (Delegated)
                  </h4>
                  <p className="text-foreground/85 leading-snug">
                    Usa <code className="px-1 py-0.5 rounded bg-muted text-[0.9em]">HasClaim("scp", ...)</code> + checa também o claim long-form{" "}
                    <code className="px-1 py-0.5 rounded bg-muted text-[0.85em]">http://schemas.microsoft.com/identity/claims/scope</code> (legado v1).
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Funciona pra tokens emitidos a um usuário logado via SPA. <code>scp</code> é string — usa <code>.Contains(...)</code>.
                  </p>
                </div>

                <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 space-y-1.5">
                  <h4 className="font-semibold flex items-center gap-1.5 text-amber-500">
                    <CheckCircle2 className="w-4 h-4" /> RequireAdminRole / UserRole (App Roles)
                  </h4>
                  <p className="text-foreground/85 leading-snug">
                    Usa <code className="px-1 py-0.5 rounded bg-muted text-[0.9em]">policy.RequireRole("Admin", "admin")</code> — ASP.NET mapeia automaticamente do claim{" "}
                    <code>roles</code>.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Funciona tanto pra users com App Role atribuído (delegated com role) quanto pra apps com Application Role (daemon).
                  </p>
                </div>
              </div>

              <div className="rounded-md bg-destructive/5 border border-destructive/30 p-3 text-sm flex gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-foreground/90">
                  <strong>Não dá pra usar <code>RequireRole</code> pra checar <code>scp</code>.</strong> São claims de tipos diferentes (array vs string).
                  Se misturar, sua policy nunca vai bater. Veja <code>api/Program.cs:83-94</code> — cada policy tem sua técnica.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5 — Admin consent */}
        <TabsContent value="consent" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" /> Admin consent — quando é obrigatório?
              </CardTitle>
              <CardDescription>
                Algumas permissions precisam de admin do tenant consentindo — não basta o user clicar "Aceitar".
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border border-border bg-card/40 p-3">
                <MermaidDiagram chart={CONSENT_FLOW} />
              </div>

              <div className="grid md:grid-cols-3 gap-3 text-sm">
                <Example
                  type="Delegated user-consentable"
                  perm="User.Read"
                  needsAdmin={false}
                  note="User clica login → 'OK ler meu perfil' → pronto."
                />
                <Example
                  type="Delegated admin-only"
                  perm="User.Read.All"
                  needsAdmin={true}
                  note="Mesmo delegated, lê perfil de outros → admin precisa aprovar."
                />
                <Example
                  type="Application (qualquer)"
                  perm="Mail.Read"
                  needsAdmin={true}
                  note="App sem user atuando → admin sempre obrigatório."
                />
              </div>

              <div className="rounded-md bg-destructive/5 border border-destructive/30 p-3 text-sm flex gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-foreground/90">
                  <strong>Sintoma de admin consent faltando:</strong> AADSTS65001 no login —
                  <em>"The user or administrator has not consented to use the application..."</em>. Resolva em Portal → API permissions →{" "}
                  <strong>Grant admin consent for {"{tenant}"}</strong>.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className={mono ? "font-mono text-xs" : "text-sm text-foreground/90"}>{value}</span>
    </div>
  );
}

interface TokenCardProps {
  badge: string;
  badgeVariant: "default" | "outline";
  title: string;
  description: string;
  payload: Record<string, unknown>;
  highlightKey: string;
  note: string;
}

function TokenCard({ badge, badgeVariant, title, description, payload, highlightKey, note }: TokenCardProps) {
  return (
    <Card className={badgeVariant === "default" ? "border-primary/30" : "border-amber-500/30"}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge variant={badgeVariant} className={badgeVariant === "outline" ? "border-amber-500/60 text-amber-500" : ""}>
            {badge}
          </Badge>
        </div>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <pre className="bg-muted/40 border border-border rounded-md p-2.5 text-[11px] overflow-auto leading-relaxed font-mono">
          {Object.entries(payload).map(([k, v]) => {
            const isHighlight = k === highlightKey;
            const valueStr = typeof v === "string" ? `"${v}"` : JSON.stringify(v);
            return (
              <div
                key={k}
                className={isHighlight ? "bg-primary/15 -mx-1 px-1 rounded" : ""}
              >
                <span className={isHighlight ? "text-primary font-bold" : "text-muted-foreground"}>"{k}"</span>
                <span className="text-muted-foreground">: </span>
                <span className="text-foreground/90">{valueStr}</span>
                <span className="text-muted-foreground">,</span>
              </div>
            );
          })}
        </pre>
        <p className="text-xs text-muted-foreground leading-snug">{note}</p>
      </CardContent>
    </Card>
  );
}

interface MechCardProps {
  icon: typeof ShieldCheck;
  title: string;
  definedIn: string;
  claim: string;
  whenToUse: string;
  example: string;
  pros: string;
  recommended?: boolean;
}

function MechCard({ icon: Icon, title, definedIn, claim, whenToUse, example, pros, recommended }: MechCardProps) {
  return (
    <Card className={recommended ? "border-primary/40" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Icon className={`w-4 h-4 ${recommended ? "text-primary" : "text-muted-foreground"}`} />
            {title}
          </CardTitle>
          {recommended && (
            <Badge variant="default" className="text-[10px]">
              recomendado
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="text-sm space-y-2.5">
        <div>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Definido em</span>
          <p className="text-foreground/90 text-sm">{definedIn}</p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Claim</span>
          <p className="font-mono text-xs">{claim}</p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Quando usar</span>
          <p className="text-foreground/90 text-sm leading-snug">{whenToUse}</p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Exemplo no token</span>
          <pre className="bg-muted/40 border border-border rounded-md p-2 text-[11px] font-mono text-foreground/90">
            {example}
          </pre>
        </div>
        <div>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Trade-offs</span>
          <p className="text-xs text-foreground/85 leading-snug">{pros}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Example({ type, perm, needsAdmin, note }: { type: string; perm: string; needsAdmin: boolean; note: string }) {
  return (
    <div
      className={`rounded-md border p-3 ${
        needsAdmin ? "border-amber-500/40 bg-amber-500/5" : "border-emerald-500/40 bg-emerald-500/5"
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{type}</span>
        <Badge variant={needsAdmin ? "outline" : "default"} className={needsAdmin ? "border-amber-500/60 text-amber-500 text-[10px]" : "text-[10px]"}>
          {needsAdmin ? "admin" : "user"}
        </Badge>
      </div>
      <p className="font-mono text-sm font-semibold text-foreground">{perm}</p>
      <p className="text-xs text-muted-foreground mt-1 leading-snug">{note}</p>
    </div>
  );
}
