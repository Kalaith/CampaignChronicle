/**
 * UserMenu component - Shows user info and logout option
 */
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {user.display_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
        </div>
        <span className="hidden sm:block">{user.display_name || user.email}</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-20">
            <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
              <div className="font-medium">{user.display_name}</div>
              <div className="text-gray-400">{user.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}