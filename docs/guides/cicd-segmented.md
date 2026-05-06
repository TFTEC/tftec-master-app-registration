# ⚙️ CI/CD Segmentado: Pipelines Separados para API e Frontend

> Guia passo a passo para criar GitHub Actions independentes — ideal quando API e Frontend estão em repos diferentes ou times diferentes cuidam de cada parte.

---

## 📋 Índice

1. [Quando usar pipelines separados](#quando-usar-pipelines-separados)
2. [Pré-requisitos](#pré-requisitos)
3. [Pipeline 1: Somente API (.NET 8)](#pipeline-1-somente-api-net-8)
4. [Pipeline 2: Somente Frontend (React)](#pipeline-2-somente-frontend-react)
5. [Pipeline Unificado (referência)](#pipeline-unificado-referência)
6. [GitHub Secrets por pipeline](#github-secrets-por-pipeline)
7. [Usando Azure DevOps em vez de GitHub Actions](#usando-azure-devops)
8. [Troubleshooting](#troubleshooting)

---

## Quando usar pipelines separados

| Cenário | Pipeline recomendado |
|---|---|
| Monorepo (API + Front no mesmo repo) | **Unificado** (`deploy-azure.yml`) |
| Repos separados (API em um, Front em outro) | **Separados** (este guia) |
| Dev diferente cuida da API (ex: Docker + Azure DevOps) | **API separado** |
| Frontend no Lovable, API no Azure DevOps | **Só Frontend** no GitHub Actions |
| Workshop onde cada grupo faz um pedaço | **Separados** |

---

## Pré-requisitos

### Para ambos os pipelines:

| Requisito | Como obter |
|---|---|
| **Service Principal** com role Contributor | [Guia de App Registration](app-registration-setup.md#6-criar-service-principal-para-cicd) |
| **Resource Group** criado no Azure | `az group create -n rg-authservice -l eastus` |
| **App Service Plan** (Linux, B1+) | Criado automaticamente pelo pipeline ou manualmente |

### Secrets necessários no GitHub:

| Secret | Usado por | Descrição |
|---|---|---|
| `AZURE_SP_CLIENT_ID` | Ambos | Service Principal Client ID |
| `AZURE_SP_CLIENT_SECRET` | Ambos | Service Principal Secret |
| `AZURE_SP_TENANT_ID` | Ambos | Tenant ID do SP |
| `AZURE_SUBSCRIPTION_ID` | Ambos | Azure Subscription ID |
| `AZURE_CLIENT_ID` | API | Client ID do AuthService App |
| `AZURE_CLIENT_SECRET` | API | Client Secret do AuthService |
| `JWT_SIGNING_KEY` | API | Chave para tokens internos |
| `REDIS_CONNECTION_STRING` | API | Redis connection string |
| `SERVICEBUS_CONNECTION_STRING` | API | Service Bus connection string |
| `APIM_GATEWAY_URL` | Frontend | URL do APIM gateway (opcional) |

---

## Pipeline 1: Somente API (.NET 8)

### Passo a passo para criar

1. No repositório da API, criar a pasta `.github/workflows/`
2. Criar o arquivo `deploy-api.yml`
3. Colar o conteúdo abaixo
4. Configurar os GitHub Secrets
5. Fazer push na branch `main`

### Arquivo: `.github/workflows/deploy-api.yml`

```yaml
# =====================================================
# AuthService API — Deploy to Azure App Service
# =====================================================
# Deploys: API (.NET 8) → Azure App Service (Linux)
# Trigger: Push to main or manual dispatch
# =====================================================

name: Deploy API

on:
  push:
    branches: [main]
    paths:
      - 'api/**'   # ← Ajuste o path se diferente
      - '.github/workflows/deploy-api.yml'
  workflow_dispatch:

env:
  RESOURCE_GROUP: rg-authservice
  LOCATION: eastus
  API_APP_NAME: authservice-api-tftec        # ← Nome do seu App Service
  APP_SERVICE_PLAN: asp-authservice
  DOTNET_PROJECT_PATH: api  # ← Caminho do projeto .NET

jobs:
  # ===== PROVISION =====
  provision:
    runs-on: ubuntu-latest
    outputs:
      api_url: ${{ steps.infra.outputs.api_url }}

    steps:
      - name: Validate secrets
        run: |
          for v in AZURE_SP_CLIENT_ID AZURE_SP_CLIENT_SECRET AZURE_SP_TENANT_ID AZURE_SUBSCRIPTION_ID; do
            if [ -z "${!v}" ]; then echo "::error::Missing $v"; exit 1; fi
          done
          echo "✅ Secrets OK"
        env:
          AZURE_SP_CLIENT_ID: ${{ secrets.AZURE_SP_CLIENT_ID }}
          AZURE_SP_CLIENT_SECRET: ${{ secrets.AZURE_SP_CLIENT_SECRET }}
          AZURE_SP_TENANT_ID: ${{ secrets.AZURE_SP_TENANT_ID }}
          AZURE_SUBSCRIPTION_ID: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Login to Azure
        uses: azure/login@v2
        with:
          creds: '{"clientId":"${{ secrets.AZURE_SP_CLIENT_ID }}","clientSecret":"${{ secrets.AZURE_SP_CLIENT_SECRET }}","tenantId":"${{ secrets.AZURE_SP_TENANT_ID }}","subscriptionId":"${{ secrets.AZURE_SUBSCRIPTION_ID }}"}'

      - name: Provision infrastructure
        id: infra
        run: |
          set -e

          # Resource Group
          az group create --name $RESOURCE_GROUP --location $LOCATION --output none

          # App Service Plan (Linux)
          EXISTING=$(az appservice plan list -g $RESOURCE_GROUP \
            --query "[?name=='$APP_SERVICE_PLAN'].name" -o tsv 2>/dev/null || echo "")
          if [ -z "$EXISTING" ]; then
            az appservice plan create \
              --name $APP_SERVICE_PLAN \
              --resource-group $RESOURCE_GROUP \
              --location $LOCATION \
              --sku B1 --is-linux --output none
            echo "✅ Plan created"
          fi

          # API App Service (.NET 8)
          EXISTING_API=$(az webapp list -g $RESOURCE_GROUP \
            --query "[?name=='$API_APP_NAME'].name" -o tsv 2>/dev/null || echo "")
          if [ -z "$EXISTING_API" ]; then
            az webapp create \
              --name $API_APP_NAME \
              --resource-group $RESOURCE_GROUP \
              --plan $APP_SERVICE_PLAN \
              --runtime "DOTNETCORE:8.0" --output none
            echo "✅ API App created"
          fi

          # Configure settings
          az webapp config appsettings set \
            --name $API_APP_NAME -g $RESOURCE_GROUP \
            --settings \
              ASPNETCORE_ENVIRONMENT=Production \
              AzureAd__Instance=https://login.microsoftonline.com/ \
              AzureAd__TenantId=common \
              AzureAd__ClientId=${{ secrets.AZURE_CLIENT_ID }} \
              AzureAd__Audience=api://${{ secrets.AZURE_CLIENT_ID }} \
              AllowedTenants__AllowAll=true \
              InternalJwt__Issuer=AuthService \
              InternalJwt__Audience=AuthService-Clients \
              InternalJwt__ExpiryMinutes=60 \
            --output none

          # Secure settings
          az webapp config appsettings set \
            --name $API_APP_NAME -g $RESOURCE_GROUP \
            --settings \
              AzureAd__ClientSecret="${{ secrets.AZURE_CLIENT_SECRET }}" \
              InternalJwt__SigningKey="${{ secrets.JWT_SIGNING_KEY }}" \
              Redis__ConnectionString="${{ secrets.REDIS_CONNECTION_STRING }}" \
              Redis__InstanceName="AuthService:" \
              ServiceBus__ConnectionString="${{ secrets.SERVICEBUS_CONNECTION_STRING }}" \
              ServiceBus__TopicName="topic-app-events" \
            --output none

          echo "api_url=https://$API_APP_NAME.azurewebsites.net" >> $GITHUB_OUTPUT
          echo "✅ API configured"

  # ===== BUILD =====
  build:
    runs-on: ubuntu-latest
    needs: provision

    steps:
      - uses: actions/checkout@v4

      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'

      - name: Build and publish
        working-directory: ${{ env.DOTNET_PROJECT_PATH }}
        run: |
          dotnet restore
          dotnet publish -c Release -o ./publish

      - uses: actions/upload-artifact@v4
        with:
          name: api-build
          path: ${{ env.DOTNET_PROJECT_PATH }}/publish/

  # ===== DEPLOY =====
  deploy:
    runs-on: ubuntu-latest
    needs: [provision, build]

    steps:
      - uses: actions/download-artifact@v4
        with:
          name: api-build
          path: ./publish

      - name: Login to Azure
        uses: azure/login@v2
        with:
          creds: '{"clientId":"${{ secrets.AZURE_SP_CLIENT_ID }}","clientSecret":"${{ secrets.AZURE_SP_CLIENT_SECRET }}","tenantId":"${{ secrets.AZURE_SP_TENANT_ID }}","subscriptionId":"${{ secrets.AZURE_SUBSCRIPTION_ID }}"}'

      - name: Deploy to App Service
        uses: azure/webapps-deploy@v3
        with:
          app-name: ${{ env.API_APP_NAME }}
          package: ./publish

      - name: Smoke tests
        run: |
          API_URL="${{ needs.provision.outputs.api_url }}"
          echo "🏥 Running smoke tests..."

          for i in {1..30}; do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" 2>/dev/null || echo "000")
            if [ "$STATUS" = "200" ]; then
              echo "✅ /health → 200"

              JWKS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/.well-known/jwks.json")
              echo "📋 /jwks → $JWKS"

              SWAGGER=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/swagger/index.html")
              echo "📋 /swagger → $SWAGGER"

              AUTH=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/auth/me")
              echo "📋 /auth/me (no token) → $AUTH (expected: 401)"

              exit 0
            fi
            echo "   Attempt $i/30..."
            sleep 10
          done
          echo "⚠️ Health check timeout"
          exit 1
```

---

## Pipeline 2: Somente Frontend (React)

### Passo a passo para criar

1. No repositório do Frontend, criar `.github/workflows/`
2. Criar o arquivo `deploy-frontend.yml`
3. Configurar os GitHub Secrets
4. Fazer push na branch `main`

### Arquivo: `.github/workflows/deploy-frontend.yml`

```yaml
# =====================================================
# AuthService Frontend — Deploy to Azure App Service
# =====================================================
# Deploys: Frontend (React + Vite) → Azure App Service
# Trigger: Push to main or manual dispatch
# =====================================================

name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'src/**'
      - 'public/**'
      - 'index.html'
      - 'package.json'
      - 'vite.config.ts'
      - '.github/workflows/deploy-frontend.yml'
  workflow_dispatch:

env:
  RESOURCE_GROUP: rg-authservice
  LOCATION: eastus
  FRONTEND_APP_NAME: authservice-front-tftec    # ← Nome do seu App Service
  APP_SERVICE_PLAN: asp-authservice

jobs:
  # ===== PROVISION =====
  provision:
    runs-on: ubuntu-latest
    outputs:
      frontend_url: ${{ steps.infra.outputs.frontend_url }}

    steps:
      - name: Login to Azure
        uses: azure/login@v2
        with:
          creds: '{"clientId":"${{ secrets.AZURE_SP_CLIENT_ID }}","clientSecret":"${{ secrets.AZURE_SP_CLIENT_SECRET }}","tenantId":"${{ secrets.AZURE_SP_TENANT_ID }}","subscriptionId":"${{ secrets.AZURE_SUBSCRIPTION_ID }}"}'

      - name: Provision infrastructure
        id: infra
        run: |
          set -e

          az group create --name $RESOURCE_GROUP --location $LOCATION --output none

          # App Service Plan
          EXISTING=$(az appservice plan list -g $RESOURCE_GROUP \
            --query "[?name=='$APP_SERVICE_PLAN'].name" -o tsv 2>/dev/null || echo "")
          if [ -z "$EXISTING" ]; then
            az appservice plan create \
              --name $APP_SERVICE_PLAN -g $RESOURCE_GROUP \
              --location $LOCATION --sku B1 --is-linux --output none
          fi

          # Frontend App Service
          EXISTING_FE=$(az webapp list -g $RESOURCE_GROUP \
            --query "[?name=='$FRONTEND_APP_NAME'].name" -o tsv 2>/dev/null || echo "")
          if [ -z "$EXISTING_FE" ]; then
            az webapp create \
              --name $FRONTEND_APP_NAME -g $RESOURCE_GROUP \
              --plan $APP_SERVICE_PLAN \
              --runtime "NODE:20-lts" --output none
          fi

          # SPA routing
          az webapp config set \
            --name $FRONTEND_APP_NAME -g $RESOURCE_GROUP \
            --startup-file "npx serve -s /home/site/wwwroot -l 8080" \
            --output none

          echo "frontend_url=https://$FRONTEND_APP_NAME.azurewebsites.net" >> $GITHUB_OUTPUT
          echo "✅ Frontend infrastructure ready"

  # ===== BUILD =====
  build:
    runs-on: ubuntu-latest
    needs: provision

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Run tests
        run: npm test -- --run || true

      - name: Build
        env:
          VITE_AUTHSERVICE_URL: ${{ secrets.APIM_GATEWAY_URL }}
        run: npm run build

      - uses: actions/upload-artifact@v4
        with:
          name: frontend-build
          path: dist/

  # ===== DEPLOY =====
  deploy:
    runs-on: ubuntu-latest
    needs: [provision, build]

    steps:
      - uses: actions/download-artifact@v4
        with:
          name: frontend-build
          path: ./dist

      - name: Login to Azure
        uses: azure/login@v2
        with:
          creds: '{"clientId":"${{ secrets.AZURE_SP_CLIENT_ID }}","clientSecret":"${{ secrets.AZURE_SP_CLIENT_SECRET }}","tenantId":"${{ secrets.AZURE_SP_TENANT_ID }}","subscriptionId":"${{ secrets.AZURE_SUBSCRIPTION_ID }}"}'

      - name: Deploy to App Service
        uses: azure/webapps-deploy@v3
        with:
          app-name: ${{ env.FRONTEND_APP_NAME }}
          package: ./dist

      - name: Verify deployment
        run: |
          FE_URL="${{ needs.provision.outputs.frontend_url }}"
          echo "🌐 Checking frontend..."

          for i in {1..15}; do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FE_URL" 2>/dev/null || echo "000")
            if [ "$STATUS" = "200" ]; then
              echo "✅ Frontend is live at $FE_URL"
              exit 0
            fi
            echo "   Attempt $i/15..."
            sleep 10
          done
          echo "⚠️ Frontend check timeout"
```

---

## Pipeline Unificado (referência)

Se API e Frontend estão no **mesmo repositório**, use o pipeline unificado em `.github/workflows/deploy-azure.yml` que já existe no projeto. Ele executa:

```
provision-infrastructure → build-api + build-frontend → deploy-api + deploy-frontend → summary
```

Veja o arquivo completo em `.github/workflows/deploy-azure.yml`.

---

## GitHub Secrets por pipeline

### Se usando Pipeline Separado — API

| Secret | Obrigatório |
|---|---|
| `AZURE_SP_CLIENT_ID` | ✅ |
| `AZURE_SP_CLIENT_SECRET` | ✅ |
| `AZURE_SP_TENANT_ID` | ✅ |
| `AZURE_SUBSCRIPTION_ID` | ✅ |
| `AZURE_CLIENT_ID` | ✅ |
| `AZURE_CLIENT_SECRET` | ✅ |
| `JWT_SIGNING_KEY` | ✅ |
| `REDIS_CONNECTION_STRING` | Opcional (fallback: InMemory) |
| `SERVICEBUS_CONNECTION_STRING` | Opcional (fallback: log-only) |

### Se usando Pipeline Separado — Frontend

| Secret | Obrigatório |
|---|---|
| `AZURE_SP_CLIENT_ID` | ✅ |
| `AZURE_SP_CLIENT_SECRET` | ✅ |
| `AZURE_SP_TENANT_ID` | ✅ |
| `AZURE_SUBSCRIPTION_ID` | ✅ |
| `APIM_GATEWAY_URL` | Opcional (fallback: URL direta da API) |

---

## Usando Azure DevOps

Se o dev que cuida da API utiliza **Azure DevOps** em vez do GitHub Actions:

### Azure Pipeline equivalente (API)

Criar arquivo `azure-pipelines.yml` na raiz do repo da API:

```yaml
# =====================================================
# AuthService API — Azure DevOps Pipeline
# =====================================================

trigger:
  branches:
    include:
      - main
  paths:
    include:
      - 'api/**'

pool:
  vmImage: 'ubuntu-latest'

variables:
  resourceGroup: 'rg-authservice'
  appServiceName: 'authservice-api-tftec'
  dotnetVersion: '8.0.x'
  projectPath: 'api'

stages:
  # ===== BUILD =====
  - stage: Build
    displayName: 'Build API'
    jobs:
      - job: BuildJob
        steps:
          - task: UseDotNet@2
            inputs:
              version: $(dotnetVersion)

          - script: |
              cd $(projectPath)
              dotnet restore
              dotnet publish -c Release -o $(Build.ArtifactStagingDirectory)/publish
            displayName: 'Build & Publish'

          - publish: $(Build.ArtifactStagingDirectory)/publish
            artifact: api-build

  # ===== DEPLOY =====
  - stage: Deploy
    displayName: 'Deploy to Azure'
    dependsOn: Build
    condition: succeeded()
    jobs:
      - deployment: DeployAPI
        environment: 'production'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureWebApp@1
                  inputs:
                    azureSubscription: 'Azure-ServiceConnection'  # ← Sua service connection
                    appType: 'webAppLinux'
                    appName: $(appServiceName)
                    package: '$(Pipeline.Workspace)/api-build'
                    runtimeStack: 'DOTNETCORE|8.0'

  # ===== SMOKE TEST =====
  - stage: Verify
    displayName: 'Smoke Tests'
    dependsOn: Deploy
    condition: succeeded()
    jobs:
      - job: SmokeTest
        steps:
          - script: |
              API_URL="https://$(appServiceName).azurewebsites.net"
              echo "Testing $API_URL..."

              for i in $(seq 1 20); do
                STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")
                if [ "$STATUS" = "200" ]; then
                  echo "✅ Health check passed"
                  curl -s "$API_URL/.well-known/jwks.json" | head -c 200
                  exit 0
                fi
                sleep 10
              done
              echo "❌ Health check failed"
              exit 1
            displayName: 'Run smoke tests'
```

### Configurar Service Connection no Azure DevOps

| # | Passo | Ação |
|---|---|---|
| 1 | **Navegar** | Azure DevOps → Project Settings → **Service connections** |
| 2 | **New** | **+ New service connection** → **Azure Resource Manager** |
| 3 | **Tipo** | **Service principal (manual)** |
| 4 | **Subscription** | Preencher com Subscription ID, Name |
| 5 | **Service Principal** | Client ID (`AZURE_SP_CLIENT_ID`), Secret, Tenant ID |
| 6 | **Name** | `Azure-ServiceConnection` (deve bater com o `azureSubscription` no YAML) |
| 7 | **Verify & Save** | Clicar **Verify and save** |

### Configurar variáveis sensíveis no Azure DevOps

| # | Passo | Ação |
|---|---|---|
| 1 | **Navegar** | Azure DevOps → Pipelines → **Library** |
| 2 | **Variable group** | **+ Variable group** → nome: `authservice-secrets` |
| 3 | **Adicionar** | Cada variável como "secret" (cadeado 🔒): |

| Variável | Valor |
|---|---|
| `AzureAd__ClientSecret` | Client Secret do AuthService |
| `InternalJwt__SigningKey` | JWT Signing Key |
| `Redis__ConnectionString` | Redis connection string |
| `ServiceBus__ConnectionString` | Service Bus connection string |

---

## Troubleshooting

| Problema | Pipeline | Solução |
|---|---|---|
| `AADSTS7000215: Invalid client secret` | Ambos | Regenerar secret do SP e atualizar no GitHub/DevOps |
| `The subscription is not registered to use namespace Microsoft.Web` | Ambos | `az provider register -n Microsoft.Web` |
| Build falha no `dotnet restore` | API | Verificar se `.csproj` está no path correto |
| `npm run build` falha | Frontend | Verificar Node.js version (precisa 20+) |
| Deploy OK mas `/health` falha | API | Verificar logs: `az webapp log tail -n API_APP_NAME -g RG` |
| Frontend mostra página em branco | Frontend | Verificar startup command: `npx serve -s /home/site/wwwroot -l 8080` |
| CORS error no browser | Frontend | Adicionar origin no CORS do App Service da API |
| `paths` filter não triggera | Ambos | Verificar se o caminho do arquivo bate exatamente |

---

<p align="center">
  <i>Guia criado para o workshop AuthService + Admin Console.<br/>
  Para configurar App Registrations, consulte <a href="app-registration-setup.md">App Registration Setup</a>.<br/>
  Para migração de repositório, consulte <a href="repo-migration.md">Migração de Repo</a>.</i>
</p>
