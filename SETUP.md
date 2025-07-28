# Setup Guide

## Project Structure

This project uses a **separated frontend and backend** structure:

```
todo-api-storage-app/
├── frontend/          # React + Vite frontend
├── backend/           # Express.js API backend  
└── package.json       # Workspace manager
```

All commands are run from the **root directory** and automatically target the appropriate folder.

## Prerequisites
- Node.js installed
- PostgreSQL installed and running
- PostgreSQL user credentials

## Quick Setup

1. **Update Environment Variables**
   ```
   Copy backend/.env.example to backend/.env and update:
   DB_PASSWORD=your_actual_postgres_password
   ```

2. **Install All Dependencies**
   ```
   npm run install:all
   ```

3. **Setup Database**
   ```
   npm run db:setup
   ```

4. **Clean Database** (Optional)
   ```
   npm run db:clean
   ```

5. **Start Both Frontend and Backend**
   ```
   npm run dev:all
   ```
   
   Or start individually:
   ```
   npm run dev:backend    # Backend only
   npm run dev:frontend   # Frontend only
   ```

## Test the API

Once running, you can test the endpoints:

### Register a User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com", 
    "password": "password123",
    "first_name": "Test",
    "last_name": "User"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

### Create a Todo (requires JWT token from login)
```bash
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Learn Node.js",
    "description": "Complete Node.js tutorial",
    "priority": "high"
  }'
```

### Get All Todos
```bash
curl http://localhost:3000/api/todos
```

### Get Statistics
```bash
curl http://localhost:3000/api/stats/overview
```

## Available Endpoints

- **Health Check**: `GET /health`
- **API Docs**: `GET /` (shows all endpoints)
- **Authentication**: `/api/auth/*`
- **Users**: `/api/users/*`
- **Categories**: `/api/categories/*`
- **Todos**: `/api/todos/*`
- **Statistics**: `/api/stats/*`

## Common Issues

1. **Database Connection Error**: Check your PostgreSQL credentials in `.env`
2. **Permission Denied**: Make sure PostgreSQL service is running
3. **Port Already in Use**: Change PORT in `.env` file

## Database State

🧹 **Clean Database**: The database is currently **completely clean** with no pre-seeded data or test data. You can:

- **Start fresh**: The app works perfectly with an empty database
- **Add sample data**: Run `npm run db:seed` to add sample users, categories, and todos
- **Clean all data**: Run `npm run db:clean` to remove all data and reset ID sequences

### Benefits of Clean Database:
- Test user registration and authentication flows
- Understand empty state UI behavior  
- Create your own meaningful test data
- Perfect starting point for development

### If you want sample data:
Running `npm run db:seed` will add:
- 4 sample users (password: "password123")
- 6 categories 
- 22+ sample todos

Sample users:
- johndoe / john@example.com
- janedoe / jane@example.com
- bobsmith / bob@example.com
- alicejohnson / alice@example.com
