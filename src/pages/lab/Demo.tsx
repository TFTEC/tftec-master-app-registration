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
        log(makeEvent("Entra ID", "response", "Token1 (aud=AuthService) recebido", `exp=${new Date(result.expiresOn ?? Date.now()).toLocaleTimeString()}`));
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
        if (!r.ok) {
          const text = await r.text();
          log(
            makeEvent(
              "AuthService",
              "error",
              `${r.status} ${r.statusText}`,
              text.length < 500 ? text : "Erro no OBO — verifique se a App Reg tem Microsoft Graph User.Read (Delegated) consentido + ClientSecret no backend.",
              text
            )
          );
          return;
        }
        const oboPayload = (await r.json()) as { accessToken: string; tokenType: string; expiresIn: number };
        log(
          makeEvent(
            "AuthService",
            "response",
            "Token2 (aud=Graph) emitido via OBO",
            `MSAL backend trocou token1 → token2 mantendo identidade do user. expiresIn=${oboPayload.expiresIn}s`,
            { tokenType: oboPayload.tokenType, expiresIn: oboPayload.expiresIn }
          )
        );

        // Now: USE token2 to call Graph /me — close the loop didactically
        log(makeEvent("AuthService (server-side)", "request", "GET Graph /me com token2", graphConfig.graphMeEndpoint));
        const graphRes = await fetch(graphConfig.graphMeEndpoint, {
          headers: { Authorization: `Bearer ${oboPayload.accessToken}` },
        });
        const graphData = await graphRes.json();
        log(
          makeEvent(
            "Graph",
            graphRes.ok ? "response" : "error",
            `${graphRes.status} ${graphRes.statusText}`,
            graphRes.ok
              ? `OBO funcionou — Graph viu o USER (${graphData.displayName}), não o app. oid=${graphData.id}`
              : graphData?.error?.message,
            graphData
          )
        );
      } catch (e) {
        log(makeEvent("Erro", "error", "Falha OBO", (e as Error).message));
      }
    } else if (scenario.id === "client-credentials") {
      try {
        log(makeEvent("MSAL", "request", "acquireToken (AuthService)", "Token do user pra autorização no AuthService (Authorize policy)"));
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
        log(makeEvent("Entra ID", "response", "Token (aud=AuthService) recebido", `Apenas autoriza chamada ao endpoint /auth/client-token — não é usado downstream`));
        log(makeEvent("AuthService (atuando como daemon)", "request", "POST /auth/client-token", `${AUTHSERVICE_API_URL}${ENDPOINTS.clientToken}`));
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
        if (!r.ok) {
          const text = await r.text();
          log(
            makeEvent(
              "AuthService",
              "error",
              `${r.status} ${r.statusText}`,
              text.length < 500 ? text : "Erro no Client Credentials — verifique se a App Reg tem Microsoft Graph (Application) consentido pelo admin do tenant + ClientSecret no backend.",
              text
            )
          );
          return;
        }
        const ccPayload = (await r.json()) as { accessToken: string; tokenType: string; expiresIn: number };
        log(
          makeEvent(
            "AuthService",
            "response",
            "Token Application emitido (sem identidade de user)",
            `Token tem claim 'roles' (App permissions), sem 'scp'. Auditoria mostra appid, não user. expiresIn=${ccPayload.expiresIn}s`,
            { tokenType: ccPayload.tokenType, expiresIn: ccPayload.expiresIn }
          )
        );

        // Now: USE token to call Graph /users — close the loop
        log(makeEvent("AuthService (server-side)", "request", "GET Graph /users?$top=3", `${graphConfig.graphUsersEndpoint}?$top=3`));
        const graphRes = await fetch(`${graphConfig.graphUsersEndpoint}?$top=3`, {
          headers: { Authorization: `Bearer ${ccPayload.accessToken}` },
        });
        const graphData = await graphRes.json();
        log(
          makeEvent(
            "Graph",
            graphRes.ok ? "response" : "error",
            `${graphRes.status} ${graphRes.statusText}`,
            graphRes.ok
              ? `Client Credentials funcionou — Graph deu ${graphData.value?.length ?? 0} users do TENANT (não restrito ao user logado). Roles application permission necessária.`
              : graphData?.error?.message,
            graphData
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

  // Pré-requisitos por cenário — orienta o aluno sobre o que precisa estar configurado na App Reg
  const prereqs: Record<string, string> = {
    "spa-login-api": "✅ Funciona out-of-the-box — User.Read (Delegated) já é consentido no login.",
    obo: "⚠️ Requer Microsoft Graph User.Read (Delegated) consentida + ClientSecret no backend AuthService. Se a App Reg/backend já têm isso (caso do tftec-auth deployed), funciona. Caso contrário, espera erro 500 com hint.",
    "client-credentials": "⚠️ Requer Microsoft Graph User.Read.All (Application) com admin consent + ClientSecret no backend. Se não tiver admin consent, espera erro 403. Comum no setup didático — instrução em api/README.md.",
    saml: "ℹ️ Conceitual — SAML 2.0 é configurado em Enterprise Applications, não via Entra ID OIDC. Sem execução automatizada.",
  };

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

      <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs flex items-start justify-between gap-3 flex-wrap">
        <span>
          <strong className="text-primary">Pré-requisito:</strong> {prereqs[scenarioId] ?? "—"}
        </span>
        <a
          href="https://github.com/tftec-guilherme/entra-auth-gateway/blob/main/docs/aula/demo-prereqs.md"
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline whitespace-nowrap"
        >
          Como configurar →
        </a>
      </div>

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
