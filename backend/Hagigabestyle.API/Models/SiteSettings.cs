namespace Hagigabestyle.API.Models;

/// <summary>
/// Singleton row (Id=1) holding site-wide toggles such as maintenance mode.
/// </summary>
public class SiteSettings
{
    public int Id { get; set; } = 1;
    public bool IsMaintenanceMode { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
