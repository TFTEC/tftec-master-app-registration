namespace AuthService.Models;

/// <summary>
/// DTO serializável para cache de tokens (IDistributedCache não aceita objetos complexos como AuthenticationResult).
/// </summary>
public class CachedTokenResult
{
    public string AccessToken { get; set; } = string.Empty;
    public DateTimeOffset ExpiresOn { get; set; }
    public string? TokenType { get; set; } = "Bearer";
    public string? TenantId { get; set; }
    public IEnumerable<string> Scopes { get; set; } = Array.Empty<string>();
}