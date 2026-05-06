using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AuthService.Services;
using AuthService.Models;

namespace AuthService.Controllers;

[ApiController]
[Route("auth")]
public class TokenController : ControllerBase
{
    private readonly IInternalTokenService _internalTokenService;
    private readonly IOboTokenService _oboTokenService;
    private readonly IClientCredentialsService _clientCredentialsService;
    private readonly IEventPublisherService _eventPublisher;
    private readonly ILogger<TokenController> _logger;

    public TokenController(
        IInternalTokenService internalTokenService,
        IOboTokenService oboTokenService,
        IClientCredentialsService clientCredentialsService,
        IEventPublisherService eventPublisher,
        ILogger<TokenController> logger)
    {
        _internalTokenService = internalTokenService;
        _oboTokenService = oboTokenService;
        _clientCredentialsService = clientCredentialsService;
        _eventPublisher = eventPublisher;
        _logger = logger;
    }

    /// <summary>
    /// Exchange Entra ID token for internal token (Model 2)
    /// </summary>
    [HttpPost("exchange")]
    [Authorize]
    public async Task<IActionResult> ExchangeToken()
    {
        try
        {
            var internalToken = _internalTokenService.GenerateToken(User);
            var sub = User.FindFirst("sub")?.Value ?? User.FindFirst("oid")?.Value ?? "unknown";
            var tid = User.FindFirst("tid")?.Value;

            _logger.LogInformation("Token exchanged for user {Sub}", sub);

            // Publish event (fire-and-forget, won't block response)
            _ = _eventPublisher.PublishAsync("token_exchanged", new
            {
                userId = sub,
                targetType = "internal_jwt",
                timestamp = DateTimeOffset.UtcNow
            }, tid);

            return Ok(new TokenResponse
            {
                AccessToken = internalToken,
                TokenType = "Bearer",
                ExpiresIn = _internalTokenService.GetExpirySeconds()
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Token exchange failed");
            return StatusCode(500, new { error = "Token exchange failed" });
        }
    }

    /// <summary>
    /// On-Behalf-Of flow: get token for downstream API as the user
    /// </summary>
    [HttpPost("obo")]
    [Authorize]
    public async Task<IActionResult> OnBehalfOf([FromBody] OboRequest request)
    {
        if (string.IsNullOrEmpty(request.TargetApi) || request.Scopes == null || !request.Scopes.Any())
        {
            return BadRequest(new { error = "targetApi and scopes are required" });
        }

        try
        {
            // Get the original access token from Authorization header
            var authHeader = Request.Headers["Authorization"].FirstOrDefault();
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
            {
                return Unauthorized(new { error = "Bearer token required" });
            }

            var userToken = authHeader.Substring("Bearer ".Length);
            var result = await _oboTokenService.GetTokenOnBehalfOfAsync(userToken, request.TargetApi, request.Scopes);
            var sub = User.FindFirst("sub")?.Value ?? "unknown";
            var tid = User.FindFirst("tid")?.Value;

            _logger.LogInformation("OBO token acquired for API {Api} on behalf of user {Sub}",
                request.TargetApi, sub);

            // Publish event
            _ = _eventPublisher.PublishAsync("token_exchanged", new
            {
                userId = sub,
                targetApi = request.TargetApi,
                targetType = "obo",
                timestamp = DateTimeOffset.UtcNow
            }, tid);

            return Ok(new TokenResponse
            {
                AccessToken = result.AccessToken,
                TokenType = "Bearer",
                ExpiresIn = (int)(result.ExpiresOn - DateTimeOffset.UtcNow).TotalSeconds
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "OBO flow failed for API {Api}", request.TargetApi);
            return StatusCode(500, new { error = "OBO flow failed", details = ex.Message });
        }
    }

    /// <summary>
    /// Client Credentials flow: get token for downstream API (service-to-service)
    /// NOTE: Auth requirement relaxed to [Authorize] (any authenticated user) for educational demo.
    /// Production: restore [Authorize(Policy = "RequireAdminRole")] to prevent abuse.
    /// See docs/review/security-audit.md "M-3 (relaxed for demo)".
    /// </summary>
    [HttpPost("client-token")]
    [Authorize]
    public async Task<IActionResult> GetClientToken([FromBody] ClientTokenRequest request)
    {
        if (string.IsNullOrEmpty(request.TargetApi))
        {
            return BadRequest(new { error = "targetApi is required" });
        }

        try
        {
            var result = await _clientCredentialsService.GetTokenAsync(request.TargetApi, request.Scopes);
            var tid = User.FindFirst("tid")?.Value;

            _logger.LogInformation("Client credentials token acquired for API {Api}", request.TargetApi);

            // Publish event
            _ = _eventPublisher.PublishAsync("token_exchanged", new
            {
                targetApi = request.TargetApi,
                targetType = "client_credentials",
                timestamp = DateTimeOffset.UtcNow
            }, tid);

            return Ok(new TokenResponse
            {
                AccessToken = result.AccessToken,
                TokenType = "Bearer",
                ExpiresIn = (int)(result.ExpiresOn - DateTimeOffset.UtcNow).TotalSeconds
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Client credentials flow failed for API {Api}", request.TargetApi);
            return StatusCode(500, new { error = "Client credentials flow failed", details = ex.Message });
        }
    }
}
