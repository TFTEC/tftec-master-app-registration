import { BookOpen, ExternalLink, Copy, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";

const Documentation = () => {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gradient">Documentação</h1>
        <p className="text-muted-foreground mt-1">
          Guia de integração e referência de API do AuthService
        </p>
      </div>

      {/* Quick Start */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Quick Start
          </CardTitle>
          <CardDescription>Comece a usar o AuthService em 5 minutos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">1</div>
              <div>
                <h4 className="font-medium">Criar App Registration no Azure</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure como Multi-tenant e adicione scopes/roles necessários
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">2</div>
              <div>
                <h4 className="font-medium">Configurar variáveis de ambiente</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Defina ClientId, ClientSecret, Audience e SigningKey
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">3</div>
              <div>
                <h4 className="font-medium">Executar com Docker</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  <code>docker-compose up -d</code> e o serviço estará disponível na porta 8080
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Reference */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Referência de API</CardTitle>
          <CardDescription>Endpoints disponíveis no AuthService</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="space-y-2">
            <AccordionItem value="me" className="border rounded-lg px-4 bg-secondary/20">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="endpoint-badge get">GET</span>
                  <code>/auth/me</code>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <p className="text-muted-foreground">Retorna as claims do usuário autenticado.</p>
                <div className="relative">
                  <pre className="code-block text-xs">{`curl -X GET http://localhost:8080/auth/me \\
  -H "Authorization: Bearer {access_token}"`}</pre>
                  <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => copyToClipboard(`curl -X GET http://localhost:8080/auth/me -H "Authorization: Bearer {access_token}"`)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Response:</p>
                  <pre className="code-block text-xs">{`{
  "authenticated": true,
  "claims": {
    "sub": "user-id",
    "oid": "object-id",
    "tid": "tenant-id",
    "preferred_username": "user@example.com",
    "roles": "User Admin",
    "scp": "api.read api.write"
  }
}`}</pre>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="exchange" className="border rounded-lg px-4 bg-secondary/20">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="endpoint-badge post">POST</span>
                  <code>/auth/exchange</code>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <p className="text-muted-foreground">Troca um token do Entra ID por um token interno do AuthService (Modelo 2).</p>
                <div className="relative">
                  <pre className="code-block text-xs">{`curl -X POST http://localhost:8080/auth/exchange \\
  -H "Authorization: Bearer {entra_token}" \\
  -H "Content-Type: application/json"`}</pre>
                  <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => copyToClipboard(`curl -X POST http://localhost:8080/auth/exchange -H "Authorization: Bearer {entra_token}"`)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Response:</p>
                  <pre className="code-block text-xs">{`{
  "accessToken": "eyJ...",
  "tokenType": "Bearer",
  "expiresIn": 3600
}`}</pre>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="obo" className="border rounded-lg px-4 bg-secondary/20">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="endpoint-badge post">POST</span>
                  <code>/auth/obo</code>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <p className="text-muted-foreground">On-Behalf-Of: obtém token para API downstream em nome do usuário.</p>
                <div className="relative">
                  <pre className="code-block text-xs">{`curl -X POST http://localhost:8080/auth/obo \\
  -H "Authorization: Bearer {user_token}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "targetApi": "ApiA",
    "scopes": ["api://api-a/access_as_user"]
  }'`}</pre>
                  <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => copyToClipboard(`curl -X POST http://localhost:8080/auth/obo -H "Authorization: Bearer {user_token}" -H "Content-Type: application/json" -d '{"targetApi": "ApiA", "scopes": ["api://api-a/access_as_user"]}'`)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="client-token" className="border rounded-lg px-4 bg-secondary/20">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="endpoint-badge post">POST</span>
                  <code>/auth/client-token</code>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <p className="text-muted-foreground">Client Credentials: obtém token para comunicação service-to-service.</p>
                <p className="text-warning text-sm">⚠️ Requer role Admin</p>
                <div className="relative">
                  <pre className="code-block text-xs">{`curl -X POST http://localhost:8080/auth/client-token \\
  -H "Authorization: Bearer {admin_token}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "targetApi": "ApiA"
  }'`}</pre>
                  <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => copyToClipboard(`curl -X POST http://localhost:8080/auth/client-token -H "Authorization: Bearer {admin_token}" -H "Content-Type: application/json" -d '{"targetApi": "ApiA"}'`)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="jwks" className="border rounded-lg px-4 bg-secondary/20">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="endpoint-badge get">GET</span>
                  <code>/.well-known/jwks.json</code>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <p className="text-muted-foreground">JWKS público para validar tokens internos emitidos pelo AuthService.</p>
                <div className="relative">
                  <pre className="code-block text-xs">{`curl http://localhost:8080/.well-known/jwks.json`}</pre>
                  <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => copyToClipboard(`curl http://localhost:8080/.well-known/jwks.json`)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Integration Models */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-success">Modelo 1: Pass-through</CardTitle>
            <CardDescription>Token Entra ID repassado diretamente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-success/10 border border-success/30">
              <p className="text-sm">
                <strong>Recomendado</strong> quando suas APIs downstream podem validar tokens do Entra ID.
              </p>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-success" />
                Menor latência (sem geração de token)
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-success" />
                Token já validado pelo Entra
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-success" />
                AuthService atua como policy gateway
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-accent">Modelo 2: Token Interno</CardTitle>
            <CardDescription>AuthService emite JWT próprio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
              <p className="text-sm">
                Use quando precisar <strong>padronizar claims</strong> ou APIs não têm acesso ao Entra.
              </p>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-accent" />
                Claims customizados e padronizados
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-accent" />
                APIs confiam apenas no AuthService
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-accent" />
                JWKS disponível para validação
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* External Links */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Recursos Externos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a 
              href="https://learn.microsoft.com/en-us/entra/identity-platform/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <ExternalLink className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">Microsoft Entra ID Docs</p>
                <p className="text-xs text-muted-foreground">Documentação oficial</p>
              </div>
            </a>
            <a 
              href="https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-on-behalf-of-flow" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <ExternalLink className="w-5 h-5 text-success" />
              <div>
                <p className="font-medium">OBO Flow</p>
                <p className="text-xs text-muted-foreground">Documentação On-Behalf-Of</p>
              </div>
            </a>
            <a 
              href="https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-client-creds-grant-flow" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <ExternalLink className="w-5 h-5 text-warning" />
              <div>
                <p className="font-medium">Client Credentials</p>
                <p className="text-xs text-muted-foreground">Documentação service-to-service</p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Documentation;
