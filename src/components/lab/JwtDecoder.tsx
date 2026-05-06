import { useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "@/config/msal";
import { toast } from "sonner";

interface DecodedToken {
  header: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
  signature: string;
  raw: string;
  error?: string;
}

function decode(token: string): DecodedToken {
  const trimmed = token.trim();
  if (!trimmed) return { header: null, payload: null, signature: "", raw: "" };
  try {
    const parts = trimmed.split(".");
    if (parts.length !== 3) throw new Error("Token deve ter 3 segmentos (header.payload.signature)");
    const header = jwtDecode<Record<string, unknown>>(trimmed, { header: true });
    const payload = jwtDecode<Record<string, unknown>>(trimmed);
    return { header, payload, signature: parts[2], raw: trimmed };
  } catch (e) {
    return {
      header: null,
      payload: null,
      signature: "",
      raw: trimmed,
      error: (e as Error).message,
    };
  }
}

const claimDescriptions: Record<string, string> = {
  iss: "Issuer — quem emitiu o token (Entra ID tenant)",
  sub: "Subject — identificador único e imutável do principal",
  aud: "Audience — para qual API este token foi emitido",
  exp: "Expiration — timestamp UNIX de expiração",
  iat: "Issued At — quando o token foi emitido",
  nbf: "Not Before — token só é válido após este momento",
  oid: "Object ID — ID do usuário/app no tenant (estável)",
  tid: "Tenant ID — diretório que emitiu",
  scp: "Scopes (Delegated) — permissões delegadas concedidas",
  roles: "Roles (App) — permissões de aplicação ou App Roles atribuídos",
  appid: "App ID — client_id do app que solicitou (v1)",
  azp: "Authorized Party — client_id que solicitou (v2)",
  ver: "Token Version — 1.0 ou 2.0",
  upn: "User Principal Name",
  preferred_username: "Username apresentado ao usuário",
  name: "Nome de exibição",
  email: "E-mail",
  nonce: "Anti-replay para ID tokens",
  acr: "Authentication Context Class",
  amr: "Authentication Methods Reference",
  groups: "Grupos de segurança (quando configurado)",
  wids: "Directory Roles (Tenant-wide IDs)",
};

function formatTimestamp(v: unknown) {
  if (typeof v !== "number") return null;
  const d = new Date(v * 1000);
  const diff = v * 1000 - Date.now();
  const rel =
    Math.abs(diff) < 60_000
      ? `${Math.round(diff / 1000)}s`
      : Math.abs(diff) < 3_600_000
      ? `${Math.round(diff / 60_000)}min`
      : `${Math.round(diff / 3_600_000)}h`;
  return `${d.toLocaleString()} (${diff > 0 ? "em " : "há "}${rel.replace("-", "")})`;
}

interface Props {
  initialToken?: string;
}

export function JwtDecoder({ initialToken = "" }: Props) {
  const [raw, setRaw] = useState(initialToken);
  const { instance, accounts } = useMsal();
  const decoded = useMemo(() => decode(raw), [raw]);

  const useMyToken = async () => {
    if (!accounts[0]) {
      toast.error("Faça login primeiro");
      return;
    }
    try {
      const result = await instance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      });
      setRaw(result.accessToken);
      toast.success("Access token carregado");
    } catch (e) {
      toast.error("Falha ao obter token: " + (e as Error).message);
    }
  };

  const useMyIdToken = () => {
    const idToken = accounts[0]?.idToken;
    if (!idToken) {
      toast.error("ID Token não disponível");
      return;
    }
    setRaw(idToken);
    toast.success("ID token carregado");
  };

  const { header, payload, error } = decoded;
  const version = (payload?.ver as string) || (payload?.iss as string)?.includes("/v2.0") ? "2.0" : "1.0";

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            JWT bruto
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={useMyIdToken}>ID Token</Button>
              <Button size="sm" variant="outline" onClick={useMyToken}>Access Token</Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="Cole um JWT aqui (header.payload.signature)"
            className="font-mono text-xs h-48"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          {raw && !error && (
            <div className="text-xs space-y-1">
              <div className="flex gap-2 items-center">
                <Badge variant="secondary">v{String(payload?.ver ?? (version === "2.0" ? "2.0" : "1.0"))}</Badge>
                {payload?.scp && <Badge variant="outline">delegated</Badge>}
                {payload?.roles ? <Badge variant="outline">app/roles</Badge> : null}
                {payload?.aud && <Badge variant="outline">aud: {String(payload.aud).slice(0, 20)}…</Badge>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Decodificado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {header && (
            <div>
              <p className="text-xs font-semibold text-primary mb-1">HEADER</p>
              <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-32">
                {JSON.stringify(header, null, 2)}
              </pre>
            </div>
          )}
          {payload && (
            <div>
              <p className="text-xs font-semibold text-accent mb-1">PAYLOAD</p>
              <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">
                {JSON.stringify(payload, null, 2)}
              </pre>
              <div className="mt-3 space-y-1">
                {Object.keys(payload).map((k) => {
                  const desc = claimDescriptions[k];
                  if (!desc) return null;
                  const v = (payload as Record<string, unknown>)[k];
                  const ts = ["exp", "iat", "nbf"].includes(k) ? formatTimestamp(v) : null;
                  return (
                    <div key={k} className="text-xs flex gap-2">
                      <code className="text-primary font-mono min-w-16">{k}</code>
                      <span className="text-muted-foreground">{desc}{ts ? ` · ${ts}` : ""}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
