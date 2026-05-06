using AuthService.Configuration;
using AuthService.Middleware;
using AuthService.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Identity.Web;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Configure logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.SetMinimumLevel(LogLevel.Information);

// Bind configuration
builder.Services.Configure<AzureAdConfig>(builder.Configuration.GetSection("AzureAd"));
builder.Services.Configure<InternalJwtConfig>(builder.Configuration.GetSection("InternalJwt"));
builder.Services.Configure<AllowedTenantsConfig>(builder.Configuration.GetSection("AllowedTenants"));
builder.Services.Configure<DownstreamApisConfig>(builder.Configuration.GetSection("DownstreamApis"));
builder.Services.Configure<ServiceBusConfig>(builder.Configuration.GetSection("ServiceBus"));

// Add services
builder.Services.AddSingleton<IInternalTokenService, InternalTokenService>();
builder.Services.AddSingleton<IOboTokenService, OboTokenService>();
builder.Services.AddSingleton<IClientCredentialsService, ClientCredentialsService>();
builder.Services.AddSingleton<ITenantValidationService, TenantValidationService>();
builder.Services.AddSingleton<ICacheService, CacheService>();
builder.Services.AddSingleton<IEventPublisherService, EventPublisherService>();

// Cache: Redis se configurado, senão InMemory (fallback seguro)
var redisConnectionString = builder.Configuration.GetValue<string>("Redis:ConnectionString");

if (!string.IsNullOrEmpty(redisConnectionString))
{
    builder.Services.AddStackExchangeRedisCache(options =>
    {
        options.Configuration = redisConnectionString;
        options.InstanceName = builder.Configuration.GetValue<string>("Redis:InstanceName") ?? "AuthService:";
    });
    Console.WriteLine("✅ Cache: Azure Redis configurado");
}
else
{
    builder.Services.AddDistributedMemoryCache();
    Console.WriteLine("⚠️ Cache: InMemory (Redis não configurado — defina Redis:ConnectionString para produção)");
}

// Configure Authentication - Multi-tenant Entra ID
var azureAdSection = builder.Configuration.GetSection("AzureAd");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(options =>
    {
        builder.Configuration.Bind("AzureAd", options);
        options.TokenValidationParameters.ValidateIssuer = false; // Multi-tenant: validate in middleware
        options.TokenValidationParameters.ValidateAudience = true;
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                logger.LogWarning("Authentication failed: {Error}", context.Exception.Message);
                return Task.CompletedTask;
            },
            OnTokenValidated = async context =>
            {
                var tenantService = context.HttpContext.RequestServices.GetRequiredService<ITenantValidationService>();
                var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                
                var tid = context.Principal?.FindFirst("tid")?.Value;
                if (!string.IsNullOrEmpty(tid) && !tenantService.IsTenantAllowed(tid))
                {
                    logger.LogWarning("Tenant {TenantId} is not in the allowed list", tid);
                    context.Fail("Tenant not allowed");
                }
            }
        };
    }, options => { builder.Configuration.Bind("AzureAd", options); });

// Authorization policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireApiRead", policy =>
        policy.RequireAssertion(context =>
            context.User.HasClaim(c => c.Type == "scp" && c.Value.Contains("api.read")) ||
            context.User.HasClaim(c => c.Type == "http://schemas.microsoft.com/identity/claims/scope" && c.Value.Contains("api.read"))));

    options.AddPolicy("RequireApiWrite", policy =>
        policy.RequireAssertion(context =>
            context.User.HasClaim(c => c.Type == "scp" && c.Value.Contains("api.write")) ||
            context.User.HasClaim(c => c.Type == "http://schemas.microsoft.com/identity/claims/scope" && c.Value.Contains("api.write"))));

    options.AddPolicy("RequireAdminRole", policy =>
        policy.RequireRole("Admin", "admin"));

    options.AddPolicy("RequireUserRole", policy =>
        policy.RequireRole("User", "user", "Admin", "admin"));
});

// CORS — config-driven (cada aluno/ambiente pode ter origins distintas)
// Defina em App Service settings: Cors__AllowedOrigins__0, Cors__AllowedOrigins__1, ...
// Local dev (appsettings.Development.json) tem fallback com localhost.
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? new[] { "http://localhost:5173", "http://localhost:3000" };

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .WithHeaders("Content-Type", "Authorization", "X-Request-Id")
              .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
              .AllowCredentials()
              .SetPreflightMaxAge(TimeSpan.FromMinutes(10));
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "AuthService", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Cole apenas o ACCESS TOKEN (sem 'Bearer ')"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});


// Configure forwarded headers for reverse proxy
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

// Health checks
builder.Services.AddHealthChecks();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

// Use forwarded headers
app.UseForwardedHeaders();

// CORS — DEVE vir ANTES de Authentication/Authorization
app.UseCors();

// Custom middleware
app.UseMiddleware<RequestLoggingMiddleware>();
app.UseMiddleware<SecurityHeadersMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

// JWKS endpoint for internal tokens (Model 2)
app.MapGet("/.well-known/jwks.json", (IInternalTokenService tokenService) =>
{
    return Results.Ok(tokenService.GetJwks());
});

var port = Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ?? "http://+:8080";
app.Logger.LogInformation("AuthService starting on {Port}", port);

app.Run();

// Exposed for WebApplicationFactory<Program> in integration tests.
public partial class Program { }
