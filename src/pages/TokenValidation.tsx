import { useState } from "react";
import { Shield, CheckCircle2, XCircle, Copy, Eye, EyeOff, Send, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuthService } from "@/hooks/useAuthService";
import { useMsal } from "@azure/msal-react";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { AUTHSERVICE_API_URL, AZURE_CONFIG } from "@/config/azure";
import { authServiceRequest, loginRequest } from "@/config/msal";

interface ClaimsResult {
  valid: boolean;        // true = JWT bem-formado e não expirado
  audienceForThisApi: boolean;  // true = aud bate com api://{client-id} desta API
  audienceLabel?: string;       // legivel: "Microsoft Graph", "AuthService API", etc.
  claims?: Record<string, string>;
  error?: string;
}

const KNOWN_AUDIENCES: Record<string, string> = {
  "00000003-0000-0000-c000-000000000000": "Microsoft Graph",
  "https://graph.microsoft.com": "Microsoft Graph (URL)",
  "https://graph.microsoft.com/": "Microsoft Graph (URL)",
};

const TokenValidation = () => {
  const [token, setToken] = useState("");
  const [result, setResult] = useState<ClaimsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [validationMode, setValidationMode] = useState<"local" | "api">("local");
  const [tokenSource, setTokenSource] = useState<"authservice" | "graph">("authservice");
  const { toast } = useToast();
  const { validateToken: validateTokenApi, getUserClaims } = useAuthService();
  const { instance, accounts } = useMsal();

  const fetchTokenViaMsal = async () => {
    if (!accounts[0]) {
      toast({
        title: "Faça login primeiro",
        description: "Você precisa estar autenticado para obter um token",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const request = tokenSource === "authservice" ? authServiceRequest : loginRequest;
      let result;
      try {
        result = await instance.acquireTokenSilent({ ...request, account: accounts[0] });
      } catch (silentErr) {
        if (silentErr instanceof InteractionRequiredAuthError) {
          result = await instance.acquireTokenPopup(request);
        } else {
          throw silentErr;
        }
      }
      setToken(result.accessToken);
      toast({
        title: "Token obtido",
        description: `Audience: ${tokenSource === "authservice" ? AZURE_CONFIG.audience : "Microsoft Graph"}`,
      });
    } catch (err) {
      toast({
        title: "Erro ao obter token",
        description: err instanceof Error ? err.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const decodeTokenLocal = () => {
    if (!token.trim()) {
      toast({
        title: "Token obrigatório",
        description: "Cole um JWT para validar",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        throw new Error("Token JWT inválido - deve ter 3 partes separadas por ponto");
      }

      const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
      
      const relevantClaims: Record<string, string> = {};
      const claimKeys = ["sub", "oid", "tid", "preferred_username", "name", "email", "aud", "iss", "exp", "iat", "scp", "roles"];
      
      for (const key of claimKeys) {
        if (payload[key]) {
          if (key === "exp" || key === "iat") {
            const date = new Date(payload[key] * 1000);
            relevantClaims[key] = `${payload[key]} (${date.toLocaleString()})`;
          } else if (Array.isArray(payload[key])) {
            relevantClaims[key] = payload[key].join(", ");
          } else {
            relevantClaims[key] = String(payload[key]);
          }
        }
      }

      // Check expiration (only TRUE invalid: expired or malformed)
      const now = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp && payload.exp < now;

      // Check audience matches THIS API (separate from "valid" — token pode ser válido pra outra API)
      const audienceForThisApi = payload.aud === AZURE_CONFIG.audience || payload.aud === AZURE_CONFIG.clientId;
      const audienceLabel = KNOWN_AUDIENCES[payload.aud] || (audienceForThisApi ? "AuthService API (esta)" : payload.aud || "desconhecido");

      setResult({
        valid: !isExpired,                // JWT bem-formado e não expirado
        audienceForThisApi,                // separado: bate com esta API?
        audienceLabel,
        claims: relevantClaims,
        error: isExpired
          ? "❌ Token EXPIRADO. Faça logout/login pra obter novo."
          : !audienceForThisApi
          ? `⚠️ Token DECODADO mas é pra ${audienceLabel} (não esta API). Pra validar contra esta API, pegue um token "AuthService API" no card acima.`
          : undefined,
      });

      toast({
        title: isExpired ? "Token Expirado" : !audienceForThisApi ? "Token decodado (audience diferente)" : "Token válido pra esta API",
        description: isExpired ? "Token está expirado" : !audienceForThisApi ? `Aud: ${audienceLabel}` : "Payload OK + audience bate",
        variant: isExpired ? "destructive" : "default",
      });
    } catch (error) {
      setResult({
        valid: false,
        audienceForThisApi: false,
        error: error instanceof Error ? error.message : "Erro ao decodificar token",
      });
      toast({
        title: "Erro",
        description: "Falha ao decodificar o token",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Decode rápido do payload pra detectar audience (sem validar)
  const peekTokenAudience = (jwt: string): string | null => {
    try {
      const parts = jwt.split(".");
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
      return payload.aud || null;
    } catch {
      return null;
    }
  };

  const validateWithApi = async () => {
    if (!token.trim()) {
      toast({
        title: "Token obrigatório",
        description: "Cole um JWT para validar",
        variant: "destructive",
      });
      return;
    }

    // Pre-flight: detecta token mismatch antes de chamar API
    const tokenAud = peekTokenAudience(token);
    const expectedAud = AZURE_CONFIG.audience;
    const expectedClientId = AZURE_CONFIG.clientId;
    const audMatches = tokenAud === expectedAud || tokenAud === expectedClientId;

    if (tokenAud && !audMatches) {
      const audLabel = KNOWN_AUDIENCES[tokenAud] || tokenAud;
      const errorMsg = `Token é pra ${audLabel} (aud=${tokenAud}), mas esta API valida aud=${expectedAud}. API vai retornar 401 — não vou nem chamar. Pra ver claims deste token, use modo "Local". Pra validar via API, pegue um token "AuthService API" no card acima.`;

      setResult({
        valid: false,
        audienceForThisApi: false,
        audienceLabel: audLabel,
        error: errorMsg,
      });
      toast({
        title: `Token pra ${audLabel}`,
        description: "Modo API só valida tokens desta API",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const claims = await getUserClaims(token);

      const relevantClaims: Record<string, string> = {};
      for (const [key, value] of Object.entries(claims)) {
        if (Array.isArray(value)) {
          relevantClaims[key] = value.join(", ");
        } else {
          relevantClaims[key] = String(value);
        }
      }

      setResult({
        valid: true,
        audienceForThisApi: true,
        audienceLabel: "AuthService API (esta)",
        claims: relevantClaims,
      });

      toast({
        title: "Token Válido!",
        description: "Validado pelo AuthService API",
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erro ao validar token";
      const is401 = errorMsg.includes("401");
      setResult({
        valid: false,
        audienceForThisApi: false,
        error: is401
          ? `API retornou 401 Unauthorized. Possíveis causas: (1) token expirado; (2) audience não bate com api://${expectedClientId}; (3) tenant não autorizado; (4) assinatura inválida. Use modo "Local" pra inspecionar claims do token.`
          : errorMsg,
      });
      toast({
        title: is401 ? "API rejeitou o token (401)" : "Erro",
        description: is401 ? "Veja painel Resultado pra detalhes" : "Falha ao validar token via API",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = () => {
    if (validationMode === "local") {
      decodeTokenLocal();
    } else {
      validateWithApi();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Conteúdo copiado para a área de transferência",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gradient">Validar Token</h1>
        <p className="text-muted-foreground mt-1">
          Decodifique e valide tokens JWT do Microsoft Entra ID
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Card */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Token de Entrada
            </CardTitle>
            <CardDescription>
              Cole o access token JWT para análise
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick fetch via MSAL */}
            <div className="space-y-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <Label className="flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-primary" />
                Obter token automaticamente via MSAL
              </Label>
              <div className="flex gap-2">
                <Select value={tokenSource} onValueChange={(v) => setTokenSource(v as "authservice" | "graph")}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="authservice">AuthService API (api://...)</SelectItem>
                    <SelectItem value="graph">Microsoft Graph (User.Read)</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={fetchTokenViaMsal} disabled={loading} variant="secondary">
                  Pegar token
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                💡 <strong>Dica:</strong> Pra validar com a API local: use "AuthService". Pra ver claims Graph (User.Read): use "Microsoft Graph".
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="token">Access Token (JWT)</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <Textarea
                id="token"
                placeholder="Cole um JWT OU clique em 'Pegar token' acima"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className={`min-h-[150px] font-mono text-sm input-azure ${!showToken ? "blur-sm focus:blur-none" : ""}`}
              />
            </div>

            <div className="space-y-2">
              <Label>Modo de Validação</Label>
              <Tabs value={validationMode} onValueChange={(v) => setValidationMode(v as "local" | "api")}>
                <TabsList className="w-full">
                  <TabsTrigger value="local" className="flex-1">Local (Client-side)</TabsTrigger>
                  <TabsTrigger value="api" className="flex-1">API ({AUTHSERVICE_API_URL.replace("https://", "").split(".")[0]})</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <Button 
              onClick={handleValidate} 
              disabled={loading}
              className="w-full btn-azure"
            >
              {loading ? "Validando..." : validationMode === "api" ? (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Validar via API
                </>
              ) : "Validar Token"}
            </Button>

            <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
              <p className="text-xs text-muted-foreground">
                <strong>Audience esperado:</strong> <code className="font-mono">{AZURE_CONFIG.audience}</code>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <strong>Nota:</strong> Esta validação é local (client-side). Para validação completa 
                com verificação de assinatura, use o endpoint <code>/auth/validate</code> do AuthService.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Result Card */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result ? (
                result.valid ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive" />
                )
              ) : (
                <Shield className="w-5 h-5 text-muted-foreground" />
              )}
              Resultado da Validação
            </CardTitle>
            <CardDescription>
              Claims extraídos do token
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Cole um token e clique em validar
              </div>
            ) : result.error && !result.claims ? (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <p className="text-destructive font-medium whitespace-pre-line">{result.error}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Status badges no topo */}
                <div className="flex flex-wrap gap-2">
                  <span className={`px-2 py-1 text-xs rounded ${result.valid ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>
                    {result.valid ? "✅ JWT bem-formado" : "❌ JWT inválido"}
                  </span>
                  {result.audienceLabel && (
                    <span className={`px-2 py-1 text-xs rounded ${result.audienceForThisApi ? "bg-success/20 text-success" : "bg-warning/20 text-warning"}`}>
                      🎯 Audience: {result.audienceLabel}
                    </span>
                  )}
                  {result.audienceForThisApi && (
                    <span className="px-2 py-1 text-xs rounded bg-primary/20 text-primary">
                      ✓ Pra esta API
                    </span>
                  )}
                </div>

                {result.error && (
                  <div className={`p-3 rounded-lg ${result.audienceForThisApi ? "bg-warning/10 border border-warning/30" : "bg-warning/10 border border-warning/30"}`}>
                    <p className="text-warning text-sm whitespace-pre-line">{result.error}</p>
                  </div>
                )}
                
                <div className="space-y-2">
                  {result.claims && Object.entries(result.claims).map(([key, value]) => (
                    <div 
                      key={key}
                      className="flex items-start justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                          {key}
                        </p>
                        <p className="text-sm font-mono break-all mt-1">{value}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(value)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TokenValidation;
