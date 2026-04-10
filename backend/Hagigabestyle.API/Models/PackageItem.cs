namespace Hagigabestyle.API.Models;

public class PackageItem
{
    public int Id { get; set; }
    public int PackageId { get; set; }
    public int ProductId { get; set; }
    public int Quantity { get; set; }

    public Package Package { get; set; } = null!;
    public Product Product { get; set; } = null!;
}
