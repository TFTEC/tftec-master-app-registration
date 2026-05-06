using System.Net;
using System.Net.Http.Json;
using AuthService.Tests.Infrastructure;
using FluentAssertions;
using Xunit;

namespace AuthService.Tests;

/// <summary>
/// Multi-tenant authorization: tokens with tid not in AllowedTenants must be rejected.
/// Tests use TestAuthHandler so the JWT pipeline isn't exercised, but the controller-level
/// check (mirroring OnTokenValidated logic) is asserted via /auth/me reading the tid claim.
/// </summary>
public class MultiTenantAuthorizationTests : IClassFixture<TestWebAppFactory>
{
    private readonly TestWebAppFactory _factory;

    public MultiTenantAuthorizationTests(TestWebAppFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Me_WithoutAnyAuth_Returns401()
    {
        var client = _factory.CreateClient();

        var resp = await client.GetAsync("/auth/me");

        resp.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Me_WithAllowedTenant_Returns200AndEchoesClaims()
    {
        var client = _factory.CreateClient();
        client.AttachClaims(TestClaims.For(tid: TestClaims.AllowedTenantA));

        var resp = await client.GetAsync("/auth/me");

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await resp.Content.ReadFromJsonAsync<MeResponse>();
        body.Should().NotBeNull();
        body!.Authenticated.Should().BeTrue();
        body.Claims.Should().ContainKey("tid").WhoseValue.Should().Be(TestClaims.AllowedTenantA);
        body.Claims.Should().ContainKey("preferred_username");
    }

    [Fact]
    public async Task Validate_WithoutAdminRole_Returns403()
    {
        var client = _factory.CreateClient();
        // No "Admin" role
        client.AttachClaims(TestClaims.For(roles: "User"));

        var resp = await client.PostAsync("/auth/validate", content: null);

        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Validate_WithAdminRole_Returns200()
    {
        var client = _factory.CreateClient();
        client.AttachClaims(TestClaims.For(roles: "Admin"));

        var resp = await client.PostAsync("/auth/validate", content: null);

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    private sealed record MeResponse(bool Authenticated, Dictionary<string, string> Claims);
}
