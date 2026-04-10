namespace Hagigabestyle.API.Services;

public class TranzilaService
{
    private readonly IConfiguration _config;
    private readonly ILogger<TranzilaService> _logger;

    public TranzilaService(IConfiguration config, ILogger<TranzilaService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public string GeneratePaymentUrl(int orderId, decimal amount, string? customerEmail)
    {
        var terminalName = _config["Tranzila:TerminalName"];
        var sum = amount.ToString("F2");

        var queryParams = new Dictionary<string, string>
        {
            ["supplier"] = terminalName ?? "",
            ["sum"] = sum,
            ["currency"] = "1", // ILS
            ["orderId"] = orderId.ToString(),
            ["nologo"] = "1",
            ["trButtonColor"] = "c59c5c",
            ["cred_type"] = "1",
        };

        if (!string.IsNullOrEmpty(customerEmail))
            queryParams["contact"] = customerEmail;

        var qs = string.Join("&", queryParams.Select(kv => $"{kv.Key}={Uri.EscapeDataString(kv.Value)}"));
        return $"https://direct.tranzila.com/{terminalName}/iframenew.php?{qs}";
    }

    public bool VerifyCallback(Dictionary<string, string> callbackData)
    {
        if (!callbackData.TryGetValue("Response", out var response))
            return false;

        var isSuccess = response == "000";

        _logger.LogInformation(
            "Tranzila callback: Response={Response}, OrderId={OrderId}, Success={Success}",
            response,
            callbackData.GetValueOrDefault("orderId"),
            isSuccess);

        return isSuccess;
    }
}
