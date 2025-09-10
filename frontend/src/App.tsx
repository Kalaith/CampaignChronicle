import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useApiCampaignStore } from './stores/apiCampaignStore';
import { AuthProvider } from './contexts/AuthContext';
import AuthGuard from './components/AuthGuard';
import CampaignSelectionPage from './pages/CampaignSelectionPage';
import CampaignLayoutPage from './pages/CampaignLayoutPage';
import './styles/App.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  const { currentCampaign } = useApiCampaignStore();

  const handleCampaignSelected = () => {
    // Navigation will be handled by React Router
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGuard>
          <BrowserRouter>
            <Routes>
              <Route 
                path="/" 
                element={
                  !currentCampaign ? 
                  <CampaignSelectionPage onCampaignSelected={handleCampaignSelected} /> :
                  <Navigate to="/campaign/dashboard" replace />
                } 
              />
              <Route 
                path="/campaign/*" 
                element={
                  currentCampaign ? 
                  <CampaignLayoutPage /> :
                  <Navigate to="/" replace />
                } 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthGuard>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
