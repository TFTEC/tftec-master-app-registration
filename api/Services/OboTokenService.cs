using Microsoft.Extensions.Options;
using Microsoft.Identity.Client;
using AuthService.Configuration;
using AuthService.Models;

namespace AuthService.Services;

public interface IOboTokenService
{
    Task<CachedTokenResult> GetTokenOnBehalfOfAsync(string userToken, string targetApi, IEnumerable<string> scopes);
}

public class OboTokenService : IOboTokenService
{
    private readonly AzureAdConfig _azureAdConfig;
    private readonly DownstreamApisConfig _downstreamConfig;
    private readonly ICacheService _cache;
    private readonly ILogger<OboTokenService> _logger;
    private readonly IConfidentialClientApplication _msalClient;

    public OboTokenService(
        IOptions<AzureAdConfig> azureAdConfig,
        IOptions<DownstreamApisConfig> downstreamConfig,
        ICacheService cache,
        ILogger<OboTokenService> logger)
    {
        _azureAdConfig = azureAdConfig.Value;
        _downstreamConfig = downstreamConfig.Value;
        _cache = cache;
        _logger = logger;

        var authority = $"{_azureAdConfig.Instance}{_azureAdConfig.TenantId}";

        var builder = ConfidentialClientApplicationBuilder
            .Create(_azureAdConfig.ClientId)
            .WithAuthority(authority);

        // Support both client secret and certificate
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

        _logger.LogInformation("OBO Token Service initialized with authority: {Authority}", authority);
    }

    public async Task<CachedTokenResult> GetTokenOnBehalfOfAsync(string userToken, string targetApi, IEnumerable<string> scopes)
    {
        // Resolve scopes from config if not provided
        var resolvedScopes = scopes.ToList();
        if (!resolvedScopes.Any() && _downstreamConfig.Apis.TryGetValue(targetApi, out var apiConfig))
        {
            resolvedScopes = apiConfig.Scopes;
        }

        if (!resolvedScopes.Any())
        {
            throw new ArgumentException($"No scopes configured for API: {targetApi}");
        }

        // Create cache key (don't include the full token for security)
        var cacheKey = $"obo:{targetApi}:{string.Join(",", resolvedScopes)}:{userToken.GetHashCode()}";

        // Check cache first (IDistributedCache via CacheService)
        var cached = await _cache.GetAsync<CachedTokenResult>(cacheKey);
        if (cached != null && cached.ExpiresOn > DateTimeOffset.UtcNow.AddMinutes(5))
        {
            _logger.LogDebug("OBO token cache hit for API: {Api}", targetApi);
            return cached;
        }

        // Acquire token using OBO flow
        var userAssertion = new UserAssertion(userToken);

        try
        {
            var result = await _msalClient
                .AcquireTokenOnBehalfOf(resolvedScopes, userAssertion)
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

            // Cache the result (with 5min buffer before expiry)
            var ttl = result.ExpiresOn.AddMinutes(-5) - DateTimeOffset.UtcNow;
            if (ttl > TimeSpan.Zero)
            {
                await _cache.SetAsync(cacheKey, tokenResult, ttl);
                _logger.LogDebug("OBO token cached for API: {Api}, expires: {Expiry}", targetApi, result.ExpiresOn);
            }

            _logger.LogInformation("OBO token acquired for API: {Api}", targetApi);
            return tokenResult;
        }
        catch (MsalUiRequiredException ex)
        {
            _logger.LogWarning(ex, "OBO flow requires user interaction for API: {Api}", targetApi);
            throw new InvalidOperationException($"User consent required for {targetApi}. Error: {ex.Message}");
        }
        catch (MsalServiceException ex)
        {
            _logger.LogError(ex, "MSAL service error during OBO for API: {Api}", targetApi);
            throw;
        }
    }
}