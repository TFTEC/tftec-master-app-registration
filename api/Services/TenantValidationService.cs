using Microsoft.Extensions.Options;
using AuthService.Configuration;

namespace AuthService.Services;

public interface ITenantValidationService
{
    bool IsTenantAllowed(string tenantId);
}

public class TenantValidationService : ITenantValidationService
{
    private readonly AllowedTenantsConfig _config;
    private readonly HashSet<string> _allowedTenants;
    private readonly ILogger<TenantValidationService> _logger;

    public TenantValidationService(IOptions<AllowedTenantsConfig> config, ILogger<TenantValidationService> logger)
    {
        _config = config.Value;
        _logger = logger;
        _allowedTenants = new HashSet<string>(_config.TenantIds, StringComparer.OrdinalIgnoreCase);

        if (_config.AllowAll)
        {
            _logger.LogWarning("Tenant validation is set to allow ALL tenants. Consider restricting in production.");
        }
        else
        {
            _logger.LogInformation("Tenant validation configured with {Count} allowed tenants", _allowedTenants.Count);
        }
    }

    public bool IsTenantAllowed(string tenantId)
    {
        if (string.IsNullOrEmpty(tenantId))
        {
            _logger.LogWarning("Empty tenant ID provided");
            return false;
        }

        // If AllowAll is true, accept any tenant
        if (_config.AllowAll)
        {
            return true;
        }

        // Check whitelist
        var allowed = _allowedTenants.Contains(tenantId);
        
        if (!allowed)
        {
            _logger.LogWarning("Tenant {TenantId} is not in the allowed list", tenantId);
        }

        return allowed;
    }
}
