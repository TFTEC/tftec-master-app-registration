# 🔄 Guia de Migração de Repositório

> Como copiar o projeto atual para um novo repositório GitHub e configurar tudo do zero.

---

## 📋 Índice

1. [Cenários de uso](#cenários-de-uso)
2. [Método 1: Clone + Push (mais rápido)](#método-1-clone--push-mais-rápido)
3. [Método 2: Fork (mantém histórico linkado)](#método-2-fork-mantém-histórico-linkado)
4. [Método 3: Template Repository](#método-3-template-repository)
5. [Configurar o novo repositório](#configurar-o-novo-repositório)
6. [Adaptar configurações do projeto](#adaptar-configurações-do-projeto)
7. [Checklist pós-migração](#checklist-pós-migração)

---

## Cenários de uso

| Cenário | Método recomendado |
|---|---|
| Outro dev vai colaborar no mesmo projeto | **Clone + Push** |
| Workshop com múltiplos grupos | **Template Repository** |
| Manter referência ao projeto original | **Fork** |
| Separar API e Frontend em repos distintos | **Clone parcial** (veja seção específica) |

---

## Método 1: Clone + Push (mais rápido)

### 1.1 Clonar o repositório atual

```bash
# Clonar com todo o histórico
git clone https://github.com/SEU_USER/entra-auth-gateway.git novo-projeto

cd novo-projeto
```

### 1.2 Remover a origin antiga e apontar para o novo

```bash
# Remover referência ao repo original
git remote remove origin

# Criar o novo repositório no GitHub (via CLI ou pelo portal)
gh repo create NOVO_USER/novo-projeto --private --source=. --push

# Ou manualmente:
git remote add origin https://github.com/NOVO_USER/novo-projeto.git
git push -u origin main
```

### 1.3 (Opcional) Limpar histórico

Se quiser começar do zero sem o histórico de commits:

```bash
# Criar um commit inicial limpo
cd novo-projeto
rm -rf .git
git init
git add .
git commit -m "feat: initial commit from entra-auth-gateway template"
git remote add origin https://github.com/NOVO_USER/novo-projeto.git
git branch -M main
git push -u origin main
```

---

## Método 2: Fork (mantém histórico linkado)

### 2.1 Fazer o Fork

1. Ir para `https://github.com/SEU_USER/entra-auth-gateway`
2. Clicar **Fork** (canto superior direito)
3. Selecionar a organização/conta destino
4. Desmarcar "Copy the main branch only" se quiser todas as branches
5. Clicar **Create fork**

### 2.2 Clonar o fork

```bash
git clone https://github.com/NOVO_USER/entra-auth-gateway.git
cd entra-auth-gateway

# (Opcional) Renomear o repo depois
# Settings → General → Repository name
```

> ⚠️ **Nota**: Forks públicos herdam a visibilidade. Para tornar privado, use o Método 1.

---

## Método 3: Template Repository

### 3.1 Configurar o repo como template

1. Ir para **Settings** do repositório original
2. Marcar ☑️ **Template repository**
3. Salvar

### 3.2 Criar novo repo a partir do template

1. Na página do repo original, clicar **Use this template** → **Create a new repository**
2. Preencher nome e visibilidade
3. Clicar **Create repository**

> 💡 **Ideal para workshops**: Cada grupo cria seu próprio repo a partir do template.

---

## Configurar o novo repositório

### 4.1 GitHub Secrets (obrigatório)

Vá em **Settings → Secrets and variables → Actions** e adicione:

| Secret | Descrição | Onde obter |
|---|---|---|
| `AZURE_SP_CLIENT_ID` | Service Principal Client ID | Portal Azure → App Registrations → SP |
| `AZURE_SP_CLIENT_SECRET` | Service Principal Secret | Mesmo App Registration → Certificates & secrets |
| `AZURE_SP_TENANT_ID` | Tenant ID do Azure AD | Portal Azure → Entra ID → Overview |
| `AZURE_SUBSCRIPTION_ID` | Subscription ID | Portal Azure → Subscriptions |
| `AZURE_CLIENT_ID` | Client ID do AuthService App | App Registration do AuthService |
| `AZURE_CLIENT_SECRET` | Client Secret do AuthService | App Registration → Certificates & secrets |
| `JWT_SIGNING_KEY` | Chave para tokens internos | Gerar: `openssl rand -base64 32` |
| `REDIS_CONNECTION_STRING` | Connection string do Redis | Portal → Redis → Access keys |
| `SERVICEBUS_CONNECTION_STRING` | Connection string do Service Bus | Portal → Service Bus → Shared access policies |
| `APIM_GATEWAY_URL` | URL do APIM (opcional) | Ex: `https://apim-tftec.azure-api.net` |

### 4.2 Alterar nomes dos App Services (se necessário)

Se o novo ambiente usa nomes diferentes, edite `.github/workflows/deploy-azure.yml`:

```yaml
env:
  RESOURCE_GROUP: rg-authservice          # ← seu resource group
  LOCATION: eastus                         # ← sua região
  UNIQUE_SUFFIX: tftec                     # ← seu sufixo único
  API_APP_NAME: authservice-api-tftec      # ← nome do App Service da API
  FRONTEND_APP_NAME: authservice-front-tftec  # ← nome do App Service do frontend
  APP_SERVICE_PLAN: asp-authservice        # ← nome do App Service Plan
```

### 4.3 Atualizar configurações do Entra ID

Edite `src/config/azure.ts`:

```typescript
export const AZURE_CONFIG = {
  instance: "https://login.microsoftonline.com/",
  tenantId: "organizations",             // ou seu tenant ID específico
  clientId: "SEU_NOVO_CLIENT_ID",        // ← Client ID do App Registration
  audience: "api://SEU_NOVO_CLIENT_ID",  // ← Audience
};
```

Edite `api/appsettings.json`:

```json
{
  "AzureAd": {
    "ClientId": "SEU_NOVO_CLIENT_ID",
    "Audience": "api://SEU_NOVO_CLIENT_ID"
  }
}
```

### 4.4 Atualizar Redirect URIs no Entra ID

No Portal Azure → App Registration → **Authentication** → adicionar:
- `https://SEU-FRONTEND.azurewebsites.net`
- `http://localhost:5173` (desenvolvimento)

---

## Separar API e Frontend em repos distintos

Se o outro dev quer apenas a **API** em um repo separado:

### Copiar apenas a API

```bash
# Criar pasta temporária
mkdir authservice-api && cd authservice-api
git init

# Copiar arquivos da API
cp -r ../entra-auth-gateway/api/* .
cp ../entra-auth-gateway/.github/workflows/deploy-azure.yml .github/workflows/

# Commit e push
git add .
git commit -m "feat: AuthService API standalone"
git remote add origin https://github.com/DEV/authservice-api.git
git push -u origin main
```

### Copiar apenas o Frontend

```bash
mkdir authservice-frontend && cd authservice-frontend
git init

# Copiar tudo exceto a API
rsync -av --exclude='api' \
          --exclude='.vs' \
          --exclude='auth_control' \
          ../entra-auth-gateway/ .

git add .
git commit -m "feat: AuthService Admin Console standalone"
git remote add origin https://github.com/DEV/authservice-frontend.git
git push -u origin main
```

> ⚠️ **Importante**: Se separar, cada repo precisa do seu próprio workflow de CI/CD. Veja o guia [CI/CD Segmentado](cicd-segmented.md).

---

## Checklist pós-migração

| ✅ | Item | Verificação |
|---|---|---|
| ☐ | Repositório criado e push feito | `git log` mostra commits |
| ☐ | GitHub Secrets configurados | Settings → Secrets → todos 10 secrets |
| ☐ | Client ID atualizado no código | `src/config/azure.ts` e `appsettings.json` |
| ☐ | Redirect URIs no Entra ID | Portal → App Registration → Authentication |
| ☐ | Pipeline executou com sucesso | Actions tab → último run verde |
| ☐ | `/health` retorna 200 | `curl https://SUA-API/health` |
| ☐ | Login funciona no frontend | Abrir URL e autenticar |
| ☐ | Swagger acessível | `https://SUA-API/swagger` |

---

<p align="center">
  <i>Guia criado para facilitar a replicação do projeto AuthService + Admin Console.<br/>
  Para detalhes de CI/CD, consulte <a href="cicd-segmented.md">CI/CD Segmentado</a>.</i>
</p>
