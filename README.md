# חגיגה בסטייל - Hagiga BaStyle

E-commerce store for disposable event products and party packages.

## Tech Stack

- **Backend**: .NET 10 Web API, Entity Framework Core, PostgreSQL
- **Frontend**: React 18, TypeScript, Vite, MUI v5
- **Payment**: Tranzila (Israeli payment gateway)
- **Languages**: Hebrew (default, RTL) + English

## Prerequisites

- .NET SDK 10+
- Node.js 20+
- PostgreSQL 14+

## Getting Started

### 1. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE hagigabestyle;
```

### 2. Backend

```bash
cd backend/Hagigabestyle.API

# Update connection string in appsettings.json if needed
# Default: Host=localhost;Port=5432;Database=hagigabestyle;Username=postgres;Password=postgres

# Run (auto-migrates on startup in Development mode)
dotnet run
```

The API will start on `http://localhost:5000`.

### 3. Frontend

```bash
cd frontend

npm install
npm run dev
```

The app will start on `http://localhost:5173`.

### 4. Admin Panel

Navigate to `http://localhost:5173/admin/login`

Default credentials:
- **Username**: `admin`
- **Password**: `admin123`

## Project Structure

```
Hagigabestyle/
├── backend/
│   └── Hagigabestyle.API/
│       ├── Controllers/     # API endpoints
│       ├── Models/          # Entity models
│       ├── DTOs/            # Data transfer objects
│       ├── Services/        # Business logic
│       ├── Data/            # DbContext + seed data
│       └── Middleware/      # Error handling
├── frontend/
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── pages/           # Route pages
│       │   └── admin/       # Admin panel pages
│       ├── hooks/           # Custom hooks
│       ├── services/        # API client
│       ├── store/           # Zustand state management
│       ├── i18n/            # Translation files (he/en)
│       └── styles/          # Theme configuration
└── README.md
```

## API Endpoints

### Public
- `GET /api/categories` - List categories
- `GET /api/products?categoryId=N` - List products
- `GET /api/products/:id` - Product detail
- `GET /api/packages` - List packages
- `GET /api/packages/:id` - Package detail
- `POST /api/orders` - Create order
- `POST /api/payments/tranzila-callback` - Payment webhook

### Admin (JWT)
- `POST /api/admin/login` - Authenticate
- `GET /api/admin/dashboard` - Dashboard stats
- CRUD: `/api/admin/products`, `/api/admin/categories`, `/api/admin/packages`
- `GET /api/admin/orders` - List orders
- `PUT /api/admin/orders/:id/status` - Update order status

## Tranzila Setup

Update `appsettings.json` with your Tranzila credentials:

```json
{
  "Tranzila": {
    "TerminalName": "your_terminal_name",
    "CallbackSecret": "your_callback_secret"
  }
}
```
