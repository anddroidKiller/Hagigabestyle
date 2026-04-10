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

    public OrdersController(OrderService orderService, TranzilaService tranzilaService)
    {
        _orderService = orderService;
        _tranzilaService = tranzilaService;
    }

    [HttpPost]
    public async Task<ActionResult<CreateOrderResultDto>> Create([FromBody] CreateOrderDto dto)
    {
        var result = await _orderService.CreateAsync(dto);
        result.PaymentUrl = _tranzilaService.GeneratePaymentUrl(result.OrderId, result.TotalAmount, dto.CustomerEmail);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<OrderDto>> GetById(int id)
    {
        var order = await _orderService.GetByIdAsync(id);
        return order == null ? NotFound() : Ok(order);
    }
}
