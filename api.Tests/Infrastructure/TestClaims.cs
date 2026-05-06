using System.Net.Http.Headers;

namespace AuthService.Tests.Infrastructure;

/// <summary>
/// Helpers to build the X-Test-Claims header consumed by TestAuthHandler.
/// </summary>
public static class TestClaims
{
    public const string AllowedTenantA = "11111111-1111-1111-1111-111111111111";
    public const string DisallowedTenant = "99999999-9999-9999-9999-999999999999";

    public static string For(
        string tid = AllowedTenantA,
        string sub = "user-sub-001",
        string preferredUsername = "ana@contoso.com",
        string name = "Ana Souza",
        string? roles = null,
        string? scp = null)
    {
        var parts = new List<string>
        {
            $"sub={sub}",
            $"oid={sub}",
            $"tid={tid}",
            $"preferred_username={preferredUsername}",
            $"name={name}"
        };
        if (!string.IsNullOrEmpty(roles)) parts.Add($"roles={roles}");
        if (!string.IsNullOrEmpty(scp)) parts.Add($"scp={scp}");
        return string.Join(";", parts);
    }

    public static void AttachClaims(this HttpClient client, string headerValue)
    {
        client.DefaultRequestHeaders.Remove(TestAuthHandler.ClaimsHeader);
        client.DefaultRequestHeaders.Add(TestAuthHandler.ClaimsHeader, headerValue);
        // Bearer header is also attached so /auth/obo (which reads it raw) has something
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", "fake-user-assertion-token");
    }
}
