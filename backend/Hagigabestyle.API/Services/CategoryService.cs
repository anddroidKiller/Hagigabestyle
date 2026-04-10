using Microsoft.EntityFrameworkCore;
using Hagigabestyle.API.Data;
using Hagigabestyle.API.DTOs;
using Hagigabestyle.API.Models;

namespace Hagigabestyle.API.Services;

public class CategoryService
{
    private readonly AppDbContext _db;

    public CategoryService(AppDbContext db) => _db = db;

    public async Task<List<CategoryDto>> GetAllAsync(bool activeOnly = true)
    {
        var query = _db.Categories.AsQueryable();
        if (activeOnly) query = query.Where(c => c.IsActive);

        return await query
            .OrderBy(c => c.SortOrder)
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                NameHe = c.NameHe,
                NameEn = c.NameEn,
                ImageUrl = c.ImageUrl,
                SortOrder = c.SortOrder,
                IsActive = c.IsActive,
                ProductCount = c.Products.Count(p => p.IsActive)
            })
            .ToListAsync();
    }

    public async Task<CategoryDto?> GetByIdAsync(int id)
    {
        return await _db.Categories
            .Where(c => c.Id == id)
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                NameHe = c.NameHe,
                NameEn = c.NameEn,
                ImageUrl = c.ImageUrl,
                SortOrder = c.SortOrder,
                IsActive = c.IsActive,
                ProductCount = c.Products.Count(p => p.IsActive)
            })
            .FirstOrDefaultAsync();
    }

    public async Task<CategoryDto> CreateAsync(CreateCategoryDto dto)
    {
        var category = new Category
        {
            NameHe = dto.NameHe,
            NameEn = dto.NameEn,
            ImageUrl = dto.ImageUrl,
            SortOrder = dto.SortOrder,
            IsActive = dto.IsActive
        };

        _db.Categories.Add(category);
        await _db.SaveChangesAsync();

        return new CategoryDto
        {
            Id = category.Id,
            NameHe = category.NameHe,
            NameEn = category.NameEn,
            ImageUrl = category.ImageUrl,
            SortOrder = category.SortOrder,
            IsActive = category.IsActive,
            ProductCount = 0
        };
    }

    public async Task<CategoryDto?> UpdateAsync(int id, UpdateCategoryDto dto)
    {
        var category = await _db.Categories.FindAsync(id);
        if (category == null) return null;

        category.NameHe = dto.NameHe;
        category.NameEn = dto.NameEn;
        category.ImageUrl = dto.ImageUrl;
        category.SortOrder = dto.SortOrder;
        category.IsActive = dto.IsActive;

        await _db.SaveChangesAsync();

        return await GetByIdAsync(id);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var category = await _db.Categories.FindAsync(id);
        if (category == null) return false;

        _db.Categories.Remove(category);
        await _db.SaveChangesAsync();
        return true;
    }
}
