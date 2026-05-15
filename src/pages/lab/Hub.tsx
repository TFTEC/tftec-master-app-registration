import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Beaker, Workflow, Code2, PlayCircle, Network, ShieldCheck, KeyRound, Boxes, FileCode, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AZURE_CONFIG } from "@/config/azure";

// Apenas módulos LIVE. Roadmap dos próximos em docs/aula/lab-modules-roadmap.md
const modules = [
  {
    title: "Demo Interativa",
    description: "Veja um fluxo completo: diagrama animado + execução real + logs ao vivo.",
    href: "/lab/demo",
    icon: PlayCircle,
    badge: "★ destaque",
    accent: "text-primary",
  },
  {
    title: "Tokens & JWT",
    description: "Decoder interativo, anatomia do JWT, comparativo v1 vs v2, ID vs Access Token.",
    href: "/lab/tokens",
    icon: Code2,
  },
  {
    title: "Fluxos OAuth",
    description: "Simuladores animados de Auth Code+PKCE, Client Credentials, OBO e Device Code.",
    href: "/lab/fluxos",
    icon: Workflow,
  },
  {
    title: "Topologias",
    description: "Galeria visual: SPA, Web App, Mobile, Daemon, Microservices+APIM, Workload Identity.",
    href: "/lab/topologias",
    icon: Network,
    badge: "novo",
  },
  {
    title: "Permissions & Claims",
    description: "Delegated vs Application, scp vs roles, App Roles vs Groups, admin consent.",
    href: "/lab/permissions-claims",
    icon: ShieldCheck,
    badge: "novo",
  },
  {
    title: "Credenciais",
    description: "Client Secret vs Certificate vs Federated Identity (FIC) vs Managed Identity — qual usar quando.",
    href: "/lab/credenciais",
    icon: KeyRound,
    badge: "novo",
  },
  {
    title: "Multi-App Patterns",
    description: "Pattern A vs B, single vs multi-tenant, B2B External Identities, OBO chains.",
    href: "/lab/multi-app",
    icon: Boxes,
    badge: "novo",
  },
  {
    title: "Protocolos",
    description: "OIDC vs OAuth 2.0 vs SAML 2.0 vs WS-Fed — 20 anos de federation, qual reconhecer quando.",
    href: "/lab/protocolos",
    icon: FileCode,
    badge: "novo",
  },
  {
    title: "Recipes",
    description: "10 receitas hands-on copy-pasta — SPA, Web App, Mobile, Daemon, FIC, B2B, AKS, Custom Claims, Swagger.",
    href: "/lab/recipes",
    icon: BookOpen,
    badge: "★ destaque",
  },
];

export default function LabHub() {
  const { user } = useAuth();
  return (
    <div className="space-y-6 max-w-7xl">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Beaker className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Laboratório de App Registrations</h1>
            <p className="text-muted-foreground">
              Plataforma educacional sobre Microsoft Entra ID, protocolos e fluxos de identidade.
            </p>
          </div>
        </div>
      </div>

      <Card className="bg-muted/30">
        <CardContent className="pt-6 grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Tenant</p>
            <p className="font-mono">{AZURE_CONFIG.tenantId}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Client App</p>
            <p className="font-mono">{AZURE_CONFIG.clientId}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Usuário logado</p>
            <p>{user?.name || "—"} <span className="text-muted-foreground">({user?.username})</span></p>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <Link key={m.href} to={m.href}>
              <Card className="h-full hover:border-primary/60 hover:bg-card/80 transition group cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Icon className={`w-8 h-8 ${m.accent ?? "text-primary/80"} group-hover:text-primary transition`} />
                    {m.badge && (
                      <Badge variant={m.badge === "★ destaque" ? "default" : "outline"} className="text-xs">
                        {m.badge}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg mt-3">{m.title}</CardTitle>
                  <CardDescription>{m.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="bg-muted/20 border-dashed">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          🎯 <strong>8/8 módulos LIVE.</strong> O <code>/lab</code> do tftec-auth está completo. Veja a história, decisões e roadmap em{" "}
          <code>docs/aula/lab-modules-roadmap.md</code> no repo.
        </CardContent>
      </Card>
    </div>
  );
}
