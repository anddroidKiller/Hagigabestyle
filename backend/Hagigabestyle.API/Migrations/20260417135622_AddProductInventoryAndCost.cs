using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hagigabestyle.API.Migrations
{
    /// <inheritdoc />
    public partial class AddProductInventoryAndCost : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "StockQuantity",
                table: "Products",
                newName: "StockQuantityWarehouse");

            migrationBuilder.AddColumn<decimal>(
                name: "CostPrice",
                table: "Products",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "StockQuantityStore",
                table: "Products",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CostPrice", "StockQuantityStore" },
                values: new object[] { 0m, 0 });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CostPrice", "StockQuantityStore" },
                values: new object[] { 0m, 0 });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CostPrice", "StockQuantityStore" },
                values: new object[] { 0m, 0 });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "CostPrice", "StockQuantityStore" },
                values: new object[] { 0m, 0 });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "CostPrice", "StockQuantityStore" },
                values: new object[] { 0m, 0 });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "CostPrice", "StockQuantityStore" },
                values: new object[] { 0m, 0 });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "CostPrice", "StockQuantityStore" },
                values: new object[] { 0m, 0 });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "CostPrice", "StockQuantityStore" },
                values: new object[] { 0m, 0 });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CostPrice",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "StockQuantityStore",
                table: "Products");

            migrationBuilder.RenameColumn(
                name: "StockQuantityWarehouse",
                table: "Products",
                newName: "StockQuantity");
        }
    }
}
