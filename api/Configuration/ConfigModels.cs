namespace AuthService.Configuration;

public class AzureAdConfig
{
    public string Instance { get; set; } = "https://login.microsoftonline.com/";
    public string TenantId { get; set; } = "common"; // Use "common" or "organizations" for multi-tenant
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public string? ClientCertificatePath { get; set; }
    public string? ClientCertificatePassword { get; set; }
}

public class InternalJwtConfig
{
    public string Issuer { get; set; } = "AuthService";
    public string Audience { get; set; } = "AuthService-Clients";
    public string SigningKey { get; set; } = string.Empty; // Base64 encoded key (min 256 bits)
    public int ExpiryMinutes { get; set; } = 60;
    public int KeyRotationDays { get; set; } = 30;
}

public class AllowedTenantsConfig
{
    public List<string> TenantIds { get; set; } = new();
    public bool AllowAll { get; set; } = true; // Default: accept all tenants
}

public class DownstreamApisConfig
{
    public Dictionary<string, DownstreamApiConfig> Apis { get; set; } = new();
}

public class DownstreamApiConfig
{
    public string BaseUrl { get; set; } = string.Empty;
    public List<string> Scopes { get; set; } = new();
    public string? ClientId { get; set; } // For client credentials flow
}

public class RedisConfig
{
    public string? ConnectionString { get; set; }
    public string InstanceName { get; set; } = "AuthService:";
    public int DefaultTtlMinutes { get; set; } = 60;
}

public class ServiceBusConfig
{
    public string? ConnectionString { get; set; }
    public string TopicName { get; set; } = "topic-app-events";
}
