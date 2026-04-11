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

// Database - build connection string from Railway env vars, defaulting to the
// Railway private DNS name so the app always targets the Postgres service and
// never falls back to localhost.
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_PRIVATE_URL")
    ?? Environment.GetEnvironmentVariable("DATABASE_URL");
string connectionString;

Log.Information("DATABASE_PRIVATE_URL set: {Set}", !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("DATABASE_PRIVATE_URL")));
Log.Information("DATABASE_URL set: {Set}", !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("DATABASE_URL")));
Log.Information("PGHOST set: {Set}", !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("PGHOST")));

if (!string.IsNullOrEmpty(databaseUrl) &&
    (databaseUrl.StartsWith("postgresql://") || databaseUrl.StartsWith("postgres://")))
{
    // Normalise the scheme so System.Uri always parses it correctly.
    var normalised = databaseUrl.StartsWith("postgres://")
        ? "postgresql://" + databaseUrl["postgres://".Length..]
        : databaseUrl;
    var uri = new Uri(normalised);
    var userInfo = uri.UserInfo.Split(':');
    var password = Uri.UnescapeDataString(userInfo.Length > 1 ? userInfo[1] : "");
    var username = Uri.UnescapeDataString(userInfo[0]);
    connectionString = $"Host={uri.Host};Port={uri.Port};Database={uri.AbsolutePath.TrimStart('/')};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true";
    Log.Information("Using DATABASE_URL connection (scheme: {Scheme}, host: {Host})", uri.Scheme, uri.Host);
}
else
{
    // Fall back to individual PG* env vars; default PGHOST to the Railway
    // private DNS name so the app connects to the Postgres service even when
    // the variable is not explicitly set.
    var pgHost = Environment.GetEnvironmentVariable("PGHOST") ?? "postgres.railway.internal";
    var pgPort = Environment.GetEnvironmentVariable("PGPORT") ?? "5432";
    var pgUser = Environment.GetEnvironmentVariable("PGUSER") ?? "postgres";
    var pgPass = Environment.GetEnvironmentVariable("PGPASSWORD") ?? "";
    var pgDb   = Environment.GetEnvironmentVariable("PGDATABASE") ?? "railway";
    connectionString = $"Host={pgHost};Port={pgPort};Database={pgDb};Username={pgUser};Password={pgPass};SSL Mode=Require;Trust Server Certificate=true";
    Log.Warning("DATABASE_URL not available or unrecognised scheme — falling back to PG* variables (PGHOST={Host})", pgHost);
}
Log.Information("Connecting to database at: {Host}", connectionString.Contains("Host=") ? connectionString.Split("Host=")[1].Split(';')[0] : "unknown");
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
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Serve frontend static files (built React app in wwwroot)
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapFallbackToFile("index.html");

var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
app.Run($"http://0.0.0.0:{port}");
