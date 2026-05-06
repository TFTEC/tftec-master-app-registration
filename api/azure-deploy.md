# Deploy AuthService no Azure

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Azure Cloud                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────────────┐         ┌──────────────────────────────┐     │
│   │  Static Web App  │         │   Azure Container Instance   │     │
│   │   (Frontend)     │ ──────► │      (AuthService API)       │     │
│   │                  │         │                              │     │
│   │  React Dashboard │         │  .NET 8 / Docker             │     │
│   └──────────────────┘         └──────────────────────────────┘     │
│                                           │                          │
│                                           ▼                          │
│                                ┌──────────────────┐                  │
│                                │  Microsoft Entra │                  │
│                                │       ID         │                  │
│                                └──────────────────┘                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Pré-requisitos

- Azure CLI instalado (`az --version`)
- Docker instalado
- Conta Azure com subscription ativa
- App Registration configurado no Entra ID

## 1. Login no Azure

```bash
# Login
az login

# Selecionar subscription (se tiver múltiplas)
az account list --output table
az account set --subscription "SUBSCRIPTION_NAME_OR_ID"
```

## 2. Criar Resource Group

```bash
# Variáveis
RESOURCE_GROUP="rg-authservice"
LOCATION="eastus"

# Criar resource group
az group create --name $RESOURCE_GROUP --location $LOCATION
```

## 3. Deploy do Backend (Azure Container Instance)

### 3.1 Criar Azure Container Registry (ACR)

```bash
ACR_NAME="acrauthservice$(openssl rand -hex 4)"

# Criar ACR
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --admin-enabled true

# Obter credenciais
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query loginServer -o tsv)
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)

echo "ACR Login Server: $ACR_LOGIN_SERVER"
echo "ACR Username: $ACR_USERNAME"
```

### 3.2 Build e Push da Imagem

```bash
# Navegar para pasta do projeto
cd api

# Login no ACR
az acr login --name $ACR_NAME

# Build e push
docker build -t $ACR_LOGIN_SERVER/authservice:v1 .
docker push $ACR_LOGIN_SERVER/authservice:v1
```

### 3.3 Criar Container Instance

```bash
# Variáveis de configuração (SUBSTITUA pelos seus valores!)
AZURE_CLIENT_ID="seu-client-id"
AZURE_CLIENT_SECRET="seu-client-secret"
JWT_SIGNING_KEY=$(openssl rand -base64 32)

# Criar container instance
az container create \
  --resource-group $RESOURCE_GROUP \
  --name authservice-api \
  --image $ACR_LOGIN_SERVER/authservice:v1 \
  --registry-login-server $ACR_LOGIN_SERVER \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --cpu 1 \
  --memory 1.5 \
  --ports 8080 \
  --dns-name-label authservice-api-$(openssl rand -hex 4) \
  --environment-variables \
    ASPNETCORE_ENVIRONMENT=Production \
    ASPNETCORE_URLS=http://+:8080 \
    AzureAd__Instance=https://login.microsoftonline.com/ \
    AzureAd__TenantId=common \
    AzureAd__ClientId=$AZURE_CLIENT_ID \
    AzureAd__Audience=api://$AZURE_CLIENT_ID \
    AllowedTenants__AllowAll=true \
    InternalJwt__Issuer=AuthService \
    InternalJwt__Audience=AuthService-Clients \
    InternalJwt__ExpiryMinutes=60 \
  --secure-environment-variables \
    AzureAd__ClientSecret=$AZURE_CLIENT_SECRET \
    InternalJwt__SigningKey=$JWT_SIGNING_KEY

# Obter URL da API
API_FQDN=$(az container show \
  --resource-group $RESOURCE_GROUP \
  --name authservice-api \
  --query ipAddress.fqdn -o tsv)

echo "API URL: http://$API_FQDN:8080"
```

### 3.4 Verificar Deploy

```bash
# Health check
curl http://$API_FQDN:8080/health

# Logs
az container logs --resource-group $RESOURCE_GROUP --name authservice-api
```

## 4. Deploy do Frontend (Azure Static Web Apps)

### 4.1 Build do Frontend

```bash
# Voltar para raiz do projeto
cd ../..

# Build
npm run build
```

### 4.2 Criar Static Web App via CLI

```bash
SWA_NAME="swa-authservice-dashboard"

# Criar Static Web App
az staticwebapp create \
  --name $SWA_NAME \
  --resource-group $RESOURCE_GROUP \
  --location "eastus2" \
  --sku Free

# Obter deployment token
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
  --name $SWA_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "properties.apiKey" -o tsv)
```

### 4.3 Deploy com SWA CLI

```bash
# Instalar SWA CLI (se não tiver)
npm install -g @azure/static-web-apps-cli

# Deploy
swa deploy ./dist \
  --deployment-token $DEPLOYMENT_TOKEN \
  --env production
```

### 4.4 Obter URL do Frontend

```bash
FRONTEND_URL=$(az staticwebapp show \
  --name $SWA_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "defaultHostname" -o tsv)

echo "Frontend URL: https://$FRONTEND_URL"
```

## 5. Configurar CORS na API

Após deploy, atualize a API para aceitar requisições do frontend:

```bash
# Recriar container com CORS (adicione a variável AllowedOrigins)
az container create \
  --resource-group $RESOURCE_GROUP \
  --name authservice-api \
  # ... mesmos parâmetros anteriores ...
  --environment-variables \
    # ... outras variáveis ...
    AllowedOrigins=https://$FRONTEND_URL
```

## 6. Script Completo de Deploy

Crie um arquivo `deploy.sh`:

```bash
#!/bin/bash
set -e

# ===== CONFIGURAÇÃO =====
RESOURCE_GROUP="rg-authservice"
LOCATION="eastus"
AZURE_CLIENT_ID="SEU_CLIENT_ID"
AZURE_CLIENT_SECRET="SEU_CLIENT_SECRET"

# ===== DEPLOY =====
echo "🚀 Iniciando deploy..."

# Resource Group
az group create --name $RESOURCE_GROUP --location $LOCATION

# ACR
ACR_NAME="acrauthservice$(date +%s | tail -c 5)"
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --admin-enabled true
az acr login --name $ACR_NAME

ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query loginServer -o tsv)
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)

# Build & Push
cd api
docker build -t $ACR_LOGIN_SERVER/authservice:v1 .
docker push $ACR_LOGIN_SERVER/authservice:v1
cd ../..

# Container Instance
JWT_SIGNING_KEY=$(openssl rand -base64 32)
az container create \
  --resource-group $RESOURCE_GROUP \
  --name authservice-api \
  --image $ACR_LOGIN_SERVER/authservice:v1 \
  --registry-login-server $ACR_LOGIN_SERVER \
  --registry-username $ACR_USERNAME \
  --registry-password "$ACR_PASSWORD" \
  --cpu 1 --memory 1.5 --ports 8080 \
  --dns-name-label authservice-api-$(date +%s | tail -c 6) \
  --environment-variables \
    ASPNETCORE_ENVIRONMENT=Production \
    ASPNETCORE_URLS=http://+:8080 \
    AzureAd__Instance=https://login.microsoftonline.com/ \
    AzureAd__TenantId=common \
    AzureAd__ClientId=$AZURE_CLIENT_ID \
    AzureAd__Audience=api://$AZURE_CLIENT_ID \
    AllowedTenants__AllowAll=true \
    InternalJwt__Issuer=AuthService \
    InternalJwt__Audience=AuthService-Clients \
    InternalJwt__ExpiryMinutes=60 \
  --secure-environment-variables \
    AzureAd__ClientSecret="$AZURE_CLIENT_SECRET" \
    InternalJwt__SigningKey="$JWT_SIGNING_KEY"

# Static Web App
npm run build
SWA_NAME="swa-authservice-dashboard"
az staticwebapp create --name $SWA_NAME --resource-group $RESOURCE_GROUP --location "eastus2" --sku Free

DEPLOYMENT_TOKEN=$(az staticwebapp secrets list --name $SWA_NAME --resource-group $RESOURCE_GROUP --query "properties.apiKey" -o tsv)
npx @azure/static-web-apps-cli deploy ./dist --deployment-token $DEPLOYMENT_TOKEN --env production

# URLs
API_FQDN=$(az container show --resource-group $RESOURCE_GROUP --name authservice-api --query ipAddress.fqdn -o tsv)
FRONTEND_URL=$(az staticwebapp show --name $SWA_NAME --resource-group $RESOURCE_GROUP --query "defaultHostname" -o tsv)

echo ""
echo "✅ Deploy concluído!"
echo "📡 API URL: http://$API_FQDN:8080"
echo "🌐 Frontend URL: https://$FRONTEND_URL"
echo "🔑 JWT Signing Key: $JWT_SIGNING_KEY"
```

## 7. Custos Estimados

| Recurso | SKU | Custo Mensal (estimado) |
|---------|-----|------------------------|
| Container Instance | 1 vCPU, 1.5GB | ~$30-40 |
| Container Registry | Basic | ~$5 |
| Static Web App | Free | $0 |
| **Total** | | **~$35-45/mês** |

## 8. Alternativas

### Para Produção Escalável

Considere **Azure Container Apps** ao invés de Container Instance:

```bash
# Criar Container Apps Environment
az containerapp env create \
  --name authservice-env \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

# Criar Container App
az containerapp create \
  --name authservice-api \
  --resource-group $RESOURCE_GROUP \
  --environment authservice-env \
  --image $ACR_LOGIN_SERVER/authservice:v1 \
  --target-port 8080 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 10 \
  --cpu 0.5 \
  --memory 1.0Gi
```

**Vantagens:**
- Auto-scaling
- HTTPS automático
- Melhor para produção
- Custo similar para cargas baixas

## 9. Cleanup

```bash
# Remover tudo
az group delete --name $RESOURCE_GROUP --yes --no-wait
```
