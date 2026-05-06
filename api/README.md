# AuthService - Auth Gateway para Microsoft Entra ID

## Visão Geral

AuthService é uma API centralizada de autenticação e autorização que funciona como gateway de autenticação para aplicações internas, integrando com Microsoft Entra ID (Azure AD) multi-tenant.

## Funcionalidades

- ✅ Autenticação multi-tenant com Microsoft Entra ID
- ✅ Validação JWT segura (assinatura, audiência, emissor)
- ✅ Autorização por scopes e roles
- ✅ Dois modelos de integração: Pass-through e Token Interno
- ✅ On-Behalf-Of (OBO) para delegação de usuário
- ✅ Client Credentials para service-to-service
- ✅ Cache de tokens para performance
- ✅ Docker-ready com hardening

## Estrutura do Projeto

```
AuthService/
├── Controllers/
│   ├── AuthController.cs      # /auth/me, /auth/validate
│   └── TokenController.cs     # /auth/exchange, /auth/obo, /auth/client-token
├── Services/
│   ├── InternalTokenService.cs    # Geração de tokens internos
│   ├── OboTokenService.cs         # Fluxo On-Behalf-Of
│   ├── ClientCredentialsService.cs # Fluxo Client Credentials
│   └── TenantValidationService.cs  # Validação de tenants
├── Configuration/
│   └── ConfigModels.cs        # Modelos de configuração
├── Middleware/
│   └── SecurityMiddleware.cs  # Logging e headers de segurança
├── Models/
│   └── TokenModels.cs         # DTOs
├── Program.cs                 # Entry point
├── appsettings.json          # Configuração
├── Dockerfile                # Container
└── docker-compose.yml        # Orquestração
```

## Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/health` | Health check |
| GET | `/auth/me` | Retorna claims do usuário autenticado |
| POST | `/auth/validate` | Valida token e retorna claims (Admin only) |
| POST | `/auth/exchange` | Troca token Entra por token interno |
| POST | `/auth/obo` | On-Behalf-Of para APIs downstream |
| POST | `/auth/client-token` | Client Credentials (service-to-service) |
| GET | `/.well-known/jwks.json` | JWKS do AuthService |

## Configuração

### 1. App Registration no Azure

1. Acesse Azure Portal > Azure Active Directory > App registrations
2. Clique em "New registration"
3. Configure:
   - **Name**: AuthService
   - **Supported account types**: "Accounts in any organizational directory (Any Azure AD directory - Multitenant)"
   - **Redirect URI**: (deixe vazio para API)
4. Após criar:
   - Copie **Application (client) ID**
   - Vá em "Certificates & secrets" e crie um **Client secret**
   - Vá em "Expose an API":
     - Clique "Add a scope"
     - Application ID URI: `api://{client-id}`
     - Adicione scopes: `api.read`, `api.write`
   - Vá em "App roles":
     - Adicione roles: `Admin`, `User`

### 2. Variáveis de Ambiente

```bash
# Azure AD
AZURE_CLIENT_ID=seu-client-id
AZURE_CLIENT_SECRET=seu-client-secret

# JWT interno (gerar com: openssl rand -base64 32)
JWT_SIGNING_KEY=sua-chave-base64-min-32-bytes
```

### 3. appsettings.json

```json
{
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "common",
    "ClientId": "YOUR_CLIENT_ID",
    "Audience": "api://YOUR_CLIENT_ID"
  },
  "AllowedTenants": {
    "AllowAll": true,
    "TenantIds": ["tenant-1-guid", "tenant-2-guid"]
  }
}
```

## Modelos de Integração

### Modelo 1: Pass-through (Recomendado)

```
┌─────────┐    Token Entra    ┌─────────────┐    Token Entra    ┌─────────┐
│   SPA   │ ───────────────── │ AuthService │ ───────────────── │  API A  │
└─────────┘                   └─────────────┘                   └─────────┘
                                    │
                              Valida + Policy
```

**Quando usar**: Quando as APIs downstream podem validar tokens do Entra ID diretamente.

### Modelo 2: Token Interno

```
┌─────────┐    Token Entra    ┌─────────────┐   Token Interno   ┌─────────┐
│   SPA   │ ───────────────── │ AuthService │ ───────────────── │  API A  │
└─────────┘                   └─────────────┘                   └─────────┘
                                    │
                              Exchange + Sign
```

**Quando usar**: Quando você precisa padronizar claims ou as APIs não têm acesso ao Entra.

## Exemplos curl

### Obter informações do usuário
```bash
curl -X GET https://authservice.example.com/auth/me \
  -H "Authorization: Bearer {access_token}"
```

### Trocar token por token interno
```bash
curl -X POST https://authservice.example.com/auth/exchange \
  -H "Authorization: Bearer {entra_token}" \
  -H "Content-Type: application/json"
```

### On-Behalf-Of
```bash
curl -X POST https://authservice.example.com/auth/obo \
  -H "Authorization: Bearer {user_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "targetApi": "ApiA",
    "scopes": ["api://api-a/access_as_user"]
  }'
```

### Client Credentials
```bash
curl -X POST https://authservice.example.com/auth/client-token \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "targetApi": "ApiA"
  }'
```

## Executando

### Docker
```bash
# Build e run
docker-compose up --build

# Apenas run (se já buildou)
docker-compose up -d

# Logs
docker-compose logs -f authservice
```

### Local (desenvolvimento)
```bash
dotnet restore
dotnet run
```

## Segurança

- ✅ Tokens nunca são logados
- ✅ Validação de assinatura via JWKS
- ✅ Validação de audiência e emissor
- ✅ Whitelist de tenants (configurável)
- ✅ Headers de segurança (X-Content-Type-Options, etc.)
- ✅ Execução como non-root no Docker
- ✅ Cache de tokens com expiração

## Troubleshooting

### Token inválido
- Verifique se o `audience` no token corresponde ao configurado
- Verifique se o tenant está na whitelist (se `AllowAll: false`)

### OBO falha
- Verifique se o usuário consentiu os scopes necessários
- Verifique se a API downstream está registrada corretamente

### Cache não funciona
- O cache é em memória, reiniciar o serviço limpa o cache
- Para produção, considere Redis
