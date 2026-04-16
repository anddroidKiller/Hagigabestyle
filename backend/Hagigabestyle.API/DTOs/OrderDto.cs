using Hagigabestyle.API.Models;

namespace Hagigabestyle.API.DTOs;

public class OrderDto
{
    public int Id { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string? CustomerEmail { get; set; }
    public string? ShippingAddress { get; set; }
    public string? City { get; set; }
    public string ShippingMethod { get; set; } = "Delivery";
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<OrderItemDto> Items { get; set; } = new();
}

public class OrderItemDto
{
    public int? ProductId { get; set; }
    public int? PackageId { get; set; }
    public string NameHe { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}

public class CreateOrderDto
{
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string? CustomerEmail { get; set; }
    public string? ShippingAddress { get; set; }
    public string? City { get; set; }
    public ShippingMethod ShippingMethod { get; set; } = ShippingMethod.Delivery;
    public string? Notes { get; set; }
    public List<CreateOrderItemDto> Items { get; set; } = new();
}

public class UpdateOrderDto
{
    public string? ShippingAddress { get; set; }
    public string? City { get; set; }
    public ShippingMethod ShippingMethod { get; set; } = ShippingMethod.Delivery;
    public string? Notes { get; set; }
    public List<CreateOrderItemDto> Items { get; set; } = new();
}

public class CreateOrderItemDto
{
    public int? ProductId { get; set; }
    public int? PackageId { get; set; }
    public int Quantity { get; set; }
}

public class UpdateOrderStatusDto
{
    public OrderStatus Status { get; set; }
}

public class CreateOrderResultDto
{
    public int OrderId { get; set; }
    public decimal TotalAmount { get; set; }
    public string? PaymentUrl { get; set; }
}

public class OrderStatusHistoryDto
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public string OldStatus { get; set; } = string.Empty;
    public string NewStatus { get; set; } = string.Empty;
    public string ChangedByUsername { get; set; } = string.Empty;
    public string ChangedByFullName { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; }
}
