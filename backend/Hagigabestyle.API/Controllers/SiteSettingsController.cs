using Microsoft.AspNetCore.Mvc;
using Hagigabestyle.API.DTOs;
using Hagigabestyle.API.Services;

namespace Hagigabestyle.API.Controllers;

/// <summary>
/// Public read-only endpoint so the SPA can check maintenance mode before rendering.
/// </summary>
[ApiController]
[Route("api/site-settings")]
public class SiteSettingsController : ControllerBase
{
    private readonly SiteSettingsService _service;

    public SiteSettingsController(SiteSettingsService service) => _service = service;

    [HttpGet("status")]
    public async Task<ActionResult<SiteSettingsDto>> GetStatus()
    {
        return await _service.GetAsync();
    }
}
