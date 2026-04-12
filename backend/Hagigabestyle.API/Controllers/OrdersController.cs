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

    public OrdersController(OrderService orderService, TranzilaService tranzilaService, EmailService emailService)
    {
        _orderService = orderService;
        _tranzilaService = tranzilaService;
        _emailService = emailService;
    }

    [HttpPost]
    public async Task<ActionResult<CreateOrderResultDto>> Create([FromBody] CreateOrderDto dto)
    {
        var result = await _orderService.CreateAsync(dto);
        result.PaymentUrl = _tranzilaService.GeneratePaymentUrl(result.OrderId, result.TotalAmount, dto.CustomerEmail);

        // Fire-and-forget email — don't block the response
        _ = Task.Run(async () =>
        {
            var order = await _orderService.GetByIdAsync(result.OrderId);
            if (order != null)
                await _emailService.SendOrderConfirmationAsync(order);
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
