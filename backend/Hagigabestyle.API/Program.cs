using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using Hagigabestyle.API.Data;
using Hagigabestyle.API.Middleware;
using Hagigabestyle.API.Services;

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

// Dump all Railway/DB env vars for diagnostics
Log.Information("=== Railway / Database environment variable dump ===");
var prefixesToLog = new[] { "DATABASE", "POSTGRES", "PG", "RAILWAY" };
var envVars = System.Environment.GetEnvironmentVariables();
var matchedAny = false;
foreach (System.Collections.DictionaryEntry entry in envVars)
{
    var key = entry.Key?.ToString() ?? string.Empty;
    if (Array.Exists(prefixesToLog, p => key.StartsWith(p, StringComparison.OrdinalIgnoreCase)))
    {
        Log.Information("  {Key} = {Value}", key, entry.Value?.ToString() ?? "(null)");
        matchedAny = true;
    }
}
if (!matchedAny)
    Log.Warning("  (no matching environment variables found)");
Log.Information("=== End environment variable dump ===");

// Database - prefer DATABASE_URL (public) over DATABASE_PRIVATE_URL (internal)
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? Environment.GetEnvironmentVariable("DATABASE_PRIVATE_URL");
string connectionString;

if (!string.IsNullOrEmpty(databaseUrl) && databaseUrl.StartsWith("postgresql://"))
{
    var uri = new Uri(databaseUrl);
    var userInfo = uri.UserInfo.Split(':', 2);
    connectionString = $"Host={uri.Host};Port={uri.Port};Database={uri.AbsolutePath.TrimStart('/')};Username={userInfo[0]};Password={(userInfo.Length > 1 ? userInfo[1] : "")};SSL Mode=Require;Trust Server Certificate=true";
    Log.Information("Using DATABASE_URL -> Host={Host}", uri.Host);
}
else
{
    connectionString = builder.Configuration.GetConnectionString("DefaultConnection")!;
    Log.Warning("No DATABASE_URL found, falling back to appsettings (localhost)");
}
builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));

// JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

// Services
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<CategoryService>();
builder.Services.AddScoped<ProductService>();
builder.Services.AddScoped<PackageService>();
builder.Services.AddScoped<OrderService>();
builder.Services.AddSingleton<TranzilaService>();

// Controllers + JSON
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddOpenApi();

var app = builder.Build();

// Auto-migrate and seed on startup (with retry for Railway cold starts)
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    var retries = 10;
    for (var i = 0; i < retries; i++)
    {
        try
        {
            db.Database.Migrate();
            break;
        }
        catch (Exception ex) when (i < retries - 1)
        {
            Log.Warning("Database not ready (attempt {Attempt}/{Total}): {Message}", i + 1, retries, ex.Message);
            Thread.Sleep(3000);
        }
    }

    if (!db.AdminUsers.Any())
    {
        db.AdminUsers.Add(new Hagigabestyle.API.Models.AdminUser
        {
            Username = "admin",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
            FullName = "מנהל המערכת"
        });
        db.SaveChanges();
    }

    if (app.Environment.IsDevelopment())
        app.MapOpenApi();
}

app.UseMiddleware<ExceptionMiddleware>();
app.UseCors("AllowFrontend");

// Static files must come before auth/routing
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapFallbackToFile("index.html");

Log.Information("App starting on port {Port}", Environment.GetEnvironmentVariable("PORT") ?? "5000");
var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
app.Run($"http://0.0.0.0:{port}");
