namespace Hagigabestyle.API.DTOs;

public class SiteSettingsDto
{
    public bool IsMaintenanceMode { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UpdateMaintenanceDto
{
    public bool IsMaintenanceMode { get; set; }
}
