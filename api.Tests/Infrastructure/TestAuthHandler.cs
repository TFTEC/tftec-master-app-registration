using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AuthService.Tests.Infrastructure;

/// <summary>
/// Test authentication handler — bypasses Entra ID and reads claims from a JSON
/// header X-Test-Claims. Lets each test inject its own identity (tid, roles, scp...).
/// Mirrors the real pipeline: still triggers tenant validation logic via injected claims.
/// </summary>
public class TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public const string SchemeName = "TestScheme";
    public const string ClaimsHeader = "X-Test-Claims";

    public TestAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder,
        ISystemClock clock) : base(options, logger, encoder, clock) { }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue(ClaimsHeader, out var raw) || string.IsNullOrEmpty(raw))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        try
        {
            // Format: "type=value;type=value;roles=Admin,User"
            var claims = new List<Claim>();
            foreach (var pair in raw.ToString().Split(';', StringSplitOptions.RemoveEmptyEntries))
            {
                var idx = pair.IndexOf('=');
                if (idx <= 0) continue;
                var type = pair[..idx].Trim();
                var value = pair[(idx + 1)..].Trim();

                if (type == "roles")
                {
                    foreach (var r in value.Split(',', StringSplitOptions.RemoveEmptyEntries))
                    {
                        claims.Add(new Claim(ClaimTypes.Role, r.Trim()));
                        claims.Add(new Claim("roles", r.Trim()));
                    }
                }
                else
                {
                    claims.Add(new Claim(type, value));
                }
            }

            var identity = new ClaimsIdentity(claims, SchemeName);
            var principal = new ClaimsPrincipal(identity);
            var ticket = new AuthenticationTicket(principal, SchemeName);
            return Task.FromResult(AuthenticateResult.Success(ticket));
        }
        catch (Exception ex)
        {
            return Task.FromResult(AuthenticateResult.Fail(ex));
        }
    }
}
