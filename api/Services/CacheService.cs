using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;

namespace AuthService.Services;

/// <summary>
/// Abstração de cache que funciona com IDistributedCache (Redis ou InMemory).
/// Serializa/deserializa objetos automaticamente via JSON.
/// </summary>
public interface ICacheService
{
    Task<T?> GetAsync<T>(string key, CancellationToken ct = default) where T : class;
    Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken ct = default) where T : class;
    Task RemoveAsync(string key, CancellationToken ct = default);
}

public class CacheService : ICacheService
{
    private readonly IDistributedCache _cache;
    private readonly ILogger<CacheService> _logger;

    public CacheService(IDistributedCache cache, ILogger<CacheService> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken ct = default) where T : class
    {
        try
        {
            var data = await _cache.GetStringAsync(key, ct);
            if (data is null)
            {
                _logger.LogDebug("Cache MISS for key: {Key}", key);
                return null;
            }

            _logger.LogDebug("Cache HIT for key: {Key}", key);
            return JsonSerializer.Deserialize<T>(data);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Cache read failed for key: {Key}. Returning null (fallback).", key);
            return null;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken ct = default) where T : class
    {
        try
        {
            var options = new DistributedCacheEntryOptions();
            if (expiry.HasValue)
            {
                options.AbsoluteExpirationRelativeToNow = expiry;
            }

            var data = JsonSerializer.Serialize(value);
            await _cache.SetStringAsync(key, data, options, ct);
            _logger.LogDebug("Cache SET for key: {Key}, TTL: {Ttl}", key, expiry?.ToString() ?? "default");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Cache write failed for key: {Key}. Continuing without cache.", key);
        }
    }

    public async Task RemoveAsync(string key, CancellationToken ct = default)
    {
        try
        {
            await _cache.RemoveAsync(key, ct);
            _logger.LogDebug("Cache REMOVE for key: {Key}", key);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Cache remove failed for key: {Key}.", key);
        }
    }
}