using Microsoft.AspNetCore.Mvc;
using Hagigabestyle.API.DTOs;
using Hagigabestyle.API.Services;

namespace Hagigabestyle.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly OrderService _orderService;
    private readonly TranzilaService _tranzilaService;
    private readonly EmailService _emailService;
    private readonly IServiceScopeFactory _scopeFactory;

    public OrdersController(OrderService orderService, TranzilaService tranzilaService, EmailService emailService, IServiceScopeFactory scopeFactory)
    {
        _orderService = orderService;
        _tranzilaService = tranzilaService;
        _emailService = emailService;
        _scopeFactory = scopeFactory;
    }

    [HttpPost]
    public async Task<ActionResult<CreateOrderResultDto>> Create([FromBody] CreateOrderDto dto)
    {
        var result = await _orderService.CreateAsync(dto);
        result.PaymentUrl = _tranzilaService.GeneratePaymentUrl(result.OrderId, result.TotalAmount, dto.CustomerEmail);

        // Send email in background with its own DI scope
        var orderId = result.OrderId;
        _ = Task.Run(async () =>
        {
            using var scope = _scopeFactory.CreateScope();
            var orderService = scope.ServiceProvider.GetRequiredService<OrderService>();
            var emailService = scope.ServiceProvider.GetRequiredService<EmailService>();
            var order = await orderService.GetByIdAsync(orderId);
            if (order != null)
                await emailService.SendOrderConfirmationAsync(order);
        });

        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<OrderDto>> GetById(int id)
    {
        var order = await _orderService.GetByIdAsync(id);
        return order == null ? NotFound() : Ok(order);
    }
}
