// App Header Component - Focused on application header functionality

import React from 'react';
import { GlobalSearch } from '../GlobalSearch';
import UserMenu from '../UserMenu';
import { useAppStore } from '../../stores/appStore';
import { APP_CONSTANTS } from '../../constants/app';
import type { HeaderProps } from '../../types/components';

export const AppHeader: React.FC<HeaderProps> = ({ 
  campaign, 
  onBackToCampaigns, 
  characters, 
  locations, 
  items, 
  notes, 
  relationships, 
  timelineEvents, 
  quests, 
  maps, 
  onSearchResultClick, 
  onNavigateToView 
}) => {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left section - Navigation and campaign info */}
          <div className="flex items-center space-x-4">
            {/* Mobile sidebar toggle */}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 lg:hidden"
              aria-label="Toggle sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Back to campaigns button */}
            <button
              onClick={onBackToCampaigns}
              className="inline-flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Back to campaigns list"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Campaigns</span>
            </button>

            {/* Campaign name */}
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 truncate max-w-xs sm:max-w-md">
                {campaign.name}
              </h1>
              {campaign.description && (
                <div 
                  className="ml-2 text-gray-500 cursor-help"
                  title={campaign.description}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Right section - Search and user menu */}
          <div className="flex items-center space-x-4">
            <GlobalSearch
              characters={characters}
              locations={locations}
              items={items}
              notes={notes}
              relationships={relationships}
              timelineEvents={timelineEvents}
              quests={quests}
              maps={maps}
              onResultClick={onSearchResultClick}
              onNavigateToView={onNavigateToView}
            />
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Progress indicator for loading states */}
      <HeaderProgressBar />
    </header>
  );
};

// Small sub-component for header progress bar
const HeaderProgressBar: React.FC = () => {
  const { isLoading } = useAppStore();

  if (!isLoading) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0">
      <div className="h-0.5 bg-blue-200">
        <div className="h-full bg-blue-600 animate-pulse" style={{ width: '30%' }} />
      </div>
    </div>
  );
};