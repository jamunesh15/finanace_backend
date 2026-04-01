# Finance Data Processing and Access Control Backend

A RESTful backend API for a finance dashboard system with role-based access control, built with Node.js, Express, MongoDB, and JWT authentication.

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Authentication:** JWT (JSON Web Tokens)
- **Validation:** express-validator
- **API Docs:** Swagger UI (swagger-jsdoc + swagger-ui-express)
- **Security:** helmet, bcryptjs, cors

---

## Project Structure

```
finance-backend/
├── src/
│   ├── app.js                  # Entry point
│   ├── config/
│   │   ├── db.js               # MongoDB connection
│   │   └── swagger.js          # Swagger configuration
│   ├── models/
│   │   ├── User.js             # User schema (role, status, password hashing)
│   │   └── Transaction.js      # Transaction schema (soft delete, indexing)
│   ├── middleware/
│   │   ├── auth.js             # JWT protect + role-based authorize guard
│   │   ├── errorHandler.js     # Global error handler
│   │   └── validators.js       # Input validation rules
│   ├── controllers/
│   │   ├── authController.js       # Register, login, getMe
│   │   ├── userController.js       # User CRUD (admin only)
│   │   ├── transactionController.js # Transaction CRUD + filtering
│   │   └── dashboardController.js  # Aggregated analytics
│   └── routes/
│       ├── authRoutes.js
│       ├── userRoutes.js
│       ├── transactionRoutes.js
│       └── dashboardRoutes.js
├── .env.example
├── package.json
└── README.md
```

---

## Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB (local or MongoDB Atlas)

### Steps

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd finance-backend

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. Update .env with your values
# MONGO_URI=mongodb://localhost:27017/finance_db
# JWT_SECRET=your_super_secret_key
# JWT_EXPIRES_IN=7d
# PORT=5000

# 5. Start the server
npm run dev       # development (nodemon)
npm start         # production
```

### API Documentation
Once the server is running, visit:
```
http://localhost:5000/api-docs
```

---

## Role Permissions

| Action                        | Viewer | Analyst | Admin |
|-------------------------------|--------|---------|-------|
| Login / Register              | ✅     | ✅      | ✅    |
| View transactions             | ✅     | ✅      | ✅    |
| View single transaction       | ✅     | ✅      | ✅    |
| Create transaction            | ❌     | ✅      | ✅    |
| Update transaction            | ❌     | ❌      | ✅    |
| Delete transaction (soft)     | ❌     | ❌      | ✅    |
| View dashboard summary        | ❌     | ✅      | ✅    |
| View category breakdown       | ❌     | ✅      | ✅    |
| View monthly trends           | ❌     | ✅      | ✅    |
| View recent activity          | ❌     | ✅      | ✅    |
| Manage users                  | ❌     | ❌      | ✅    |

---

## API Reference

### Auth

| Method | Endpoint             | Description              | Access  |
|--------|----------------------|--------------------------|---------|
| POST   | /api/auth/register   | Register a new user      | Public  |
| POST   | /api/auth/login      | Login and get JWT token  | Public  |
| GET    | /api/auth/me         | Get current user info    | Private |

### Users (Admin only)

| Method | Endpoint         | Description             |
|--------|------------------|-------------------------|
| GET    | /api/users       | List all users          |
| GET    | /api/users/:id   | Get user by ID          |
| PATCH  | /api/users/:id   | Update role/status/name |
| DELETE | /api/users/:id   | Delete user             |

### Transactions

| Method | Endpoint                | Description                            | Access          |
|--------|-------------------------|----------------------------------------|-----------------|
| GET    | /api/transactions       | List transactions (filters + pagination) | All roles     |
| GET    | /api/transactions/:id   | Get single transaction                 | All roles       |
| POST   | /api/transactions       | Create transaction                     | Analyst, Admin  |
| PUT    | /api/transactions/:id   | Update transaction                     | Admin           |
| DELETE | /api/transactions/:id   | Soft delete transaction                | Admin           |

#### Query Parameters for GET /api/transactions
| Param      | Type   | Description                    |
|------------|--------|--------------------------------|
| type       | string | Filter by `income` or `expense`|
| category   | string | Filter by category (partial)   |
| startDate  | date   | Filter from date (ISO format)  |
| endDate    | date   | Filter to date (ISO format)    |
| page       | number | Page number (default: 1)       |
| limit      | number | Results per page (default: 10) |
| sort       | string | Sort field (default: `-date`)  |

### Dashboard (Analyst + Admin)

| Method | Endpoint                        | Description                  |
|--------|---------------------------------|------------------------------|
| GET    | /api/dashboard/summary          | Total income, expense, net   |
| GET    | /api/dashboard/by-category      | Category-wise totals         |
| GET    | /api/dashboard/monthly-trends   | Monthly trends (by year)     |
| GET    | /api/dashboard/recent           | Recent transactions          |

---

## Sample Requests

### Register
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "Admin User",
  "email": "admin@finance.com",
  "password": "admin123",
  "role": "admin"
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@finance.com",
  "password": "admin123"
}
```

### Create Transaction
```bash
POST /api/transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 50000,
  "type": "income",
  "category": "Salary",
  "date": "2025-04-01",
  "notes": "Monthly salary"
}
```

### Get Transactions with Filter
```bash
GET /api/transactions?type=expense&category=food&startDate=2025-01-01&page=1&limit=10
Authorization: Bearer <token>
```

---

## Error Response Format

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

Validation errors include a field-level breakdown:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "amount", "message": "Amount must be a positive number" }
  ]
}
```

---

## Assumptions Made

1. **Registration is open by default** — any user can register. In a real system, admin creation would be restricted to a seeded super-admin or an invite flow.
2. **Soft delete on transactions** — deleted transactions are flagged with `isDeleted: true` and excluded from all queries automatically via a Mongoose pre-hook.
3. **Analyst can create transactions** — interpreted as a "power user" who can input data but not modify or delete existing records.
4. **Viewer can browse transactions** — read-only access to raw data, but no access to analytics/dashboard.
5. **createdBy is tracked** on every transaction for audit purposes.

---

## Design Decisions

- **Separation of concerns** — controllers handle HTTP logic, models handle data, middleware handles cross-cutting concerns (auth, validation, errors).
- **Centralized error handling** — a single `errorHandler` middleware catches all errors including Mongoose-specific ones (duplicate key, cast errors, validation), keeping controllers clean.
- **Role guard as middleware** — `authorize(...roles)` is a composable middleware factory, making it trivial to add new roles or adjust permissions per route.
- **Soft delete via pre-hook** — the `isDeleted: false` filter is applied automatically on all `find` queries, so no controller needs to remember to add it manually.
- **Pagination capped at 100** — prevents abuse of the limit parameter.

---

## Optional Enhancements Included

- ✅ JWT Authentication
- ✅ Pagination on transaction listing
- ✅ Soft delete on transactions
- ✅ Swagger API documentation at `/api-docs`
- ✅ Input validation with field-level error messages
- ✅ Helmet + CORS for basic security hardening
