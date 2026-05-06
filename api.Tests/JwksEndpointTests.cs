using System.Net;
using System.Net.Http.Json;
using AuthService.Tests.Infrastructure;
using FluentAssertions;
using Xunit;

namespace AuthService.Tests;

/// <summary>
/// JWKS endpoint contract:
/// - Always reachable without auth.
/// - Returns at least one key with kid + alg + use=sig.
/// - Symmetric keys (current impl) MUST NOT expose 'k' (private material).
/// </summary>
public class JwksEndpointTests : IClassFixture<TestWebAppFactory>
{
    private readonly TestWebAppFactory _factory;

    public JwksEndpointTests(TestWebAppFactory factory) { _factory = factory; }

    [Fact]
    public async Task Jwks_IsPubliclyReachable()
    {
        var client = _factory.CreateClient();

        var resp = await client.GetAsync("/.well-known/jwks.json");

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Jwks_ReturnsAtLeastOneKeyWithRequiredFields()
    {
        var client = _factory.CreateClient();

        var jwks = await client.GetFromJsonAsync<JwksDto>("/.well-known/jwks.json");

        jwks.Should().NotBeNull();
        jwks!.Keys.Should().NotBeEmpty();

        var key = jwks.Keys[0];
        key.Kid.Should().NotBeNullOrEmpty();
        key.Alg.Should().NotBeNullOrEmpty();
        key.Use.Should().Be("sig");
    }

    [Fact]
    public async Task Jwks_DoesNotExposePrivateSymmetricKeyMaterial()
    {
        var client = _factory.CreateClient();

        var jwks = await client.GetFromJsonAsync<JwksDto>("/.well-known/jwks.json");

        // 'k' (symmetric key value) must never be in the response
        jwks!.Keys.Should().OnlyContain(k => string.IsNullOrEmpty(k.K));
    }

    private sealed class JwksDto
    {
        public List<KeyDto> Keys { get; set; } = new();
    }

    private sealed class KeyDto
    {
        public string Kty { get; set; } = "";
        public string Use { get; set; } = "";
        public string Kid { get; set; } = "";
        public string Alg { get; set; } = "";
        public string? K { get; set; }
    }
}
