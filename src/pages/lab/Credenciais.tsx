import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MermaidDiagram } from "@/components/lab/MermaidDiagram";
import { TokenClaimSpotlight } from "@/components/lab/TokenClaimSpotlight";
import { KeyRound, FileLock, Github, Cloud, AlertTriangle, CheckCircle2, Sparkles, ExternalLink } from "lucide-react";

const FIC_WORKFLOW_SNIPPET = `# .github/workflows/deploy-azure.yml — ZERO secrets de Azure

permissions:
  id-token: write     # Required for OIDC token exchange
  contents: read

jobs:
  deploy-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Azure Login (OIDC)
        uses: azure/login@v2
        with:
          client-id: \${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: \${{ secrets.AZURE_TENANT_ID }}
          subscription-id: \${{ secrets.AZURE_SUBSCRIPTION_ID }}
        # NOTA: AZURE_CLIENT_ID NÃO é secret de auth — é só o GUID do SP.
        # A confiança é configurada no Entra ID via Federated Credential.

      - name: Deploy to App Service
        uses: azure/webapps-deploy@v3
        with:
          app-name: authservice-api-tftec
          package: api/publish`;

const FIC_CREATE_SNIPPET = `# Configurar Federated Credential no Entra ID (uma vez)
$repo = "seu-user/seu-repo"
$appId = "<APP_ID>"

az ad app federated-credential create --id $appId --parameters @'
{
  "name": "github-main",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:seu-user/seu-repo:ref:refs/heads/main",
  "audiences": ["api://AzureADTokenExchange"]
}
'@`;

const SECRET_CREATE_SNIPPET = `# Portal: App registration → Certificates & secrets → + New client secret
# CLI:
az ad app credential reset --id <APP_ID> --years 1
# ⚠️ Secret é printado UMA VEZ na tela — copie agora`;

const CERT_CREATE_SNIPPET = `# 1) Gerar cert self-signed (dev only — prod usa CA)
openssl req -x509 -newkey rsa:2048 -keyout cert.key -out cert.pem -days 365 -nodes

# 2) Upload no Entra ID
az ad app credential reset --id <APP_ID> --cert "@cert.pem"

# 3) Usar no código (Microsoft.Identity.Web)
"AzureAd": {
  "ClientCertificates": [
    { "SourceType": "Path", "CertificateDiskPath": "cert.pfx", "CertificatePassword": "..." }
  ]
}`;

const MI_CREATE_SNIPPET = `# 1) Habilitar System-Assigned MI no recurso Azure
az webapp identity assign --name tftec-auth-api --resource-group rg-tftec

# 2) Dar permissão (ex.: ler do KeyVault)
az role assignment create --assignee <principal-id> \\
  --role "Key Vault Secrets User" \\
  --scope <vault-resource-id>

# 3) No código — DefaultAzureCredential resolve automaticamente
var credential = new DefaultAzureCredential();
var client = new SecretClient(vaultUri, credential);
# Em produção usa MI; em dev local cai pra az CLI / VS / VSCode credential`;

const FIC_FLOW = `sequenceDiagram
  participant GH as GitHub Actions
  participant T as GitHub OIDC issuer
  participant E as Entra ID
  participant A as Azure resource
  GH->>T: Solicita id_token (jwt)
  T->>GH: id_token com claims (repo, ref, sub)
  GH->>E: /token (client_assertion=id_token)
  Note over E: Valida assinatura via JWKS público<br/>do GitHub e confere subject<br/>contra Federated Credential
  E->>GH: access_token (Azure)
  GH->>A: Deploy / az CLI calls
  A->>GH: 200`;

const DECISION_TREE = `graph TD
  Start[Onde seu app vai rodar?] --> Loc{Localização}
  Loc -->|Dentro do Azure| MI[Managed Identity<br/>App Service / VM / Function / AKS]
  Loc -->|CI CD GitHub Azure DevOps| FIC[Federated Identity Credential<br/>OIDC trust]
  Loc -->|On-prem / outro cloud| OnPrem{Permite cert?}
  OnPrem -->|Sim| Cert[Certificate<br/>client_assertion JWT]
  OnPrem -->|Não| Sec[Client Secret<br/>MVP / dev local apenas]
  MI --> Best[ZERO credenciais pra gerenciar]
  FIC --> Best
  Cert --> Rotation[Planejar rotação anual]
  Sec --> Warn[Secret vaza fácil<br/>rotacionar 6 meses]`;

interface CredItem {
  id: string;
  title: string;
  shortName: string;
  icon: typeof KeyRound;
  badge: "MVP" | "Prod OK" | "Recomendado" | "Azure only";
  mechanism: string;
  whenToUse: string;
  risks: string[];
  mitigations: string[];
  createSnippet: string;
  flowChart?: string;
  realExample?: string;
}

const credentials: CredItem[] = [
  {
    id: "secret",
    title: "Client Secret",
    shortName: "Secret",
    icon: KeyRound,
    badge: "MVP",
    mechanism:
      "String randômica gerada pelo Portal/CLI. App envia (`client_id` + `client_secret`) pra trocar por access_token. Expira em 6/12/24 meses.",
    whenToUse: "MVP, dev local, prototipagem rápida. NUNCA em produção crítica — secret vaza em logs, env, code, chats.",
    risks: [
      "Vaza em commits acidentais (`.env` no Git, screenshots em PRs)",
      "Logs e exception traces podem capturar — varredura de leak é trabalhosa",
      "Rotação manual a cada 6-12 meses (esquece, expira, app cai)",
    ],
    mitigations: [
      "Use Key Vault em produção (mas então prefira Managed Identity)",
      "Configure detecção de leak (GitHub secret scanning, GitGuardian)",
      "Migre pra FIC / Managed Identity assim que possível",
    ],
    createSnippet: SECRET_CREATE_SNIPPET,
    realExample:
      "tftec-auth usa secret só em dev local (`appsettings.Development.json`). Em produção o backend lê `AZURE_AUTHSERVICE_CLIENT_SECRET` do GitHub Secrets (que é, ironicamente, um anti-padrão — futura migração pra FIC end-to-end).",
  },
  {
    id: "cert",
    title: "Certificate",
    shortName: "Cert",
    icon: FileLock,
    badge: "Prod OK",
    mechanism:
      "App assina um JWT (`client_assertion`) com private key do certificate. Entra ID valida com public key registrada na App Reg. Sem segredo viajando pela rede.",
    whenToUse:
      "Workloads em produção fora do Azure (on-prem, outro cloud), apps server-side .NET / Java tradicionais com gestão de cert madura.",
    risks: [
      "Rotação trabalhosa (gerar cert novo, registrar no Entra ID, deploy)",
      "Private key vazada = comprometimento total",
      "Gestão de PFX/PEM em containers é chata (mount, secrets engine)",
    ],
    mitigations: [
      "CA interna + automação de rotação (Azure KeyVault gera + auto-renova)",
      "Microsoft.Identity.Web abstrai bem (config-driven)",
      "Pra prod nova, considere FIC (sem cert algum)",
    ],
    createSnippet: CERT_CREATE_SNIPPET,
  },
  {
    id: "fic",
    title: "Federated Identity Credential",
    shortName: "FIC",
    icon: Github,
    badge: "Recomendado",
    mechanism:
      "Trust no Entra ID que aceita id_tokens emitidos por OUTRO issuer OIDC (GitHub Actions, AKS, GitLab, qualquer JWT issuer). Sem secret, sem cert — só trust de issuer + filtro de subject.",
    whenToUse:
      "CI/CD (GitHub Actions, Azure DevOps, GitLab), AKS Workload Identity, qualquer cenário onde já existe um OIDC issuer confiável. Padrão moderno recomendado pela Microsoft.",
    risks: [
      "Configuração inicial requer entender subject filter (`repo:org/repo:ref:refs/heads/main`)",
      "Subject muito permissivo (ex.: só `repo:org/repo:*`) abre brecha",
      "Issuer comprometido (improvável, mas tem que confiar no GitHub/AKS/etc)",
    ],
    mitigations: [
      "Filtre subject por branch específica (`refs/heads/main`) ou environment",
      "Use Federated Credentials separadas por env (dev/staging/prod)",
      "Monitore login attempts no Entra ID (sign-in logs)",
    ],
    createSnippet: FIC_CREATE_SNIPPET,
    flowChart: FIC_FLOW,
    realExample:
      "O CI/CD do tftec-auth usa FIC: `.github/workflows/deploy-azure.yml` chama `azure/login@v2` com `client-id` + `tenant-id` + `subscription-id` — esses 3 NÃO são segredos de auth, são só GUIDs públicos. A confiança real fica no Federated Credential registrado no Entra ID (`sp-tftec-authsvc-cicd-001`).",
  },
  {
    id: "managed-identity",
    title: "Managed Identity",
    shortName: "MI",
    icon: Cloud,
    badge: "Azure only",
    mechanism:
      "Identity atrelada a um recurso Azure (App Service, Function, VM, AKS). Azure cuida do lifecycle (criação, rotação, token issuance via IMDS endpoint). Você nunca toca em credencial alguma.",
    whenToUse:
      "Qualquer cenário Azure→Azure: App Service → Storage / KeyVault / SQL / Cosmos / outro App Service. Default absoluto pra workloads que rodam dentro do Azure.",
    risks: [
      "Funciona só DENTRO do Azure (não roda em dev local sem fallback)",
      "Pode ser System-Assigned (1:1 com recurso) ou User-Assigned (compartilhável) — escolher errado complica multi-env",
      "RBAC errado = `403 Forbidden` opaco em runtime",
    ],
    mitigations: [
      "Use `DefaultAzureCredential` — fallback automático pra `az CLI` / VS / VSCode em dev",
      "User-Assigned pra recursos efêmeros (Container Apps, Functions); System-Assigned pra fixos (App Service)",
      "Bicep/Terraform sempre atribui RBAC junto com criação do recurso",
    ],
    createSnippet: MI_CREATE_SNIPPET,
  },
];

export default function LabCredenciais() {
  const [tab, setTab] = useState("secret");
  const active = credentials.find((c) => c.id === tab) ?? credentials[0];

  return (
    <div className="space-y-6 max-w-7xl">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Credenciais</h1>
        <p className="text-muted-foreground">
          Como seu app prova quem é pro Entra ID. 4 opções em ordem crescente de segurança — Secret é MVP, Managed Identity é o ideal Azure.
        </p>
        <div className="text-xs px-3 py-2 rounded bg-primary/5 border border-primary/20">
          📚 <strong>Esta página é visual/conceitual.</strong> Pro hands-on de criar Client Secret e FIC reais veja{" "}
          <a
            href="https://github.com/tftec-guilherme/entra-auth-gateway/blob/main/docs/aula/hands-on.md#cap-6--credenciais-10-min"
            target="_blank"
            rel="noreferrer"
            className="underline text-primary"
          >
            hands-on Cap 6
          </a>
          .
        </div>
      </header>

      {/* Matriz comparativa inicial */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Comparativo rápido
          </CardTitle>
          <CardDescription className="text-xs">As 4 credenciais lado a lado. Em geral: ↓ secret &nbsp;·&nbsp; ↑ FIC e MI.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-muted-foreground text-xs uppercase tracking-wide">Tipo</th>
                  <th className="text-left py-2 px-2 text-muted-foreground text-xs uppercase tracking-wide">Como autentica</th>
                  <th className="text-left py-2 px-2 text-muted-foreground text-xs uppercase tracking-wide">Expiração</th>
                  <th className="text-left py-2 px-2 text-muted-foreground text-xs uppercase tracking-wide">Onde usar</th>
                  <th className="text-left py-2 px-2 text-muted-foreground text-xs uppercase tracking-wide">Risco</th>
                </tr>
              </thead>
              <tbody className="text-foreground/90">
                <tr className="border-b border-border/50">
                  <td className="py-2 px-2 font-semibold">Client Secret</td>
                  <td className="py-2 px-2">String enviada na request</td>
                  <td className="py-2 px-2">6/12/24 meses</td>
                  <td className="py-2 px-2 text-xs">Dev local, MVP</td>
                  <td className="py-2 px-2 text-amber-500 font-medium">🔴 alto</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-2 font-semibold">Certificate</td>
                  <td className="py-2 px-2">JWT assinado com private key</td>
                  <td className="py-2 px-2">~1 ano (configurável)</td>
                  <td className="py-2 px-2 text-xs">On-prem prod</td>
                  <td className="py-2 px-2 text-amber-500/80">🟡 médio</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-2 font-semibold">FIC (Federated)</td>
                  <td className="py-2 px-2">Trust em OIDC issuer externo</td>
                  <td className="py-2 px-2 text-emerald-500">∞ (sem credential)</td>
                  <td className="py-2 px-2 text-xs">CI/CD, AKS</td>
                  <td className="py-2 px-2 text-emerald-500">🟢 baixo</td>
                </tr>
                <tr>
                  <td className="py-2 px-2 font-semibold">Managed Identity</td>
                  <td className="py-2 px-2">Azure injeta token via IMDS</td>
                  <td className="py-2 px-2 text-emerald-500">∞ (sem credential)</td>
                  <td className="py-2 px-2 text-xs">Azure → Azure</td>
                  <td className="py-2 px-2 text-emerald-500">🟢 mínimo</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tabs deep-dive */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-4 h-auto">
          {credentials.map((c) => {
            const Icon = c.icon;
            return (
              <TabsTrigger key={c.id} value={c.id} className="text-xs md:text-sm">
                <Icon className="w-3.5 h-3.5 mr-1.5" />
                {c.shortName}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {credentials.map((c) => (
          <TabsContent key={c.id} value={c.id} className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <c.icon className="w-5 h-5 text-primary" />
                      {c.title}
                    </CardTitle>
                    <CardDescription className="mt-1">{c.mechanism}</CardDescription>
                  </div>
                  <Badge
                    variant={c.badge === "Recomendado" || c.badge === "Azure only" ? "default" : "outline"}
                    className={
                      c.badge === "MVP"
                        ? "border-amber-500/60 text-amber-500"
                        : c.badge === "Prod OK"
                        ? "border-primary/40"
                        : ""
                    }
                  >
                    {c.badge}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <section className="rounded-md bg-primary/5 border border-primary/20 p-3">
                  <h3 className="text-sm font-semibold mb-1.5 flex items-center gap-1.5 text-primary">
                    <Sparkles className="w-4 h-4" /> Quando usar
                  </h3>
                  <p className="text-sm text-foreground/90 leading-relaxed">{c.whenToUse}</p>
                </section>

                <section>
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Como criar / configurar</h3>
                  <pre className="bg-muted/40 border border-border rounded-md p-3 text-xs overflow-auto leading-relaxed">
                    <code>{c.createSnippet}</code>
                  </pre>
                </section>

                {c.flowChart && (
                  <section>
                    <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Fluxo de troca de token</h3>
                    <div className="rounded-md border border-border bg-card/40 p-3">
                      <MermaidDiagram chart={c.flowChart} />
                    </div>
                  </section>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <section>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-amber-500">
                      <AlertTriangle className="w-4 h-4" /> Riscos
                    </h3>
                    <ul className="space-y-1 text-sm">
                      {c.risks.map((r, i) => (
                        <li key={i} className="text-foreground/85 leading-snug">
                          • {r}
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-emerald-500">
                      <CheckCircle2 className="w-4 h-4" /> Mitigations
                    </h3>
                    <ul className="space-y-1 text-sm">
                      {c.mitigations.map((m, i) => (
                        <li key={i} className="text-foreground/85 leading-snug">
                          • {m}
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>

                {c.realExample && (
                  <section className="text-xs text-muted-foreground border-t border-border pt-3">
                    <span className="font-semibold">Exemplo real: </span>
                    {c.realExample}
                  </section>
                )}

                {/* FIC ganha o workflow real exibido logo abaixo */}
                {c.id === "fic" && (
                  <section className="border-t border-border pt-4 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                        <Github className="w-4 h-4" /> Workflow real do tftec-auth
                      </h3>
                      <a
                        href="https://github.com/tftec-guilherme/entra-auth-gateway/actions/workflows/deploy-azure.yml"
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        Ver runs reais no GitHub Actions <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Snippet do <code className="px-1 py-0.5 rounded bg-muted text-[0.9em]">.github/workflows/deploy-azure.yml</code> — zero secrets de auth.
                    </p>
                    <pre className="bg-muted/40 border border-border rounded-md p-3 text-[11px] overflow-auto leading-relaxed">
                      <code>{FIC_WORKFLOW_SNIPPET}</code>
                    </pre>
                  </section>
                )}

                {/* Client Secret ganha um spotlight do appidacr (típico em token Application com secret) */}
                {c.id === "secret" && (
                  <TokenClaimSpotlight
                    source="authservice"
                    highlight="appidacr"
                    title="Veja se SEU token usou secret"
                    description="appidacr=1 indica token obtido via Client Secret/Cert (não broker/MFA). Para tokens de USUÁRIO (delegated, este caso), appidacr geralmente não aparece — é mais comum em tokens Application via Client Credentials."
                    emptyHint="Token de user delegated (Auth Code + PKCE da SPA) — appidacr só aparece em tokens Application (Client Credentials)."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Decision tree */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Qual escolher?
          </CardTitle>
          <CardDescription className="text-xs">Decision tree por localização do workload.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border bg-card/40 p-3">
            <MermaidDiagram chart={DECISION_TREE} />
          </div>
          <div className="mt-3 text-sm text-foreground/85 leading-relaxed">
            <strong className="text-foreground">Resumo da resposta acima:</strong> Default moderno é{" "}
            <strong className="text-primary">Managed Identity dentro do Azure</strong> e{" "}
            <strong className="text-primary">FIC no CI/CD</strong>. Certificate é OK pra on-prem. Client Secret só pra dev local — se está em produção, é
            dívida técnica esperando pra vazar. <em>Não use {active.id === "secret" ? "essa opção (Secret)" : "Client Secret"} em produção.</em>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
