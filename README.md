# TODO API Storage App

A full-stack TODO application with React frontend and Express API backend, featuring comprehensive services for testing frameworks.

## Features

### Backend API
- **Todo Management** - Create, read, update, delete todos
- **User Management** - User registration and management  
- **Category Management** - Organize todos by categories
- **Authentication** - JWT-based authentication
- **Statistics** - Various statistics about todos and users
- **PostgreSQL Storage** - Persistent local storage
- **Swagger Documentation** - Interactive API documentation

### Frontend UI
- **Modern React Interface** - Built with React 18 and Vite
- **Responsive Design** - Tailwind CSS for styling
- **Dark/Light Mode** - Theme toggle support
- **Authentication Flow** - Login, register, and protected routes
- **Todo Management** - Full CRUD operations with real-time updates
- **Category Management** - Organize todos by categories
- **Statistics Dashboard** - Visual overview of todo data

## Quick Start

### Option 1: Full Application (Frontend + Backend)
```bash
# Install all dependencies (both backend and frontend)
npm run install:all

# Start both backend and frontend in development mode
npm run dev:all
```

### Option 2: Backend Only
```bash
# Install backend dependencies only
npm install

# Start backend development server
npm run dev
```

### Option 3: Frontend Only
```bash
# Install frontend dependencies
npm run install:frontend

# Start frontend development server
npm run dev:frontend
```

## Setup

1. **Environment Configuration**
   Copy `.env.example` to `.env` and update database credentials:
   ```bash
   cp .env.example .env
   ```

2. **Database Setup**
   Setup database (creates database and tables):
   ```bash
   npm run db:setup
   ```

3. **Sample Data (Optional)**
   Seed database with sample data (optional):
   ```bash
   npm run db:seed
   ```

4. **Clean Database (Optional)**
   Remove all existing data and reset ID sequences:
   ```bash
   npm run db:clean
   ```

## Available Scripts

### Development
- `npm run dev` - Start backend development server (nodemon)
- `npm run dev:frontend` - Start frontend development server (Vite)
- `npm run dev:all` - Start both backend and frontend concurrently

### Production
- `npm start` - Start backend production server
- `npm run build` - Build frontend for production
- `npm run preview` - Preview built frontend

### Database
- `npm run db:setup` - Create database and tables
- `npm run db:seed` - Seed database with sample data (optional)
- `npm run db:clean` - Remove all data and reset ID sequences

### Utilities
- `npm run lint` - Lint frontend code
- `npm run clean` - Remove all node_modules and build directories

## Application URLs

- **Backend API**: http://localhost:3000
- **Frontend UI**: http://localhost:5173 (in development)
- **API Documentation**: http://localhost:3000/api-docs (Swagger UI)

## Database State

🧹 **Clean Database**: The application currently has a **clean database** with no pre-seeded data. This allows you to:

- Start with a completely fresh application
- Test registration and authentication flows
- Create your own users, categories, and todos
- Understand the app's behavior with empty state

### If you want sample data:
```bash
npm run db:seed
```
This will add 4 sample users, 6 categories, and 20+ sample todos.

### To clean the database again:
```bash
npm run db:clean
```
This removes all data and resets ID sequences to start from 1.

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
