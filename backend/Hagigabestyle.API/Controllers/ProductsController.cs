using Microsoft.AspNetCore.Mvc;
using Hagigabestyle.API.DTOs;
using Hagigabestyle.API.Services;

namespace Hagigabestyle.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly ProductService _service;

    public ProductsController(ProductService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<List<ProductDto>>> GetAll([FromQuery] int? categoryId)
    {
        return await _service.GetAllAsync(categoryId);
    }

    [HttpGet("hot")]
    public async Task<ActionResult<List<ProductDto>>> GetHot([FromQuery] int limit = 8)
    {
        return await _service.GetHotAsync(Math.Clamp(limit, 1, 24));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetById(int id)
    {
        var product = await _service.GetByIdAsync(id);
        return product == null ? NotFound() : Ok(product);
    }
}
