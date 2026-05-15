import { useState } from "react";
import { useMsal } from "@azure/msal-react";
import { jwtDecode } from "jwt-decode";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { loginRequest, authServiceRequest } from "@/config/msal";

interface Props {
  /** Which token to fetch */
  source: "graph" | "authservice" | "id-token";
  /** Claim name to highlight (e.g. "scp", "roles", "aud", "tid") */
  highlight: string;
  /** Claims worth showing (whitelist). Other claims are hidden to reduce noise. */
  visibleClaims?: string[];
  /** Title above the payload */
  title: string;
  /** Description (1-line educational hint) */
  description?: string;
  /** Help text shown if user is not logged in or claim is missing */
  emptyHint?: string;
}

const DEFAULT_VISIBLE = ["aud", "iss", "tid", "oid", "appid", "azp", "scp", "roles", "ver", "exp"];

export function TokenClaimSpotlight({ source, highlight, visibleClaims, title, description, emptyHint }: Props) {
  const { instance, accounts } = useMsal();
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = visibleClaims ?? DEFAULT_VISIBLE;

  const fetchToken = async () => {
    if (!accounts[0]) {
      toast.error("Faça login primeiro");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (source === "id-token") {
        const idToken = accounts[0]?.idToken;
        if (!idToken) {
          setError("ID Token não disponível na sessão MSAL");
          return;
        }
        setPayload(jwtDecode<Record<string, unknown>>(idToken));
      } else {
        const request = source === "graph" ? loginRequest : authServiceRequest;
        const result = await instance.acquireTokenSilent({ ...request, account: accounts[0] });
        setPayload(jwtDecode<Record<string, unknown>>(result.accessToken));
      }
    } catch (e) {
      setError((e as Error).message);
      toast.error("Falha ao obter token");
    } finally {
      setLoading(false);
    }
  };

  const highlightValue = payload?.[highlight];
  const claimsToShow = payload ? Object.entries(payload).filter(([k]) => visible.includes(k) || k === highlight) : [];

  return (
    <div className="rounded-md border border-primary/30 bg-primary/5 p-3 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-primary flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> {title}
          </h4>
          {description && <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>}
        </div>
        <Button onClick={fetchToken} disabled={loading} size="sm" variant="default">
          {loading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
          {payload ? "Recarregar" : "Ver SEU token"}
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 p-2 text-xs flex gap-2">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <span className="text-destructive">{error}</span>
        </div>
      )}

      {!payload && !error && (
        <p className="text-xs text-muted-foreground italic">
          {emptyHint ?? `Clique pra fazer MSAL acquireTokenSilent e ver o claim '${highlight}' do SEU token real.`}
        </p>
      )}

      {payload && (
        <div className="space-y-2">
          {highlightValue !== undefined ? (
            <div className="rounded-md bg-foreground/5 border border-primary/50 p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs uppercase tracking-wide text-primary font-bold">{highlight}</span>
                <Badge variant="default" className="text-[10px]">
                  {Array.isArray(highlightValue) ? `array (${highlightValue.length})` : typeof highlightValue}
                </Badge>
              </div>
              <pre className="text-[11px] font-mono text-foreground whitespace-pre-wrap break-all">
                {JSON.stringify(highlightValue, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="rounded-md bg-amber-500/10 border border-amber-500/30 p-2 text-xs text-amber-600">
              Claim <code>{highlight}</code> não presente neste token.{" "}
              {emptyHint ?? "Esperado pra cenários diferentes — veja o JWT canônico ao lado."}
            </div>
          )}

          <details className="text-[11px]">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition">
              Ver outros claims relevantes ({claimsToShow.length})
            </summary>
            <pre className="mt-2 font-mono text-foreground/85 bg-muted/30 border border-border rounded p-2 overflow-auto max-h-48 leading-relaxed">
              {claimsToShow
                .filter(([k]) => k !== highlight)
                .map(([k, v]) => `"${k}": ${typeof v === "string" ? `"${v}"` : JSON.stringify(v)}`)
                .join(",\n")}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
