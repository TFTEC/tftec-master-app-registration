// Azure AD / Entra ID Configuration
//
// CONFIGURE SEU PRÓPRIO App Registration via .env.local (recomendado) ou App Service settings:
//   VITE_AZURE_CLIENT_ID=<seu-client-id>            # Application (client) ID da SUA App Reg
//   VITE_AZURE_TENANT_ID=organizations              # ou <seu-tenant-id> | common
//   VITE_AZURE_AUDIENCE=api://<seu-client-id>       # gerado a partir do Client ID
//
// Ver .env.example na raiz do projeto + docs/guides/app-registration-setup.md

const DEFAULT_CLIENT_ID = "REPLACE_WITH_YOUR_CLIENT_ID";

export const AZURE_CONFIG = {
  instance: "https://login.microsoftonline.com/",
  tenantId: import.meta.env.VITE_AZURE_TENANT_ID || "organizations", // Multi-tenant default
  clientId: import.meta.env.VITE_AZURE_CLIENT_ID || DEFAULT_CLIENT_ID,
  audience: import.meta.env.VITE_AZURE_AUDIENCE || `api://${import.meta.env.VITE_AZURE_CLIENT_ID || DEFAULT_CLIENT_ID}`,
};

if (AZURE_CONFIG.clientId === DEFAULT_CLIENT_ID && typeof window !== "undefined") {
  console.warn(
    "[AZURE_CONFIG] VITE_AZURE_CLIENT_ID não configurado. " +
    "Crie .env.local com seu Client ID — login com Microsoft NÃO vai funcionar com o placeholder."
  );
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

// AuthService API URL
// Priority: APIM Gateway → Direct AuthService → Fallback (local dev)
// When APIM is configured, ALL calls go through APIM as the single entry point
export const AUTHSERVICE_API_URL =
  import.meta.env.VITE_AUTHSERVICE_URL ||
  "http://localhost:8080";

// Flag to indicate if we're going through APIM
export const IS_APIM_ENABLED = !!import.meta.env.VITE_AUTHSERVICE_URL;

export const ENDPOINTS = {
  me: "/auth/me",
  validate: "/auth/validate",
  exchange: "/auth/exchange",
  obo: "/auth/obo",
  clientToken: "/auth/client-token",
  jwks: "/.well-known/jwks.json",
  health: "/health",
};
