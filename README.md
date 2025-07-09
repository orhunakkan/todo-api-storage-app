# TODO API Storage App

A simple local API application with comprehensive services for testing e2e frameworks.

## Features

- **Todo Management** - Create, read, update, delete todos
- **User Management** - User registration and management  
- **Category Management** - Organize todos by categories
- **Authentication** - JWT-based authentication
- **Statistics** - Various statistics about todos and users
- **PostgreSQL Storage** - Persistent local storage

## Setup

1. Copy `.env.example` to `.env` and update database credentials:
   ```
   cp .env.example .env
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Setup database (creates database and tables):
   ```
   npm run db:setup
   ```

4. Seed database with sample data (optional):
   ```
   npm run db:seed
   ```

5. Start the server:
   ```
   npm start
   ```

   Or for development with auto-restart:
   ```
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (requires auth)

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `GET /api/categories/:id` - Get category by ID
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Todos
- `GET /api/todos` - Get all todos (with filtering)
- `POST /api/todos` - Create todo
- `GET /api/todos/:id` - Get todo by ID
- `PUT /api/todos/:id` - Update todo
- `DELETE /api/todos/:id` - Delete todo
- `PATCH /api/todos/:id/complete` - Mark todo as complete
- `PATCH /api/todos/:id/incomplete` - Mark todo as incomplete

### Statistics
- `GET /api/stats/overview` - General statistics
- `GET /api/stats/todos` - Todo statistics
- `GET /api/stats/users` - User statistics

## Query Parameters

### Todos
- `?user_id=123` - Filter by user
- `?category_id=456` - Filter by category
- `?completed=true/false` - Filter by completion status
- `?priority=low/medium/high` - Filter by priority
- `?limit=10` - Limit results
- `?offset=0` - Offset for pagination

## Example Usage

```bash
# Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Create a todo
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"title":"Learn Node.js","description":"Complete Node.js tutorial","priority":"high"}'
```

Server runs on http://localhost:3000
