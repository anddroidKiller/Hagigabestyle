using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Hagigabestyle.API.DTOs;
using Hagigabestyle.API.Services;

namespace Hagigabestyle.API.Controllers;

[ApiController]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly AuthService _authService;
    private readonly CategoryService _categoryService;
    private readonly ProductService _productService;
    private readonly PackageService _packageService;
    private readonly OrderService _orderService;
    private readonly PdfService _pdfService;
    private readonly SiteSettingsService _siteSettingsService;

    public AdminController(
        AuthService authService,
        CategoryService categoryService,
        ProductService productService,
        PackageService packageService,
        OrderService orderService,
        PdfService pdfService,
        SiteSettingsService siteSettingsService)
    {
        _authService = authService;
        _categoryService = categoryService;
        _productService = productService;
        _packageService = packageService;
        _orderService = orderService;
        _pdfService = pdfService;
        _siteSettingsService = siteSettingsService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResultDto>> Login([FromBody] LoginDto dto)
    {
        var result = await _authService.LoginAsync(dto);
        return result == null ? Unauthorized(new { message = "שם משתמש או סיסמה שגויים" }) : Ok(result);
    }

    // Dashboard
    [Authorize(Roles = "Admin")]
    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardDto>> GetDashboard()
    {
        return await _orderService.GetDashboardAsync();
    }

    // Categories CRUD
    [Authorize(Roles = "Admin")]
    [HttpGet("categories")]
    public async Task<ActionResult<List<CategoryDto>>> GetCategories()
    {
        return await _categoryService.GetAllAsync(activeOnly: false);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("categories")]
    public async Task<ActionResult<CategoryDto>> CreateCategory([FromBody] CreateCategoryDto dto)
    {
        return await _categoryService.CreateAsync(dto);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("categories/{id}")]
    public async Task<ActionResult<CategoryDto>> UpdateCategory(int id, [FromBody] UpdateCategoryDto dto)
    {
        var result = await _categoryService.UpdateAsync(id, dto);
        return result == null ? NotFound() : Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("categories/{id}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        return await _categoryService.DeleteAsync(id) ? NoContent() : NotFound();
    }

    // Products CRUD
    [Authorize(Roles = "Admin")]
    [HttpGet("products")]
    public async Task<ActionResult<List<ProductDto>>> GetProducts([FromQuery] int? categoryId)
    {
        return await _productService.GetAllAsync(categoryId, activeOnly: false);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("products")]
    public async Task<ActionResult<ProductDto>> CreateProduct([FromBody] CreateProductDto dto)
    {
        return await _productService.CreateAsync(dto);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("products/{id}")]
    public async Task<ActionResult<ProductDto>> UpdateProduct(int id, [FromBody] UpdateProductDto dto)
    {
        var result = await _productService.UpdateAsync(id, dto);
        return result == null ? NotFound() : Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("products/{id}")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        return await _productService.DeleteAsync(id) ? NoContent() : NotFound();
    }

    // Packages CRUD
    [Authorize(Roles = "Admin")]
    [HttpGet("packages")]
    public async Task<ActionResult<List<PackageDto>>> GetPackages()
    {
        return await _packageService.GetAllAsync(activeOnly: false);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("packages")]
    public async Task<ActionResult<PackageDto>> CreatePackage([FromBody] CreatePackageDto dto)
    {
        return await _packageService.CreateAsync(dto);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("packages/{id}")]
    public async Task<ActionResult<PackageDto>> UpdatePackage(int id, [FromBody] UpdatePackageDto dto)
    {
        var result = await _packageService.UpdateAsync(id, dto);
        return result == null ? NotFound() : Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("packages/{id}")]
    public async Task<IActionResult> DeletePackage(int id)
    {
        return await _packageService.DeleteAsync(id) ? NoContent() : NotFound();
    }

    // Orders
    [Authorize(Roles = "Admin")]
    [HttpGet("orders")]
    public async Task<ActionResult<List<OrderDto>>> GetOrders()
    {
        return await _orderService.GetAllAsync();
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("orders/{id}")]
    public async Task<ActionResult<OrderDto>> GetOrder(int id)
    {
        var order = await _orderService.GetByIdAsync(id);
        return order == null ? NotFound() : Ok(order);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("orders/{id}/status")]
    public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusDto dto)
    {
        var username = User.Identity?.Name ?? "unknown";
        var fullName = User.FindFirstValue(ClaimTypes.GivenName) ?? username;
        var ok = await _orderService.UpdateStatusAsync(id, dto.Status, username, fullName);
        return ok ? NoContent() : NotFound();
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("orders/{id}/history")]
    public async Task<ActionResult<List<OrderStatusHistoryDto>>> GetOrderHistory(int id)
    {
        return await _orderService.GetStatusHistoryAsync(id);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("orders/{id}/receipt")]
    public async Task<IActionResult> GetOrderReceipt(int id)
    {
        var order = await _orderService.GetByIdAsync(id);
        if (order == null) return NotFound();
        var pdf = _pdfService.GenerateReceiptPdf(order);
        return File(pdf, "application/pdf", $"receipt-{id}.pdf");
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("orders/{id}/invoice")]
    public async Task<IActionResult> GetOrderInvoice(int id)
    {
        var order = await _orderService.GetByIdAsync(id);
        if (order == null) return NotFound();
        var pdf = _pdfService.GenerateInvoicePdf(order);
        return File(pdf, "application/pdf", $"invoice-{id}.pdf");
    }

    // Site settings (maintenance mode)
    [Authorize(Roles = "Admin")]
    [HttpGet("site-settings")]
    public async Task<ActionResult<SiteSettingsDto>> GetSiteSettings()
    {
        return await _siteSettingsService.GetAsync();
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("site-settings/maintenance")]
    public async Task<ActionResult<SiteSettingsDto>> SetMaintenance([FromBody] UpdateMaintenanceDto dto)
    {
        return await _siteSettingsService.SetMaintenanceAsync(dto.IsMaintenanceMode);
    }
}
