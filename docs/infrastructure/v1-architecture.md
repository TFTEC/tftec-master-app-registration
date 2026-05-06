# Infraestrutura v1 — APIM + Redis + Service Bus + Logic Apps

## Visão Geral

Evolução da arquitetura para unificar endpoints, adicionar cache e processamento assíncrono.

```
┌──────────┐                    ┌──────────┐
│ Frontend │───── HTTPS ──────►│   APIM   │
│  (React) │                   │ (Gateway)│
└──────────┘                   └────┬─────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              ┌───────────┐  ┌───────────┐   ┌───────────┐
              │AuthService│  │  API A    │   │  API B    │
              │ (.NET 8)  │  │           │   │           │
              └─────┬─────┘  └───────────┘   └───────────┘
                    │
           ┌───────┼───────┐
           ▼               ▼
     ┌───────────┐   ┌─────────────┐
     │   Redis   │   │ Service Bus │
     │  (Cache)  │   │  (Eventos)  │
     └───────────┘   └──────┬──────┘
                            │
                            ▼
                     ┌─────────────┐
                     │  Logic App  │
                     │ (Automação) │
                     └─────────────┘
```

## Fluxos

| Tipo | Caminho | Uso |
|---|---|---|
| Síncrono | Frontend → APIM → AuthService/APIs | Todas as chamadas HTTP |
| Assíncrono | API → Service Bus → Logic App → ações | Auditoria, provisionamento, notificações |
| Cache | AuthService/API → Redis | Tokens, JWKS, respostas, rate-limit |

## 1. Provisionar Infraestrutura

### Variáveis base

```bash
export LOCATION="brazilsouth"
export RG="rg-tftec-unified-hml"
export PREFIX="tftec-hml"

az group create -n "$RG" -l "$LOCATION"
```

### 1.1 Key Vault

```bash
export KV_NAME="kv-${PREFIX}-001"

az keyvault create \
  -g "$RG" \
  -n "$KV_NAME" \
  -l "$LOCATION" \
  --enable-rbac-authorization true

# Guardar secrets do Entra/Redis/ServiceBus
az keyvault secret set \
  --vault-name "$KV_NAME" \
  -n "AzureAd--ClientSecret" \
  --value "COLOQUE_AQUI"
```

### 1.2 Azure Cache for Redis

```bash
export REDIS_NAME="redis-${PREFIX}-001"

az redis create \
  -g "$RG" \
  -n "$REDIS_NAME" \
  -l "$LOCATION" \
  --sku Basic \
  --vm-size c0

# Obter connection string
export REDIS_HOST=$(az redis show -g "$RG" -n "$REDIS_NAME" --query hostName -o tsv)
REDIS_KEY=$(az redis list-keys -g "$RG" -n "$REDIS_NAME" --query primaryKey -o tsv)
echo "$REDIS_HOST:6380,password=$REDIS_KEY,ssl=True,abortConnect=False"
```

### 1.3 Service Bus

```bash
export SB_NAME="sb-${PREFIX}-001"

az servicebus namespace create \
  -g "$RG" \
  -n "$SB_NAME" \
  -l "$LOCATION" \
  --sku Standard

# Topic + subscription
export TOPIC="topic-app-events"
export SUB="sub-logicapp"

az servicebus topic create \
  -g "$RG" \
  --namespace-name "$SB_NAME" \
  -n "$TOPIC"

az servicebus topic subscription create \
  -g "$RG" \
  --namespace-name "$SB_NAME" \
  --topic-name "$TOPIC" \
  -n "$SUB"

# Connection string
export SB_CS=$(az servicebus namespace authorization-rule keys list \
  -g "$RG" \
  --namespace-name "$SB_NAME" \
  -n RootManageSharedAccessKey \
  --query primaryConnectionString -o tsv)
echo "$SB_CS"
```

### 1.4 API Management (Developer SKU)

```bash
export APIM_NAME="apim-${PREFIX}-001"

az apim create \
  -g "$RG" \
  -n "$APIM_NAME" \
  -l "$LOCATION" \
  --publisher-email "ti@tftec.com.br" \
  --publisher-name "TFTEC" \
  --sku-name Developer
```

## 2. AuthService: Redis + Service Bus

### Variáveis de ambiente

```bash
# Redis
Redis__ConnectionString=HOST:6380,password=...,ssl=True,abortConnect=False

# Service Bus
ServiceBus__ConnectionString=Endpoint=sb://...
ServiceBus__TopicName=topic-app-events
```

### Pacotes NuGet

```bash
dotnet add package StackExchange.Redis
dotnet add package Azure.Messaging.ServiceBus
```

### Estratégia de cache (Redis)

| Dado | TTL | Justificativa |
|---|---|---|
| JWKS/metadata de tenant | 6h | Raramente muda |
| Token OBO | expiração - 5min | Evita token expirado |
| Token Client Credentials | expiração - 5min | Evita token expirado |

### Eventos no Service Bus

| Evento | Quando | Payload |
|---|---|---|
| `user_authenticated` | Login com sucesso | userId, tenantId, timestamp |
| `token_exchanged` | Token exchange | userId, targetApi, timestamp |
| `user_provision_requested` | Novo usuário | userId, email, tenantId |

### Formato padrão de evento

```json
{
  "eventName": "user_provision_requested",
  "correlationId": "GUID",
  "tenantId": "GUID",
  "occurredAt": "2026-02-06T12:00:00Z",
  "data": {
    "userId": "123",
    "email": "x@empresa.com"
  }
}
```

## 3. APIM: Gateway Unificado

### APIs a publicar

| API | Base Path | Backend |
|---|---|---|
| AuthService | `/auth` | `https://authservice-api-tftec.azurewebsites.net` |
| App API | `/api` | URL do backend da aplicação |

**Resultado**: Frontend chama apenas `https://apim-tftec-hml-001.azure-api.net/auth/` e `/api/`.

### 3.1 Política Pass-through com validação no APIM

Inbound policy para `/api`:

```xml
<policies>
  <inbound>
    <base />
    <cors>
      <allowed-origins>
        <origin>https://SEU_FRONTEND_AQUI</origin>
      </allowed-origins>
      <allowed-methods>
        <method>GET</method><method>POST</method>
        <method>PUT</method><method>DELETE</method>
        <method>OPTIONS</method>
      </allowed-methods>
      <allowed-headers><header>*</header></allowed-headers>
      <expose-headers><header>*</header></expose-headers>
    </cors>

    <validate-jwt header-name="Authorization"
                  failed-validation-httpcode="401"
                  failed-validation-error-message="Unauthorized">
      <openid-config url="https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration" />
      <audiences>
        <audience>api://SEU_CLIENT_ID_DO_AUTH_SERVICE</audience>
      </audiences>
    </validate-jwt>

    <choose>
      <when condition="@(!new [] { &quot;TENANT_ID_1&quot;, &quot;TENANT_ID_2&quot; }.Contains(context.Principal.Claims.FirstOrDefault(c => c.Type == &quot;tid&quot;)?.Value))">
        <return-response>
          <set-status code="403" reason="Forbidden" />
          <set-body>Tenant not allowed</set-body>
        </return-response>
      </when>
    </choose>
  </inbound>
  <backend><base /></backend>
  <outbound><base /></outbound>
  <on-error><base /></on-error>
</policies>
```

### 3.2 Política Token Interno (via APIM)

Para cenários onde o APIM faz o exchange antes de encaminhar:

```xml
<policies>
  <inbound>
    <base />
    <validate-jwt header-name="Authorization"
                  failed-validation-httpcode="401"
                  failed-validation-error-message="Unauthorized">
      <openid-config url="https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration" />
      <audiences>
        <audience>api://SEU_CLIENT_ID_DO_AUTH_SERVICE</audience>
      </audiences>
    </validate-jwt>

    <send-request mode="new" response-variable-name="exchange" timeout="10" ignore-error="false">
      <set-url>https://SEU_AUTHSERVICE_HOST/auth/exchange</set-url>
      <set-method>POST</set-method>
      <set-header name="Authorization" exists-action="override">
        <value>@(context.Request.Headers.GetValueOrDefault("Authorization",""))</value>
      </set-header>
      <set-header name="Content-Type" exists-action="override">
        <value>application/json</value>
      </set-header>
      <set-body>{}</set-body>
    </send-request>

    <set-variable name="internalToken"
                  value="@(((IResponse)context.Variables[&quot;exchange&quot;]).Body.As&lt;JObject&gt;()[&quot;token&quot;]?.ToString())" />
    <set-header name="Authorization" exists-action="override">
      <value>@($"Bearer {context.Variables[&quot;internalToken&quot;]}")</value>
    </set-header>
  </inbound>
  <backend><base /></backend>
  <outbound><base /></outbound>
  <on-error><base /></on-error>
</policies>
```

## 4. Logic App: Consumir Service Bus

### Workflow

1. **Trigger**: Service Bus Topic Subscription (mensagem recebida)
2. **Parse JSON**: Deserializa payload do evento
3. **HTTP Action**: Chama API interna (ex.: `/api/provision/confirm`)
4. **Notificação**: (Opcional) Envia alerta via Teams/Email

> Na v1, usar connection string. Na v2, migrar para Managed Identity + RBAC.

## 5. Ordem de Execução

| # | Etapa | Critério de Sucesso |
|---|---|---|
| 1 | APIM na frente | Frontend chama apenas APIM |
| 2 | Policy validate-jwt + CORS | Requests autenticados passam, sem auth retorna 401 |
| 3 | Redis no AuthService | Cache hits em tokens/JWKS |
| 4 | Service Bus + 1 evento real | Evento publicado e visível no portal |
| 5 | Logic App consumindo | Run history mostrando execuções |
| 6 | Evoluir | Rate-limit, caching APIM, Key Vault, private endpoints |

## 6. Critério de Sucesso do v1

- [ ] Frontend não conhece mais URL de AuthService nem de backend: só APIM
- [ ] Chamadas HTTP observáveis no APIM (Analytics)
- [ ] Cache hits no Redis (ao menos tokens/JWKS)
- [ ] Eventos fluindo no Service Bus
- [ ] Logic App executando e registrando run history

## Referências

- [APIM Policies](https://learn.microsoft.com/en-us/azure/api-management/api-management-policies)
- [Azure Cache for Redis](https://learn.microsoft.com/en-us/azure/azure-cache-for-redis/)
- [Azure Service Bus](https://learn.microsoft.com/en-us/azure/service-bus-messaging/)
- [Logic Apps](https://learn.microsoft.com/en-us/azure/logic-apps/)
