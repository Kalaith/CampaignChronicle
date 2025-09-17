// Modern App Layout Component - Refactored with new infrastructure

import React, { useEffect } from 'react';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { ToastContainer } from '../ui/ToastContainer';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { LoadingOverlay } from '../ui/LoadingOverlay';
import { useAppStore } from '../../stores/appStore';
import type { MainLayoutProps } from '../../types/components';

export const AppLayout: React.FC<MainLayoutProps> = ({ 
  campaign, 
  currentView, 
  onViewChange, 
  onBackToCampaigns, 
  children,
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
  const { 
    sidebarCollapsed, 
    sidebarWidth, 
    isMobile, 
    isLoading, 
    loadingMessage,
    setScreenSize,
    setIsMobile 
  } = useAppStore();

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      
      if (width < 640) {
        setScreenSize('sm');
        setIsMobile(true);
      } else if (width < 768) {
        setScreenSize('md');
        setIsMobile(true);
      } else if (width < 1024) {
        setScreenSize('lg');
        setIsMobile(false);
      } else {
        setScreenSize('xl');
        setIsMobile(false);
      }
    };

    handleResize(); // Initial call
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setScreenSize, setIsMobile]);

  const mainContentStyle = {
    marginLeft: isMobile ? 0 : sidebarCollapsed ? '4rem' : `${sidebarWidth}px`,
    transition: 'margin-left 300ms ease-in-out',
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <AppHeader 
          campaign={campaign} 
          onBackToCampaigns={onBackToCampaigns}
          characters={characters}
          locations={locations}
          items={items}
          notes={notes}
          relationships={relationships}
          timelineEvents={timelineEvents}
          quests={quests}
          maps={maps}
          onSearchResultClick={onSearchResultClick}
          onNavigateToView={onNavigateToView}
        />

        {/* Body container */}
        <div className="flex flex-1 relative">
          {/* Sidebar */}
          <AppSidebar 
            currentView={currentView} 
            onViewChange={onViewChange}
            campaignName={campaign.name}
          />

          {/* Main content area */}
          <main 
            className="flex-1 flex flex-col"
            style={mainContentStyle}
          >
            {/* Content wrapper with proper spacing */}
            <div className="flex-1 p-4 sm:p-6 lg:p-8">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </div>

            {/* Footer */}
            <AppFooter />
          </main>
        </div>

        {/* Global overlays */}
        <LoadingOverlay isLoading={isLoading} message={loadingMessage} />
        <ToastContainer />
      </div>
    </ErrorBoundary>
  );
};

// Simple footer component
const AppFooter: React.FC = () => {
  const { isMobile } = useAppStore();

  if (isMobile) return null;

  return (
    <footer className="border-t border-gray-200 bg-white px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto py-4 flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span>Campaign Chronicle</span>
          <span>•</span>
          <span>v1.0.0</span>
        </div>
        <div className="flex items-center space-x-4">
          <button className="hover:text-gray-700 transition-colors">
            Help
          </button>
          <span>•</span>
          <button className="hover:text-gray-700 transition-colors">
            Feedback
          </button>
        </div>
      </div>
    </footer>
  );
};