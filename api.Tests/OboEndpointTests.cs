using System.Net;
using System.Net.Http.Json;
using AuthService.Models;
using AuthService.Tests.Infrastructure;
using FluentAssertions;
using Moq;
using Xunit;

namespace AuthService.Tests;

/// <summary>
/// /auth/obo (On-Behalf-Of) endpoint contract:
/// - Requires authenticated user.
/// - Requires targetApi + non-empty scopes.
/// - Reads raw Bearer token from Authorization header and forwards to OBO service.
/// - Returns the downstream token to the caller.
/// </summary>
public class OboEndpointTests : IClassFixture<TestWebAppFactory>
{
    private readonly TestWebAppFactory _factory;

    public OboEndpointTests(TestWebAppFactory factory)
    {
        _factory = factory;
        _factory.OboMock.Reset();
    }

    [Fact]
    public async Task Obo_WithoutAuth_Returns401()
    {
        var client = _factory.CreateClient();

        var resp = await client.PostAsJsonAsync("/auth/obo", new
        {
            targetApi = "https://graph.microsoft.com",
            scopes = new[] { "User.Read" }
        });

        resp.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Obo_MissingScopes_Returns400()
    {
        var client = _factory.CreateClient();
        client.AttachClaims(TestClaims.For());

        var resp = await client.PostAsJsonAsync("/auth/obo", new
        {
            targetApi = "https://graph.microsoft.com",
            scopes = Array.Empty<string>()
        });

        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Obo_MissingTargetApi_Returns400()
    {
        var client = _factory.CreateClient();
        client.AttachClaims(TestClaims.For());

        var resp = await client.PostAsJsonAsync("/auth/obo", new
        {
            targetApi = "",
            scopes = new[] { "User.Read" }
        });

        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Obo_HappyPath_ForwardsTokenAndScopesToService()
    {
        var expectedToken = "downstream-access-token-xyz";
        var expiry = DateTimeOffset.UtcNow.AddHours(1);

        _factory.OboMock
            .Setup(s => s.GetTokenOnBehalfOfAsync(
                It.Is<string>(t => t == "fake-user-assertion-token"),
                "https://graph.microsoft.com",
                It.Is<IEnumerable<string>>(s => s.Contains("User.Read"))))
            .ReturnsAsync(new CachedTokenResult
            {
                AccessToken = expectedToken,
                ExpiresOn = expiry,
                TokenType = "Bearer"
            });

        var client = _factory.CreateClient();
        client.AttachClaims(TestClaims.For());

        var resp = await client.PostAsJsonAsync("/auth/obo", new
        {
            targetApi = "https://graph.microsoft.com",
            scopes = new[] { "User.Read" }
        });

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await resp.Content.ReadFromJsonAsync<TokenDto>();
        body!.AccessToken.Should().Be(expectedToken);
        body.TokenType.Should().Be("Bearer");
        body.ExpiresIn.Should().BeGreaterThan(0);

        _factory.OboMock.VerifyAll();
    }

    [Fact]
    public async Task Obo_ServiceThrows_Returns500()
    {
        _factory.OboMock
            .Setup(s => s.GetTokenOnBehalfOfAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<IEnumerable<string>>()))
            .ThrowsAsync(new InvalidOperationException("AADSTS65001: consent required"));

        var client = _factory.CreateClient();
        client.AttachClaims(TestClaims.For());

        var resp = await client.PostAsJsonAsync("/auth/obo", new
        {
            targetApi = "https://graph.microsoft.com",
            scopes = new[] { "User.Read" }
        });

        resp.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
    }

    private sealed record TokenDto(string AccessToken, string TokenType, int ExpiresIn);
}
