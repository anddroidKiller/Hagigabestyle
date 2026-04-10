namespace Hagigabestyle.API.DTOs;

public class CategoryDto
{
    public int Id { get; set; }
    public string NameHe { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public int ProductCount { get; set; }
}

public class CreateCategoryDto
{
    public string NameHe { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UpdateCategoryDto
{
    public string NameHe { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
}
