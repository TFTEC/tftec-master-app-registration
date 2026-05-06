import { Configuration, LogLevel } from "@azure/msal-browser";
import { AZURE_CONFIG } from "./azure";

export const msalConfig: Configuration = {
  auth: {
    clientId: AZURE_CONFIG.clientId,
    authority: `${AZURE_CONFIG.instance}${AZURE_CONFIG.tenantId}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            break;
          case LogLevel.Warning:
            console.warn(message);
            break;
          case LogLevel.Info:
            console.info(message);
            break;
          case LogLevel.Verbose:
            console.debug(message);
            break;
        }
      },
      logLevel: LogLevel.Warning,
    },
  },
};

// Scopes for Microsoft Graph API
export const graphScopes = {
  user: ["User.Read", "User.ReadWrite.All", "Directory.ReadWrite.All"],
  apps: ["Application.Read.All", "Application.ReadWrite.All"],
  signInLogs: ["AuditLog.Read.All", "Directory.Read.All"],
};

export const loginRequest = {
  scopes: [
    "User.Read",
    "User.ReadWrite.All",
    "Directory.ReadWrite.All",
    "Application.Read.All",
    "Application.ReadWrite.All",
    "AuditLog.Read.All",
  ],
};

// Scope para acessar a API AuthService (audience = api://{client-id})
// Usado quando frontend precisa chamar endpoints /auth/* da API .NET
// que valida JWT bearer com audience = api://{client-id}
export const authServiceRequest = {
  scopes: [`${AZURE_CONFIG.audience}/access_as_user`],
};

export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
  graphUsersEndpoint: "https://graph.microsoft.com/v1.0/users",
  graphAppsEndpoint: "https://graph.microsoft.com/v1.0/applications",
  graphSignInLogsEndpoint: "https://graph.microsoft.com/v1.0/auditLogs/signIns",
};
