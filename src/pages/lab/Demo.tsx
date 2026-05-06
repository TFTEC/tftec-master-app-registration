import { useCallback, useMemo, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SequencePlayer, SequenceStep } from "@/components/lab/SequencePlayer";
import { EventTimeline, TimelineEvent, makeEvent } from "@/components/lab/EventTimeline";
import { scenarios } from "@/lib/labScenarios";
import { loginRequest, graphConfig, authServiceRequest } from "@/config/msal";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { AUTHSERVICE_API_URL, ENDPOINTS, AZURE_CONFIG } from "@/config/azure";
import { toast } from "sonner";
import { Play } from "lucide-react";

export default function LabDemo() {
  const { instance, accounts } = useMsal();
  const [scenarioId, setScenarioId] = useState(scenarios[0].id);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const scenario = useMemo(() => scenarios.find((s) => s.id === scenarioId)!, [scenarioId]);

  const log = useCallback((e: TimelineEvent) => setEvents((prev) => [...prev, e]), []);

  const runReal = useCallback(async () => {
    if (!accounts[0]) {
      toast.error("Faça login primeiro");
      return;
    }
    log(makeEvent("Demo", "info", `Iniciando execução real: ${scenario.title}`));

    if (scenario.id === "spa-login-api") {
      try {
        log(makeEvent("MSAL", "request", "acquireTokenSilent", "Pedindo access_token via cache local"));
        const result = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
        log(
          makeEvent("Entra ID", "response", "Token recebido", `expira ${new Date(result.expiresOn ?? Date.now()).toLocaleTimeString()}`, {
            scopes: result.scopes,
            account: result.account?.username,
          })
        );

        log(makeEvent("SPA", "request", "GET Graph /me", graphConfig.graphMeEndpoint));
        const r = await fetch(graphConfig.graphMeEndpoint, {
          headers: { Authorization: `Bearer ${result.accessToken}` },
        });
        const data = await r.json();
        log(
          makeEvent(
            "Graph",
            r.ok ? "response" : "error",
            `${r.status} ${r.statusText}`,
            r.ok ? `displayName=${data.displayName}` : data?.error?.message,
            data
          )
        );
      } catch (e) {
        log(makeEvent("Erro", "error", "Falha", (e as Error).message));
      }
    } else if (scenario.id === "obo") {
      try {
        log(makeEvent("MSAL", "request", "acquireToken (AuthService)", `Pedindo token com aud=${authServiceRequest.scopes[0]}`));
        // Tenta silent primeiro; se falhar (consent missing), abre popup
        let result;
        try {
          result = await instance.acquireTokenSilent({ ...authServiceRequest, account: accounts[0] });
        } catch (silentErr) {
          if (silentErr instanceof InteractionRequiredAuthError) {
            log(makeEvent("MSAL", "info", "Consent required", "Abrindo popup pra usuário aprovar scope access_as_user"));
            result = await instance.acquireTokenPopup(authServiceRequest);
          } else {
            throw silentErr;
          }
        }
        log(makeEvent("Entra ID", "response", "Token recebido", `aud=${AZURE_CONFIG.audience}, exp=${new Date(result.expiresOn ?? Date.now()).toLocaleTimeString()}`));
        log(makeEvent("SPA", "request", "POST /auth/obo", `${AUTHSERVICE_API_URL}${ENDPOINTS.obo}`));
        const r = await fetch(`${AUTHSERVICE_API_URL}${ENDPOINTS.obo}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${result.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            targetApi: "graph",
            scopes: ["https://graph.microsoft.com/User.Read"],
          }),
        });
        const text = await r.text();
        log(
          makeEvent(
            "AuthService",
            r.ok ? "response" : "error",
            `${r.status} ${r.statusText}`,
            r.ok ? "OBO concluído — token2 emitido para Graph (User.Read)" : text,
            text
          )
        );
      } catch (e) {
        log(makeEvent("Erro", "error", "Falha OBO", (e as Error).message));
      }
    } else if (scenario.id === "client-credentials") {
      try {
        log(makeEvent("MSAL", "request", "acquireToken (AuthService)", "Token do user pra autorização no AuthService"));
        let result;
        try {
          result = await instance.acquireTokenSilent({ ...authServiceRequest, account: accounts[0] });
        } catch (silentErr) {
          if (silentErr instanceof InteractionRequiredAuthError) {
            result = await instance.acquireTokenPopup(authServiceRequest);
          } else {
            throw silentErr;
          }
        }
        log(makeEvent("Entra ID", "response", "Token recebido", `aud=${AZURE_CONFIG.audience}`));
        log(makeEvent("Daemon (via AuthService)", "request", "POST /auth/client-token", `${AUTHSERVICE_API_URL}${ENDPOINTS.clientToken}`));
        const r = await fetch(`${AUTHSERVICE_API_URL}${ENDPOINTS.clientToken}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${result.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            targetApi: "graph",
            scopes: ["https://graph.microsoft.com/.default"],
          }),
        });
        const text = await r.text();
        log(
          makeEvent(
            "AuthService",
            r.ok ? "response" : "error",
            `${r.status} ${r.statusText}`,
            r.ok ? "Token de aplicação emitido (sem identidade de user)" : text,
            text
          )
        );
      } catch (e) {
        log(makeEvent("Erro", "error", "Falha CC", (e as Error).message));
      }
    } else {
      log(makeEvent("Demo", "info", "Cenário SAML é demonstrativo", "SAML 2.0 federation é configurado em Enterprise Applications no Portal Azure — não há execução automatizada via SPA. Veja docs/aula/roadmap-avancado.md §B2B."));
    }
  }, [accounts, instance, log, scenario.id, scenario.title]);

  // Inject onActivate on each step to log events
  const playerSteps: SequenceStep[] = scenario.steps.map((s, i) => ({
    ...s,
    onActivate: () => {
      log(makeEvent("Cenário", "info", `Passo ${i + 1}: ${s.title}`, s.description));
    },
  }));

  return (
    <div className="space-y-6 max-w-[1600px]">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Demo Interativa End-to-End</h1>
          <p className="text-muted-foreground">
            Escolha um cenário, navegue pelo diagrama e dispare a execução real para ver tudo na timeline.
          </p>
        </div>
        <Button onClick={runReal} size="lg">
          <Play className="w-4 h-4 mr-2" /> Executar de verdade
        </Button>
      </header>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr_400px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cenário</CardTitle>
            <CardDescription>4 fluxos comuns no Entra ID</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={scenarioId} onValueChange={setScenarioId} className="space-y-3">
              {scenarios.map((s) => (
                <div key={s.id} className="flex items-start gap-2">
                  <RadioGroupItem value={s.id} id={s.id} className="mt-1" />
                  <Label htmlFor={s.id} className="text-sm cursor-pointer">
                    <div className="font-medium">{s.title}</div>
                    <div className="text-xs text-muted-foreground">{s.description}</div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{scenario.title}</CardTitle>
            <CardDescription>{scenario.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <SequencePlayer chart={scenario.chart} steps={playerSteps} />
          </CardContent>
        </Card>

        <EventTimeline events={events} onClear={() => setEvents([])} />
      </div>
    </div>
  );
}
