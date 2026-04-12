using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Hagigabestyle.API.DTOs;

namespace Hagigabestyle.API.Services;

public class PdfService
{
    private readonly IConfiguration _config;
    public PdfService(IConfiguration config)
    {
        _config = config;
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public byte[] GenerateReceiptPdf(OrderDto order) => GenerateDocument(order, "קבלה", "Receipt");
    public byte[] GenerateInvoicePdf(OrderDto order) => GenerateDocument(order, "חשבונית", "Invoice");

    private byte[] GenerateDocument(OrderDto order, string titleHe, string titleEn)
    {
        var bizName = _config["Business:Name"] ?? "חגיגה בסטייל";
        var bizAddress = _config["Business:Address"] ?? "";
        var bizPhone = _config["Business:Phone"] ?? "";
        var bizTaxId = _config["Business:TaxId"] ?? "";
        var bizWebsite = _config["Business:Website"] ?? "";

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(40);
                page.ContentFromRightToLeft();
                page.DefaultTextStyle(x => x.FontSize(11).FontFamily("Noto Sans Hebrew", "Noto Sans", "DejaVu Sans", "Liberation Sans"));

                page.Header().Element(header =>
                {
                    header.Column(col =>
                    {
                        col.Item().Row(row =>
                        {
                            row.RelativeItem().Column(left =>
                            {
                                left.Item().Text(bizName).FontSize(22).Bold().FontColor("#c9a54e");
                                if (!string.IsNullOrEmpty(bizAddress))
                                    left.Item().Text(bizAddress).FontSize(9).FontColor("#666");
                                if (!string.IsNullOrEmpty(bizPhone))
                                    left.Item().Text($"טלפון: {bizPhone}").FontSize(9).FontColor("#666");
                                if (!string.IsNullOrEmpty(bizTaxId))
                                    left.Item().Text($"ח.פ / עוסק מורשה: {bizTaxId}").FontSize(9).FontColor("#666");
                            });

                            row.RelativeItem().AlignLeft().Column(right =>
                            {
                                right.Item().Text($"{titleHe}").FontSize(24).Bold();
                                right.Item().Text($"{titleEn}").FontSize(12).FontColor("#999");
                                right.Item().Text($"מס׳ {order.Id}").FontSize(14).Bold();
                                right.Item().Text($"תאריך: {order.CreatedAt:dd/MM/yyyy}").FontSize(10);
                            });
                        });

                        col.Item().PaddingVertical(10).LineHorizontal(1).LineColor("#e0e0e0");
                    });
                });

                page.Content().Element(content =>
                {
                    content.Column(col =>
                    {
                        // Customer details
                        col.Item().PaddingBottom(15).Column(customer =>
                        {
                            customer.Item().Text("פרטי לקוח").FontSize(13).Bold().FontColor("#333");
                            customer.Item().PaddingTop(5).Row(r =>
                            {
                                r.RelativeItem().Column(c =>
                                {
                                    c.Item().Text($"שם: {order.CustomerName}");
                                    c.Item().Text($"טלפון: {order.CustomerPhone}");
                                });
                                r.RelativeItem().Column(c =>
                                {
                                    if (!string.IsNullOrEmpty(order.CustomerEmail))
                                        c.Item().Text($"אימייל: {order.CustomerEmail}");
                                    if (!string.IsNullOrEmpty(order.ShippingAddress))
                                        c.Item().Text($"כתובת: {order.ShippingAddress}, {order.City}");
                                });
                            });
                        });

                        col.Item().PaddingBottom(5).LineHorizontal(0.5f).LineColor("#e0e0e0");

                        // Items table
                        col.Item().PaddingVertical(10).Table(table =>
                        {
                            table.ColumnsDefinition(cols =>
                            {
                                cols.ConstantColumn(40);   // #
                                cols.RelativeColumn(3);    // Item name
                                cols.RelativeColumn(1);    // Qty
                                cols.RelativeColumn(1.2f); // Unit price
                                cols.RelativeColumn(1.2f); // Line total
                            });

                            // Header
                            table.Header(h =>
                            {
                                h.Cell().Background("#f5f0e0").Padding(6).Text("#").Bold().FontSize(10);
                                h.Cell().Background("#f5f0e0").Padding(6).Text("פריט").Bold().FontSize(10);
                                h.Cell().Background("#f5f0e0").Padding(6).AlignCenter().Text("כמות").Bold().FontSize(10);
                                h.Cell().Background("#f5f0e0").Padding(6).AlignLeft().Text("מחיר יחידה").Bold().FontSize(10);
                                h.Cell().Background("#f5f0e0").Padding(6).AlignLeft().Text("סה״כ").Bold().FontSize(10);
                            });

                            for (var i = 0; i < order.Items.Count; i++)
                            {
                                var item = order.Items[i];
                                var bg = i % 2 == 1 ? "#fafafa" : "#fff";
                                table.Cell().Background(bg).Padding(6).Text($"{i + 1}").FontSize(10);
                                table.Cell().Background(bg).Padding(6).Text(item.NameHe).FontSize(10);
                                table.Cell().Background(bg).Padding(6).AlignCenter().Text($"{item.Quantity}").FontSize(10);
                                table.Cell().Background(bg).Padding(6).AlignLeft().Text($"₪{item.UnitPrice:F2}").FontSize(10);
                                table.Cell().Background(bg).Padding(6).AlignLeft().Text($"₪{(item.UnitPrice * item.Quantity):F2}").FontSize(10);
                            }
                        });

                        col.Item().PaddingTop(5).LineHorizontal(1).LineColor("#c9a54e");

                        // Total
                        col.Item().PaddingTop(10).AlignLeft().Row(r =>
                        {
                            r.AutoItem().PaddingLeft(20).Column(totalCol =>
                            {
                                totalCol.Item().Row(tr =>
                                {
                                    tr.AutoItem().Width(100).Text("סה״כ לפני מע״מ:").FontSize(11);
                                    tr.AutoItem().Text($"₪{(order.TotalAmount / 1.17m):F2}").FontSize(11);
                                });
                                totalCol.Item().Row(tr =>
                                {
                                    tr.AutoItem().Width(100).Text("מע״מ (17%):").FontSize(11);
                                    tr.AutoItem().Text($"₪{(order.TotalAmount - order.TotalAmount / 1.17m):F2}").FontSize(11);
                                });
                                totalCol.Item().PaddingTop(5).Row(tr =>
                                {
                                    tr.AutoItem().Width(100).Text("סה״כ לתשלום:").FontSize(14).Bold().FontColor("#c9a54e");
                                    tr.AutoItem().Text($"₪{order.TotalAmount:F2}").FontSize(14).Bold().FontColor("#c9a54e");
                                });
                            });
                        });

                        if (!string.IsNullOrEmpty(order.Notes))
                        {
                            col.Item().PaddingTop(20).Column(notes =>
                            {
                                notes.Item().Text("הערות:").Bold();
                                notes.Item().Text(order.Notes);
                            });
                        }
                    });
                });

                page.Footer().Element(footer =>
                {
                    footer.Column(col =>
                    {
                        col.Item().LineHorizontal(0.5f).LineColor("#e0e0e0");
                        col.Item().PaddingTop(8).AlignCenter()
                            .Text($"{bizName} | {bizWebsite}").FontSize(9).FontColor("#999");
                        col.Item().AlignCenter()
                            .Text("תודה שקניתם אצלנו!").FontSize(10).FontColor("#c9a54e");
                    });
                });
            });
        });

        return document.GeneratePdf();
    }
}
