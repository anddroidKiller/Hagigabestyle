namespace Hagigabestyle.API.DTOs;

public class ProductDto
{
    public int Id { get; set; }
    public string NameHe { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string? DescriptionHe { get; set; }
    public string? DescriptionEn { get; set; }
    public decimal Price { get; set; }
    public string? Barcode { get; set; }
    public string? ImageUrl { get; set; }
    public int CategoryId { get; set; }
    public string CategoryNameHe { get; set; } = string.Empty;
    public string CategoryNameEn { get; set; } = string.Empty;
    public int StockQuantity { get; set; }
    public bool IsActive { get; set; }
}

public class CreateProductDto
{
    public string NameHe { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string? DescriptionHe { get; set; }
    public string? DescriptionEn { get; set; }
    public decimal Price { get; set; }
    public string? Barcode { get; set; }
    public string? ImageUrl { get; set; }
    public int CategoryId { get; set; }
    public int StockQuantity { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UpdateProductDto
{
    public string NameHe { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string? DescriptionHe { get; set; }
    public string? DescriptionEn { get; set; }
    public decimal Price { get; set; }
    public string? Barcode { get; set; }
    public string? ImageUrl { get; set; }
    public int CategoryId { get; set; }
    public int StockQuantity { get; set; }
    public bool IsActive { get; set; }
}
