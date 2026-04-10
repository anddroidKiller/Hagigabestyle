using Microsoft.AspNetCore.Mvc;
using Hagigabestyle.API.Models;
using Hagigabestyle.API.Services;

namespace Hagigabestyle.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly TranzilaService _tranzilaService;
    private readonly OrderService _orderService;
    private readonly ILogger<PaymentsController> _logger;

    public PaymentsController(TranzilaService tranzilaService, OrderService orderService, ILogger<PaymentsController> logger)
    {
        _tranzilaService = tranzilaService;
        _orderService = orderService;
        _logger = logger;
    }

    [HttpPost("tranzila-callback")]
    public async Task<IActionResult> TranzilaCallback()
    {
        var form = await Request.ReadFormAsync();
        var callbackData = form.ToDictionary(x => x.Key, x => x.Value.ToString());

        _logger.LogInformation("Tranzila callback received: {@Data}", callbackData);

        var isSuccess = _tranzilaService.VerifyCallback(callbackData);

        if (callbackData.TryGetValue("orderId", out var orderIdStr) && int.TryParse(orderIdStr, out var orderId))
        {
            var newStatus = isSuccess ? OrderStatus.Paid : OrderStatus.Cancelled;
            await _orderService.UpdateStatusAsync(orderId, newStatus);

            if (isSuccess && callbackData.TryGetValue("ConfirmationCode", out var confirmationCode))
            {
                _logger.LogInformation("Payment confirmed for order {OrderId}, confirmation: {Code}", orderId, confirmationCode);
            }
        }

        return Ok();
    }
}
