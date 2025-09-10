import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

// Define user type for campaign chronicle
interface User {
  id: number;
  auth0_id: string;
  email: string;
  display_name: string;
  username: string;
  role: string;
  created_at: string;
  updated_at: string;
}

// Define the shape of our auth context
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  checkingUserStatus: boolean;
  error: string | null;
  /**
   * Forces a re-verification of the authenticated user against the backend.
   */
  refreshUserInfo: () => Promise<void>;
  loginWithRedirect: () => void;
  logout: () => void;
  getAccessToken: () => Promise<string>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  checkingUserStatus: true,
  error: null,
  refreshUserInfo: async () => { /* no-op default */ },
  loginWithRedirect: () => { /* no-op default */ },
  logout: () => { /* no-op default */ },
  getAccessToken: async () => { throw new Error('Not implemented'); }
});

// Custom hook for using auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const auth0 = useAuth0();
  const { isAuthenticated, isLoading, user: auth0User, loginWithRedirect, logout: auth0Logout, getAccessTokenSilently } = auth0;
  
  // Add state for our extended auth information
  const [user, setUser] = useState<User | null>(null);
  const [checkingUserStatus, setCheckingUserStatus] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Verify user in our database and sync with Auth0 data
   */
  const performUserVerification = useCallback(async () => {
    if (!auth0User) return;

    setCheckingUserStatus(true);
    
    try {
      // Get access token to make authenticated API call
      const token = await getAccessTokenSilently();
      
      // Call our API to verify/create user
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/verify-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          auth0_id: auth0User.sub,
          email: auth0User.email,
          display_name: auth0User.name || auth0User.email,
          username: auth0User.nickname || auth0User.email?.split('@')[0] || 'user'
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setUser(result.data);
      } else {
        throw new Error(result.message || 'User verification failed');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify user';
      setError(errorMessage);
    } finally {
      setCheckingUserStatus(false);
    }
  }, [auth0User, getAccessTokenSilently]);

  // Verify user in our database when they authenticate with Auth0
  useEffect(() => {
    if (isAuthenticated && auth0User && !isLoading) {
      performUserVerification();
    } else if (!isLoading) {
      setCheckingUserStatus(false);
      // Clear user data when not authenticated
      setUser(null);
    }
  }, [isAuthenticated, auth0User, isLoading, performUserVerification]);

  const logout = useCallback(() => {
    setUser(null);
    setError(null);
    auth0Logout({ logoutParams: { returnTo: window.location.origin } });
  }, [auth0Logout]);

  const getAccessToken = useCallback(async (): Promise<string> => {
    return await getAccessTokenSilently();
  }, [getAccessTokenSilently]);

  const contextValue: AuthContextType = {
    isAuthenticated,
    isLoading: isLoading || checkingUserStatus,
    user,
    checkingUserStatus,
    error,
    refreshUserInfo: performUserVerification,
    loginWithRedirect,
    logout,
    getAccessToken
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};