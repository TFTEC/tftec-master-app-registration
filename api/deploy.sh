#!/bin/bash
set -e

# =====================================================
# AuthService Azure Deploy Script
# =====================================================
# Este script faz deploy completo:
# - Backend: Azure Container Instance
# - Frontend: Azure Static Web Apps
# =====================================================

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════╗"
echo "║           AuthService Azure Deploy Script             ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ===== CONFIGURAÇÃO (EDITE AQUI!) =====
RESOURCE_GROUP="${RESOURCE_GROUP:-rg-authservice}"
LOCATION="${LOCATION:-eastus}"
AZURE_CLIENT_ID="${AZURE_CLIENT_ID:-}"
AZURE_CLIENT_SECRET="${AZURE_CLIENT_SECRET:-}"

# Validar variáveis obrigatórias
if [ -z "$AZURE_CLIENT_ID" ] || [ -z "$AZURE_CLIENT_SECRET" ]; then
    echo -e "${RED}❌ Erro: AZURE_CLIENT_ID e AZURE_CLIENT_SECRET são obrigatórios${NC}"
    echo ""
    echo "Uso:"
    echo "  export AZURE_CLIENT_ID='seu-client-id'"
    echo "  export AZURE_CLIENT_SECRET='seu-client-secret'"
    echo "  ./deploy.sh"
    exit 1
fi

# Verificar Azure CLI
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI não encontrado. Instale: https://docs.microsoft.com/cli/azure/install-azure-cli${NC}"
    exit 1
fi

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker não encontrado. Instale: https://docs.docker.com/get-docker/${NC}"
    exit 1
fi

# Verificar login Azure
echo -e "${YELLOW}🔐 Verificando login no Azure...${NC}"
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}📝 Fazendo login no Azure...${NC}"
    az login
fi

SUBSCRIPTION=$(az account show --query name -o tsv)
echo -e "${GREEN}✓ Logado na subscription: $SUBSCRIPTION${NC}"

# ===== RESOURCE GROUP =====
echo -e "\n${BLUE}📦 Criando Resource Group...${NC}"
az group create --name $RESOURCE_GROUP --location $LOCATION --output none
echo -e "${GREEN}✓ Resource Group: $RESOURCE_GROUP${NC}"

# ===== AZURE CONTAINER REGISTRY =====
echo -e "\n${BLUE}🐳 Criando Azure Container Registry...${NC}"
RANDOM_SUFFIX=$(date +%s | tail -c 5)
ACR_NAME="acrauthsvc${RANDOM_SUFFIX}"

az acr create \
    --resource-group $RESOURCE_GROUP \
    --name $ACR_NAME \
    --sku Basic \
    --admin-enabled true \
    --output none

ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query loginServer -o tsv)
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)

echo -e "${GREEN}✓ ACR criado: $ACR_LOGIN_SERVER${NC}"

# ===== BUILD & PUSH DOCKER IMAGE =====
echo -e "\n${BLUE}🔨 Fazendo build da imagem Docker...${NC}"

# Navegar para pasta do projeto .NET
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Login no ACR
az acr login --name $ACR_NAME

# Build e push
docker build -t $ACR_LOGIN_SERVER/authservice:v1 .
echo -e "${GREEN}✓ Build concluído${NC}"

echo -e "\n${BLUE}📤 Fazendo push para ACR...${NC}"
docker push $ACR_LOGIN_SERVER/authservice:v1
echo -e "${GREEN}✓ Push concluído${NC}"

# ===== AZURE CONTAINER INSTANCE =====
echo -e "\n${BLUE}🚀 Criando Azure Container Instance...${NC}"

# Gerar JWT signing key
JWT_SIGNING_KEY=$(openssl rand -base64 32)
DNS_LABEL="authservice-api-${RANDOM_SUFFIX}"

az container create \
    --resource-group $RESOURCE_GROUP \
    --name authservice-api \
    --image $ACR_LOGIN_SERVER/authservice:v1 \
    --registry-login-server $ACR_LOGIN_SERVER \
    --registry-username $ACR_USERNAME \
    --registry-password "$ACR_PASSWORD" \
    --cpu 1 \
    --memory 1.5 \
    --ports 8080 \
    --dns-name-label $DNS_LABEL \
    --restart-policy Always \
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
        InternalJwt__SigningKey="$JWT_SIGNING_KEY" \
    --output none

API_FQDN=$(az container show \
    --resource-group $RESOURCE_GROUP \
    --name authservice-api \
    --query ipAddress.fqdn -o tsv)

echo -e "${GREEN}✓ Container Instance criado: http://$API_FQDN:8080${NC}"

# ===== HEALTH CHECK =====
echo -e "\n${BLUE}🏥 Aguardando API ficar healthy...${NC}"
for i in {1..30}; do
    if curl -s -o /dev/null -w "%{http_code}" "http://$API_FQDN:8080/health" | grep -q "200"; then
        echo -e "${GREEN}✓ API está healthy!${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# ===== STATIC WEB APP (Frontend) =====
echo -e "\n${BLUE}🌐 Criando Azure Static Web App...${NC}"

# Voltar para raiz do projeto
cd "$SCRIPT_DIR/../.."

# Build do frontend
echo -e "${YELLOW}📦 Fazendo build do frontend...${NC}"
npm run build

SWA_NAME="swa-authsvc-${RANDOM_SUFFIX}"

az staticwebapp create \
    --name $SWA_NAME \
    --resource-group $RESOURCE_GROUP \
    --location "eastus2" \
    --sku Free \
    --output none

DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
    --name $SWA_NAME \
    --resource-group $RESOURCE_GROUP \
    --query "properties.apiKey" -o tsv)

echo -e "${GREEN}✓ Static Web App criado${NC}"

# Deploy com SWA CLI
echo -e "\n${BLUE}📤 Fazendo deploy do frontend...${NC}"
npx @azure/static-web-apps-cli deploy ./dist \
    --deployment-token $DEPLOYMENT_TOKEN \
    --env production

FRONTEND_URL=$(az staticwebapp show \
    --name $SWA_NAME \
    --resource-group $RESOURCE_GROUP \
    --query "defaultHostname" -o tsv)

echo -e "${GREEN}✓ Frontend deployed!${NC}"

# ===== RESULTADO FINAL =====
echo -e "\n${GREEN}"
echo "╔═══════════════════════════════════════════════════════╗"
echo "║              ✅ DEPLOY CONCLUÍDO!                     ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${BLUE}📡 Backend (API):${NC}"
echo "   URL: http://$API_FQDN:8080"
echo "   Health: http://$API_FQDN:8080/health"
echo "   Swagger: http://$API_FQDN:8080/swagger"
echo ""
echo -e "${BLUE}🌐 Frontend (Dashboard):${NC}"
echo "   URL: https://$FRONTEND_URL"
echo ""
echo -e "${BLUE}🔑 Credenciais geradas:${NC}"
echo "   JWT Signing Key: $JWT_SIGNING_KEY"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "   1. Atualize o App Registration no Entra ID:"
echo "      - Adicione https://$FRONTEND_URL como Redirect URI"
echo "   2. Configure a URL da API no frontend"
echo "   3. Para HTTPS na API, considere usar Azure Container Apps"
echo ""
echo -e "${BLUE}📋 Recursos criados no Resource Group '$RESOURCE_GROUP':${NC}"
az resource list --resource-group $RESOURCE_GROUP --output table

# Salvar informações
cat > "$SCRIPT_DIR/deploy-info.txt" << EOF
AuthService Azure Deploy Info
=============================
Data: $(date)

Backend API:
  URL: http://$API_FQDN:8080
  Health: http://$API_FQDN:8080/health

Frontend:
  URL: https://$FRONTEND_URL

Azure Resources:
  Resource Group: $RESOURCE_GROUP
  Container Registry: $ACR_NAME
  Container Instance: authservice-api
  Static Web App: $SWA_NAME

JWT Signing Key: $JWT_SIGNING_KEY

Cleanup:
  az group delete --name $RESOURCE_GROUP --yes --no-wait
EOF

echo -e "\n${GREEN}📄 Informações salvas em: api/deploy-info.txt${NC}"
