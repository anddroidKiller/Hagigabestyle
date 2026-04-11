using Microsoft.EntityFrameworkCore;
using Hagigabestyle.API.Models;

namespace Hagigabestyle.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Package> Packages => Set<Package>();
    public DbSet<PackageItem> PackageItems => Set<PackageItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.NameHe).IsRequired().HasMaxLength(200);
            entity.Property(e => e.NameEn).IsRequired().HasMaxLength(200);
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.NameHe).IsRequired().HasMaxLength(200);
            entity.Property(e => e.NameEn).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Price).HasPrecision(10, 2);
            entity.HasOne(e => e.Category)
                  .WithMany(c => c.Products)
                  .HasForeignKey(e => e.CategoryId);
        });

        modelBuilder.Entity<Package>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.NameHe).IsRequired().HasMaxLength(200);
            entity.Property(e => e.NameEn).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Price).HasPrecision(10, 2);
            entity.Property(e => e.OriginalPrice).HasPrecision(10, 2);
        });

        modelBuilder.Entity<PackageItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Package)
                  .WithMany(p => p.PackageItems)
                  .HasForeignKey(e => e.PackageId);
            entity.HasOne(e => e.Product)
                  .WithMany(p => p.PackageItems)
                  .HasForeignKey(e => e.ProductId);
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CustomerName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.CustomerPhone).IsRequired().HasMaxLength(20);
            entity.Property(e => e.TotalAmount).HasPrecision(10, 2);
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(20);
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UnitPrice).HasPrecision(10, 2);
            entity.HasOne(e => e.Order)
                  .WithMany(o => o.OrderItems)
                  .HasForeignKey(e => e.OrderId);
            entity.HasOne(e => e.Product)
                  .WithMany()
                  .HasForeignKey(e => e.ProductId)
                  .IsRequired(false);
            entity.HasOne(e => e.Package)
                  .WithMany()
                  .HasForeignKey(e => e.PackageId)
                  .IsRequired(false);
        });

        modelBuilder.Entity<AdminUser>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Username).IsRequired().HasMaxLength(100);
            entity.HasIndex(e => e.Username).IsUnique();
        });

        SeedData(modelBuilder);
    }

    private static void SeedData(ModelBuilder modelBuilder)
    {
        const string img = "/images";

        modelBuilder.Entity<Category>().HasData(
            new Category { Id = 1, NameHe = "צלחות וכוסות", NameEn = "Plates & Cups", ImageUrl = $"{img}/cat-plates-cups.jpg", SortOrder = 1, IsActive = true },
            new Category { Id = 2, NameHe = "מפיות ומפות", NameEn = "Napkins & Tablecloths", ImageUrl = $"{img}/cat-napkins.jpg", SortOrder = 2, IsActive = true },
            new Category { Id = 3, NameHe = "בלונים וקישוטים", NameEn = "Balloons & Decorations", ImageUrl = $"{img}/cat-balloons.jpg", SortOrder = 3, IsActive = true },
            new Category { Id = 4, NameHe = "סכום חד פעמי", NameEn = "Disposable Cutlery", ImageUrl = $"{img}/cat-cutlery.jpg", SortOrder = 4, IsActive = true },
            new Category { Id = 5, NameHe = "אביזרים למסיבה", NameEn = "Party Accessories", ImageUrl = $"{img}/cat-party.jpg", SortOrder = 5, IsActive = true }
        );

        modelBuilder.Entity<Product>().HasData(
            new Product { Id = 1, NameHe = "צלחות זהב 10 יח'", NameEn = "Gold Plates 10 pcs", DescriptionHe = "צלחות חד פעמיות בצבע זהב, חבילה של 10", DescriptionEn = "Gold disposable plates, pack of 10", Price = 29.90m, ImageUrl = $"{img}/prod-gold-plates.jpg", CategoryId = 1, StockQuantity = 100, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Product { Id = 2, NameHe = "כוסות קריסטל 20 יח'", NameEn = "Crystal Cups 20 pcs", DescriptionHe = "כוסות שקופות איכותיות, חבילה של 20", DescriptionEn = "Quality transparent cups, pack of 20", Price = 24.90m, ImageUrl = $"{img}/prod-crystal-cups.jpg", CategoryId = 1, StockQuantity = 150, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Product { Id = 3, NameHe = "מפיות פרימיום 50 יח'", NameEn = "Premium Napkins 50 pcs", DescriptionHe = "מפיות נייר איכותיות, חבילה של 50", DescriptionEn = "Quality paper napkins, pack of 50", Price = 19.90m, ImageUrl = $"{img}/prod-napkins.jpg", CategoryId = 2, StockQuantity = 200, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Product { Id = 4, NameHe = "מפת שולחן זהב", NameEn = "Gold Tablecloth", DescriptionHe = "מפת שולחן חד פעמית בצבע זהב", DescriptionEn = "Gold disposable tablecloth", Price = 14.90m, ImageUrl = $"{img}/prod-gold-tablecloth.jpg", CategoryId = 2, StockQuantity = 80, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Product { Id = 5, NameHe = "בלוני הליום 10 יח'", NameEn = "Helium Balloons 10 pcs", DescriptionHe = "בלונים צבעוניים עם הליום", DescriptionEn = "Colorful helium balloons", Price = 49.90m, ImageUrl = $"{img}/prod-balloons.jpg", CategoryId = 3, StockQuantity = 60, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Product { Id = 6, NameHe = "שרשרת דגלונים", NameEn = "Flag Garland", DescriptionHe = "שרשרת דגלונים צבעונית לקישוט", DescriptionEn = "Colorful flag garland for decoration", Price = 22.90m, ImageUrl = $"{img}/prod-garland.jpg", CategoryId = 3, StockQuantity = 90, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Product { Id = 7, NameHe = "סט סכום זהב 30 יח'", NameEn = "Gold Cutlery Set 30 pcs", DescriptionHe = "סכין, מזלג וכפית בצבע זהב", DescriptionEn = "Gold knife, fork and spoon set", Price = 34.90m, ImageUrl = $"{img}/prod-cutlery-set.jpg", CategoryId = 4, StockQuantity = 120, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Product { Id = 8, NameHe = "כובעי מסיבה 6 יח'", NameEn = "Party Hats 6 pcs", DescriptionHe = "כובעי מסיבה צבעוניים, חבילה של 6", DescriptionEn = "Colorful party hats, pack of 6", Price = 15.90m, ImageUrl = $"{img}/prod-party-hats.jpg", CategoryId = 5, StockQuantity = 70, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
        );

        modelBuilder.Entity<Package>().HasData(
            new Package { Id = 1, NameHe = "מארז יום הולדת קלאסי", NameEn = "Classic Birthday Package", DescriptionHe = "מארז מושלם ליום הולדת - כולל צלחות, כוסות, מפיות, סכום ובלונים", DescriptionEn = "Perfect birthday package - includes plates, cups, napkins, cutlery and balloons", Price = 149.90m, OriginalPrice = 189.50m, ImageUrl = $"{img}/pkg-birthday.jpg", IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Package { Id = 2, NameHe = "מארז מסיבה זהב פרימיום", NameEn = "Premium Gold Party Package", DescriptionHe = "מארז פרימיום בזהב - צלחות, כוסות, מפיות, מפה, סכום, בלונים וקישוטים", DescriptionEn = "Premium gold package - plates, cups, napkins, tablecloth, cutlery, balloons and decorations", Price = 249.90m, OriginalPrice = 322.20m, ImageUrl = $"{img}/pkg-gold-premium.jpg", IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
        );

        modelBuilder.Entity<PackageItem>().HasData(
            new PackageItem { Id = 1, PackageId = 1, ProductId = 1, Quantity = 2 },
            new PackageItem { Id = 2, PackageId = 1, ProductId = 2, Quantity = 2 },
            new PackageItem { Id = 3, PackageId = 1, ProductId = 3, Quantity = 1 },
            new PackageItem { Id = 4, PackageId = 1, ProductId = 7, Quantity = 1 },
            new PackageItem { Id = 5, PackageId = 1, ProductId = 5, Quantity = 1 },
            new PackageItem { Id = 6, PackageId = 2, ProductId = 1, Quantity = 3 },
            new PackageItem { Id = 7, PackageId = 2, ProductId = 2, Quantity = 3 },
            new PackageItem { Id = 8, PackageId = 2, ProductId = 3, Quantity = 2 },
            new PackageItem { Id = 9, PackageId = 2, ProductId = 4, Quantity = 2 },
            new PackageItem { Id = 10, PackageId = 2, ProductId = 7, Quantity = 2 },
            new PackageItem { Id = 11, PackageId = 2, ProductId = 5, Quantity = 1 },
            new PackageItem { Id = 12, PackageId = 2, ProductId = 6, Quantity = 1 }
        );
    }
}
