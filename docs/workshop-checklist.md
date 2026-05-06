# 🎓 Workshop Checklist — AuthService + Admin Console

> Checklist completo para validar tudo que foi implementado antes do workshop.
> Data de referência: Fevereiro 2026

---

## 📊 Status de Implementação

### ✅ AuthService API (.NET 8)

| Componente | Status | Arquivo | Observações |
|---|---|---|---|
| **Autenticação Entra ID** | ✅ Implementado | `Program.cs` | Multi-tenant, JwtBearer + Microsoft.Identity.Web |
| **GET /auth/me** | ✅ Implementado | `AuthController.cs` | Retorna claims do usuário autenticado |
| **POST /auth/validate** | ✅ Implementado | `AuthController.cs` | Debug endpoint (requer role Admin) |
| **POST /auth/exchange** | ✅ Implementado | `TokenController.cs` | Entra ID → JWT interno (Modelo 2) |
| **POST /auth/obo** | ✅ Implementado | `TokenController.cs` | On-Behalf-Of flow para APIs downstream |
| **POST /auth/client-token** | ✅ Implementado | `TokenController.cs` | Client Credentials (requer role Admin) |
| **GET /.well-known/jwks.json** | ✅ Implementado | `Program.cs` | Expõe chave pública para validação |
| **GET /health** | ✅ Implementado | `Program.cs` | Health check endpoint |
| **Swagger/OpenAPI** | ✅ Implementado | `Program.cs` | Com autenticação Bearer |
| **CORS** | ✅ Implementado | `Program.cs` | Origins do Frontend configuradas |
| **Redis Cache** | ✅ Implementado | `CacheService.cs` | Fallback para InMemory se Redis não configurado |
| **Service Bus Events** | ✅ Implementado | `EventPublisherService.cs` | Fallback para log-only se não configurado |
| **Tenant Validation** | ✅ Implementado | `TenantValidationService.cs` | AllowAll=true por padrão |
| **Security Headers** | ✅ Implementado | `SecurityMiddleware.cs` | X-Content-Type-Options, X-Frame-Options, etc. |
| **Request Logging** | ✅ Implementado | `SecurityMiddleware.cs` | Com X-Request-Id e latência |
| **Forwarded Headers** | ✅ Implementado | `Program.cs` | Para funcionamento atrás de proxy/APIM |
| **Docker** | ✅ Implementado | `Dockerfile` | Multi-stage, non-root user |
| **Docker Compose** | ✅ Implementado | `docker-compose.yml` | AuthService + Redis local |

### ✅ Frontend Admin Console (React + Vite)

| Componente | Status | Arquivo | Observações |
|---|---|---|---|
| **Login MSAL** | ✅ Implementado | `AuthContext.tsx` | Redirect flow, sessionStorage |
| **Protected Routes** | ✅ Implementado | `ProtectedRoute.tsx` | Redireciona para /login |
| **Dashboard** | ✅ Implementado | `Index.tsx` | Métricas reais via Graph API |
| **Users CRUD** | ✅ Implementado | `Users.tsx` | Create, Read, Update, Delete via Graph |
| **App Registrations** | ✅ Implementado | `AppRegistrations.tsx` | Listar + gerenciar secrets |
| **Token Validation** | ✅ Implementado | `TokenValidation.tsx` | Decode + verify tokens |
| **OBO Flow** | ✅ Implementado | `OboFlow.tsx` | Interface para testar OBO |
| **Client Credentials** | ✅ Implementado | `ClientCredentials.tsx` | Interface para testar CC flow |
| **Settings** | ✅ Implementado | `Settings.tsx` | Configuração + export ENV vars |
| **Documentation** | ✅ Implementado | `Documentation.tsx` | Docs integrados |
| **Sidebar Navigation** | ✅ Implementado | `AppSidebar.tsx` | Com ícones e agrupamento |

### ✅ Infraestrutura & CI/CD

| Componente | Status | Arquivo | Observações |
|---|---|---|---|
| **GitHub Actions** | ✅ Implementado | `deploy-azure.yml` | Provision + Build + Deploy |
| **App Service API** | ✅ Provisionado | Azure | `authservice-api-tftec` |
| **App Service Frontend** | ✅ Provisionado | Azure | `authservice-front-tftec` |
| **APIM** | ✅ Provisionado | Azure | No RG `rg-authservice` |

### ✅ Documentação

| Documento | Status | Arquivo |
|---|---|---|
| **Diagramas Mermaid** | ✅ Completo | `architecture-diagram.md` |
| **Step-by-Step Portal** | ✅ Completo | `azure-portal-step-by-step.md` |
| **Arquitetura v1** | ✅ Completo | `v1-architecture.md` |
| **README API** | ✅ Completo | `authservice-dotnet/README.md` |
| **Migração de Repositório** | ✅ Completo | `guides/repo-migration.md` |
| **App Registration Setup** | ✅ Completo | `guides/app-registration-setup.md` |
| **CI/CD Segmentado** | ✅ Completo | `guides/cicd-segmented.md` |
| **Deploy Azure (manual)** | ✅ Completo | `authservice-dotnet/azure-deploy.md` |

---

## 🔒 Padrão de Fallback Seguro

Todos os componentes opcionais seguem o mesmo padrão: **se a connection string não estiver configurada, o sistema continua funcionando com fallback**.

| Componente | Com Configuração | Sem Configuração (Fallback) |
|---|---|---|
| **Redis** | Cache distribuído no Azure Redis | Cache em memória (IDistributedMemoryCache) |
| **Service Bus** | Publica eventos no Topic | Apenas loga o evento no console |

---

## 🧪 Roteiro de Testes (Workshop)

### Teste 1: Health Check
```bash
curl https://authservice-api-tftec.azurewebsites.net/health
# Esperado: HTTP 200 → "Healthy"
```

### Teste 2: Swagger UI
```
Abrir: https://authservice-api-tftec.azurewebsites.net/swagger
# Esperado: Documentação interativa com todos os endpoints
```

### Teste 3: Endpoint sem autenticação
```bash
curl https://authservice-api-tftec.azurewebsites.net/auth/me
# Esperado: HTTP 401 Unauthorized
```

### Teste 4: Login no Frontend
```
1. Abrir: https://authservice-front-tftec.azurewebsites.net
2. Clicar "Entrar com Microsoft"
3. Autenticar com conta do tenant
4. Esperado: Redireciona para Dashboard com métricas
```

### Teste 5: Dashboard com dados reais
```
1. Após login, verificar:
   - Contador de Usuários > 0
   - Contador de Apps > 0
   - Gráfico de sign-ins (últimos 7 dias)
   - Lista de sign-ins recentes
```

### Teste 6: CRUD de Usuários
```
1. Navegar para "Users"
2. Listar usuários do tenant
3. (Opcional) Criar usuário de teste
4. (Opcional) Editar/desabilitar usuário
```

### Teste 7: Token Exchange
```
1. Navegar para "Token Validation"
2. Copiar access token
3. Enviar para /auth/me via Swagger
4. Esperado: Claims do Entra ID retornadas
```

### Teste 8: JWKS
```bash
curl https://authservice-api-tftec.azurewebsites.net/.well-known/jwks.json
# Esperado: JSON com keys[] contendo kid + alg
```

---

## 📋 Checklist Pré-Workshop

### Azure / Entra ID
- [ ] App Registration existe com Client ID `386715b6-b101-4fe4-9209-ee2e92eeca8b`
- [ ] Client Secret válido (não expirado) configurado no App Service
- [ ] Redirect URIs configuradas:
  - `https://authservice-front-tftec.azurewebsites.net`
  - `https://auth-guard-way.lovable.app`
  - `http://localhost:5173` (dev)
- [ ] Permissões do Graph API concedidas (Admin Consent):
  - `User.ReadWrite.All`
  - `Directory.ReadWrite.All`
  - `Application.ReadWrite.All`
  - `AuditLog.Read.All`

### Recursos Azure (v1)
- [ ] **Redis**: `redis-tftec-hml-001.redis.cache.windows.net` (porta 6380, SSL)
- [ ] **Service Bus**: `sb-tftec-hml-001.servicebus.windows.net`
  - [ ] Topic `topic-app-events` criado no namespace do Service Bus

### App Service — API
- [ ] App Service running (`authservice-api-tftec`)
- [ ] `/health` retorna 200
- [ ] `/swagger` carrega UI
- [ ] Variáveis de ambiente configuradas:
  - `AzureAd__ClientId`
  - `AzureAd__ClientSecret`
  - `InternalJwt__SigningKey`
  - `Redis__ConnectionString` → `redis-tftec-hml-001.redis.cache.windows.net:6380,...`
  - `ServiceBus__ConnectionString` → `Endpoint=sb://sb-tftec-hml-001.servicebus.windows.net/;...`

### App Service — Frontend
- [ ] App Service running (`authservice-front-tftec`)
- [ ] Página de login carrega
- [ ] Redirect após login funciona

### APIM (se já configurado)
- [ ] API "AuthService" publicada em `/auth`
- [ ] Policy validate-jwt configurada
- [ ] CORS permitindo o frontend
- [ ] Request sem token → 401

### GitHub Actions — Secrets
- [ ] `AZURE_SP_CLIENT_ID`
- [ ] `AZURE_SP_CLIENT_SECRET`
- [ ] `AZURE_SP_TENANT_ID`
- [ ] `AZURE_SUBSCRIPTION_ID`
- [ ] `AZURE_CLIENT_ID`
- [ ] `AZURE_CLIENT_SECRET`
- [ ] `JWT_SIGNING_KEY`
- [ ] `REDIS_CONNECTION_STRING` → `redis-tftec-hml-001.redis.cache.windows.net:6380,password=...,ssl=True,abortConnect=False`
- [ ] `SERVICEBUS_CONNECTION_STRING` → `Endpoint=sb://sb-tftec-hml-001.servicebus.windows.net/;SharedAccessKeyName=...`
- [ ] `APIM_GATEWAY_URL` (opcional, ex: `https://apim-tftec.azure-api.net`)

---

## 🗺️ Fluxos para Demonstrar no Workshop

### Fluxo 1: Autenticação Completa
```
Browser → Frontend → MSAL loginRedirect() → Entra ID → Token → Frontend → /auth/me → Claims
```

### Fluxo 2: Graph API (Dados Reais)
```
Frontend → acquireTokenSilent() → Graph API → Users/Apps/SignIns → Dashboard
```

### Fluxo 3: Token Exchange (Modelo 2)
```
Frontend → Bearer Token Entra → POST /auth/exchange → JWT Interno → JWKS Validation
```

### Fluxo 4: On-Behalf-Of
```
Frontend → Bearer Token → POST /auth/obo → MSAL OBO → Token para API Downstream
```

### Fluxo 5: Infraestrutura v1 (Visão)
```
APIM (gateway) → AuthService + Redis (cache) → Service Bus (eventos) → Logic App (automação)
```

---

## ⚠️ Troubleshooting Rápido

| Problema | Causa Provável | Solução |
|---|---|---|
| 401 no /auth/me | Token expirado ou audience errada | Verificar `AzureAd__Audience` no App Service |
| CORS error | Origin não permitida | Verificar origins no `Program.cs` e no App Service |
| Dashboard vazio | Permissões Graph faltando | Verificar Admin Consent no Entra ID |
| Login loop infinito | Redirect URI não cadastrada | Adicionar URL no App Registration |
| Redis não conecta | Connection string errada | Verificar formato `host:6380,password=...,ssl=True` |
| Swagger não carrega | App Service parado | Reiniciar o App Service |

---

<p align="center">
  <b>📦 Resource Group:</b> <code>rg-authservice</code> &nbsp;|&nbsp;
  <b>🌎 Region:</b> <code>East US</code> &nbsp;|&nbsp;
  <b>🔗 API:</b> <code>authservice-api-tftec</code> &nbsp;|&nbsp;
  <b>🖥️ Frontend:</b> <code>authservice-front-tftec</code><br>
  <b>🔴 Redis:</b> <code>redis-tftec-hml-001</code> &nbsp;|&nbsp;
  <b>📨 Service Bus:</b> <code>sb-tftec-hml-001</code>
</p>
