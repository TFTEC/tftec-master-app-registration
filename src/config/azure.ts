// Azure AD / Entra ID Configuration
// 3 fontes em ordem de prioridade:
//   1. RUNTIME CONFIG (public/config.js) — substituído por env vars do App Service no startup
//      via scripts/replace-runtime-config.sh. Permite trocar clientId sem rebuild Vite.
//   2. BUILD-TIME (import.meta.env.VITE_*) — embebido no bundle durante npm run build.
//      Default pra dev local + fallback se runtime config tiver placeholders não-substituídos.
//   3. DEFAULT_CLIENT_ID — só pra emergência (App Reg legacy do tftec-auth deployed).
//
// Veja docs/aula/runtime-config-vs-build-time.md pra discussão pedagógica.

const DEFAULT_CLIENT_ID = "78345291-2586-4691-b1f9-e4e780f55328";

interface RuntimeConfig {
  clientId?: string;
  tenantId?: string;
  audience?: string;
  authServiceUrl?: string;
}

// Detecta se valor é placeholder não-substituído (forma: __VITE_AZURE_..._ ou similar)
const isPlaceholder = (val: string | undefined): boolean =>
  !val || val.startsWith("__VITE_") || val.startsWith("__");

// Lê runtime config injetada por public/config.js
const runtimeConfig: RuntimeConfig = (typeof window !== "undefined" && (window as unknown as { __APP_CONFIG__?: RuntimeConfig }).__APP_CONFIG__) || {};

const resolvedClientId = isPlaceholder(runtimeConfig.clientId)
  ? import.meta.env.VITE_AZURE_CLIENT_ID || DEFAULT_CLIENT_ID
  : runtimeConfig.clientId!;

const resolvedTenantId = isPlaceholder(runtimeConfig.tenantId)
  ? import.meta.env.VITE_AZURE_TENANT_ID || "organizations"
  : runtimeConfig.tenantId!;

const resolvedAudience = isPlaceholder(runtimeConfig.audience)
  ? (import.meta.env.VITE_AZURE_AUDIENCE || `api://${resolvedClientId}`)
  : runtimeConfig.audience!;

export const AZURE_CONFIG = {
  instance: "https://login.microsoftonline.com/",
  tenantId: resolvedTenantId,
  clientId: resolvedClientId,
  audience: resolvedAudience,
};

// Debug helper — log fonte de config em dev pra facilitar troubleshoot
if (import.meta.env.DEV) {
  const source = !isPlaceholder(runtimeConfig.clientId)
    ? "runtime (window.__APP_CONFIG__)"
    : import.meta.env.VITE_AZURE_CLIENT_ID
    ? "build-time (import.meta.env)"
    : "DEFAULT_CLIENT_ID fallback";
  console.info(`[AZURE_CONFIG] Source: ${source}, clientId: ${resolvedClientId}`);
}

export const INTERNAL_JWT_CONFIG = {
  issuer: "AuthService",
  audience: "AuthService-Clients",
  expiryMinutes: 60,
};

export const DOWNSTREAM_APIS = {
  ApiA: {
    name: "ApiA",
    baseUrl: "https://api-a.example.com",
    scopes: ["api://api-a-client-id/access_as_user"],
    clientId: "api-a-client-id",
  },
  ApiB: {
    name: "ApiB",
    baseUrl: "https://api-b.example.com",
    scopes: ["api://api-b-client-id/.default"],
    clientId: "api-b-client-id",
  },
};

// AuthService API URL — 3 fontes (runtime → build-time → fallback)
const resolvedAuthServiceUrl = isPlaceholder(runtimeConfig.authServiceUrl)
  ? (import.meta.env.VITE_AUTHSERVICE_URL || "https://authservice-api-tftec.azurewebsites.net")
  : runtimeConfig.authServiceUrl!;

export const AUTHSERVICE_API_URL = resolvedAuthServiceUrl;

// Flag to indicate if we're going through APIM (URL configurada explicitamente, não fallback)
export const IS_APIM_ENABLED = !isPlaceholder(runtimeConfig.authServiceUrl) || !!import.meta.env.VITE_AUTHSERVICE_URL;

export const ENDPOINTS = {
  me: "/auth/me",
  validate: "/auth/validate",
  exchange: "/auth/exchange",
  obo: "/auth/obo",
  clientToken: "/auth/client-token",
  jwks: "/.well-known/jwks.json",
  health: "/health",
};
