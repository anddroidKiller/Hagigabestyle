namespace Hagigabestyle.API.Models;

public class Product
{
    public int Id { get; set; }
    public string NameHe { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string? DescriptionHe { get; set; }
    public string? DescriptionEn { get; set; }
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
    public int CategoryId { get; set; }
    public int StockQuantity { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Category Category { get; set; } = null!;
    public ICollection<PackageItem> PackageItems { get; set; } = new List<PackageItem>();
}
