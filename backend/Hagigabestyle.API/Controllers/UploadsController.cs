using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hagigabestyle.API.Controllers;

[ApiController]
[Route("api/admin/uploads")]
[Authorize(Roles = "Admin")]
public class UploadsController : ControllerBase
{
    private static readonly HashSet<string> _allowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".gif"
    };

    private const long MaxFileSize = 10 * 1024 * 1024; // 10MB

    private readonly IWebHostEnvironment _env;
    private readonly IConfiguration _config;
    private readonly ILogger<UploadsController> _logger;

    public UploadsController(IWebHostEnvironment env, IConfiguration config, ILogger<UploadsController> logger)
    {
        _env = env;
        _config = config;
        _logger = logger;
    }

    public class UploadResultDto
    {
        public string Url { get; set; } = string.Empty;
    }

    [HttpPost("image")]
    [RequestSizeLimit(MaxFileSize)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxFileSize)]
    public async Task<ActionResult<UploadResultDto>> UploadImage([FromForm] IFormFile? file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file uploaded" });

        if (file.Length > MaxFileSize)
            return BadRequest(new { error = $"File too large (max {MaxFileSize / 1024 / 1024}MB)" });

        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrEmpty(ext) || !_allowedExtensions.Contains(ext))
            return BadRequest(new { error = "Unsupported file type. Allowed: jpg, jpeg, png, webp, gif" });

        // Resolve target directory:
        // 1. Env var UPLOADS_PATH (e.g. /data/uploads on Railway with a mounted volume)
        // 2. fallback to wwwroot/uploads/products (lost on each Railway redeploy unless a volume is mounted there)
        var configuredRoot = _config["UploadsPath"]
            ?? Environment.GetEnvironmentVariable("UPLOADS_PATH");

        string baseDir;
        string urlPrefix;
        if (!string.IsNullOrWhiteSpace(configuredRoot))
        {
            baseDir = Path.Combine(configuredRoot, "products");
            urlPrefix = "/uploads/products";
        }
        else
        {
            var webroot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            baseDir = Path.Combine(webroot, "uploads", "products");
            urlPrefix = "/uploads/products";
        }

        Directory.CreateDirectory(baseDir);

        var fileName = $"{Guid.NewGuid():N}{ext.ToLowerInvariant()}";
        var fullPath = Path.Combine(baseDir, fileName);

        try
        {
            await using var stream = System.IO.File.Create(fullPath);
            await file.CopyToAsync(stream);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[UPLOAD] Failed to save file {Name}", fileName);
            return StatusCode(500, new { error = "Failed to save file" });
        }

        var publicUrl = $"{urlPrefix}/{fileName}";
        _logger.LogInformation("[UPLOAD] Saved {Name} ({Bytes} bytes) -> {Url}",
            fileName, file.Length, publicUrl);

        return Ok(new UploadResultDto { Url = publicUrl });
    }
}
