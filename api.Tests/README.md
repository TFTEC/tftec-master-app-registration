# AuthService Integration Tests

Testes de integração end-to-end para a API AuthService usando `WebApplicationFactory<Program>` + xUnit.

## Cobertura

| Arquivo | O que valida |
|---|---|
| `MultiTenantAuthorizationTests.cs` | `/auth/me` exige autenticação, claims preservadas, role `Admin` exigida em `/auth/validate` |
| `JwksEndpointTests.cs` | `/.well-known/jwks.json` público, contrato dos campos, **não vaza chave simétrica** |
| `ExchangeTokenEndpointTests.cs` | `/auth/exchange` gera JWT interno válido, claims mapeadas, falha com chave errada |
| `OboEndpointTests.cs` | `/auth/obo` valida body, encaminha bearer + scopes ao serviço, propaga erros |
| `ClientCredentialsEndpointTests.cs` | `/auth/client-token` exige role `Admin`, encaminha ao serviço, retorna Bearer |

## Estratégia

- **TestAuthHandler** substitui o JWT bearer real (Microsoft.Identity.Web). Cada teste injeta claims via header `X-Test-Claims` (formato `tipo=valor;tipo=valor;roles=Admin,User`).
- **TestWebAppFactory** sobrescreve `IOboTokenService` e `IClientCredentialsService` com mocks (Moq) — zero chamadas reais ao Entra ID.
- `InternalJwt:SigningKey` é determinístico (256 bits base64) para que os testes possam validar a assinatura do token emitido.
- `AllowedTenants` whitelist é configurada com tenants conhecidos (allowed/disallowed).

## Como rodar

```bash
# Da raiz do repo
dotnet test AuthService.sln

# Ou só o projeto de testes
dotnet test api.Tests/AuthService.Tests.csproj
```

## Adicionando novos testes

1. Use `IClassFixture<TestWebAppFactory>` para reutilizar o host entre testes da mesma classe.
2. `client.AttachClaims(TestClaims.For(...))` injeta identidade.
3. Para mockar OBO/Client Credentials, configure `_factory.OboMock` / `_factory.ClientCredentialsMock` no início do teste.
