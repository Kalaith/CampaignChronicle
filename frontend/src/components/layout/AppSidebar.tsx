// App Sidebar Component - Focused on navigation sidebar functionality

import React from 'react';
import { useAppStore } from '../../stores/appStore';
import type { SidebarProps, SidebarNotification } from '../../types/components';
import type { ViewType } from '../../types';

interface NavigationItem {
  id: ViewType;
  label: string;
  icon: string;
  description: string;
  badge?: string | number;
  disabled?: boolean;
}

const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', description: 'Campaign overview and statistics' },
  { id: 'characters', label: 'Characters', icon: '👥', description: 'Manage NPCs, PCs, and villains' },
  { id: 'locations', label: 'Locations', icon: '🏰', description: 'World locations and places' },
  { id: 'items', label: 'Items', icon: '⚔️', description: 'Equipment, treasures, and artifacts' },
  { id: 'relationships', label: 'Relationships', icon: '🔗', description: 'Character connections and bonds' },
  { id: 'notes', label: 'Notes', icon: '📝', description: 'Campaign notes and documentation' },
  { id: 'timeline', label: 'Timeline', icon: '📅', description: 'Campaign events and history' },
  { id: 'quests', label: 'Quests', icon: '🎯', description: 'Active and completed quests' },
  { id: 'maps', label: 'Maps', icon: '🗺️', description: 'Campaign maps and locations' },
  { id: 'player-access', label: 'Player Access', icon: '👥', description: 'Manage player permissions' },
  { id: 'resources', label: 'Resources', icon: '📁', description: 'Shared resources and files' },
  { id: 'dice-roller', label: 'Dice Roller', icon: '🎲', description: 'Digital dice rolling tool' },
  { id: 'mobile-companion', label: 'Mobile Companion', icon: '📱', description: 'Mobile access portal' },
];

export const AppSidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  campaignName,
  notifications = []
}) => {
  const { sidebarCollapsed, sidebarWidth, isMobile } = useAppStore();

  // Don't show sidebar on mobile when collapsed
  if (isMobile && sidebarCollapsed) {
    return null;
  }

  const sidebarStyle = {
    width: sidebarCollapsed ? '4rem' : `${sidebarWidth}px`,
    minWidth: sidebarCollapsed ? '4rem' : '200px',
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && !sidebarCollapsed && (
        <div className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden" />
      )}

      {/* Sidebar */}
      <nav 
        className={`
          ${isMobile ? 'fixed' : 'relative'} 
          top-0 left-0 z-30 h-full bg-white shadow-sm border-r border-gray-200 
          transition-all duration-300 ease-in-out flex flex-col
        `}
        style={sidebarStyle}
      >
        {/* Sidebar header */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          {!sidebarCollapsed && (
            <div>
              <h2 className="text-sm font-semibold text-gray-900 truncate" title={campaignName}>
                {campaignName || 'Campaign Chronicle'}
              </h2>
              <p className="text-xs text-gray-500 mt-1">Navigation</p>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="flex justify-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">CC</span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <ul className="space-y-1">
              {navigationItems.map((item) => (
                <NavigationItem
                  key={item.id}
                  item={item}
                  currentView={currentView}
                  onViewChange={onViewChange}
                  isCollapsed={sidebarCollapsed}
                  notifications={notifications.filter(n => n.id === item.id)}
                />
              ))}
            </ul>
          </div>
        </div>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          {!sidebarCollapsed && (
            <div className="text-xs text-gray-500 text-center">
              <p>Campaign Chronicle</p>
              <p className="mt-1">v1.0.0</p>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

// Navigation item sub-component
interface NavigationItemProps {
  item: NavigationItem;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isCollapsed: boolean;
  notifications: SidebarNotification[];
}

const NavigationItem: React.FC<NavigationItemProps> = ({
  item,
  currentView,
  onViewChange,
  isCollapsed,
  notifications
}) => {
  const isActive = currentView === item.id;
  const hasNotifications = notifications.length > 0;
  const notificationCount = notifications.reduce((sum, n) => sum + (n.count || 1), 0);

  const buttonClassName = `
    group relative w-full flex items-center px-3 py-2 rounded-lg text-left transition-all duration-200
    ${isActive
      ? 'bg-blue-100 text-blue-700 shadow-sm'
      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
    }
    ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
  `;

  const handleClick = () => {
    if (!item.disabled) {
      onViewChange(item.id);
    }
  };

  return (
    <li>
      <button
        onClick={handleClick}
        className={buttonClassName}
        disabled={item.disabled}
        title={isCollapsed ? `${item.label}: ${item.description}` : item.description}
        aria-label={item.label}
      >
        {/* Icon */}
        <span className={`flex-shrink-0 text-lg ${isCollapsed ? 'mx-auto' : 'mr-3'}`}>
          {item.icon}
        </span>

        {/* Label and badge */}
        {!isCollapsed && (
          <div className="flex-1 min-w-0 flex items-center justify-between">
            <span className="font-medium truncate">
              {item.label}
            </span>
            
            {/* Notifications or badge */}
            {hasNotifications && (
              <span className={`
                ml-2 px-2 py-0.5 text-xs rounded-full font-medium
                ${notifications.some(n => n.type === 'error') 
                  ? 'bg-red-100 text-red-800'
                  : notifications.some(n => n.type === 'warning')
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-blue-100 text-blue-800'
                }
              `}>
                {notificationCount}
              </span>
            )}
            
            {item.badge && !hasNotifications && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full font-medium">
                {item.badge}
              </span>
            )}
          </div>
        )}

        {/* Collapsed notification indicator */}
        {isCollapsed && hasNotifications && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>

      {/* Tooltip for collapsed state */}
      {isCollapsed && (
        <div className="
          group-hover:opacity-100 opacity-0 absolute left-full top-0 ml-2 px-2 py-1 
          bg-gray-900 text-white text-sm rounded whitespace-nowrap z-50 
          transition-opacity pointer-events-none
        ">
          {item.label}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 
                         border-4 border-transparent border-r-gray-900" />
        </div>
      )}
    </li>
  );
};