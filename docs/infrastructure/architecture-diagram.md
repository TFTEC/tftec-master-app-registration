# 🏗️ Diagrama de Infraestrutura — AuthService & Admin Console

> Visão completa da arquitetura atual e evolução v1 (APIM + Redis + Service Bus + Logic Apps)

---

## 1. Arquitetura Atual (Produção)

```mermaid
graph TB
    subgraph Users["👤 Usuários"]
        Browser["🌐 Browser"]
    end

    subgraph Azure["☁️ Microsoft Azure — Brazil South"]

        subgraph AppServices["📦 Azure App Services (Linux B1)"]
            Frontend["🖥️ Admin Console<br/><i>React 18 + Vite + TypeScript</i><br/><code>authservice-front-tftec</code>"]
            API["🔐 AuthService API<br/><i>.NET 8 + Docker</i><br/><code>authservice-api-tftec</code>"]
        end

    end

    subgraph Microsoft["☁️ Microsoft Cloud"]
        EntraID["🔑 Microsoft Entra ID<br/><i>Multi-tenant OIDC/OAuth 2.0</i>"]
        GraphAPI["📊 Microsoft Graph API"]
    end

    Browser -->|"HTTPS"| Frontend
    Frontend -->|"MSAL.js Redirect Flow"| EntraID
    EntraID -->|"Access Token + ID Token"| Frontend
    Frontend -->|"Bearer Token"| GraphAPI
    Frontend -->|"Bearer Token"| API
    API -->|"OIDC Validation + OBO"| EntraID

    style Users fill:#f0f9ff,stroke:#0ea5e9,color:#0c4a6e
    style Azure fill:#eff6ff,stroke:#3b82f6,color:#1e3a5f
    style AppServices fill:#dbeafe,stroke:#60a5fa,color:#1e40af
    style Microsoft fill:#faf5ff,stroke:#a855f7,color:#4c1d95
    style Frontend fill:#fef3c7,stroke:#f59e0b,color:#78350f
    style API fill:#fee2e2,stroke:#ef4444,color:#7f1d1d
    style EntraID fill:#f3e8ff,stroke:#a855f7,color:#6b21a8
    style GraphAPI fill:#dcfce7,stroke:#22c55e,color:#14532d
```

---

## 2. O que cada componente faz

```mermaid
graph LR
    subgraph Frontend["🖥️ Admin Console"]
        F1["📊 Dashboard<br/><i>Métricas reais via Graph</i>"]
        F2["👥 Users CRUD<br/><i>Criar, editar, excluir</i>"]
        F3["📱 App Registrations<br/><i>Secrets management</i>"]
        F4["🔄 OBO + Exchange<br/><i>Token delegation</i>"]
        F5["🔑 Client Credentials<br/><i>Service-to-service</i>"]
        F6["✅ Token Validation<br/><i>Decode + verify</i>"]
    end

    subgraph API["🔐 AuthService API"]
        A1["GET /auth/me<br/><i>User claims</i>"]
        A2["POST /auth/validate<br/><i>Token validation</i>"]
        A3["POST /auth/exchange<br/><i>Entra → Internal JWT</i>"]
        A4["POST /auth/obo<br/><i>On-Behalf-Of</i>"]
        A5["POST /auth/client-token<br/><i>Client Credentials</i>"]
        A6["GET /.well-known/jwks.json<br/><i>Public keys</i>"]
    end

    subgraph Graph["📊 Graph API"]
        G1["User.ReadWrite.All"]
        G2["Application.ReadWrite.All"]
        G3["AuditLog.Read.All"]
        G4["Directory.ReadWrite.All"]
    end

    F1 --> G3
    F2 --> G1
    F3 --> G2
    F4 --> A3
    F4 --> A4
    F5 --> A5
    F6 --> A2

    style Frontend fill:#fef3c7,stroke:#f59e0b,color:#78350f
    style API fill:#fee2e2,stroke:#ef4444,color:#7f1d1d
    style Graph fill:#dcfce7,stroke:#22c55e,color:#14532d
```

---

## 3. Fluxo de Autenticação (Passo a Passo)

```mermaid
sequenceDiagram
    actor User as 👤 Usuário
    participant SPA as 🖥️ Admin Console
    participant Entra as 🔑 Entra ID
    participant Graph as 📊 Graph API
    participant Auth as 🔐 AuthService

    rect rgb(240, 249, 255)
        Note over User, Entra: 1️⃣ Login (MSAL Redirect)
        User->>SPA: Acessa aplicação
        SPA->>Entra: loginRedirect()
        Entra-->>User: Tela Microsoft Login + MFA
        User->>Entra: Credenciais
        Entra-->>SPA: Access Token + ID Token
        Note over SPA: sessionStorage (não persiste)
    end

    rect rgb(220, 252, 231)
        Note over SPA, Graph: 2️⃣ Operações via Graph API
        SPA->>Graph: GET /users (Bearer Token)
        Graph-->>SPA: Lista de usuários
        SPA->>Graph: POST /applications (Bearer Token)
        Graph-->>SPA: App Registration criado
    end

    rect rgb(254, 226, 226)
        Note over SPA, Auth: 3️⃣ Token Exchange / OBO
        SPA->>Auth: POST /auth/exchange (Bearer Token Entra)
        Auth->>Entra: Valida token + troca
        Entra-->>Auth: Token interno assinado
        Auth-->>SPA: JWT interno para APIs downstream
    end
```

---

## 4. Modelos de Integração com APIs Downstream

```mermaid
graph TB
    subgraph Model1["✅ Modelo 1: Pass-through (Recomendado)"]
        direction LR
        M1_SPA["🖥️ SPA"] -->|"Token Entra"| M1_Auth["🔐 AuthService<br/><i>Valida + Autoriza</i>"]
        M1_Auth -->|"Mesmo Token Entra"| M1_API["🔗 API Downstream"]
    end

    subgraph Model2["🔄 Modelo 2: Token Interno"]
        direction LR
        M2_SPA["🖥️ SPA"] -->|"Token Entra"| M2_Auth["🔐 AuthService<br/><i>Exchange + Sign</i>"]
        M2_Auth -->|"JWT Interno Assinado"| M2_API["🔗 API Downstream"]
        M2_Auth -.->|"JWKS público"| M2_API
    end

    style Model1 fill:#dcfce7,stroke:#22c55e,color:#14532d
    style Model2 fill:#dbeafe,stroke:#3b82f6,color:#1e3a5f
```

---

## 5. CI/CD Pipeline (GitHub Actions)

```mermaid
graph LR
    subgraph Dev["👨‍💻 Desenvolvimento"]
        Code["📝 Código"] -->|"git push main"| GH["🐙 GitHub"]
    end

    subgraph Pipeline["⚙️ GitHub Actions"]
        direction TB
        GH -->|"Trigger"| Infra["1️⃣ Provisionar Infra<br/><i>RG + App Service Plan</i>"]
        Infra --> BuildAPI["2️⃣ Build API<br/><i>dotnet publish</i>"]
        Infra --> BuildFront["2️⃣ Build Frontend<br/><i>npm run build</i>"]
        BuildAPI --> DeployAPI["3️⃣ Deploy API<br/><i>App Service</i>"]
        BuildFront --> DeployFront["3️⃣ Deploy Frontend<br/><i>App Service</i>"]
        DeployAPI --> Health["4️⃣ Health Check<br/><i>GET /health</i>"]
    end

    subgraph Secrets["🔒 GitHub Secrets"]
        S1["AZURE_SP_CLIENT_ID"]
        S2["AZURE_SP_CLIENT_SECRET"]
        S3["AZURE_SP_TENANT_ID"]
        S4["AZURE_SUBSCRIPTION_ID"]
        S5["AZURE_CLIENT_ID"]
        S6["AZURE_CLIENT_SECRET"]
        S7["JWT_SIGNING_KEY"]
    end

    Secrets -.->|"Injetados no pipeline"| Pipeline

    style Dev fill:#f0f9ff,stroke:#0ea5e9,color:#0c4a6e
    style Pipeline fill:#fef3c7,stroke:#f59e0b,color:#78350f
    style Secrets fill:#f3e8ff,stroke:#a855f7,color:#6b21a8
```

---

## 6. Infraestrutura v1 — Evolução Completa

> Meta: **1 endpoint público (APIM)**, **cache (Redis)**, **eventos assíncronos (Service Bus + Logic Apps)**

```mermaid
graph TB
    subgraph Users["👤 Usuários"]
        Browser["🌐 Browser"]
    end

    subgraph Azure["☁️ Azure — rg-tftec-unified-hml — Brazil South"]

        subgraph Gateway["🌐 Azure API Management (APIM)"]
            APIM_JWT["🔒 validate-jwt<br/><i>Entra ID OIDC</i>"]
            APIM_CORS["🌍 CORS Policy"]
            APIM_Route1["/auth/* → AuthService"]
            APIM_Route2["/api/* → APIs"]
            APIM_Tenant["🏢 Tenant Whitelist<br/><i>Validação por tid claim</i>"]
        end

        subgraph Compute["📦 App Services (Linux B1)"]
            Frontend["🖥️ Admin Console<br/><i>React + Vite</i>"]
            AuthAPI["🔐 AuthService<br/><i>.NET 8</i>"]
        end

        subgraph Cache["⚡ Azure Cache for Redis"]
            R1["JWKS Metadata<br/><i>TTL: 6h</i>"]
            R2["Tokens OBO / CC<br/><i>TTL: exp - folga</i>"]
            R3["Rate Limit Aux<br/><i>Contadores IP/tenant</i>"]
        end

        subgraph Messaging["📨 Azure Service Bus"]
            Topic["Topic: topic-app-events"]
            E1["user_authenticated"]
            E2["token_exchanged"]
            E3["user_provision_requested"]
        end

        subgraph Automation["🔄 Azure Logic Apps"]
            LA_Trigger["Trigger: Service Bus"]
            LA1["📧 Notificações<br/><i>Email / Teams</i>"]
            LA2["👤 User Provisioning"]
            LA3["📋 Auditoria"]
        end

        subgraph Security["🔒 Azure Key Vault"]
            KV1["AzureAd--ClientSecret"]
            KV2["InternalJwt--SigningKey"]
            KV3["Redis--ConnectionString"]
            KV4["ServiceBus--ConnectionString"]
        end

        subgraph Downstream["🔗 APIs Downstream"]
            APIA["API A"]
            APIB["API B"]
            APIN["API N"]
        end

    end

    subgraph Microsoft["☁️ Microsoft Cloud"]
        EntraID["🔑 Entra ID"]
        GraphAPI["📊 Graph API"]
    end

    Browser -->|"HTTPS"| Frontend
    Frontend -->|"MSAL Redirect"| EntraID
    Frontend -->|"Bearer Token"| GraphAPI
    Browser -->|"HTTPS (via APIM)"| Gateway

    APIM_Route1 -->|"Proxy"| AuthAPI
    APIM_Route2 -->|"Proxy"| Downstream

    AuthAPI -->|"Cache tokens/JWKS"| Cache
    AuthAPI -->|"Publish events"| Messaging
    AuthAPI -->|"OIDC + OBO"| EntraID
    AuthAPI -->|"OBO Token"| Downstream

    Topic --> E1
    Topic --> E2
    Topic --> E3

    Messaging -->|"Subscribe"| Automation
    LA_Trigger --> LA1
    LA_Trigger --> LA2
    LA_Trigger --> LA3

    Security -.->|"Managed Identity"| AuthAPI
    Security -.->|"Managed Identity"| Gateway

    style Users fill:#f0f9ff,stroke:#0ea5e9,color:#0c4a6e
    style Azure fill:#eff6ff,stroke:#3b82f6,color:#1e3a5f
    style Gateway fill:#dbeafe,stroke:#60a5fa,color:#1e40af
    style Compute fill:#fef3c7,stroke:#f59e0b,color:#78350f
    style Cache fill:#fff7ed,stroke:#f97316,color:#7c2d12
    style Messaging fill:#dcfce7,stroke:#22c55e,color:#14532d
    style Automation fill:#faf5ff,stroke:#a855f7,color:#4c1d95
    style Security fill:#f3e8ff,stroke:#c084fc,color:#6b21a8
    style Downstream fill:#f5f5f5,stroke:#737373,color:#404040
    style Microsoft fill:#faf5ff,stroke:#a855f7,color:#4c1d95
```

---

## 7. Ordem de Execução (Roadmap v1)

```mermaid
graph LR
    subgraph Phase1["🟢 Fase 1 — Gateway"]
        P1["APIM na frente<br/><i>Criar /auth e /api</i>"]
        P2["Policy validate-jwt<br/><i>+ CORS no APIM</i>"]
    end

    subgraph Phase2["🟡 Fase 2 — Performance"]
        P3["Redis no AuthService<br/><i>Cache tokens/JWKS</i>"]
    end

    subgraph Phase3["🔵 Fase 3 — Eventos"]
        P4["Service Bus<br/><i>1 evento real publicado</i>"]
        P5["Logic App<br/><i>1 automação executando</i>"]
    end

    subgraph Phase4["🟣 Fase 4 — Hardening"]
        P6["Key Vault + RBAC<br/><i>Managed Identity</i>"]
        P7["Private Endpoints<br/><i>VNet Integration</i>"]
        P8["Rate Limiting<br/><i>APIM + Redis</i>"]
    end

    P1 --> P2 --> P3 --> P4 --> P5 --> P6 --> P7 --> P8

    style Phase1 fill:#dcfce7,stroke:#22c55e,color:#14532d
    style Phase2 fill:#fef3c7,stroke:#f59e0b,color:#78350f
    style Phase3 fill:#dbeafe,stroke:#3b82f6,color:#1e3a5f
    style Phase4 fill:#f3e8ff,stroke:#a855f7,color:#6b21a8
```

---

## 8. Critério de Sucesso (v1 "Feito")

| ✅ Critério | Verificação |
|---|---|
| Frontend não conhece URLs diretas | Só chama APIM |
| JWT validado no gateway | APIM policy ativa |
| Cache funcionando | Hits visíveis no Redis |
| Eventos fluindo | Mensagens no Service Bus |
| Automação executando | Logic App run history |
| Segredos centralizados | Key Vault com RBAC |

---

<p align="center">
  <b>📦 Resource Group:</b> <code>rg-tftec-unified-hml</code> &nbsp;|&nbsp;
  <b>🌎 Region:</b> <code>Brazil South</code> &nbsp;|&nbsp;
  <b>🏢 Publisher:</b> <code>TFTEC</code>
</p>
