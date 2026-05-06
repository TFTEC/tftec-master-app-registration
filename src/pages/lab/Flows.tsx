import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SequencePlayer } from "@/components/lab/SequencePlayer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const flows = {
  authcode: {
    title: "Authorization Code + PKCE",
    description: "Padrão para SPAs e apps mobile. PKCE substitui o client_secret.",
    chart: `sequenceDiagram
  participant U as Usuário
  participant C as Cliente (SPA)
  participant E as Entra ID
  participant A as API
  C->>E: /authorize (code_challenge)
  E->>U: Login + consent
  U->>E: Credenciais
  E->>C: code (redirect)
  C->>E: /token (code + verifier)
  E->>C: access + id + refresh
  C->>A: Bearer access_token
  A->>C: 200`,
    steps: [
      { title: "Início", description: "SPA detecta sessão ausente." },
      { title: "/authorize", description: "Envia code_challenge derivado de um code_verifier secreto local." },
      { title: "Tela de login", description: "Hospedada pela Microsoft." },
      { title: "Usuário autentica", description: "Senha + MFA conforme Conditional Access." },
      { title: "Code retorna", description: "Single-use, expira em ~10 min." },
      { title: "/token", description: "Cliente prova posse enviando o code_verifier original." },
      { title: "Tokens emitidos", description: "id_token + access_token + refresh_token." },
      { title: "Chamada à API", description: "Bearer no header Authorization." },
      { title: "API responde", description: "Após validar via JWKS." },
    ],
    cta: { label: "Executar de verdade →", href: "/lab/demo" },
  },
  cc: {
    title: "Client Credentials",
    description: "App ↔ App, sem usuário. Daemons, jobs, microservices.",
    chart: `sequenceDiagram
  participant D as Daemon
  participant E as Entra ID
  participant A as API
  D->>E: /token (client_id + secret + .default)
  E->>D: access_token (roles)
  D->>A: Bearer access_token
  A->>D: 200`,
    steps: [
      { title: "Daemon precisa rodar", description: "Sem usuário interativo." },
      { title: "Solicita token", description: "grant_type=client_credentials, scope=…/.default." },
      { title: "Token com 'roles'", description: "Application permissions, sem 'scp'." },
      { title: "Chama API", description: "Acesso amplo (consent foi dado pelo admin)." },
      { title: "API responde", description: "Auditoria mostra appid, não usuário." },
    ],
    cta: { label: "Executar de verdade →", href: "/lab/demo" },
  },
  obo: {
    title: "On-Behalf-Of (OBO)",
    description: "API intermediária precisa chamar outra API mantendo a identidade do usuário.",
    chart: `sequenceDiagram
  participant C as Cliente
  participant A1 as API1
  participant E as Entra ID
  participant A2 as API2
  C->>A1: Bearer token1
  A1->>E: /token (jwt-bearer + token1)
  E->>A1: token2 (aud=API2)
  A1->>A2: Bearer token2
  A2->>A1: 200
  A1->>C: 200`,
    steps: [
      { title: "Cliente chama API1", description: "Token tem aud=API1." },
      { title: "API1 valida token", description: "Microsoft.Identity.Web cuida disso." },
      { title: "Pede OBO", description: "Troca token1 por token2 com aud=API2 — preserva oid do usuário." },
      { title: "Recebe token2", description: "Mesma identidade, audience diferente." },
      { title: "Chama API2", description: "Como se fosse o usuário direto." },
      { title: "API2 responde", description: "Vê o usuário, não a API1." },
      { title: "API1 normaliza", description: "Devolve dados ao cliente sem expor token2." },
    ],
    cta: { label: "Executar de verdade →", href: "/lab/demo" },
  },
  device: {
    title: "Device Code",
    description: "TVs, IoT, CLIs sem browser embutido. Usuário aprova em outro dispositivo.",
    chart: `sequenceDiagram
  participant D as Device
  participant E as Entra ID
  participant U as Usuário (celular)
  D->>E: /devicecode
  E->>D: device_code + user_code + URL
  D->>U: Mostra URL e user_code
  U->>E: Acessa URL e digita código
  loop polling
    D->>E: /token (device_code)
    E->>D: pending...
  end
  E->>D: access_token
  D->>D: Pronto`,
    steps: [
      { title: "Device pede código", description: "Sem capacidade de exibir login completo." },
      { title: "Recebe par de códigos", description: "device_code (interno) + user_code (curto, para humano)." },
      { title: "Mostra ao usuário", description: "Ex: 'Acesse aka.ms/devicelogin e digite ABCD-1234'." },
      { title: "Usuário aprova no celular", description: "Em browser real, com MFA normal." },
      { title: "Polling", description: "Device pergunta a cada N segundos se já foi aprovado." },
      { title: "Token emitido", description: "Após aprovação, device recebe access_token + refresh_token." },
      { title: "Pronto", description: "Device opera normalmente." },
    ],
  },
};

type FlowKey = keyof typeof flows;

export default function LabFlows() {
  const [tab, setTab] = useState<FlowKey>("authcode");
  const flow = flows[tab];

  return (
    <div className="space-y-6 max-w-7xl">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Fluxos OAuth 2.0</h1>
        <p className="text-muted-foreground">
          Simuladores animados dos 4 fluxos mais comuns no Entra ID. Use ▶ para reproduzir passo a passo.
        </p>
        <div className="text-xs px-3 py-2 rounded bg-primary/5 border border-primary/20">
          📚 <strong>Esta página é didática (apenas animação).</strong>
          {" "}Para executar de verdade contra a API e ver requests/responses ao vivo, use <a href="/lab/demo" className="underline text-primary">/lab/demo</a> (Demo Interativa).
        </div>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as FlowKey)}>
        <TabsList>
          <TabsTrigger value="authcode">Auth Code + PKCE</TabsTrigger>
          <TabsTrigger value="cc">Client Credentials</TabsTrigger>
          <TabsTrigger value="obo">OBO</TabsTrigger>
          <TabsTrigger value="device">Device Code</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{flow.title}</CardTitle>
              <CardDescription>{flow.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SequencePlayer chart={flow.chart} steps={flow.steps} />
              {"cta" in flow && flow.cta && (
                <Link to={flow.cta.href}>
                  <Button variant="secondary">{flow.cta.label} →</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
