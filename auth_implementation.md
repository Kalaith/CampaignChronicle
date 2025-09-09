# Campaign Chronicle Authentication Integration Plan

## Overview
Campaign Chronicle currently operates without authentication. This plan outlines how to implement user accounts through the frontpage site to provide secure, multi-user access to campaign management features.

## Current State
- Campaign Chronicle: No authentication, open access to all features
- Frontpage: Separate site that will handle user authentication and session management

## Proposed Architecture

### Authentication Flow
1. **User Registration/Login**: Handled entirely by frontpage site
2. **Session Management**: Frontpage maintains user sessions and tokens
3. **Campaign Access**: Campaign Chronicle validates users through frontpage API
4. **Data Isolation**: Each user's campaigns and data are isolated by user ID

### Technical Implementation

#### Phase 1: Frontpage Authentication System
- **User Registration**: Email/password registration with validation
- **Login System**: Secure authentication with session management
- **User Profiles**: Basic profile management (username, email, preferences)
- **Session Tokens**: JWT or session-based authentication tokens
- **API Endpoints**: RESTful API for user validation and data access

#### Phase 2: Campaign Chronicle Integration
- **Authentication Middleware**: Validate user sessions from frontpage
- **User Context**: Pass user ID to all Campaign Chronicle operations
- **Database Schema Updates**: Add user_id foreign keys to all campaign tables
- **Data Migration**: Associate existing campaigns with a default admin user
- **Access Control**: Ensure users can only access their own campaigns

#### Phase 3: Enhanced Features
- **Campaign Sharing**: Allow users to share campaigns with other users
- **Team Management**: Multi-user campaigns with role-based permissions
- **Import/Export**: User-specific data backup and restore
- **Activity Logs**: Track user actions for security and audit

### Database Changes

#### Frontpage Database (New Tables)
```sql
-- Users table
users (id, email, username, password_hash, created_at, updated_at, email_verified)

-- User sessions
user_sessions (id, user_id, token, expires_at, created_at)

-- User preferences  
user_preferences (id, user_id, preferences_json, updated_at)
```

#### Campaign Chronicle Database (Schema Updates)
```sql
-- Add user_id to existing tables
ALTER TABLE campaigns ADD COLUMN user_id INT REFERENCES users(id);
ALTER TABLE characters ADD COLUMN user_id INT REFERENCES users(id);  
ALTER TABLE locations ADD COLUMN user_id INT REFERENCES users(id);
ALTER TABLE items ADD COLUMN user_id INT REFERENCES users(id);
ALTER TABLE notes ADD COLUMN user_id INT REFERENCES users(id);
ALTER TABLE relationships ADD COLUMN user_id INT REFERENCES users(id);

-- Campaign sharing (future enhancement)
campaign_shares (id, campaign_id, owner_user_id, shared_user_id, permissions, created_at)
```

### API Design

#### Frontpage Authentication API
```
POST /api/auth/register - User registration
POST /api/auth/login - User login  
POST /api/auth/logout - User logout
GET /api/auth/validate - Validate session token
GET /api/auth/user - Get current user info
PUT /api/auth/user - Update user profile
```

#### Campaign Chronicle User API
```
GET /api/user/campaigns - Get user's campaigns
POST /api/user/campaigns - Create new campaign for user
GET /api/user/validate - Validate user session (internal)
```

### Security Considerations

#### Authentication Security
- **Password Hashing**: Use bcrypt or Argon2 for password storage
- **CSRF Protection**: Implement CSRF tokens for all forms
- **Rate Limiting**: Prevent brute force attacks on login
- **Session Security**: Secure session cookies with httpOnly and secure flags
- **Token Expiration**: Implement reasonable token expiration times

#### Data Security  
- **SQL Injection**: Use prepared statements for all database queries
- **XSS Prevention**: Sanitize all user inputs and outputs
- **Access Control**: Strict user ID validation on all operations
- **Data Encryption**: Consider encrypting sensitive campaign data at rest

### Implementation Timeline

#### Week 1-2: Frontpage Authentication
- Set up user registration and login system
- Implement session management
- Create user profile management
- Build authentication API endpoints

#### Week 3-4: Campaign Chronicle Integration  
- Add authentication middleware to Campaign Chronicle
- Update database schema with user_id fields
- Migrate existing data to default admin user
- Implement user context throughout application

#### Week 5-6: Testing and Security
- Comprehensive security testing
- User acceptance testing
- Performance optimization
- Documentation and deployment

### Migration Strategy

#### Data Migration
1. **Create Default Admin User**: Migrate all existing campaigns to admin account
2. **User ID Population**: Update all tables with default admin user_id
3. **Validation**: Ensure all records have valid user associations
4. **Backup**: Full database backup before migration

#### Rollback Plan
- **Database Backup**: Complete backup before any schema changes
- **Feature Flags**: Implement authentication as optional feature initially  
- **Graceful Degradation**: Maintain ability to run without authentication during transition

### Post-Implementation Enhancements

#### User Experience
- **Dashboard**: Personalized dashboard showing user's campaigns
- **Recent Activity**: Show recent changes and activity
- **Search**: User-specific search across campaigns
- **Favorites**: Allow users to favorite important campaigns/characters

#### Advanced Features
- **Team Collaboration**: Multi-user campaign management
- **Campaign Templates**: Shareable campaign templates
- **Data Analytics**: User engagement and usage analytics
- **Mobile App**: Extend authentication to mobile applications

## Conclusion
This phased approach ensures secure implementation of user authentication while maintaining Campaign Chronicle's current functionality. The separation of concerns between frontpage authentication and Campaign Chronicle features provides flexibility and security while enabling future enhancements for multi-user collaboration.
