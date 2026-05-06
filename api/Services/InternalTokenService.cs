using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using AuthService.Configuration;
using AuthService.Models;

namespace AuthService.Services;

public interface IInternalTokenService
{
    string GenerateToken(ClaimsPrincipal user);
    int GetExpirySeconds();
    JwksResponse GetJwks();
}

public class InternalTokenService : IInternalTokenService
{
    private readonly InternalJwtConfig _config;
    private readonly ILogger<InternalTokenService> _logger;
    private readonly SecurityKey _signingKey;
    private readonly string _keyId;
    private readonly SigningCredentials _signingCredentials;

    public InternalTokenService(IOptions<InternalJwtConfig> config, ILogger<InternalTokenService> logger)
    {
        _config = config.Value;
        _logger = logger;

        if (string.IsNullOrEmpty(_config.SigningKey))
        {
            throw new InvalidOperationException("InternalJwt:SigningKey is required");
        }

        // Generate a key ID for JWKS
        _keyId = GenerateKeyId(_config.SigningKey);

        // Use symmetric key (HS256) for simplicity - can be upgraded to RSA for production
        var keyBytes = Convert.FromBase64String(_config.SigningKey);
        if (keyBytes.Length < 32) // 256 bits minimum
        {
            throw new InvalidOperationException("SigningKey must be at least 256 bits (32 bytes base64)");
        }

        _signingKey = new SymmetricSecurityKey(keyBytes);
        _signingCredentials = new SigningCredentials(_signingKey, SecurityAlgorithms.HmacSha256);

        _logger.LogInformation("Internal token service initialized with key ID: {KeyId}", _keyId);
    }

    public string GenerateToken(ClaimsPrincipal user)
    {
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
        };

        // Map relevant claims from Entra ID token
        var claimMappings = new Dictionary<string, string>
        {
            { "sub", JwtRegisteredClaimNames.Sub },
            { "oid", "oid" },
            { "tid", "tid" },
            { "preferred_username", "preferred_username" },
            { "name", "name" },
            { "email", JwtRegisteredClaimNames.Email },
            { "http://schemas.microsoft.com/identity/claims/scope", "scp" },
            { "scp", "scp" }
        };

        foreach (var mapping in claimMappings)
        {
            var claim = user.FindFirst(mapping.Key);
            if (claim != null)
            {
                claims.Add(new Claim(mapping.Value, claim.Value));
            }
        }

        // Map roles
        var roles = user.FindAll(c => 
            c.Type == "roles" || 
            c.Type == ClaimTypes.Role ||
            c.Type == "http://schemas.microsoft.com/ws/2008/06/identity/claims/role");

        foreach (var role in roles)
        {
            claims.Add(new Claim("roles", role.Value));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(_config.ExpiryMinutes),
            Issuer = _config.Issuer,
            Audience = _config.Audience,
            SigningCredentials = _signingCredentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        _logger.LogDebug("Internal token generated for subject: {Sub}", 
            user.FindFirst("sub")?.Value ?? user.FindFirst("oid")?.Value ?? "unknown");

        return tokenHandler.WriteToken(token);
    }

    public int GetExpirySeconds() => _config.ExpiryMinutes * 60;

    public JwksResponse GetJwks()
    {
        // For symmetric keys, we don't expose the key in JWKS
        // This is a placeholder - in production, use RSA keys
        return new JwksResponse
        {
            Keys = new List<JwkKey>
            {
                new JwkKey
                {
                    Kty = "oct",
                    Use = "sig",
                    Kid = _keyId,
                    Alg = "HS256"
                    // Note: 'k' (key value) is NOT exposed for security
                }
            }
        };
    }

    private static string GenerateKeyId(string key)
    {
        using var sha256 = SHA256.Create();
        var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(key));
        return Convert.ToBase64String(hash[..8]).Replace("+", "-").Replace("/", "_").TrimEnd('=');
    }
}
