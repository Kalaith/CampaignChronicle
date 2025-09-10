# Campaign Chronicle Authentication Integration Summary

## Overview
Campaign Chronicle has been successfully integrated with the frontpage authentication system. Users now need to authenticate through the frontpage auth service to access their campaign data.

## What Was Implemented

### Backend Changes
1. **Authentication Middleware** (`src/Middleware/AuthMiddleware.php`)
   - Validates user tokens with the frontpage auth service
   - Adds user information to request context
   - Returns 401 for unauthorized requests

2. **Authentication Controller** (`src/Controllers/AuthController.php`)
   - `/api/auth/user` - Get current user info
   - `/api/auth/validate` - Validate user session

3. **Database Schema Updates**
   - Added `user_id` foreign key to all main tables:
     - campaigns, characters, locations, items, notes, relationships, timeline_events
   - Migration script: `migrate_auth.php`

4. **Controller Updates**
   - Updated CampaignController to filter by user_id
   - Added authentication checks to all CRUD operations
   - BaseController enhanced with user context methods

5. **Route Protection**
   - All API routes (except auth endpoints) now require authentication
   - Auth middleware applied to protected route groups

### Frontend Changes
1. **Authentication Store** (`src/stores/authStore.ts`)
   - Zustand store for managing auth state
   - Persistent storage for user data and tokens

2. **Auth API Service** (`src/services/authApi.ts`)
   - Integration with frontpage auth endpoints
   - Token management and validation
   - Login, register, logout functionality

3. **Auth Components**
   - `AuthGuard.tsx` - Protects routes and validates authentication
   - `LoginForm.tsx` - Handles user login and registration
   - `UserMenu.tsx` - Displays user info and logout option

4. **API Integration**
   - Updated main API service to include authorization headers
   - Changed API base URL to port 8000 (Campaign Chronicle backend)

5. **UI Updates**
   - Added AuthGuard wrapper to main App component
   - Integrated UserMenu into MainLayout header
   - Login/register interface for unauthenticated users

### Configuration
1. **Environment Variables**
   - `AUTH_SERVICE_URL` - URL of frontpage auth service
   - Database configuration for Campaign Chronicle
   - Example: `.env.example` file created

## How It Works

### Authentication Flow
1. User visits Campaign Chronicle frontend
2. AuthGuard checks if user is authenticated
3. If not authenticated, shows login form
4. User logs in through frontpage auth service
5. Token is stored and used for all subsequent API calls
6. Backend validates token with frontpage service on each request
7. User data is filtered by authenticated user's ID

### Data Isolation
- All campaign data is now isolated by user_id
- Users can only see and modify their own campaigns
- Existing data migrated to default user (ID: 1)

### Token Management
- JWT tokens stored in localStorage
- Automatic token inclusion in API headers
- Token validation on app startup
- Graceful handling of expired tokens

## Migration Requirements

### Database Migration
Run the auth migration script:
```bash
cd backend
php migrate_auth.php
```

This will:
- Add user_id columns to all tables
- Set existing data to user_id = 1 (default admin)
- Make user_id columns non-nullable

### Environment Setup
1. Copy `.env.example` to `.env`
2. Configure database connection
3. Set AUTH_SERVICE_URL to frontpage backend API

### Dependencies
Backend uses existing dependencies, no new packages required.
Frontend uses existing Zustand for state management.

## Security Features
- All API endpoints require valid authentication tokens
- User data isolation prevents cross-user data access
- Tokens validated on each request
- Automatic logout on token expiration
- CORS middleware maintained for secure cross-origin requests

## Future Enhancements
- Campaign sharing between users
- Team collaboration features
- Role-based permissions
- Activity logging and audit trails
- Enhanced user profile management

## Testing
To test the integration:
1. Ensure frontpage auth service is running
2. Start Campaign Chronicle backend with auth middleware
3. Access Campaign Chronicle frontend
4. Should prompt for login if not authenticated
5. After login, should access campaigns normally with user isolation

## Deployment Notes
- Ensure frontpage auth service is accessible from Campaign Chronicle backend
- Update environment variables for production URLs
- Run database migration before deployment
- Test authentication flow end-to-end before going live