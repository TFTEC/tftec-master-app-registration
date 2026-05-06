using System.Net;
using System.Net.Http.Json;
using AuthService.Models;
using AuthService.Tests.Infrastructure;
using FluentAssertions;
using Moq;
using Xunit;

namespace AuthService.Tests;

/// <summary>
/// /auth/client-token (Client Credentials) endpoint contract:
/// - Requires authenticated caller WITH Admin role (RequireAdminRole policy).
/// - Requires targetApi (scopes optional — service falls back to ".default").
/// - Forwards request to ClientCredentialsService and returns Bearer token.
/// </summary>
public class ClientCredentialsEndpointTests : IClassFixture<TestWebAppFactory>
{
    private readonly TestWebAppFactory _factory;

    public ClientCredentialsEndpointTests(TestWebAppFactory factory)
    {
        _factory = factory;
        _factory.ClientCredentialsMock.Reset();
    }

    [Fact]
    public async Task ClientToken_WithoutAuth_Returns401()
    {
        var client = _factory.CreateClient();

        var resp = await client.PostAsJsonAsync("/auth/client-token", new
        {
            targetApi = "https://graph.microsoft.com",
            scopes = new[] { "https://graph.microsoft.com/.default" }
        });

        resp.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ClientToken_AuthenticatedButNotAdmin_Returns403()
    {
        var client = _factory.CreateClient();
        client.AttachClaims(TestClaims.For(roles: "User")); // Not Admin

        var resp = await client.PostAsJsonAsync("/auth/client-token", new
        {
            targetApi = "https://graph.microsoft.com",
            scopes = new[] { "https://graph.microsoft.com/.default" }
        });

        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task ClientToken_AdminMissingTargetApi_Returns400()
    {
        var client = _factory.CreateClient();
        client.AttachClaims(TestClaims.For(roles: "Admin"));

        var resp = await client.PostAsJsonAsync("/auth/client-token", new
        {
            targetApi = "",
            scopes = new[] { "x/.default" }
        });

        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ClientToken_HappyPath_ForwardsToServiceAndReturnsBearer()
    {
        var expectedToken = "app-only-access-token-abc";
        var expiry = DateTimeOffset.UtcNow.AddHours(1);

        _factory.ClientCredentialsMock
            .Setup(s => s.GetTokenAsync(
                "https://graph.microsoft.com",
                It.Is<IEnumerable<string>>(s => s != null && s.Contains("https://graph.microsoft.com/.default"))))
            .ReturnsAsync(new CachedTokenResult
            {
                AccessToken = expectedToken,
                ExpiresOn = expiry,
                TokenType = "Bearer"
            });

        var client = _factory.CreateClient();
        client.AttachClaims(TestClaims.For(roles: "Admin"));

        var resp = await client.PostAsJsonAsync("/auth/client-token", new
        {
            targetApi = "https://graph.microsoft.com",
            scopes = new[] { "https://graph.microsoft.com/.default" }
        });

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await resp.Content.ReadFromJsonAsync<TokenDto>();
        body!.AccessToken.Should().Be(expectedToken);
        body.TokenType.Should().Be("Bearer");
        body.ExpiresIn.Should().BeGreaterThan(0);

        _factory.ClientCredentialsMock.VerifyAll();
    }

    [Fact]
    public async Task ClientToken_ServiceThrows_Returns500()
    {
        _factory.ClientCredentialsMock
            .Setup(s => s.GetTokenAsync(It.IsAny<string>(), It.IsAny<IEnumerable<string>?>()))
            .ThrowsAsync(new InvalidOperationException("AADSTS7000215: invalid client secret"));

        var client = _factory.CreateClient();
        client.AttachClaims(TestClaims.For(roles: "Admin"));

        var resp = await client.PostAsJsonAsync("/auth/client-token", new
        {
            targetApi = "https://graph.microsoft.com",
            scopes = new[] { "https://graph.microsoft.com/.default" }
        });

        resp.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
    }

    private sealed record TokenDto(string AccessToken, string TokenType, int ExpiresIn);
}
