using Microsoft.EntityFrameworkCore;
using Hagigabestyle.API.Data;
using Hagigabestyle.API.DTOs;
using Hagigabestyle.API.Models;

namespace Hagigabestyle.API.Services;

public class OrderService
{
    private readonly AppDbContext _db;

    public OrderService(AppDbContext db) => _db = db;

    public async Task<CreateOrderResultDto> CreateAsync(CreateOrderDto dto)
    {
        decimal totalAmount = 0;
        var orderItems = new List<OrderItem>();

        foreach (var item in dto.Items)
        {
            decimal unitPrice = 0;

            if (item.ProductId.HasValue)
            {
                var product = await _db.Products.FindAsync(item.ProductId.Value);
                if (product == null) throw new ArgumentException($"Product {item.ProductId} not found");
                unitPrice = product.Price;
            }
            else if (item.PackageId.HasValue)
            {
                var package = await _db.Packages.FindAsync(item.PackageId.Value);
                if (package == null) throw new ArgumentException($"Package {item.PackageId} not found");
                unitPrice = package.Price;
            }

            totalAmount += unitPrice * item.Quantity;
            orderItems.Add(new OrderItem
            {
                ProductId = item.ProductId,
                PackageId = item.PackageId,
                Quantity = item.Quantity,
                UnitPrice = unitPrice
            });
        }

        var order = new Order
        {
            CustomerName = dto.CustomerName,
            CustomerPhone = dto.CustomerPhone,
            CustomerEmail = dto.CustomerEmail,
            ShippingAddress = dto.ShippingMethod == ShippingMethod.Pickup ? null : dto.ShippingAddress,
            City = dto.ShippingMethod == ShippingMethod.Pickup ? null : dto.City,
            ShippingMethod = dto.ShippingMethod,
            Notes = dto.Notes,
            TotalAmount = totalAmount,
            Status = OrderStatus.Pending,
            OrderItems = orderItems
        };

        _db.Orders.Add(order);
        await _db.SaveChangesAsync();

        return new CreateOrderResultDto
        {
            OrderId = order.Id,
            TotalAmount = totalAmount,
            PaymentUrl = null
        };
    }

    public async Task<List<OrderDto>> GetAllAsync()
    {
        return await _db.Orders
            .Include(o => o.OrderItems).ThenInclude(oi => oi.Product)
            .Include(o => o.OrderItems).ThenInclude(oi => oi.Package)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => MapToDto(o))
            .ToListAsync();
    }

    public async Task<OrderDto?> GetByIdAsync(int id)
    {
        return await _db.Orders
            .Include(o => o.OrderItems).ThenInclude(oi => oi.Product)
            .Include(o => o.OrderItems).ThenInclude(oi => oi.Package)
            .Where(o => o.Id == id)
            .Select(o => MapToDto(o))
            .FirstOrDefaultAsync();
    }

    public async Task<OrderDto?> UpdateAsync(int id, UpdateOrderDto dto)
    {
        var order = await _db.Orders
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return null;

        // Rebuild items, repricing from current product/package prices
        decimal totalAmount = 0;
        var newItems = new List<OrderItem>();
        foreach (var item in dto.Items)
        {
            if (item.Quantity <= 0) continue;

            decimal unitPrice;
            if (item.ProductId.HasValue)
            {
                var product = await _db.Products.FindAsync(item.ProductId.Value)
                              ?? throw new ArgumentException($"Product {item.ProductId} not found");
                unitPrice = product.Price;
            }
            else if (item.PackageId.HasValue)
            {
                var package = await _db.Packages.FindAsync(item.PackageId.Value)
                              ?? throw new ArgumentException($"Package {item.PackageId} not found");
                unitPrice = package.Price;
            }
            else
            {
                continue;
            }

            totalAmount += unitPrice * item.Quantity;
            newItems.Add(new OrderItem
            {
                OrderId = order.Id,
                ProductId = item.ProductId,
                PackageId = item.PackageId,
                Quantity = item.Quantity,
                UnitPrice = unitPrice,
            });
        }

        _db.OrderItems.RemoveRange(order.OrderItems);
        order.OrderItems = newItems;
        order.TotalAmount = totalAmount;
        order.ShippingMethod = dto.ShippingMethod;
        order.ShippingAddress = dto.ShippingMethod == ShippingMethod.Pickup ? null : dto.ShippingAddress;
        order.City = dto.ShippingMethod == ShippingMethod.Pickup ? null : dto.City;
        order.Notes = dto.Notes;

        await _db.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task<bool> UpdateStatusAsync(int id, OrderStatus status, string username, string fullName)
    {
        var order = await _db.Orders.FindAsync(id);
        if (order == null) return false;

        var oldStatus = order.Status;
        if (oldStatus == status)
        {
            // No change — nothing to record
            return true;
        }

        order.Status = status;

        _db.OrderStatusHistories.Add(new OrderStatusHistory
        {
            OrderId = order.Id,
            OldStatus = oldStatus,
            NewStatus = status,
            ChangedByUsername = username,
            ChangedByFullName = fullName,
            ChangedAt = DateTime.UtcNow,
        });

        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<List<OrderStatusHistoryDto>> GetStatusHistoryAsync(int orderId)
    {
        return await _db.OrderStatusHistories
            .Where(h => h.OrderId == orderId)
            .OrderByDescending(h => h.ChangedAt)
            .Select(h => new OrderStatusHistoryDto
            {
                Id = h.Id,
                OrderId = h.OrderId,
                OldStatus = h.OldStatus.ToString(),
                NewStatus = h.NewStatus.ToString(),
                ChangedByUsername = h.ChangedByUsername,
                ChangedByFullName = h.ChangedByFullName,
                ChangedAt = h.ChangedAt,
            })
            .ToListAsync();
    }

    public async Task<DashboardDto> GetDashboardAsync()
    {
        var orders = _db.Orders.AsQueryable();

        return new DashboardDto
        {
            TotalOrders = await orders.CountAsync(),
            PendingOrders = await orders.CountAsync(o => o.Status == OrderStatus.Pending),
            TotalRevenue = await orders.Where(o => o.Status == OrderStatus.Paid || o.Status == OrderStatus.Delivered).SumAsync(o => o.TotalAmount),
            TotalProducts = await _db.Products.CountAsync(p => p.IsActive),
            TotalPackages = await _db.Packages.CountAsync(p => p.IsActive),
            RecentOrders = await orders
                .OrderByDescending(o => o.CreatedAt)
                .Take(10)
                .Select(o => new RecentOrderDto
                {
                    Id = o.Id,
                    CustomerName = o.CustomerName,
                    TotalAmount = o.TotalAmount,
                    Status = o.Status.ToString(),
                    CreatedAt = o.CreatedAt
                })
                .ToListAsync()
        };
    }

    private static OrderDto MapToDto(Order o) => new()
    {
        Id = o.Id,
        CustomerName = o.CustomerName,
        CustomerPhone = o.CustomerPhone,
        CustomerEmail = o.CustomerEmail,
        ShippingAddress = o.ShippingAddress,
        City = o.City,
        ShippingMethod = o.ShippingMethod.ToString(),
        TotalAmount = o.TotalAmount,
        Status = o.Status.ToString(),
        Notes = o.Notes,
        CreatedAt = o.CreatedAt,
        Items = o.OrderItems.Select(oi => new OrderItemDto
        {
            ProductId = oi.ProductId,
            PackageId = oi.PackageId,
            NameHe = oi.Product?.NameHe ?? oi.Package?.NameHe ?? "",
            NameEn = oi.Product?.NameEn ?? oi.Package?.NameEn ?? "",
            Quantity = oi.Quantity,
            UnitPrice = oi.UnitPrice
        }).ToList()
    };
}
