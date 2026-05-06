import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { JwtDecoder } from "@/components/lab/JwtDecoder";
import { Badge } from "@/components/ui/badge";

export default function LabTokens() {
  return (
    <div className="space-y-6 max-w-7xl">
      <header>
        <h1 className="text-3xl font-bold">Tokens & JWT</h1>
        <p className="text-muted-foreground">
          Decoder interativo, anatomia de um JWT, comparativo v1 vs v2 e ID Token vs Access Token.
        </p>
      </header>

      <Tabs defaultValue="decoder">
        <TabsList>
          <TabsTrigger value="decoder">Decoder</TabsTrigger>
          <TabsTrigger value="anatomy">Anatomia</TabsTrigger>
          <TabsTrigger value="versions">v1 vs v2</TabsTrigger>
          <TabsTrigger value="id-vs-access">ID vs Access</TabsTrigger>
        </TabsList>

        <TabsContent value="decoder" className="mt-4">
          <JwtDecoder />
        </TabsContent>

        <TabsContent value="anatomy" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estrutura de um JWT</CardTitle>
              <CardDescription>3 partes separadas por ponto, codificadas em Base64URL.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <pre className="text-xs bg-muted p-3 rounded break-all">
                <span className="text-blue-400">eyJhbGciOiJSUzI1NiIs...</span>
                <span className="text-muted-foreground">.</span>
                <span className="text-emerald-400">eyJhdWQiOiIzODY3MTV...</span>
                <span className="text-muted-foreground">.</span>
                <span className="text-purple-400">SflKxwRJSMeKKF2QT4f...</span>
              </pre>
              <div className="grid md:grid-cols-3 gap-3">
                <div className="border rounded p-3">
                  <p className="text-blue-400 font-semibold mb-1">HEADER</p>
                  <p className="text-xs text-muted-foreground">Algoritmo (RS256), tipo (JWT) e <code>kid</code> (qual chave do JWKS validar).</p>
                </div>
                <div className="border rounded p-3">
                  <p className="text-emerald-400 font-semibold mb-1">PAYLOAD</p>
                  <p className="text-xs text-muted-foreground">Claims: aud, iss, exp, sub, oid, scp/roles, etc.</p>
                </div>
                <div className="border rounded p-3">
                  <p className="text-purple-400 font-semibold mb-1">SIGNATURE</p>
                  <p className="text-xs text-muted-foreground">RSA(SHA256(header.payload), private_key). API valida com a public key do JWKS.</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                ⚠️ Payload é apenas codificado, NÃO criptografado. Nunca coloque dados sensíveis nele.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Token v1.0 vs v2.0</CardTitle>
              <CardDescription>Endpoint <code>/v2.0/</code> emite tokens v2 — recomendado para apps novos.</CardDescription>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead className="text-left border-b">
                  <tr><th className="py-2">Aspecto</th><th>v1.0</th><th>v2.0</th></tr>
                </thead>
                <tbody className="divide-y">
                  <tr><td className="py-2">Issuer</td><td><code>sts.windows.net/{`{tid}`}/</code></td><td><code>login.microsoftonline.com/{`{tid}`}/v2.0</code></td></tr>
                  <tr><td className="py-2">Audience</td><td>app id URI ou clientId</td><td>geralmente clientId (GUID)</td></tr>
                  <tr><td className="py-2">Scopes</td><td><code>scp</code> com scope curto</td><td><code>scp</code> com URI completa</td></tr>
                  <tr><td className="py-2">Client ID claim</td><td><code>appid</code></td><td><code>azp</code></td></tr>
                  <tr><td className="py-2">Endpoint</td><td><code>/oauth2/token</code></td><td><code>/oauth2/v2.0/token</code></td></tr>
                  <tr><td className="py-2">Suporte a OIDC</td><td>parcial</td><td>completo (OIDC compliant)</td></tr>
                  <tr><td className="py-2">Multi-tenant</td><td>via configuração</td><td>nativo</td></tr>
                </tbody>
              </table>
              <p className="text-xs text-muted-foreground mt-3">
                A versão é definida pelo <code>accessTokenAcceptedVersion</code> no manifest do App Registration que é o <em>recurso</em> (audience).
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="id-vs-access" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>ID Token vs Access Token</CardTitle>
              <CardDescription>Confundir os dois é um dos erros mais comuns em integrações.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                <div className="border rounded p-4 space-y-2">
                  <Badge>ID Token</Badge>
                  <p className="text-xs"><strong>Para:</strong> o cliente. Diz <em>quem</em> autenticou.</p>
                  <p className="text-xs"><strong>Audience:</strong> o próprio cliente.</p>
                  <p className="text-xs"><strong>Claims típicas:</strong> name, email, sub, oid, nonce, acr, amr.</p>
                  <p className="text-xs"><strong>Não enviar para APIs!</strong> APIs devem rejeitar ID tokens.</p>
                </div>
                <div className="border rounded p-4 space-y-2">
                  <Badge variant="secondary">Access Token</Badge>
                  <p className="text-xs"><strong>Para:</strong> a API (resource). Diz <em>o que</em> pode fazer.</p>
                  <p className="text-xs"><strong>Audience:</strong> a API alvo (App ID URI).</p>
                  <p className="text-xs"><strong>Claims típicas:</strong> scp (delegated) ou roles (application).</p>
                  <p className="text-xs">É o que vai no header <code>Authorization: Bearer …</code>.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
