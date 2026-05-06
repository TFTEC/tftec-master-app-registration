using AuthService.Configuration;
using AuthService.Models;
using AuthService.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Moq;

namespace AuthService.Tests.Infrastructure;

/// <summary>
/// WebApplicationFactory variant that:
/// - Replaces Microsoft.Identity.Web JWT auth with a controllable TestAuthHandler.
/// - Provides a deterministic InternalJwt signing key (256-bit base64).
/// - Configures AllowedTenants with a known whitelist (AllowAll = false).
/// - Mocks OBO and Client Credentials services to avoid network calls.
/// Tests can override AllowedTenants per-class via WithAllowedTenants(...).
/// </summary>
public class TestWebAppFactory : WebApplicationFactory<Program>
{
    public Mock<IOboTokenService> OboMock { get; } = new(MockBehavior.Strict);
    public Mock<IClientCredentialsService> ClientCredentialsMock { get; } = new(MockBehavior.Strict);
    public Mock<IEventPublisherService> EventsMock { get; } = new();

    // Deterministic 256-bit base64 key (32 bytes of 0x42 = "QkJC..." padded)
    public const string TestSigningKey =
        "QkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQg==";

    public List<string> AllowedTenants { get; set; } = new()
    {
        "11111111-1111-1111-1111-111111111111", // tenant A (allowed)
        "22222222-2222-2222-2222-222222222222"  // tenant B (allowed)
    };

    public bool AllowAllTenants { get; set; } = false;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["AzureAd:Instance"] = "https://login.microsoftonline.com/",
                ["AzureAd:TenantId"] = "organizations",
                ["AzureAd:ClientId"] = "00000000-0000-0000-0000-000000000001",
                ["AzureAd:ClientSecret"] = "test-secret",
                ["AzureAd:Audience"] = "api://00000000-0000-0000-0000-000000000001",

                ["AllowedTenants:AllowAll"] = AllowAllTenants.ToString().ToLowerInvariant(),

                ["InternalJwt:Issuer"] = "AuthService.Tests",
                ["InternalJwt:Audience"] = "AuthService-TestClients",
                ["InternalJwt:SigningKey"] = TestSigningKey,
                ["InternalJwt:ExpiryMinutes"] = "60",

                ["Redis:ConnectionString"] = "",
                ["ServiceBus:ConnectionString"] = ""
            });

            // AllowedTenants list (config index-based)
            for (int i = 0; i < AllowedTenants.Count; i++)
            {
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    [$"AllowedTenants:TenantIds:{i}"] = AllowedTenants[i]
                });
            }
        });

        builder.ConfigureTestServices(services =>
        {
            // 1. Replace authentication with TestAuthHandler (default scheme overrides JWT bearer)
            services.AddAuthentication(defaultScheme: TestAuthHandler.SchemeName)
                .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(
                    TestAuthHandler.SchemeName, _ => { });

            // 2. Mock external token services (no real network to Entra ID)
            services.RemoveAll<IOboTokenService>();
            services.AddSingleton(OboMock.Object);

            services.RemoveAll<IClientCredentialsService>();
            services.AddSingleton(ClientCredentialsMock.Object);

            // 3. Replace event publisher (no Service Bus required)
            services.RemoveAll<IEventPublisherService>();
            services.AddSingleton(EventsMock.Object);
        });
    }
}

internal static class ServiceCollectionExtensions
{
    public static void RemoveAll<T>(this IServiceCollection services)
    {
        var descriptors = services.Where(s => s.ServiceType == typeof(T)).ToList();
        foreach (var d in descriptors) services.Remove(d);
    }
}
