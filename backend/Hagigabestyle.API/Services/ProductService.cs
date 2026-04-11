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

        return await query
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => MapToDto(p))
            .ToListAsync();
    }

    public async Task<ProductDto?> GetByIdAsync(int id)
    {
        return await _db.Products
            .Include(p => p.Category)
            .Where(p => p.Id == id)
            .Select(p => MapToDto(p))
            .FirstOrDefaultAsync();
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
            Barcode = dto.Barcode,
            ImageUrl = dto.ImageUrl,
            CategoryId = dto.CategoryId,
            StockQuantity = dto.StockQuantity,
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
        product.Barcode = dto.Barcode;
        product.ImageUrl = dto.ImageUrl;
        product.CategoryId = dto.CategoryId;
        product.StockQuantity = dto.StockQuantity;
        product.IsActive = dto.IsActive;

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

    private static ProductDto MapToDto(Product p) => new()
    {
        Id = p.Id,
        NameHe = p.NameHe,
        NameEn = p.NameEn,
        DescriptionHe = p.DescriptionHe,
        DescriptionEn = p.DescriptionEn,
        Price = p.Price,
        Barcode = p.Barcode,
        ImageUrl = p.ImageUrl,
        CategoryId = p.CategoryId,
        CategoryNameHe = p.Category.NameHe,
        CategoryNameEn = p.Category.NameEn,
        StockQuantity = p.StockQuantity,
        IsActive = p.IsActive
    };
}
