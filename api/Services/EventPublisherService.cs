using System.Text.Json;
using Microsoft.Extensions.Options;
using AuthService.Configuration;

namespace AuthService.Services;

/// <summary>
/// Publica eventos no Azure Service Bus (Topic).
/// Se a ConnectionString não estiver configurada, os eventos são apenas logados (fallback seguro).
/// </summary>
public interface IEventPublisherService
{
    Task PublishAsync(string eventName, object data, string? tenantId = null);
}

public class EventPublisherService : IEventPublisherService
{
    private readonly ServiceBusConfig _config;
    private readonly ILogger<EventPublisherService> _logger;
    private readonly bool _isEnabled;

    // Lazy-initialized sender (only created if ServiceBus is configured)
    private Azure.Messaging.ServiceBus.ServiceBusClient? _client;
    private Azure.Messaging.ServiceBus.ServiceBusSender? _sender;

    public EventPublisherService(
        IOptions<ServiceBusConfig> config,
        ILogger<EventPublisherService> logger)
    {
        _config = config.Value;
        _logger = logger;
        _isEnabled = !string.IsNullOrEmpty(_config.ConnectionString);

        if (_isEnabled)
        {
            _client = new Azure.Messaging.ServiceBus.ServiceBusClient(_config.ConnectionString);
            _sender = _client.CreateSender(_config.TopicName);
            _logger.LogInformation("✅ EventPublisher: Service Bus configurado (Topic: {Topic})", _config.TopicName);
        }
        else
        {
            _logger.LogWarning("⚠️ EventPublisher: Service Bus não configurado — eventos serão apenas logados");
        }
    }

    public async Task PublishAsync(string eventName, object data, string? tenantId = null)
    {
        var envelope = new
        {
            eventName,
            correlationId = Guid.NewGuid().ToString(),
            tenantId = tenantId ?? "unknown",
            occurredAt = DateTimeOffset.UtcNow,
            data
        };

        var json = JsonSerializer.Serialize(envelope, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        });

        if (_isEnabled && _sender != null)
        {
            try
            {
                var message = new Azure.Messaging.ServiceBus.ServiceBusMessage(json)
                {
                    ContentType = "application/json",
                    Subject = eventName,
                    CorrelationId = envelope.correlationId
                };

                await _sender.SendMessageAsync(message);
                _logger.LogInformation("Event published: {EventName} (correlationId: {CorrelationId})",
                    eventName, envelope.correlationId);
            }
            catch (Exception ex)
            {
                // Falha no Service Bus NÃO deve derrubar a request — log e continua
                _logger.LogError(ex, "Failed to publish event {EventName} to Service Bus. Continuing without event.", eventName);
            }
        }
        else
        {
            // Fallback: apenas log (útil para dev/testes sem Service Bus)
            _logger.LogInformation("Event (local-only): {EventName} | Payload: {Payload}", eventName, json);
        }
    }
}
