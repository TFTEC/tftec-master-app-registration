import { useState } from "react";
import { 
  Key, 
  Server, 
  ArrowRight, 
  Copy,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
  Shield
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuthService } from "@/hooks/useAuthService";
import { DOWNSTREAM_APIS } from "@/config/azure";

const ClientCredentials = () => {
  const { getClientToken, apiUrl } = useAuthService();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [adminToken, setAdminToken] = useState("");
  const [targetApi, setTargetApi] = useState("ApiA");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGetClientToken = async () => {
    if (!adminToken.trim()) {
      toast({ title: "Token de admin obrigatório", variant: "destructive" });
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await getClientToken(adminToken, targetApi);
      setResult(response);
      toast({ title: "Token obtido com sucesso!" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      toast({ title: "Erro no fluxo", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gradient">Client Credentials</h1>
        <p className="text-muted-foreground mt-1">
          Fluxo de autenticação para comunicação entre serviços (machine-to-machine)
        </p>
      </div>

      {/* Explanation */}
      <Card className="glass-card border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Server className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-lg">O que é Client Credentials?</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            O fluxo <strong>Client Credentials</strong> é usado quando um serviço precisa acessar outro serviço 
            <strong> sem a presença de um usuário</strong>. A aplicação se autentica usando seu próprio 
            Client ID e Secret, obtendo um token para acessar APIs protegidas.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-secondary/30 border border-border">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Cenários de Uso
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Jobs e processos em background</li>
                <li>• Sincronização entre sistemas</li>
                <li>• Microserviços se comunicando</li>
                <li>• APIs acessando outras APIs</li>
                <li>• Tarefas agendadas (cron jobs)</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-secondary/30 border border-border">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Key className="w-4 h-4 text-accent" />
                Diferença do OBO
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• <strong>OBO:</strong> Age em nome de um usuário específico</li>
                <li>• <strong>Client Credentials:</strong> Age como a própria aplicação</li>
                <li>• OBO mantém contexto do usuário</li>
                <li>• Client Credentials usa permissões da app</li>
              </ul>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm pt-2">
            <div className="px-3 py-1.5 rounded bg-primary/20 text-primary">Serviço A</div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-muted-foreground">client_id + secret</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="px-3 py-1.5 rounded bg-secondary">Entra ID</div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-muted-foreground">access_token</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="px-3 py-1.5 rounded bg-accent/20 text-accent">Serviço B</div>
          </div>

          <Alert>
            <Info className="w-4 h-4" />
            <AlertTitle>Importante</AlertTitle>
            <AlertDescription className="text-xs">
              No Client Credentials, as permissões são definidas no App Registration como 
              <strong> Application Permissions</strong> (não Delegated). Um admin do tenant deve 
              conceder consentimento para essas permissões.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Test Interface */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Testar Client Credentials</CardTitle>
          <CardDescription>
            Endpoint: <code className="font-mono text-xs">{apiUrl}/auth/client-token</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-token">Token de Admin (para autorizar a operação)</Label>
            <Textarea
              id="admin-token"
              placeholder="Cole o access_token de um admin aqui..."
              value={adminToken}
              onChange={(e) => setAdminToken(e.target.value)}
              className="font-mono text-xs h-24"
            />
            <p className="text-xs text-muted-foreground">
              Este token é usado para autorizar a emissão do client token. Em produção, 
              a API usaria suas próprias credenciais configuradas.
            </p>
          </div>

          <div className="space-y-2">
            <Label>API Destino</Label>
            <Select value={targetApi} onValueChange={setTargetApi}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DOWNSTREAM_APIS).map(([key, api]) => (
                  <SelectItem key={key} value={key}>{api.name} - {api.baseUrl}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="p-3 rounded-lg bg-secondary/30 border border-border">
            <p className="text-xs font-mono text-muted-foreground">
              <strong>POST</strong> /auth/client-token<br />
              <strong>Body:</strong> {`{ "targetApi": "${targetApi}" }`}
            </p>
          </div>

          <Button onClick={handleGetClientToken} disabled={loading || !adminToken} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            Obter Token de Aplicação
          </Button>

          {/* Result */}
          {(result || error) && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <Label>Resultado</Label>
                {result && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copiar
                  </Button>
                )}
              </div>
              {error ? (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                  <div className="flex items-center gap-2 text-destructive mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium">Erro</span>
                  </div>
                  <pre className="text-xs text-destructive whitespace-pre-wrap">{error}</pre>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-success/10 border border-success/30">
                  <div className="flex items-center gap-2 text-success mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-medium">Sucesso</span>
                  </div>
                  <pre className="text-xs text-foreground whitespace-pre-wrap overflow-auto max-h-64">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientCredentials;
