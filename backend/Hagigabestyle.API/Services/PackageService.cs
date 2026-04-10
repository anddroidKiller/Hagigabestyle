using Microsoft.EntityFrameworkCore;
using Hagigabestyle.API.Data;
using Hagigabestyle.API.DTOs;
using Hagigabestyle.API.Models;

namespace Hagigabestyle.API.Services;

public class PackageService
{
    private readonly AppDbContext _db;

    public PackageService(AppDbContext db) => _db = db;

    public async Task<List<PackageDto>> GetAllAsync(bool activeOnly = true)
    {
        var query = _db.Packages
            .Include(p => p.PackageItems)
            .ThenInclude(pi => pi.Product)
            .AsQueryable();

        if (activeOnly) query = query.Where(p => p.IsActive);

        return await query
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => MapToDto(p))
            .ToListAsync();
    }

    public async Task<PackageDto?> GetByIdAsync(int id)
    {
        return await _db.Packages
            .Include(p => p.PackageItems)
            .ThenInclude(pi => pi.Product)
            .Where(p => p.Id == id)
            .Select(p => MapToDto(p))
            .FirstOrDefaultAsync();
    }

    public async Task<PackageDto> CreateAsync(CreatePackageDto dto)
    {
        var package = new Package
        {
            NameHe = dto.NameHe,
            NameEn = dto.NameEn,
            DescriptionHe = dto.DescriptionHe,
            DescriptionEn = dto.DescriptionEn,
            Price = dto.Price,
            OriginalPrice = dto.OriginalPrice,
            ImageUrl = dto.ImageUrl,
            IsActive = dto.IsActive,
            PackageItems = dto.Items.Select(i => new PackageItem
            {
                ProductId = i.ProductId,
                Quantity = i.Quantity
            }).ToList()
        };

        _db.Packages.Add(package);
        await _db.SaveChangesAsync();

        return (await GetByIdAsync(package.Id))!;
    }

    public async Task<PackageDto?> UpdateAsync(int id, UpdatePackageDto dto)
    {
        var package = await _db.Packages
            .Include(p => p.PackageItems)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (package == null) return null;

        package.NameHe = dto.NameHe;
        package.NameEn = dto.NameEn;
        package.DescriptionHe = dto.DescriptionHe;
        package.DescriptionEn = dto.DescriptionEn;
        package.Price = dto.Price;
        package.OriginalPrice = dto.OriginalPrice;
        package.ImageUrl = dto.ImageUrl;
        package.IsActive = dto.IsActive;

        _db.PackageItems.RemoveRange(package.PackageItems);
        package.PackageItems = dto.Items.Select(i => new PackageItem
        {
            ProductId = i.ProductId,
            Quantity = i.Quantity
        }).ToList();

        await _db.SaveChangesAsync();

        return await GetByIdAsync(id);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var package = await _db.Packages.Include(p => p.PackageItems).FirstOrDefaultAsync(p => p.Id == id);
        if (package == null) return false;

        _db.PackageItems.RemoveRange(package.PackageItems);
        _db.Packages.Remove(package);
        await _db.SaveChangesAsync();
        return true;
    }

    private static PackageDto MapToDto(Package p) => new()
    {
        Id = p.Id,
        NameHe = p.NameHe,
        NameEn = p.NameEn,
        DescriptionHe = p.DescriptionHe,
        DescriptionEn = p.DescriptionEn,
        Price = p.Price,
        OriginalPrice = p.OriginalPrice,
        ImageUrl = p.ImageUrl,
        IsActive = p.IsActive,
        Items = p.PackageItems.Select(pi => new PackageItemDto
        {
            ProductId = pi.ProductId,
            ProductNameHe = pi.Product.NameHe,
            ProductNameEn = pi.Product.NameEn,
            Quantity = pi.Quantity
        }).ToList()
    };
}
