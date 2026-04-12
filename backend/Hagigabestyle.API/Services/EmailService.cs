using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Hagigabestyle.API.DTOs;

namespace Hagigabestyle.API.Services;

public class EmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    public EmailService(IConfiguration config, ILogger<EmailService> logger, IHttpClientFactory httpClientFactory)
    {
        _config = config;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }

    public async Task SendOrderConfirmationAsync(OrderDto order)
    {
        _logger.LogInformation("[EMAIL] Starting email send for order #{OrderId}", order.Id);

        if (string.IsNullOrWhiteSpace(order.CustomerEmail))
        {
            _logger.LogWarning("[EMAIL] No email address for order #{OrderId}, skipping", order.Id);
            return;
        }

        var apiKey = _config["Email:BrevoApiKey"];
        var fromEmail = _config["Email:FromEmail"] ?? "service@hagigabestyle.co.il";
        var fromName = _config["Email:FromName"] ?? "חגיגה בסטייל";

        _logger.LogInformation("[EMAIL] Config: ApiKey={KeySet}, From={From}",
            string.IsNullOrEmpty(apiKey) ? "(NOT SET)" : "***set***", fromEmail);

        if (string.IsNullOrEmpty(apiKey))
        {
            _logger.LogError("[EMAIL] Brevo API key not configured! Set Email__BrevoApiKey env var");
            return;
        }

        try
        {
            var html = BuildOrderEmailHtml(order);

            var payload = new
            {
                sender = new { name = fromName, email = fromEmail },
                to = new[] { new { email = order.CustomerEmail, name = order.CustomerName } },
                subject = $"חגיגה בסטייל - אישור הזמנה #{order.Id}",
                htmlContent = html
            };

            var json = JsonSerializer.Serialize(payload);

            using var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("api-key", apiKey);
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            _logger.LogInformation("[EMAIL] Sending via Brevo HTTP API to {To}...", order.CustomerEmail);

            var response = await client.PostAsync(
                "https://api.brevo.com/v3/smtp/email",
                new StringContent(json, Encoding.UTF8, "application/json"));

            var responseBody = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("[EMAIL] Sent successfully for order #{OrderId} to {Email}. Response: {Response}",
                    order.Id, order.CustomerEmail, responseBody);
            }
            else
            {
                _logger.LogError("[EMAIL] Brevo API returned {StatusCode} for order #{OrderId}: {Response}",
                    response.StatusCode, order.Id, responseBody);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[EMAIL] FAILED for order #{OrderId} to {Email}: {Message}",
                order.Id, order.CustomerEmail, ex.Message);
        }
    }

    private static string BuildOrderEmailHtml(OrderDto order)
    {
        var itemRows = string.Join("", order.Items.Select(item =>
            $"""
            <tr>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;">{item.NameHe}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">{item.Quantity}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:left;">₪{item.UnitPrice:F2}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:left;">₪{(item.UnitPrice * item.Quantity):F2}</td>
            </tr>
            """));

        return $"""
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head><meta charset="UTF-8"></head>
        <body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f5f5f5;">
            <div style="max-width:600px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                <!-- Header -->
                <div style="background:linear-gradient(135deg,#c9a54e,#a17d3f);padding:30px;text-align:center;">
                    <h1 style="color:#fff;margin:0;font-size:28px;">חגיגה בסטייל</h1>
                    <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;">אישור הזמנה</p>
                </div>

                <!-- Content -->
                <div style="padding:30px;">
                    <p style="font-size:18px;color:#333;">שלום {order.CustomerName},</p>
                    <p style="color:#666;">תודה על הזמנתך! להלן פרטי ההזמנה:</p>

                    <!-- Order Info -->
                    <div style="background:#f9f7f2;border-radius:8px;padding:16px;margin:20px 0;">
                        <table style="width:100%;border-collapse:collapse;">
                            <tr>
                                <td style="padding:4px 0;color:#888;">מספר הזמנה:</td>
                                <td style="padding:4px 0;font-weight:bold;">#{order.Id}</td>
                            </tr>
                            <tr>
                                <td style="padding:4px 0;color:#888;">תאריך:</td>
                                <td style="padding:4px 0;">{order.CreatedAt:dd/MM/yyyy HH:mm}</td>
                            </tr>
                            <tr>
                                <td style="padding:4px 0;color:#888;">טלפון:</td>
                                <td style="padding:4px 0;">{order.CustomerPhone}</td>
                            </tr>
                            {(string.IsNullOrEmpty(order.ShippingAddress) ? "" : $"""
                            <tr>
                                <td style="padding:4px 0;color:#888;">כתובת משלוח:</td>
                                <td style="padding:4px 0;">{order.ShippingAddress}, {order.City}</td>
                            </tr>
                            """)}
                        </table>
                    </div>

                    <!-- Items Table -->
                    <table style="width:100%;border-collapse:collapse;margin:20px 0;">
                        <thead>
                            <tr style="background:#f9f7f2;">
                                <th style="padding:10px 12px;text-align:right;font-weight:600;">פריט</th>
                                <th style="padding:10px 12px;text-align:center;font-weight:600;">כמות</th>
                                <th style="padding:10px 12px;text-align:left;font-weight:600;">מחיר</th>
                                <th style="padding:10px 12px;text-align:left;font-weight:600;">סה״כ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itemRows}
                        </tbody>
                    </table>

                    <!-- Total -->
                    <div style="text-align:left;margin:20px 0;padding:16px;background:#c9a54e;border-radius:8px;">
                        <span style="color:#fff;font-size:20px;font-weight:bold;">סה״כ לתשלום: ₪{order.TotalAmount:F2}</span>
                    </div>

                    {(string.IsNullOrEmpty(order.Notes) ? "" : $"""
                    <div style="margin:16px 0;padding:12px;background:#fff3cd;border-radius:8px;">
                        <strong>הערות:</strong> {order.Notes}
                    </div>
                    """)}

                    <p style="color:#666;margin-top:24px;">נשמח לעמוד לשירותך!</p>
                </div>

                <!-- Footer -->
                <div style="background:#f5f5f5;padding:20px;text-align:center;color:#999;font-size:13px;">
                    <p style="margin:0;">חגיגה בסטייל | www.hagigabestyle.co.il</p>
                </div>
            </div>
        </body>
        </html>
        """;
    }
}
