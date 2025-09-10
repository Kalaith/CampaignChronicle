/**
 * AuthGuard component - Protects routes requiring authentication
 */
import { useAuth } from '../contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, isAuthenticated, isLoading, loginWithRedirect, error } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 text-center">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white mb-2">Campaign Chronicle</h1>
              <p className="text-gray-400 mb-6">Please authenticate to continue</p>
            </div>
            
            <div className="space-y-4">
              {error && (
                <div className="bg-red-900/50 border border-red-500 rounded-md p-3 mb-4">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}
              
              <p className="text-gray-300">You need to be logged in to access Campaign Chronicle.</p>
              <button 
                onClick={() => loginWithRedirect()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-md transition-colors"
              >
                Login with Auth0
              </button>
              <p className="text-sm text-gray-400">
                This will use the same login as the frontpage - single sign-on across all WebHatchery apps.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}