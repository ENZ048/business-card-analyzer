# Super Scanner - User & Plan System Setup

## Overview
This system now includes a comprehensive user authentication and subscription plan system with an admin panel for managing users, plans, and analytics.

## Features Added

### User System
- User registration and authentication
- JWT-based authentication
- User profiles and password management
- Role-based access control (user, admin, super_admin)

### Plan System
- **Starter Plan**: 1,000 card scans (1 year validity) - FREE
- **Growth Plan**: 3,000 card scans (1 year validity) - $29.99/year
- **Pro Plan**: 10,000 card scans (1 year validity) - $79.99/year
- **Enterprise Plan**: Unlimited card scans (1 year validity) - $199.99/year

### Admin Panel
- Dashboard with usage statistics
- User management (view, edit, deactivate users)
- Plan management (edit plans, pricing, features)
- Usage analytics and reporting
- Role management

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Variables
Create a `.env` file in the backend directory with:

```env
# Server Configuration
PORT=5000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/business-card-analyzer

# JWT Secret (Change this in production!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Google Cloud Vision API
GOOGLE_CLOUD_CREDENTIALS={"type":"service_account","project_id":"your-project",...}

# OpenAI API
OPENAI_API_KEY=your-openai-api-key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### 3. MongoDB Setup
Make sure MongoDB is running on your system. The app will automatically create the database and collections.

### 4. Create Admin User
Run the following command to create a default admin user:

```bash
npm run create-admin
```

This creates an admin user with:
- Email: admin@businesscardanalyzer.com
- Password: admin123456
- Role: super_admin

**⚠️ IMPORTANT: Change the admin password after first login!**

### 5. Start the Backend
```bash
npm run dev
```

## Frontend Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start the Frontend
```bash
npm run dev
```

## Usage

### For Regular Users
1. Visit the application
2. Register for a new account (automatically gets Starter Plan)
3. Start scanning business cards
4. Upgrade plan when needed

### For Admins
1. Login with admin credentials
2. Access the admin panel automatically
3. Manage users, plans, and view analytics

## API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Plans
- `GET /api/plans` - Get all plans
- `GET /api/plans/current` - Get user's current plan
- `POST /api/plans/upgrade` - Upgrade user's plan
- `GET /api/plans/usage` - Get usage history

### Admin (Requires Admin Role)
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/users` - Get all users (with pagination)
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Deactivate user
- `GET /api/admin/plans` - Get plans for admin
- `PUT /api/admin/plans/:id` - Update plan
- `GET /api/admin/usage` - Get usage analytics

## Database Models

### User Model
- Basic user information (name, email, password)
- Current plan and plan dates
- Role (user, admin, super_admin)
- Account status

### Plan Model
- Plan details (name, description, limits, pricing)
- Features list
- Active status and popularity

### Usage Model
- Monthly usage tracking per user
- Scan limits and usage counts
- Plan association

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Input validation and sanitization
- CORS protection

## Admin Panel Features

### Dashboard
- Total users and active users
- New users this month
- Total scans this month
- Plan distribution
- Usage trends
- Recent users list

### User Management
- Search and filter users
- View user details and usage
- Edit user information
- Change user roles
- Deactivate users
- Reset user usage

### Plan Management
- Edit plan details
- Update pricing and features
- Set plan popularity
- View plan statistics

### Usage Analytics
- Monthly usage trends
- Top users by usage
- Usage statistics
- Export capabilities

## Production Considerations

1. **Change default admin password**
2. **Use strong JWT secret**
3. **Set up proper MongoDB security**
4. **Configure CORS for production domain**
5. **Set up SSL/HTTPS**
6. **Implement rate limiting**
7. **Add logging and monitoring**
8. **Set up backup strategies**

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in .env

2. **Authentication Issues**
   - Verify JWT_SECRET is set
   - Check token expiration

3. **Admin Access Issues**
   - Run `npm run create-admin` to create admin user
   - Check user role in database

4. **Plan Issues**
   - Default plans are created automatically
   - Check plan data in MongoDB

For more help, check the console logs and ensure all environment variables are properly set.
