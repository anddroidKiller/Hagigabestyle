using Microsoft.EntityFrameworkCore;
using Hagigabestyle.API.Data;
using Hagigabestyle.API.DTOs;
using Hagigabestyle.API.Models;

namespace Hagigabestyle.API.Services;

public class SiteSettingsService
{
    private readonly AppDbContext _db;

    public SiteSettingsService(AppDbContext db) => _db = db;

    public async Task<SiteSettingsDto> GetAsync()
    {
        var row = await EnsureRowAsync();
        return new SiteSettingsDto
        {
            IsMaintenanceMode = row.IsMaintenanceMode,
            UpdatedAt = row.UpdatedAt,
        };
    }

    public async Task<SiteSettingsDto> SetMaintenanceAsync(bool enabled)
    {
        var row = await EnsureRowAsync();
        row.IsMaintenanceMode = enabled;
        row.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return new SiteSettingsDto
        {
            IsMaintenanceMode = row.IsMaintenanceMode,
            UpdatedAt = row.UpdatedAt,
        };
    }

    private async Task<SiteSettings> EnsureRowAsync()
    {
        var row = await _db.SiteSettings.FirstOrDefaultAsync(s => s.Id == 1);
        if (row == null)
        {
            row = new SiteSettings { Id = 1, IsMaintenanceMode = false, UpdatedAt = DateTime.UtcNow };
            _db.SiteSettings.Add(row);
            await _db.SaveChangesAsync();
        }

        return row;
    }
}
