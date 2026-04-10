using Microsoft.AspNetCore.Mvc;
using Hagigabestyle.API.DTOs;
using Hagigabestyle.API.Services;

namespace Hagigabestyle.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PackagesController : ControllerBase
{
    private readonly PackageService _service;

    public PackagesController(PackageService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<List<PackageDto>>> GetAll()
    {
        return await _service.GetAllAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PackageDto>> GetById(int id)
    {
        var package = await _service.GetByIdAsync(id);
        return package == null ? NotFound() : Ok(package);
    }
}
