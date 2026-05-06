using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Json;
using AuthService.Tests.Infrastructure;
using FluentAssertions;
using Microsoft.IdentityModel.Tokens;
using Xunit;

namespace AuthService.Tests;

/// <summary>
/// /auth/exchange — Internal Token (Model 2):
/// - Requires authentication.
/// - Returns a Bearer JWT with iss/aud/sub/tid/preferred_username preserved.
/// - Token must validate with the same SigningKey configured in the host.
/// </summary>
public class ExchangeTokenEndpointTests : IClassFixture<TestWebAppFactory>
{
    private readonly TestWebAppFactory _factory;

    public ExchangeTokenEndpointTests(TestWebAppFactory factory) { _factory = factory; }

    [Fact]
    public async Task Exchange_WithoutAuth_Returns401()
    {
        var client = _factory.CreateClient();

        var resp = await client.PostAsync("/auth/exchange", content: null);

        resp.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Exchange_WithAuth_ReturnsSignedJwtWithUserClaims()
    {
        var client = _factory.CreateClient();
        client.AttachClaims(TestClaims.For(
            tid: TestClaims.AllowedTenantA,
            sub: "user-001",
            preferredUsername: "ana@contoso.com",
            roles: "Admin"));

        var resp = await client.PostAsync("/auth/exchange", content: null);

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await resp.Content.ReadFromJsonAsync<TokenResponseDto>();
        body.Should().NotBeNull();
        body!.TokenType.Should().Be("Bearer");
        body.AccessToken.Should().NotBeNullOrEmpty();
        body.ExpiresIn.Should().BeGreaterThan(0);

        // Validate the JWT with the same key the API was configured with
        var keyBytes = Convert.FromBase64String(TestWebAppFactory.TestSigningKey);
        var validationParams = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = "AuthService.Tests",
            ValidateAudience = true,
            ValidAudience = "AuthService-TestClients",
            ValidateLifetime = true,
            IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
            ValidateIssuerSigningKey = true
        };

        var handler = new JwtSecurityTokenHandler();
        var principal = handler.ValidateToken(body.AccessToken, validationParams, out var validated);

        principal.Should().NotBeNull();
        validated.Should().BeOfType<JwtSecurityToken>();

        var jwt = (JwtSecurityToken)validated;
        jwt.Claims.Should().Contain(c => c.Type == "sub" && c.Value == "user-001");
        jwt.Claims.Should().Contain(c => c.Type == "tid" && c.Value == TestClaims.AllowedTenantA);
        jwt.Claims.Should().Contain(c => c.Type == "preferred_username" && c.Value == "ana@contoso.com");
        jwt.Claims.Should().Contain(c => c.Type == "roles" && c.Value == "Admin");
    }

    [Fact]
    public async Task Exchange_TokenWrongSigningKey_FailsValidation()
    {
        var client = _factory.CreateClient();
        client.AttachClaims(TestClaims.For());

        var resp = await client.PostAsync("/auth/exchange", content: null);
        var body = await resp.Content.ReadFromJsonAsync<TokenResponseDto>();

        // Tamper: try to validate with a different 256-bit key
        var wrongKey = Convert.FromBase64String(
            "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=");
        var handler = new JwtSecurityTokenHandler();
        var validationParams = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = false,
            IssuerSigningKey = new SymmetricSecurityKey(wrongKey),
            ValidateIssuerSigningKey = true
        };

        var act = () => handler.ValidateToken(body!.AccessToken, validationParams, out _);
        act.Should().Throw<SecurityTokenSignatureKeyNotFoundException>()
           .Or.Throw<SecurityTokenInvalidSignatureException>();
    }

    private sealed record TokenResponseDto(string AccessToken, string TokenType, int ExpiresIn);
}
