import { useState } from "react";
import { 
  Users, 
  ArrowRight, 
  Key, 
  RefreshCw,
  Info,
  Copy,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  X
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuthService } from "@/hooks/useAuthService";
import { DOWNSTREAM_APIS, AUTHSERVICE_API_URL } from "@/config/azure";

const OboFlow = () => {
  const { getOboToken, exchangeToken, apiUrl } = useAuthService();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [userToken, setUserToken] = useState("");
  const [targetApi, setTargetApi] = useState("ApiA");
  const [scopes, setScopes] = useState<string[]>([DOWNSTREAM_APIS.ApiA.scopes[0] || ""]);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addScope = () => setScopes([...scopes, ""]);
  const removeScope = (index: number) => setScopes(scopes.filter((_, i) => i !== index));
  const updateScope = (index: number, value: string) => {
    const newScopes = [...scopes];
    newScopes[index] = value;
    setScopes(newScopes);
  };

  const handleOboFlow = async () => {
    if (!userToken.trim()) {
      toast({ title: "Token obrigatório", variant: "destructive" });
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await getOboToken(userToken, targetApi, scopes.filter(s => s.trim()));
      setResult(response);
      toast({ title: "Token OBO obtido com sucesso!" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      toast({ title: "Erro no fluxo OBO", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleExchange = async () => {
    if (!userToken.trim()) {
      toast({ title: "Token obrigatório", variant: "destructive" });
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await exchangeToken(userToken);
      setResult(response);
      toast({ title: "Token interno gerado com sucesso!" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      toast({ title: "Erro no exchange", description: message, variant: "destructive" });
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
        <h1 className="text-3xl font-bold text-gradient">Delegação de Token</h1>
        <p className="text-muted-foreground mt-1">
          Teste os fluxos On-Behalf-Of (OBO) e Token Exchange
        </p>
      </div>

      {/* Explanation Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass-card border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Fluxo On-Behalf-Of (OBO)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Permite que uma API intermediária acesse outra API <strong>em nome do usuário</strong> 
              que fez a requisição original, mantendo a identidade e permissões do usuário.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <div className="px-3 py-1.5 rounded bg-secondary">Usuário</div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className="px-3 py-1.5 rounded bg-primary/20 text-primary">API A</div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className="px-3 py-1.5 rounded bg-accent/20 text-accent">API B</div>
            </div>
            <Alert>
              <Info className="w-4 h-4" />
              <AlertTitle>Quando usar?</AlertTitle>
              <AlertDescription className="text-xs">
                Use OBO quando a API intermediária precisa acessar recursos que pertencem ao usuário 
                em outro serviço (ex: acessar OneDrive do usuário via sua API).
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card className="glass-card border-accent/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/20">
                <RefreshCw className="w-5 h-5 text-accent" />
              </div>
              <CardTitle className="text-lg">Token Exchange (Interno)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Troca um token do Entra ID por um <strong>token interno assinado pelo AuthService</strong>. 
              Útil para padronizar claims e usar chaves próprias de validação.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <div className="px-3 py-1.5 rounded bg-secondary">Token Entra</div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className="px-3 py-1.5 rounded bg-accent/20 text-accent">AuthService</div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className="px-3 py-1.5 rounded bg-success/20 text-success">Token Interno</div>
            </div>
            <Alert>
              <Info className="w-4 h-4" />
              <AlertTitle>Quando usar?</AlertTitle>
              <AlertDescription className="text-xs">
                Use Exchange quando você quer que suas APIs internas validem tokens usando 
                sua própria chave JWKS, sem depender do Entra ID.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Test Interface */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Testar Fluxos</CardTitle>
          <CardDescription>
            Endpoint: <code className="font-mono text-xs">{apiUrl}</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="obo" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="obo">
                <Users className="w-4 h-4 mr-2" />
                On-Behalf-Of
              </TabsTrigger>
              <TabsTrigger value="exchange">
                <RefreshCw className="w-4 h-4 mr-2" />
                Token Exchange
              </TabsTrigger>
            </TabsList>

            <TabsContent value="obo" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="obo-token">Token do Usuário (Bearer)</Label>
                  <Textarea
                    id="obo-token"
                    placeholder="Cole o access_token do usuário aqui..."
                    value={userToken}
                    onChange={(e) => setUserToken(e.target.value)}
                    className="font-mono text-xs h-24"
                  />
                </div>

                <div className="space-y-2">
                  <Label>API Destino</Label>
                  <Select value={targetApi} onValueChange={(value) => {
                    setTargetApi(value);
                    if (value === "ApiA") setScopes([...DOWNSTREAM_APIS.ApiA.scopes]);
                    else if (value === "ApiB") setScopes([...DOWNSTREAM_APIS.ApiB.scopes]);
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DOWNSTREAM_APIS).map(([key, api]) => (
                        <SelectItem key={key} value={key}>{api.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Scopes</Label>
                    <Button variant="ghost" size="sm" onClick={addScope}>
                      <Plus className="w-4 h-4 mr-1" /> Adicionar
                    </Button>
                  </div>
                  {scopes.map((scope, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder="api://api-id/scope"
                        value={scope}
                        onChange={(e) => updateScope(index, e.target.value)}
                        className="font-mono text-xs"
                      />
                      {scopes.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeScope(index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <Button onClick={handleOboFlow} disabled={loading || !userToken} className="w-full">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  Executar Fluxo OBO
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="exchange" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="exchange-token">Token Entra ID</Label>
                  <Textarea
                    id="exchange-token"
                    placeholder="Cole o access_token do Entra ID aqui..."
                    value={userToken}
                    onChange={(e) => setUserToken(e.target.value)}
                    className="font-mono text-xs h-24"
                  />
                </div>

                <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                  <p className="text-xs text-muted-foreground">
                    <strong>POST</strong> {apiUrl}/auth/exchange
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Retorna um JWT assinado pelo AuthService com claims padronizados.
                  </p>
                </div>

                <Button onClick={handleExchange} disabled={loading || !userToken} className="w-full">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Key className="w-4 h-4 mr-2" />}
                  Trocar Token
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Result */}
          {(result || error) && (
            <div className="mt-6 space-y-2">
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

export default OboFlow;
