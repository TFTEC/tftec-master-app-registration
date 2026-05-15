import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyableSnippet } from "@/components/lab/CopyableSnippet";
import {
  Boxes,
  Layers,
  Server,
  Smartphone,
  Terminal,
  Github,
  Globe2,
  Network,
  ShieldCheck,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface RecipeStep {
  /** Description of the step (what it does, why) */
  description: string;
  /** The az / Portal / code command to execute */
  command: string;
  /** Optional language hint (default: bash for az, csharp for backend, etc.) */
  language?: string;
}

interface Recipe {
  id: string;
  title: string;
  icon: typeof Boxes;
  shortDescription: string;
  scenario: string;
  whenUse: string[];
  whenNotUse: string[];
  decisions: { aspect: string; choice: string; why: string }[];
  setupSteps: RecipeStep[];
  /** Optional: extra Portal steps (e.g. expose-an-api scope) */
  portalSteps?: string[];
  /** Optional: code integration snippet */
  integration?: { label: string; code: string };
  validation: string[];
  pitfalls: { error: string; cause: string; fix: string }[];
  complexity: "⭐ Onboarding" | "⭐⭐ Médio" | "⭐⭐⭐ Avançado" | "⭐⭐⭐⭐ Expert";
}

const recipes: Recipe[] = [
  {
    id: "spa-pattern-a",
    title: "1. SPA multi-tenant + API juntos (Pattern A)",
    icon: Boxes,
    shortDescription: "Igual ao tftec-auth. Frontend React + backend .NET na MESMA App Reg.",
    scenario:
      "SPA pega access_token com aud=api://{client-id} e chama o backend, que valida com o mesmo client_id. Ponto de partida pra apps SaaS B2B onde o time controla SPA + API.",
    whenUse: ["MVP, time único, SaaS multi-tenant simples", "Você controla os dois lados (SPA e API)"],
    whenNotUse: ["API vai ser consumida por OUTROS clients (mobile, parceiros) → Recipe 2"],
    decisions: [
      { aspect: "signInAudience", choice: "AzureADMultipleOrgs", why: "Multi-tenant SaaS" },
      { aspect: "Platform", choice: "Single-page application", why: "SPA precisa de PKCE + CORS no /token" },
      { aspect: "Credencial", choice: "PKCE (sem secret)", why: "Browser não segura secret" },
      { aspect: "Permission", choice: "User.Read (Delegated)", why: "Lê perfil do user logado" },
    ],
    setupSteps: [
      {
        description: "Criar App Reg multi-tenant",
        command: `$APP_NAME = "recipe-1-spa-multi-tenant-pattern-a"
$REDIRECT_URI = "http://localhost:5173/"

$APP_ID = az ad app create \`
  --display-name $APP_NAME \`
  --sign-in-audience AzureADMultipleOrgs \`
  --query appId -o tsv`,
      },
      {
        description: "Criar Service Principal no tenant atual",
        command: `az ad sp create --id $APP_ID`,
      },
      {
        description: "Adicionar Redirect URI tipo SPA (PKCE + CORS)",
        command: `az ad app update --id $APP_ID --set spa.redirectUris="['$REDIRECT_URI']"`,
      },
      {
        description: "Expor a própria API (audience custom)",
        command: `az ad app update --id $APP_ID --identifier-uris "api://$APP_ID"`,
      },
      {
        description: "Microsoft Graph User.Read (Delegated)",
        command: `$GRAPH_APP_ID = "00000003-0000-0000-c000-000000000000"
az ad app permission add --id $APP_ID --api $GRAPH_APP_ID \`
  --api-permissions e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope

az ad app permission admin-consent --id $APP_ID`,
      },
    ],
    portalSteps: [
      "Portal → sua App Reg → Expose an API → + Add a scope",
      "Application ID URI: api://{APP_ID} (já preenchido)",
      "Scope name: access_as_user · Who can consent: Admins and users · State: Enabled",
      "Save",
    ],
    integration: {
      label: "Frontend (src/config/azure.ts)",
      code: `export const AZURE_CONFIG = {
  tenantId: "organizations",                          // multi-tenant
  clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
  audience: \`api://\${import.meta.env.VITE_AZURE_CLIENT_ID}\`,
};`,
    },
    validation: [
      "Abrir http://localhost:5173 → click Login → ver displayName",
      "DevTools → sessionStorage → decode token em jwt.ms → esperado: aud=api://{APP_ID}",
      "Backend valida o token (Microsoft.Identity.Web) → endpoint protegido retorna 200",
    ],
    pitfalls: [
      {
        error: "AADSTS50011",
        cause: "Redirect URI mismatch (com/sem barra final)",
        fix: "Adicionar ambos http://localhost:5173 e http://localhost:5173/",
      },
      {
        error: "AADSTS7000229",
        cause: "Primeiro login dum tenant novo, sem Service Principal local",
        fix: "Acesse https://login.microsoftonline.com/{tenant}/adminconsent?client_id={APP_ID}",
      },
      {
        error: "CORS error no /token",
        cause: "Registrou como Web em vez de SPA",
        fix: "Portal → Authentication → apagar Web platform e adicionar Single-page application",
      },
    ],
    complexity: "⭐ Onboarding",
  },
  {
    id: "spa-pattern-b",
    title: "2. SPA + API separadas (Pattern B)",
    icon: Layers,
    shortDescription: "Quando a API ganha o 2º consumidor. DUAS App Regs.",
    scenario:
      "Uma App Reg pro SPA cliente, outra pra a API. Cliente pede consent pra um scope da API. API valida tokens com aud=api://{api-app-id}.",
    whenUse: ["API consumida por 2+ clients (web, mobile, B2B parceiros)", "Times separados (segregação de credenciais)"],
    whenNotUse: ["MVP single-team → começa com Pattern A (Recipe 1)"],
    decisions: [
      { aspect: "API App Reg", choice: "(none) — só expose", why: "API não tem UI, só recebe calls" },
      { aspect: "Cliente App Reg", choice: "Single-page application", why: "SPA é UI" },
      { aspect: "Permissions cross-app", choice: "Cliente pede scope da API via API permissions", why: "Trust explícito" },
    ],
    setupSteps: [
      {
        description: "API App Reg (servidor)",
        command: `$API_NAME = "recipe-2-api"
$API_APP_ID = az ad app create \`
  --display-name $API_NAME \`
  --sign-in-audience AzureADMyOrg \`
  --query appId -o tsv

az ad sp create --id $API_APP_ID
az ad app update --id $API_APP_ID --identifier-uris "api://$API_APP_ID"`,
      },
      {
        description: "Cliente App Reg (SPA)",
        command: `$CLIENT_NAME = "recipe-2-client-spa"
$CLIENT_APP_ID = az ad app create \`
  --display-name $CLIENT_NAME \`
  --sign-in-audience AzureADMyOrg \`
  --query appId -o tsv

az ad sp create --id $CLIENT_APP_ID
az ad app update --id $CLIENT_APP_ID \`
  --set spa.redirectUris="['http://localhost:5173/']"`,
      },
    ],
    portalSteps: [
      "Na API App Reg: Expose an API → Add a scope → access_as_user (como Recipe 1)",
      "Na Cliente App Reg: API permissions → + Add a permission → My APIs → seleciona recipe-2-api → Delegated → access_as_user → Add",
      "Grant admin consent na Cliente App Reg (se admin-only) OU user-consent OK em login",
    ],
    validation: [
      "SPA loga → token tem aud=api://{API_APP_ID} (não Cliente)",
      "API valida — Audience configurado = api://{API_APP_ID}",
    ],
    pitfalls: [
      {
        error: "AADSTS65001",
        cause: "Cliente não pediu permission pro scope da API",
        fix: "Portal → cliente → API permissions → Add → seleciona scope da API",
      },
      {
        error: "Audience errada",
        cause: "SPA pega token com aud=Cliente mas API espera api://{API}",
        fix: "scope no MSAL config = api://{API_APP_ID}/access_as_user (não /.default)",
      },
    ],
    complexity: "⭐⭐ Médio",
  },
  {
    id: "webapp-mvc",
    title: "3. Web App tradicional ASP.NET MVC",
    icon: Server,
    shortDescription: "Server-side rendering com cookie de sessão. Token NUNCA toca o browser.",
    scenario:
      "ASP.NET Core MVC ou Razor Pages. Backend cuida do callback OIDC, token vive no token cache do server, browser só carrega cookie HttpOnly.",
    whenUse: ["Apps intranet enterprise, governo, bancos (token NÃO pode vazar no browser)", "Sticky sessions ou Redis cache já existe"],
    whenNotUse: ["App moderna SPA-first → Recipe 1"],
    decisions: [
      { aspect: "signInAudience", choice: "AzureADMyOrg (geralmente single)", why: "Enterprise interno" },
      { aspect: "Platform", choice: "Web", why: "Callback no server, com client_secret" },
      { aspect: "Redirect URI", choice: "https://meu-app/signin-oidc", why: "Microsoft.Identity.Web pattern" },
      { aspect: "Credencial", choice: "Client Secret OU Certificate", why: "Server confia em si próprio" },
    ],
    setupSteps: [
      {
        description: "Criar App Reg Web",
        command: `$APP_NAME = "recipe-3-webapp-mvc"
$WEB_APP_URL = "https://localhost:5001"

$APP_ID = az ad app create \`
  --display-name $APP_NAME \`
  --sign-in-audience AzureADMyOrg \`
  --web-redirect-uris "$WEB_APP_URL/signin-oidc" \`
  --enable-id-token-issuance true \`
  --query appId -o tsv

az ad sp create --id $APP_ID

az ad app update --id $APP_ID \`
  --set web.logoutUrl="$WEB_APP_URL/signout-callback-oidc"`,
      },
      {
        description: "Criar Client Secret (válido 1 ano)",
        command: `$SECRET = az ad app credential reset --id $APP_ID --years 1 --query password -o tsv
Write-Host "Client Secret (copie agora):"; Write-Host $SECRET`,
      },
    ],
    integration: {
      label: "Backend (Program.cs)",
      code: `builder.Services.AddAuthentication(OpenIdConnectDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApp(builder.Configuration.GetSection("AzureAd"));

builder.Services.AddRazorPages().AddMicrosoftIdentityUI();

// appsettings.json:
// {
//   "AzureAd": {
//     "ClientId": "{APP_ID}",
//     "ClientSecret": "{SECRET}",
//     "CallbackPath": "/signin-oidc"
//   }
// }`,
    },
    validation: [
      "Acesse https://localhost:5001 → redirect Microsoft → login → volta com cookie HttpOnly",
      "DevTools → Cookies → vê AspNetCore.Cookies (HttpOnly + Secure + SameSite=Lax)",
      "Request /authorize usa scope=openid profile (não scopes de API)",
    ],
    pitfalls: [
      {
        error: "InvalidOperationException no startup",
        cause: "ClientSecret faltando em appsettings.Production.json",
        fix: "Use Key Vault ou env var. NUNCA commit secret no repo.",
      },
      {
        error: "AADSTS50011 com /signin-oidc",
        cause: "Microsoft.Identity.Web usa /signin-oidc, mas redirect registrado é /",
        fix: "Redirect URI deve ser https://meu-app/signin-oidc (com sufixo)",
      },
    ],
    complexity: "⭐⭐ Médio",
  },
  {
    id: "mobile-android",
    title: "4. Mobile nativo Android + MSAL",
    icon: Smartphone,
    shortDescription: "Broker do sistema + biometria. SSO entre apps Microsoft.",
    scenario:
      "App Android nativo com MSAL Mobile SDK. Token cache device-bound (TPM). Login via broker (Microsoft Authenticator).",
    whenUse: ["Apps corporativos Android/iOS", "Cenário Intune com device compliance"],
    whenNotUse: ["Web SPA dentro de WebView → use Recipe 1"],
    decisions: [
      { aspect: "signInAudience", choice: "AzureADMyOrg ou Multi", why: "Depende do app" },
      { aspect: "Platform", choice: "Mobile and desktop (Public client)", why: "Sem secret" },
      { aspect: "Redirect URI", choice: "msauth://{bundle-id}/{base64-hash}", why: "Deep link Android" },
      { aspect: "Credencial", choice: "PKCE + broker (device-bound)", why: "Token criptografado no device" },
    ],
    setupSteps: [
      {
        description: "Criar App Reg Public client",
        command: `$APP_NAME = "recipe-4-mobile-android"
$BUNDLE_ID = "com.exemplo.app"
$SIGNATURE_HASH = "AbCdEfG..."   # SHA1 do signing key, base64

$APP_ID = az ad app create \`
  --display-name $APP_NAME \`
  --sign-in-audience AzureADMyOrg \`
  --public-client-redirect-uris "msauth://$BUNDLE_ID/$SIGNATURE_HASH" "msauth://com.microsoft.authenticator/$BUNDLE_ID" \`
  --is-fallback-public-client true \`
  --query appId -o tsv

az ad sp create --id $APP_ID`,
      },
      {
        description: "Como pegar o signature hash (Linux/Mac):",
        command: `keytool -exportcert -alias androiddebugkey -keystore ~/.android/debug.keystore | openssl sha1 -binary | openssl base64`,
        language: "bash",
      },
    ],
    integration: {
      label: "Android Kotlin",
      code: `val msalApp = PublicClientApplication.createSingleAccountPublicClientApplication(
    context, R.raw.msal_config)

val params = AcquireTokenParameters.Builder()
    .startAuthorizationFromActivity(this)
    .withScopes(listOf("User.Read"))
    .withCallback(authCallback)
    .build()

msalApp.acquireToken(params)`,
    },
    validation: [
      "App abre → tap Login → Authenticator ou Chrome Custom Tab abre",
      "Login → app recebe token via IPC",
      "IAccount.getId() retorna oid do user",
    ],
    pitfalls: [
      {
        error: "Redirect URI mismatch",
        cause: "Signature hash difere entre debug e release builds",
        fix: "Registre AMBOS no Portal (msauth://...debug-hash e msauth://...release-hash)",
      },
      {
        error: "WebView fallback inseguro",
        cause: "Authenticator não instalado, MSAL cai pra WebView",
        fix: "Doc Microsoft recomenda EXIGIR broker em prod (acquireTokenParameters.withBrokerInteractionRequired)",
      },
    ],
    complexity: "⭐⭐⭐ Avançado",
  },
  {
    id: "daemon-secret",
    title: "5. Daemon com Client Secret (MVP)",
    icon: Terminal,
    shortDescription: "Job sem usuário. Cron, ETL. Client Credentials flow.",
    scenario:
      "Daemon roda 24/7 sem user interativo. Autentica como ELE MESMO via client_id + client_secret. Token com claim 'roles' (Application). Audit log mostra appid.",
    whenUse: ["MVP, dev local, prototipagem, scripts internos"],
    whenNotUse: ["Production crítica → Recipe 6 (FIC) ou Managed Identity"],
    decisions: [
      { aspect: "signInAudience", choice: "AzureADMyOrg", why: "Daemon interno" },
      { aspect: "Platform", choice: "(none) — sem Redirect URI", why: "Sem flow interativo" },
      { aspect: "Credencial", choice: "Client Secret", why: "MVP rápido" },
      { aspect: "Permission", choice: "Application (Mail.Read, User.Read.All)", why: "Sem user envolvido" },
      { aspect: "Admin consent", choice: "Obrigatório", why: "Application permissions exigem admin" },
    ],
    setupSteps: [
      {
        description: "Criar App Reg + SP + Secret",
        command: `$APP_NAME = "recipe-5-daemon-secret"

$APP_ID = az ad app create \`
  --display-name $APP_NAME \`
  --sign-in-audience AzureADMyOrg \`
  --query appId -o tsv

az ad sp create --id $APP_ID

$SECRET = az ad app credential reset --id $APP_ID --years 1 --query password -o tsv
Write-Host "Client Secret:"; Write-Host $SECRET`,
      },
      {
        description: "Microsoft Graph User.Read.All (Application) + admin consent OBRIGATÓRIO",
        command: `$GRAPH_APP_ID = "00000003-0000-0000-c000-000000000000"
az ad app permission add --id $APP_ID --api $GRAPH_APP_ID \`
  --api-permissions df021288-bdef-4463-88db-98f22de89214=Role

az ad app permission admin-consent --id $APP_ID`,
      },
    ],
    integration: {
      label: "Node.js (msal-node)",
      code: `import { ConfidentialClientApplication } from "@azure/msal-node";

const msalApp = new ConfidentialClientApplication({
  auth: {
    clientId: process.env.APP_ID!,
    clientSecret: process.env.CLIENT_SECRET!,
    authority: \`https://login.microsoftonline.com/\${process.env.TENANT_ID}\`,
  },
});

const { accessToken } = await msalApp.acquireTokenByClientCredential({
  scopes: ["https://graph.microsoft.com/.default"],
});

const res = await fetch("https://graph.microsoft.com/v1.0/users?$top=5", {
  headers: { Authorization: \`Bearer \${accessToken}\` },
});`,
    },
    validation: [
      "Pegar token via curl: POST /token com grant_type=client_credentials",
      "Decode em jwt.ms — esperado 'roles' (não 'scp'), aud=Graph, appid={APP_ID}",
      "Chamar Graph: retorna lista de users do tenant",
    ],
    pitfalls: [
      {
        error: "AADSTS65001",
        cause: "Esqueceu o admin-consent",
        fix: "Application permissions SEMPRE exigem admin: az ad app permission admin-consent --id {APP_ID}",
      },
      {
        error: "403 Forbidden no Graph",
        cause: "Permission adicionada mas SP não tem assignment",
        fix: "Após admin consent, aguarde 1-2min de propagação",
      },
      {
        error: "Secret expirado",
        cause: "Secret defaut expira em 6-24 meses",
        fix: "Rotação manual OU migrar pra Recipe 6 (FIC) / Managed Identity",
      },
    ],
    complexity: "⭐⭐ Médio",
  },
  {
    id: "daemon-fic",
    title: "6. Daemon com FIC (GitHub Actions OIDC)",
    icon: Github,
    shortDescription: "Zero secrets. Padrão moderno pra CI/CD.",
    scenario:
      "GitHub Actions pede id_token via OIDC do próprio GitHub. Entra ID aceita esse id_token como prova de identidade via Federated Credential. Sem AZURE_CLIENT_SECRET.",
    whenUse: ["CI/CD que deploya em Azure (GitHub Actions, Azure DevOps, GitLab CI)", "Padrão recomendado pela Microsoft pra 2024+"],
    whenNotUse: ["Daemon em servidor não-CI/CD → use Managed Identity ou Recipe 5"],
    decisions: [
      { aspect: "Credencial", choice: "Federated Identity Credential", why: "Zero secret" },
      { aspect: "Subject filter", choice: "repo:{org}/{repo}:ref:refs/heads/main", why: "Restringe a branch específica" },
      { aspect: "Issuer", choice: "https://token.actions.githubusercontent.com", why: "GitHub OIDC issuer público" },
      { aspect: "Audience", choice: "api://AzureADTokenExchange", why: "Constante MS" },
    ],
    setupSteps: [
      {
        description: "Criar App Reg + SP",
        command: `$APP_NAME = "recipe-6-daemon-fic-github"
$REPO = "seu-user/seu-repo"

$APP_ID = az ad app create \`
  --display-name $APP_NAME \`
  --sign-in-audience AzureADMyOrg \`
  --query appId -o tsv

az ad sp create --id $APP_ID`,
      },
      {
        description: "Federated Credential — confia em GitHub Actions",
        command: `$ficParams = @{
  name      = "github-actions-main"
  issuer    = "https://token.actions.githubusercontent.com"
  subject   = "repo:\${REPO}:ref:refs/heads/main"
  audiences = @("api://AzureADTokenExchange")
} | ConvertTo-Json -Compress

az ad app federated-credential create --id $APP_ID --parameters $ficParams`,
      },
      {
        description: "Role assignment — Contributor na sub",
        command: `$SUB_ID = az account show --query id -o tsv
$SP_OBJECT_ID = az ad sp show --id $APP_ID --query id -o tsv

az role assignment create \`
  --assignee-object-id $SP_OBJECT_ID \`
  --assignee-principal-type ServicePrincipal \`
  --role Contributor \`
  --scope "/subscriptions/$SUB_ID"`,
      },
    ],
    integration: {
      label: ".github/workflows/deploy.yml",
      code: `permissions:
  id-token: write      # OBRIGATÓRIO pra OIDC token exchange
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Azure Login (OIDC, zero secrets)
        uses: azure/login@v2
        with:
          client-id: \${{ secrets.AZURE_CLIENT_ID }}            # = APP_ID (GUID público)
          tenant-id: \${{ secrets.AZURE_TENANT_ID }}            # GUID público
          subscription-id: \${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - run: az group list`,
    },
    validation: [
      "Commit + push pra main",
      "Workflow roda — step Azure Login mostra 'Login successful via OIDC'",
      "az commands seguintes funcionam sem secret",
    ],
    pitfalls: [
      {
        error: "AADSTS70021",
        cause: "Subject não bate — cuidado com main vs master vs develop",
        fix: "Criar FICs separadas por branch OU usar wildcards (refs/heads/*)",
      },
      {
        error: "AADSTS900150",
        cause: "Workflow sem permissions.id-token: write",
        fix: "Adicionar bloco permissions no YAML",
      },
      {
        error: "Workflow funciona em PR mas não em push",
        cause: "Subject de PR é diferente (refs/pull/123/merge)",
        fix: "Criar FIC adicional pra PRs OU restringir workflow a push",
      },
    ],
    complexity: "⭐⭐⭐ Avançado",
  },
  {
    id: "b2b-saas",
    title: "7. B2B SaaS multi-tenant",
    icon: Globe2,
    shortDescription: "Seu SaaS é vendido pra outras empresas. Cada cliente loga com a conta dele.",
    scenario:
      "App multi-tenant onde cliente A faz login, App Reg está NO SEU tenant. Entra ID provisiona SP no tenant do cliente automaticamente no primeiro consent.",
    whenUse: ["SaaS B2B (Salesforce-like, ERP) com clientes Entra ID corporativos"],
    whenNotUse: ["B2C consumer (Gmail, Facebook) → Entra External ID for Customers"],
    decisions: [
      { aspect: "signInAudience", choice: "AzureADMultipleOrgs", why: "Multi-tenant SaaS" },
      { aspect: "Verified publisher", choice: "Recomendado", why: "Reduz friction de consent dos clientes" },
      { aspect: "Permissions", choice: "Apenas o mínimo", why: "Clientes auditam consent" },
      { aspect: "Branding", choice: "Logo + Publisher domain", why: "Tela de consent profissional" },
    ],
    setupSteps: [
      {
        description: "Criar App Reg + SP",
        command: `$APP_NAME = "recipe-7-b2b-saas"
$YOUR_DOMAIN = "yourdomain.com"

$APP_ID = az ad app create \`
  --display-name $APP_NAME \`
  --sign-in-audience AzureADMultipleOrgs \`
  --web-redirect-uris "https://saas.$YOUR_DOMAIN/signin-oidc" \`
  --enable-id-token-issuance true \`
  --query appId -o tsv

az ad sp create --id $APP_ID`,
      },
      {
        description: "Endpoint admin consent pra cliente",
        command: `https://login.microsoftonline.com/common/adminconsent?client_id={APP_ID}&redirect_uri=https://saas.yourdomain.com/admin-consent-callback`,
      },
    ],
    validation: [
      "Cliente (outro tenant) acessa https://saas.yourdomain.com/login",
      "Redirect Microsoft (common authority)",
      "Tela 'An admin needs to consent' OU consent direto se permission é user-consent-able",
      "Após aceito: SP aparece em Enterprise applications NO TENANT DO CLIENTE",
    ],
    pitfalls: [
      {
        error: "AADSTS7000229",
        cause: "Cliente nunca consentiu — sem SP local",
        fix: "Trigger admin consent flow ANTES do primeiro login",
      },
      {
        error: "Token validation falha (issuer)",
        cause: "Backend valida issuer fixo, mas cada cliente tem issuer diferente",
        fix: "Microsoft.Identity.Web: ValidateIssuer=false + validação manual de tenant na lista de allowed tenants",
      },
    ],
    complexity: "⭐⭐⭐ Avançado",
  },
  {
    id: "aks-workload-identity",
    title: "8. AKS Workload Identity",
    icon: Network,
    shortDescription: "Pods Kubernetes autenticam como SP sem secret. Production-grade k8s.",
    scenario:
      "Pod em AKS precisa chamar Graph/KeyVault/Storage. AKS expõe OIDC issuer + cada Pod ServiceAccount → projected token JWT → Entra ID aceita como FIC.",
    whenUse: ["AKS produção multi-team", "Compliance heavy", "Cada workload com identidade separada (audit granular)"],
    whenNotUse: ["App Service / Function App → Managed Identity nativa (mais simples)", "Single-pod simple — overkill"],
    decisions: [
      { aspect: "AKS feature", choice: "Workload Identity addon", why: "OIDC issuer + token projection" },
      { aspect: "Credencial", choice: "Federated Identity Credential", why: "Trust no SA do k8s" },
      { aspect: "Subject", choice: "system:serviceaccount:{ns}:{sa}", why: "Pattern Kubernetes ServiceAccount" },
    ],
    setupSteps: [
      {
        description: "Habilitar Workload Identity no AKS",
        command: `az aks update --resource-group $AKS_RG --name $AKS_NAME \`
  --enable-oidc-issuer --enable-workload-identity

$AKS_OIDC_ISSUER = az aks show --resource-group $AKS_RG --name $AKS_NAME \`
  --query "oidcIssuerProfile.issuerUrl" -o tsv`,
      },
      {
        description: "Criar App Reg + Federated Credential trustando o SA",
        command: `$APP_ID = az ad app create --display-name "recipe-8-aks-workload" --query appId -o tsv
az ad sp create --id $APP_ID

$ficParams = @{
  name      = "aks-workload-identity"
  issuer    = $AKS_OIDC_ISSUER
  subject   = "system:serviceaccount:default:my-app-sa"
  audiences = @("api://AzureADTokenExchange")
} | ConvertTo-Json -Compress

az ad app federated-credential create --id $APP_ID --parameters $ficParams`,
      },
    ],
    integration: {
      label: "Kubernetes manifest",
      code: `apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-app-sa
  namespace: default
  annotations:
    azure.workload.identity/client-id: "{APP_ID}"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  template:
    metadata:
      labels:
        azure.workload.identity/use: "true"
    spec:
      serviceAccountName: my-app-sa
      containers:
        - name: app
          image: myacr.azurecr.io/my-app:latest`,
    },
    validation: [
      "kubectl exec pod -- env | grep AZURE_ → AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_FEDERATED_TOKEN_FILE injetados",
      "kubectl exec pod -- cat /var/run/secrets/azure/tokens/azure-identity-token → decode em jwt.ms",
      "App no pod chama Graph com DefaultAzureCredential → funciona sem secret",
    ],
    pitfalls: [
      {
        error: "Webhook não inject env vars",
        cause: "Label azure.workload.identity/use=true faltando no Pod (não no Deployment)",
        fix: "Label vai no spec.template.metadata.labels, não no metadata do Deployment",
      },
      {
        error: "AADSTS70021",
        cause: "Subject errado — case-sensitive",
        fix: "Exato: system:serviceaccount:{ns}:{sa} (minúsculas, namespace correto)",
      },
    ],
    complexity: "⭐⭐⭐⭐ Expert",
  },
  {
    id: "custom-claims",
    title: "9. Custom Claims (App Roles + Optional Claims)",
    icon: ShieldCheck,
    shortDescription: "Tokens com claims customizados: roles, groups, email, ipaddr.",
    scenario:
      "Backend precisa de claim que NÃO vem no token padrão. App Roles via Manifest, Optional Claims via Token configuration, Groups claim, Claim Mapping Policy avançada.",
    whenUse: ["RBAC granular com App Roles próprios", "Compliance que exige claim de device/IP", "Migration de SAML legado com attribute customizado"],
    whenNotUse: ["Só pra 'porque pode' → tokens grandes degradam performance"],
    decisions: [
      { aspect: "App Roles", choice: "Manifest patch", why: "Roles do próprio app" },
      { aspect: "Optional Claims", choice: "optionalClaims manifest", why: "email, groups, ipaddr extras" },
      { aspect: "Group claim", choice: "Security groups OU All groups", why: "Cuidado overflow >200" },
      { aspect: "Claim Mapping Policy", choice: "Avançado", why: "Graph PowerShell pra custom corporate attribute" },
    ],
    setupSteps: [
      {
        description: "Criar App Role via Manifest patch",
        command: `$APP_NAME = "recipe-9-custom-claims"
$APP_ID = az ad app create --display-name $APP_NAME --query appId -o tsv
az ad sp create --id $APP_ID

$appRole = @{
  id                 = [guid]::NewGuid().ToString()
  isEnabled          = $true
  origin             = "Application"
  allowedMemberTypes = @("User", "Application")
  displayName        = "Approver"
  description        = "Pode aprovar requisicoes"
  value              = "Approver"
}

$current = az ad app show --id $APP_ID --query appRoles -o json | ConvertFrom-Json
$newRoles = @($current + $appRole) | ConvertTo-Json -Compress
az ad app update --id $APP_ID --app-roles $newRoles`,
      },
      {
        description: "Optional Claims (email, groups, ipaddr)",
        command: `$optionalClaims = @{
  idToken     = @(
    @{ name = "email";  source = $null; essential = $false }
    @{ name = "groups"; source = $null; essential = $false }
  )
  accessToken = @(
    @{ name = "email";  source = $null; essential = $false }
    @{ name = "groups"; source = $null; essential = $false }
    @{ name = "ipaddr"; source = $null; essential = $false }
  )
  saml2Token  = @()
} | ConvertTo-Json -Depth 10 -Compress

az ad app update --id $APP_ID --optional-claims $optionalClaims`,
      },
    ],
    portalSteps: [
      "Portal → App Reg → Token configuration → + Add groups claim",
      "Selecione: Security groups OU Groups assigned to the application",
      "Configure pra ID token + Access token",
      "Save",
    ],
    validation: [
      "Atribuir App Role 'Approver' ao seu user via Enterprise Applications",
      "Logout + Login no SPA",
      "Decode token em jwt.ms → esperado: roles=['Approver'], groups=[...], email='...'",
    ],
    pitfalls: [
      {
        error: "groups claim ausente",
        cause: "Esqueceu de configurar Token configuration",
        fix: "App Roles vêm em roles, security groups em groups. Configurar separado.",
      },
      {
        error: "Token > 1KB (overflow)",
        cause: "User tem >200 groups",
        fix: "Usar Graph /me/memberOf em vez do claim OU filtrar 'Groups assigned to the application'",
      },
      {
        error: "email vazio",
        cause: "User não tem mail attribute no AD",
        fix: "Fallback pra preferred_username OU Claim Mapping Policy",
      },
    ],
    complexity: "⭐⭐⭐ Avançado",
  },
  {
    id: "swagger-oauth2",
    title: "10. Swagger UI com OAuth2 + Entra ID",
    icon: BookOpen,
    shortDescription: "Botão Authorize do Swagger faz Auth Code + PKCE direto. API doc vira dev tool.",
    scenario:
      "Backend .NET 8 + Swashbuckle. Swagger UI faz login real Entra ID quando aluno clica Authorize. Próximas calls testadas já vão com Bearer automático.",
    whenUse: ["Time front-end ou parceiros B2B testando API", "Doc viva — Swagger UI vira ferramenta de exploração"],
    whenNotUse: ["API sem usuários (daemon-only) — Swagger vira doc estática"],
    decisions: [
      { aspect: "Flow", choice: "Auth Code + PKCE", why: "Swagger UI 3.x suporta nativo" },
      { aspect: "Redirect URI extra", choice: "https://{api}/swagger/oauth2-redirect.html", why: "Endpoint Swashbuckle padrão" },
      { aspect: "Scope", choice: "api://{client-id}/access_as_user", why: "Mesmo scope que SPA usa" },
    ],
    setupSteps: [
      {
        description: "Adicionar SPA Redirect URI pro Swagger UI",
        command: `$APP_ID = "<seu-app-id-existente>"
$API_URL = "https://localhost:5001"

az ad app update --id $APP_ID \`
  --set spa.redirectUris="['$API_URL/swagger/oauth2-redirect.html', 'http://localhost:5173/']"`,
      },
    ],
    integration: {
      label: "Program.cs (Swashbuckle config)",
      code: `builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("oauth2", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.OAuth2,
        Flows = new OpenApiOAuthFlows
        {
            AuthorizationCode = new OpenApiOAuthFlow
            {
                AuthorizationUrl = new Uri($"https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/authorize"),
                TokenUrl         = new Uri($"https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token"),
                Scopes = new Dictionary<string, string>
                {
                    [$"api://{clientId}/access_as_user"] = "Access API as user"
                }
            }
        }
    });
});

app.UseSwaggerUI(c =>
{
    c.OAuthClientId(clientId);
    c.OAuthUsePkce();
    c.OAuthScopes($"api://{clientId}/access_as_user");
});`,
    },
    validation: [
      "dotnet run → https://localhost:5001/swagger",
      "Click 🔐 Authorize → modal abre",
      "Click Authorize → popup Microsoft → consent",
      "Modal verde ✅ → endpoints protegidos retornam 200 com Bearer automático",
    ],
    pitfalls: [
      {
        error: "AADSTS9002326 (cross-origin)",
        cause: "Registrou como Web em vez de SPA",
        fix: "Swagger UI faz Auth Code + PKCE = precisa SPA platform",
      },
      {
        error: "Token expirou no meio do teste",
        cause: "Swagger UI não renova silently",
        fix: "Click Authorize de novo (gera token novo)",
      },
      {
        error: "Em produção: Swagger exposto público é risco",
        cause: "Endpoints sensíveis testáveis por qualquer um logado",
        fix: "Desabilitar Swagger em prod OU exigir App Role pra acessar /swagger",
      },
    ],
    complexity: "⭐⭐ Médio",
  },
];

export default function LabRecipes() {
  const [activeId, setActiveId] = useState<string>(recipes[0].id);
  const active = recipes.find((r) => r.id === activeId) ?? recipes[0];

  return (
    <div className="space-y-6 max-w-[1600px]">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">App Registration Recipes</h1>
        <p className="text-muted-foreground">
          10 receitas hands-on pra criar diferentes estilos de App Reg. Cada uma com comandos <code className="px-1 py-0.5 rounded bg-muted text-[0.9em]">az</code> copy-pasta,
          snippet de código, validação e pitfalls.
        </p>
        <div className="text-xs px-3 py-2 rounded bg-primary/5 border border-primary/20 flex items-start justify-between gap-3 flex-wrap">
          <span>
            📚 <strong>Doc completo:</strong>{" "}
            <a
              href="https://github.com/tftec-guilherme/entra-auth-gateway/blob/main/docs/aula/app-reg-recipes.md"
              target="_blank"
              rel="noreferrer"
              className="underline text-primary"
            >
              docs/aula/app-reg-recipes.md
            </a>{" "}
            (markdown completo com apêndice cross-cutting de Claims/Roles/Swagger/Protocolos/Multi-tenant).
          </span>
        </div>
      </header>

      <div className="grid lg:grid-cols-[320px_1fr] gap-4">
        {/* Sidebar — lista de receitas */}
        <nav aria-label="Lista de receitas" className="space-y-1">
          {recipes.map((r) => {
            const Icon = r.icon;
            const isActive = r.id === activeId;
            return (
              <button
                key={r.id}
                onClick={() => setActiveId(r.id)}
                className={`w-full text-left px-3 py-2.5 rounded-md border transition flex items-start gap-2.5 ${
                  isActive
                    ? "bg-primary/10 border-primary/40 text-foreground"
                    : "bg-card/50 border-border hover:border-primary/30 hover:bg-card"
                }`}
              >
                <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                <div className="min-w-0">
                  <div className="font-medium text-sm leading-tight">{r.title}</div>
                  <p className="text-xs text-muted-foreground leading-snug mt-1">{r.shortDescription}</p>
                  <Badge variant="outline" className="text-[10px] mt-1.5 px-1.5 py-0">
                    {r.complexity}
                  </Badge>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Detail card */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <active.icon className="w-6 h-6 text-primary" />
                    {active.title}
                  </CardTitle>
                  <CardDescription className="mt-1">{active.scenario}</CardDescription>
                </div>
                <Badge variant="outline">{active.complexity}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Quando usar / não usar */}
              <div className="grid md:grid-cols-2 gap-4">
                <section className="rounded-md bg-emerald-500/5 border border-emerald-500/30 p-3">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-emerald-500">
                    <CheckCircle2 className="w-4 h-4" /> Quando usar
                  </h3>
                  <ul className="space-y-1 text-sm">
                    {active.whenUse.map((u, i) => (
                      <li key={i} className="text-foreground/85 leading-snug">
                        • {u}
                      </li>
                    ))}
                  </ul>
                </section>
                <section className="rounded-md bg-amber-500/5 border border-amber-500/30 p-3">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-amber-500">
                    <AlertTriangle className="w-4 h-4" /> Quando NÃO usar
                  </h3>
                  <ul className="space-y-1 text-sm">
                    {active.whenNotUse.map((u, i) => (
                      <li key={i} className="text-foreground/85 leading-snug">
                        • {u}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              {/* Decisões críticas */}
              <section>
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Decisões críticas</h3>
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-1.5 px-2 text-xs uppercase tracking-wide text-muted-foreground">Aspecto</th>
                        <th className="text-left py-1.5 px-2 text-xs uppercase tracking-wide text-muted-foreground">Escolha</th>
                        <th className="text-left py-1.5 px-2 text-xs uppercase tracking-wide text-muted-foreground">Por quê</th>
                      </tr>
                    </thead>
                    <tbody>
                      {active.decisions.map((d, i) => (
                        <tr key={i} className="border-b border-border/40">
                          <td className="py-1.5 px-2 font-medium">{d.aspect}</td>
                          <td className="py-1.5 px-2 font-mono text-xs">{d.choice}</td>
                          <td className="py-1.5 px-2 text-muted-foreground text-xs">{d.why}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Setup steps com az */}
              <section>
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Terminal className="w-4 h-4" /> Setup com az CLI
                </h3>
                <div className="space-y-3">
                  {active.setupSteps.map((step, i) => (
                    <div key={i} className="space-y-1.5">
                      <p className="text-sm text-foreground/90">
                        <span className="text-primary font-semibold">{i + 1}.</span> {step.description}
                      </p>
                      <CopyableSnippet code={step.command} />
                    </div>
                  ))}
                </div>
              </section>

              {/* Portal steps */}
              {active.portalSteps && (
                <section className="rounded-md bg-primary/5 border border-primary/20 p-3">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-primary">
                    <Sparkles className="w-4 h-4" /> Completar via Portal
                  </h3>
                  <ol className="space-y-1 text-sm list-decimal list-inside">
                    {active.portalSteps.map((step, i) => (
                      <li key={i} className="text-foreground/90 leading-snug">
                        {step}
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {/* Integração no código */}
              {active.integration && (
                <section>
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Integração no código</h3>
                  <CopyableSnippet code={active.integration.code} label={active.integration.label} />
                </section>
              )}

              {/* Validação */}
              <section>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-emerald-500">
                  <CheckCircle2 className="w-4 h-4" /> Validação
                </h3>
                <ol className="space-y-1 text-sm list-decimal list-inside">
                  {active.validation.map((v, i) => (
                    <li key={i} className="text-foreground/90 leading-snug">
                      {v}
                    </li>
                  ))}
                </ol>
              </section>

              {/* Pitfalls */}
              <section>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-destructive">
                  <AlertTriangle className="w-4 h-4" /> Pitfalls comuns
                </h3>
                <div className="space-y-2">
                  {active.pitfalls.map((p, i) => (
                    <div key={i} className="rounded-md border border-destructive/30 bg-destructive/5 p-2.5">
                      <p className="text-sm">
                        <span className="font-mono font-bold text-destructive">{p.error}</span> — {p.cause}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <strong className="text-foreground">Fix:</strong> {p.fix}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </CardContent>
          </Card>

          {/* Footer card — links pra cross-receitas */}
          <Card className="bg-muted/20 border-dashed">
            <CardContent className="pt-5 pb-5 text-sm text-muted-foreground space-y-2">
              <p>
                📚 <strong>Conceitos cross-receitas (Claims, Roles, Swagger, Protocolos, Multi-tenant):</strong>
              </p>
              <p className="text-xs leading-relaxed">
                O doc{" "}
                <a
                  href="https://github.com/tftec-guilherme/entra-auth-gateway/blob/main/docs/aula/app-reg-recipes.md"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  app-reg-recipes.md <ExternalLink className="w-3 h-3" />
                </a>{" "}
                tem apêndice com tabelas de decisão pra cada conceito atravessando as 10 receitas. Use junto com{" "}
                <a href="/lab/protocolos" className="text-primary hover:underline">
                  /lab/protocolos
                </a>{" "}
                (4 protocolos),{" "}
                <a href="/lab/credenciais" className="text-primary hover:underline">
                  /lab/credenciais
                </a>{" "}
                (4 credenciais),{" "}
                <a href="/lab/permissions-claims" className="text-primary hover:underline">
                  /lab/permissions-claims
                </a>{" "}
                (claims + roles).
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
