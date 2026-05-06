namespace AuthService.Models;

public class TokenResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string TokenType { get; set; } = "Bearer";
    public int ExpiresIn { get; set; }
}

public class OboRequest
{
    public string TargetApi { get; set; } = string.Empty;
    public List<string> Scopes { get; set; } = new();
}

public class ClientTokenRequest
{
    public string TargetApi { get; set; } = string.Empty;
    public List<string>? Scopes { get; set; }
}

public class JwksResponse
{
    public List<JwkKey> Keys { get; set; } = new();
}

public class JwkKey
{
    public string Kty { get; set; } = "RSA"; // or "oct" for symmetric
    public string Use { get; set; } = "sig";
    public string Kid { get; set; } = string.Empty;
    public string Alg { get; set; } = "RS256";
    public string? N { get; set; } // RSA modulus
    public string? E { get; set; } // RSA exponent
    public string? K { get; set; } // Symmetric key (for HS256)
}

public class ValidationResult
{
    public bool Valid { get; set; }
    public string? Error { get; set; }
    public Dictionary<string, string> Claims { get; set; } = new();
}
