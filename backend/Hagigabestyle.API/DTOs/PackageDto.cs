namespace Hagigabestyle.API.DTOs;

public class PackageDto
{
    public int Id { get; set; }
    public string NameHe { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string? DescriptionHe { get; set; }
    public string? DescriptionEn { get; set; }
    public decimal Price { get; set; }
    public decimal OriginalPrice { get; set; }
    public decimal Discount => OriginalPrice > 0 ? Math.Round((1 - Price / OriginalPrice) * 100, 0) : 0;
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; }
    public List<PackageItemDto> Items { get; set; } = new();
}

public class PackageItemDto
{
    public int ProductId { get; set; }
    public string ProductNameHe { get; set; } = string.Empty;
    public string ProductNameEn { get; set; } = string.Empty;
    public int Quantity { get; set; }
}

public class CreatePackageDto
{
    public string NameHe { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string? DescriptionHe { get; set; }
    public string? DescriptionEn { get; set; }
    public decimal Price { get; set; }
    public decimal OriginalPrice { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public List<CreatePackageItemDto> Items { get; set; } = new();
}

public class CreatePackageItemDto
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
}

public class UpdatePackageDto
{
    public string NameHe { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string? DescriptionHe { get; set; }
    public string? DescriptionEn { get; set; }
    public decimal Price { get; set; }
    public decimal OriginalPrice { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; }
    public List<CreatePackageItemDto> Items { get; set; } = new();
}
