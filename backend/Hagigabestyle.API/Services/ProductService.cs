using Microsoft.EntityFrameworkCore;
using Hagigabestyle.API.Data;
using Hagigabestyle.API.DTOs;
using Hagigabestyle.API.Models;

namespace Hagigabestyle.API.Services;

public class ProductService
{
    private readonly AppDbContext _db;

    // A product is "hot" when MORE than this many units were sold in the trailing window.
    public const int HotThreshold = 5;
    public static readonly TimeSpan HotWindow = TimeSpan.FromDays(30);

    private static readonly OrderStatus[] _saleCountingStatuses =
    {
        OrderStatus.Paid,
        OrderStatus.Processing,
        OrderStatus.Shipped,
        OrderStatus.Delivered,
    };

    public ProductService(AppDbContext db) => _db = db;

    public async Task<List<ProductDto>> GetAllAsync(int? categoryId = null, bool activeOnly = true)
    {
        var query = _db.Products.Include(p => p.Category).AsQueryable();
        if (activeOnly) query = query.Where(p => p.IsActive);
        if (categoryId.HasValue) query = query.Where(p => p.CategoryId == categoryId.Value);

        var products = await query
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        var ids = products.Select(p => p.Id).ToList();
        var salesByProduct = await GetMonthlySalesAsync(ids);
        return products.Select(p => MapToDto(p, salesByProduct.GetValueOrDefault(p.Id, 0))).ToList();
    }

    public async Task<List<ProductDto>> GetHotAsync(int limit = 8)
    {
        var since = DateTime.UtcNow - HotWindow;

        var hotIds = await _db.OrderItems
            .Where(oi => oi.ProductId != null
                         && _saleCountingStatuses.Contains(oi.Order!.Status)
                         && oi.Order.CreatedAt >= since)
            .GroupBy(oi => oi.ProductId!.Value)
            .Select(g => new { ProductId = g.Key, Sold = g.Sum(oi => oi.Quantity) })
            .Where(x => x.Sold > HotThreshold)
            .OrderByDescending(x => x.Sold)
            .Take(limit)
            .ToListAsync();

        if (hotIds.Count == 0) return new List<ProductDto>();

        var idList = hotIds.Select(x => x.ProductId).ToList();
        var products = await _db.Products
            .Include(p => p.Category)
            .Where(p => p.IsActive && idList.Contains(p.Id))
            .ToListAsync();

        var salesLookup = hotIds.ToDictionary(x => x.ProductId, x => x.Sold);
        return products
            .OrderByDescending(p => salesLookup.GetValueOrDefault(p.Id, 0))
            .Select(p => MapToDto(p, salesLookup.GetValueOrDefault(p.Id, 0)))
            .ToList();
    }

    public async Task<ProductDto?> GetByIdAsync(int id)
    {
        var product = await _db.Products
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (product == null) return null;
        var sales = await GetMonthlySalesAsync(new List<int> { id });
        return MapToDto(product, sales.GetValueOrDefault(id, 0));
    }

    private async Task<Dictionary<int, int>> GetMonthlySalesAsync(IReadOnlyCollection<int> productIds)
    {
        if (productIds.Count == 0) return new Dictionary<int, int>();
        var since = DateTime.UtcNow - HotWindow;

        var rows = await _db.OrderItems
            .Where(oi => oi.ProductId != null
                         && productIds.Contains(oi.ProductId.Value)
                         && _saleCountingStatuses.Contains(oi.Order!.Status)
                         && oi.Order.CreatedAt >= since)
            .GroupBy(oi => oi.ProductId!.Value)
            .Select(g => new { ProductId = g.Key, Sold = g.Sum(oi => oi.Quantity) })
            .ToListAsync();

        return rows.ToDictionary(r => r.ProductId, r => r.Sold);
    }

    public async Task<ProductDto> CreateAsync(CreateProductDto dto)
    {
        var product = new Product
        {
            NameHe = dto.NameHe,
            NameEn = dto.NameEn,
            DescriptionHe = dto.DescriptionHe,
            DescriptionEn = dto.DescriptionEn,
            Price = dto.Price,
            CostPrice = dto.CostPrice,
            Barcode = dto.Barcode,
            ImageUrl = dto.ImageUrl,
            CategoryId = dto.CategoryId,
            StockQuantityStore = dto.StockQuantityStore,
            StockQuantityWarehouse = dto.StockQuantityWarehouse,
            LocationStore = string.IsNullOrWhiteSpace(dto.LocationStore) ? null : dto.LocationStore.Trim(),
            LocationWarehouse = string.IsNullOrWhiteSpace(dto.LocationWarehouse) ? null : dto.LocationWarehouse.Trim(),
            IsActive = dto.IsActive
        };

        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        await _db.Entry(product).Reference(p => p.Category).LoadAsync();

        return MapToDto(product, 0);
    }

    public async Task<ProductDto?> UpdateAsync(int id, UpdateProductDto dto)
    {
        var product = await _db.Products.Include(p => p.Category).FirstOrDefaultAsync(p => p.Id == id);
        if (product == null) return null;

        product.NameHe = dto.NameHe;
        product.NameEn = dto.NameEn;
        product.DescriptionHe = dto.DescriptionHe;
        product.DescriptionEn = dto.DescriptionEn;
        product.Price = dto.Price;
        product.CostPrice = dto.CostPrice;
        product.Barcode = dto.Barcode;
        product.ImageUrl = dto.ImageUrl;
        product.CategoryId = dto.CategoryId;
        product.StockQuantityStore = dto.StockQuantityStore;
        product.StockQuantityWarehouse = dto.StockQuantityWarehouse;
        product.LocationStore = string.IsNullOrWhiteSpace(dto.LocationStore) ? null : dto.LocationStore.Trim();
        product.LocationWarehouse = string.IsNullOrWhiteSpace(dto.LocationWarehouse) ? null : dto.LocationWarehouse.Trim();
        product.IsActive = dto.IsActive;

        await _db.SaveChangesAsync();

        var sales = await GetMonthlySalesAsync(new List<int> { id });
        return MapToDto(product, sales.GetValueOrDefault(id, 0));
    }

    public async Task<ProductDto?> UpdateInventoryAsync(int id, UpdateInventoryDto dto)
    {
        var product = await _db.Products.Include(p => p.Category).FirstOrDefaultAsync(p => p.Id == id);
        if (product == null) return null;

        product.StockQuantityStore = Math.Max(0, dto.StockQuantityStore);
        product.StockQuantityWarehouse = Math.Max(0, dto.StockQuantityWarehouse);
        product.LocationStore = string.IsNullOrWhiteSpace(dto.LocationStore) ? null : dto.LocationStore.Trim();
        product.LocationWarehouse = string.IsNullOrWhiteSpace(dto.LocationWarehouse) ? null : dto.LocationWarehouse.Trim();

        await _db.SaveChangesAsync();
        var sales = await GetMonthlySalesAsync(new List<int> { id });
        return MapToDto(product, sales.GetValueOrDefault(id, 0));
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null) return false;

        _db.Products.Remove(product);
        await _db.SaveChangesAsync();
        return true;
    }

    private static ProductDto MapToDto(Product p, int monthlySales)
    {
        var total = p.StockQuantityStore + p.StockQuantityWarehouse;
        var margin = p.Price > 0
            ? Math.Round((p.Price - p.CostPrice) / p.Price * 100m, 2)
            : 0m;
        return new ProductDto
        {
            Id = p.Id,
            NameHe = p.NameHe,
            NameEn = p.NameEn,
            DescriptionHe = p.DescriptionHe,
            DescriptionEn = p.DescriptionEn,
            Price = p.Price,
            CostPrice = p.CostPrice,
            Barcode = p.Barcode,
            ImageUrl = p.ImageUrl,
            CategoryId = p.CategoryId,
            CategoryNameHe = p.Category.NameHe,
            CategoryNameEn = p.Category.NameEn,
            StockQuantityStore = p.StockQuantityStore,
            StockQuantityWarehouse = p.StockQuantityWarehouse,
            LocationStore = p.LocationStore,
            LocationWarehouse = p.LocationWarehouse,
            StockQuantity = total,
            ProfitMargin = margin,
            MonthlySalesCount = monthlySales,
            IsHot = monthlySales > HotThreshold,
            IsActive = p.IsActive
        };
    }
}
