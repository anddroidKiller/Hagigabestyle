namespace Hagigabestyle.API.Models;

public class OrderStatusHistory
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public Order? Order { get; set; }

    public OrderStatus OldStatus { get; set; }
    public OrderStatus NewStatus { get; set; }

    public string ChangedByUsername { get; set; } = string.Empty;
    public string ChangedByFullName { get; set; } = string.Empty;

    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
}
