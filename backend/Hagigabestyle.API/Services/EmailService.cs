using MailKit.Net.Smtp;
using MimeKit;
using Hagigabestyle.API.DTOs;

namespace Hagigabestyle.API.Services;

public class EmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendOrderConfirmationAsync(OrderDto order)
    {
        _logger.LogInformation("[EMAIL] Starting email send for order #{OrderId}", order.Id);

        if (string.IsNullOrWhiteSpace(order.CustomerEmail))
        {
            _logger.LogWarning("[EMAIL] No email address for order #{OrderId}, skipping", order.Id);
            return;
        }

        var host = _config["Email:SmtpHost"] ?? "smtp-relay.brevo.com";
        var portStr = _config["Email:SmtpPort"] ?? "587";
        var user = _config["Email:SmtpUser"];
        var pass = _config["Email:SmtpPassword"];
        var fromEmail = _config["Email:FromEmail"] ?? "noreply@hagigabestyle.co.il";
        var fromName = _config["Email:FromName"] ?? "חגיגה בסטייל";

        _logger.LogInformation("[EMAIL] Config: Host={Host}, Port={Port}, User={User}, From={From}",
            host, portStr, string.IsNullOrEmpty(user) ? "(NOT SET)" : user, fromEmail);

        if (string.IsNullOrEmpty(user) || string.IsNullOrEmpty(pass))
        {
            _logger.LogError("[EMAIL] SMTP credentials not configured! Set Email__SmtpUser and Email__SmtpPassword env vars");
            return;
        }

        try
        {
            var port = int.Parse(portStr);

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(fromName, fromEmail));
            message.To.Add(MailboxAddress.Parse(order.CustomerEmail));
            message.Subject = $"חגיגה בסטייל - אישור הזמנה #{order.Id}";

            var html = BuildOrderEmailHtml(order);
            message.Body = new TextPart("html") { Text = html };

            _logger.LogInformation("[EMAIL] Connecting to SMTP {Host}:{Port}...", host, port);
            using var client = new SmtpClient();
            await client.ConnectAsync(host, port, MailKit.Security.SecureSocketOptions.StartTls);
            _logger.LogInformation("[EMAIL] Connected. Authenticating as {User}...", user);

            await client.AuthenticateAsync(user, pass);
            _logger.LogInformation("[EMAIL] Authenticated. Sending to {To}...", order.CustomerEmail);

            await client.SendAsync(message);
            _logger.LogInformation("[EMAIL] Sent successfully for order #{OrderId} to {Email}", order.Id, order.CustomerEmail);

            await client.DisconnectAsync(true);
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
