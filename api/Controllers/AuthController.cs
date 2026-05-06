using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AuthService.Services;
using System.Security.Claims;

namespace AuthService.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly IEventPublisherService _eventPublisher;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IEventPublisherService eventPublisher,
        ILogger<AuthController> logger)
    {
        _eventPublisher = eventPublisher;
        _logger = logger;
    }

    /// <summary>
    /// Returns claims from the current authenticated user
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMe()
    {
        var claims = GetRelevantClaims(User);
        var sub = claims.GetValueOrDefault("sub", "unknown");
        var tid = claims.GetValueOrDefault("tid");

        _logger.LogInformation("User info requested for subject: {Sub}", sub);

        // Publish authentication event
        _ = _eventPublisher.PublishAsync("user_authenticated", new
        {
            userId = sub,
            email = claims.GetValueOrDefault("preferred_username"),
            timestamp = DateTimeOffset.UtcNow
        }, tid);

        return Ok(new
        {
            authenticated = true,
            claims
        });
    }

    /// <summary>
    /// Validates a token and returns its claims (debug endpoint)
    /// </summary>
    [HttpPost("validate")]
    [Authorize(Policy = "RequireAdminRole")]
    public IActionResult ValidateToken()
    {
        var claims = GetRelevantClaims(User);
        
        return Ok(new
        {
            valid = true,
            tokenType = "EntraID",
            claims,
            validatedAt = DateTime.UtcNow
        });
    }

    private Dictionary<string, string> GetRelevantClaims(ClaimsPrincipal user)
    {
        var relevantClaimTypes = new[]
        {
            "sub", "oid", "tid", "preferred_username", "name", "email",
            "roles", "scp", "aud", "iss", "exp", "iat", "nbf",
            "http://schemas.microsoft.com/identity/claims/scope",
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
        };

        var claims = new Dictionary<string, string>();

        foreach (var claim in user.Claims)
        {
            var type = claim.Type;
            // Normalize some claim types
            if (type == "http://schemas.microsoft.com/identity/claims/scope")
                type = "scp";
            if (type == "http://schemas.microsoft.com/ws/2008/06/identity/claims/role")
                type = "roles";

            if (relevantClaimTypes.Contains(claim.Type) || relevantClaimTypes.Contains(type))
            {
                if (claims.ContainsKey(type))
                    claims[type] = claims[type] + " " + claim.Value;
                else
                    claims[type] = claim.Value;
            }
        }

        return claims;
    }
}
