# Shared Auth0 Authentication Setup

Campaign Chronicle now shares the same Auth0 authentication system as the frontpage, providing true single sign-on (SSO) across WebHatchery applications.

## Overview

- **Frontend**: Uses `@auth0/auth0-react` for direct Auth0 integration
- **Backend**: Validates Auth0 JWT tokens directly using `firebase/php-jwt`
- **Database**: User data synced between Auth0 and local database
- **Session Management**: Handled entirely by Auth0 (no dependency on frontpage)

## Configuration Steps

### 1. Frontend Configuration

1. Copy environment variables from frontpage:
```bash
# Create .env file in campaign_chronicle/frontend/
cp ../frontpage/frontend/.env ./campaign_chronicle/frontend/.env
```

2. The following environment variables are required:
```env
VITE_AUTH0_DOMAIN=your-auth0-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-auth0-client-id
VITE_AUTH0_AUDIENCE=your-auth0-api-audience
VITE_AUTH0_CALLBACK_URL=http://localhost:5173
VITE_API_BASE_URL=http://localhost:8000/api
```

### 2. Backend Configuration

1. Create `.env` file in `campaign_chronicle/backend/`:
```env
# Copy from .env.example and update with your values
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_AUDIENCE=your-auth0-api-audience

# Database settings
DB_HOST=localhost
DB_PORT=3306
DB_NAME=campaign_chronicle
DB_USER=root
DB_PASSWORD=your-password
```

### 3. Auth0 Configuration

#### Update Auth0 Application Settings

1. **Allowed Callback URLs**: Add campaign_chronicle URLs
```
http://localhost:5173,
http://localhost:5173/callback,
https://your-domain.com/campaign_chronicle,
https://your-domain.com/campaign_chronicle/callback
```

2. **Allowed Logout URLs**: Add campaign_chronicle URLs
```
http://localhost:5173,
https://your-domain.com/campaign_chronicle
```

3. **Allowed Web Origins**: Add campaign_chronicle domains
```
http://localhost:5173,
https://your-domain.com
```

#### CORS Settings
Ensure Auth0 CORS is configured to allow requests from campaign_chronicle domains.

## How It Works

### Authentication Flow

1. **User visits Campaign Chronicle**
   - If not authenticated, shows "Login with Auth0" button
   - Clicking button redirects to Auth0 Universal Login

2. **Auth0 Authentication**
   - User logs in through Auth0 (same login as frontpage)
   - Auth0 redirects back with authorization code
   - Frontend exchanges code for access token

3. **User Verification**
   - Frontend calls `/api/auth/verify-user` with Auth0 user data
   - Backend validates JWT token directly with Auth0
   - Creates/updates user record in local database
   - Returns user profile to frontend

4. **Subsequent Requests**
   - All API calls include `Authorization: Bearer <token>` header
   - Backend validates JWT on each request
   - User context available in all controllers

### Single Sign-On

- **Same Auth0 Tenant**: Both apps use identical Auth0 configuration
- **Shared Sessions**: Login to one app = login to both apps
- **Unified Logout**: Logout from one app logs out of both
- **User Profiles**: Consistent user data across applications

### Database Schema

The existing user schema remains the same:
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    auth0_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    username VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    is_verified BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Development Setup

### 1. Install Dependencies

Frontend:
```bash
cd campaign_chronicle/frontend
npm install
```

Backend:
```bash
cd campaign_chronicle/backend
composer install
```

### 2. Start Development Servers

Backend:
```bash
cd campaign_chronicle/backend
composer run start
# Runs on http://localhost:8000
```

Frontend:
```bash
cd campaign_chronicle/frontend
npm run dev
# Runs on http://localhost:5173
```

### 3. Test Authentication

1. Visit `http://localhost:5173`
2. Click "Login with Auth0"
3. Complete Auth0 login (same as frontpage)
4. Should be redirected back and authenticated
5. User data should appear in campaign_chronicle database

## Production Deployment

### Environment Variables

Update production environment files with:

Frontend (`.env.production`):
```env
VITE_AUTH0_DOMAIN=your-auth0-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-auth0-client-id
VITE_AUTH0_AUDIENCE=your-auth0-api-audience
VITE_AUTH0_CALLBACK_URL=https://your-domain.com/campaign_chronicle
VITE_API_BASE_URL=https://your-domain.com/campaign_chronicle/api
```

Backend (`.env`):
```env
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_AUDIENCE=your-auth0-api-audience
APP_ENV=production
APP_DEBUG=false
```

### Auth0 Production URLs

Update Auth0 application settings with production URLs:
```
Callback URLs: https://your-domain.com/campaign_chronicle
Logout URLs: https://your-domain.com/campaign_chronicle
Web Origins: https://your-domain.com
```

## Security Features

### JWT Validation
- **Direct Auth0 validation**: No dependency on frontpage backend
- **JWKS endpoint**: Public keys fetched from Auth0
- **Token claims validation**: Audience, issuer, expiration checked
- **Automatic user sync**: Auth0 profile updates reflected locally

### User Isolation
- **Campaign data filtered by user_id**: Users only see their own data
- **Automatic user creation**: New Auth0 users get database records
- **Role-based access**: Admin roles supported through Auth0 custom claims

## Troubleshooting

### Common Issues

1. **"Auth0 configuration missing"**
   - Check `.env` files in both frontend and backend
   - Ensure all required variables are set

2. **"Token validation failed"**
   - Verify AUTH0_DOMAIN and AUTH0_AUDIENCE match frontend
   - Check Auth0 application configuration

3. **"User verification failed"**
   - Check database connection
   - Ensure users table exists and has correct schema

4. **CORS errors**
   - Update Auth0 application Allowed Web Origins
   - Check backend CORS middleware configuration

### Debug Mode

Enable debug logging by setting:
```env
APP_DEBUG=true
LOG_LEVEL=debug
```

Logs will show JWT validation steps and user verification process.

## Auth0-Only Implementation

Campaign Chronicle now uses **Auth0-only authentication**:

1. **Legacy auth system removed**: No fallback to frontpage auth service
2. **Clean architecture**: Single authentication method
3. **User data preserved**: Existing users can be migrated via Auth0 ID matching
4. **Simplified maintenance**: No dual-auth complexity

## Benefits of Shared Auth0

1. **True SSO**: Single login across all WebHatchery apps
2. **Simplified architecture**: No inter-service auth dependencies
3. **Better security**: Direct JWT validation, no cookie sharing
4. **Centralized user management**: All user data in Auth0
5. **Scalability**: Independent deployment and scaling
6. **Modern auth flows**: PKCE, refresh tokens, MFA support