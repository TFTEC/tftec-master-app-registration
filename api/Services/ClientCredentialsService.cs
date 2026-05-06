using Microsoft.Extensions.Options;
using Microsoft.Identity.Client;
using AuthService.Configuration;
using AuthService.Models;

namespace AuthService.Services;

public interface IClientCredentialsService
{
    Task<CachedTokenResult> GetTokenAsync(string targetApi, IEnumerable<string>? scopes = null);
}

public class ClientCredentialsService : IClientCredentialsService
{
    private readonly AzureAdConfig _azureAdConfig;
    private readonly DownstreamApisConfig _downstreamConfig;
    private readonly ICacheService _cache;
    private readonly ILogger<ClientCredentialsService> _logger;
    private readonly IConfidentialClientApplication _msalClient;

    public ClientCredentialsService(
        IOptions<AzureAdConfig> azureAdConfig,
        IOptions<DownstreamApisConfig> downstreamConfig,
        ICacheService cache,
        ILogger<ClientCredentialsService> logger)
    {
        _azureAdConfig = azureAdConfig.Value;
        _downstreamConfig = downstreamConfig.Value;
        _cache = cache;
        _logger = logger;

        var authority = $"{_azureAdConfig.Instance}{_azureAdConfig.TenantId}";

        var builder = ConfidentialClientApplicationBuilder
            .Create(_azureAdConfig.ClientId)
            .WithAuthority(authority);

        if (!string.IsNullOrEmpty(_azureAdConfig.ClientSecret))
        {
            builder = builder.WithClientSecret(_azureAdConfig.ClientSecret);
        }
        else if (!string.IsNullOrEmpty(_azureAdConfig.ClientCertificatePath))
        {
            var cert = new System.Security.Cryptography.X509Certificates.X509Certificate2(
                _azureAdConfig.ClientCertificatePath,
                _azureAdConfig.ClientCertificatePassword);
            builder = builder.WithCertificate(cert);
        }
        else
        {
            throw new InvalidOperationException("Either ClientSecret or ClientCertificate must be configured");
        }

        _msalClient = builder.Build();

        _logger.LogInformation("Client Credentials Service initialized");
    }

    public async Task<CachedTokenResult> GetTokenAsync(string targetApi, IEnumerable<string>? scopes = null)
    {
        // Resolve scopes - for client credentials, use .default scope pattern
        var resolvedScopes = scopes?.ToList() ?? new List<string>();

        if (!resolvedScopes.Any())
        {
            if (_downstreamConfig.Apis.TryGetValue(targetApi, out var apiConfig) && apiConfig.Scopes.Any())
            {
                resolvedScopes = apiConfig.Scopes;
            }
            else if (_downstreamConfig.Apis.TryGetValue(targetApi, out var config) && !string.IsNullOrEmpty(config.ClientId))
            {
                // Use .default scope for the target API
                resolvedScopes = new List<string> { $"{config.ClientId}/.default" };
            }
            else
            {
                throw new ArgumentException($"No scopes configured for API: {targetApi}");
            }
        }

        // Cache key
        var cacheKey = $"cc:{targetApi}:{string.Join(",", resolvedScopes)}";

        // Check cache (IDistributedCache via CacheService)
        var cached = await _cache.GetAsync<CachedTokenResult>(cacheKey);
        if (cached != null && cached.ExpiresOn > DateTimeOffset.UtcNow.AddMinutes(5))
        {
            _logger.LogDebug("Client credentials token cache hit for API: {Api}", targetApi);
            return cached;
        }

        try
        {
            var result = await _msalClient
                .AcquireTokenForClient(resolvedScopes)
                .ExecuteAsync();

            // Build cacheable DTO
            var tokenResult = new CachedTokenResult
            {
                AccessToken = result.AccessToken,
                ExpiresOn = result.ExpiresOn,
                TokenType = "Bearer",
                TenantId = result.TenantId,
                Scopes = result.Scopes
            };

            // Cache result (with 5min buffer)
            var ttl = result.ExpiresOn.AddMinutes(-5) - DateTimeOffset.UtcNow;
            if (ttl > TimeSpan.Zero)
            {
                await _cache.SetAsync(cacheKey, tokenResult, ttl);
            }

            _logger.LogInformation("Client credentials token acquired for API: {Api}", targetApi);
            return tokenResult;
        }
        catch (MsalServiceException ex)
        {
            _logger.LogError(ex, "Client credentials flow failed for API: {Api}", targetApi);
            throw;
        }
    }
}