using Microsoft.EntityFrameworkCore;
using Hagigabestyle.API.Data;
using Hagigabestyle.API.DTOs;
using Hagigabestyle.API.Models;

namespace Hagigabestyle.API.Services;

public class ProductService
{
    private readonly AppDbContext _db;

    public ProductService(AppDbContext db) => _db = db;

    public async Task<List<ProductDto>> GetAllAsync(int? categoryId = null, bool activeOnly = true)
    {
        var query = _db.Products.Include(p => p.Category).AsQueryable();
        if (activeOnly) query = query.Where(p => p.IsActive);
        if (categoryId.HasValue) query = query.Where(p => p.CategoryId == categoryId.Value);

        var products = await query
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return products.Select(MapToDto).ToList();
    }

    public async Task<ProductDto?> GetByIdAsync(int id)
    {
        var product = await _db.Products
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == id);
        return product == null ? null : MapToDto(product);
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
            IsActive = dto.IsActive
        };

        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        await _db.Entry(product).Reference(p => p.Category).LoadAsync();

        return MapToDto(product);
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
        product.IsActive = dto.IsActive;

        await _db.SaveChangesAsync();

        return MapToDto(product);
    }

    public async Task<ProductDto?> UpdateInventoryAsync(int id, UpdateInventoryDto dto)
    {
        var product = await _db.Products.Include(p => p.Category).FirstOrDefaultAsync(p => p.Id == id);
        if (product == null) return null;

        product.StockQuantityStore = Math.Max(0, dto.StockQuantityStore);
        product.StockQuantityWarehouse = Math.Max(0, dto.StockQuantityWarehouse);

        await _db.SaveChangesAsync();
        return MapToDto(product);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null) return false;

        _db.Products.Remove(product);
        await _db.SaveChangesAsync();
        return true;
    }

    private static ProductDto MapToDto(Product p)
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
            StockQuantity = total,
            ProfitMargin = margin,
            IsActive = p.IsActive
        };
    }
}
