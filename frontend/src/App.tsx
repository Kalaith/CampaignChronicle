import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useApiCampaignStore } from './stores/apiCampaignStore';
import CampaignSelectionPage from './pages/CampaignSelectionPage';
import CampaignLayoutPage from './pages/CampaignLayoutPage';
import './styles/App.css';

const App: React.FC = () => {
  const { currentCampaign } = useApiCampaignStore();

  const handleCampaignSelected = () => {
    // Navigation will be handled by React Router
  };

  return (
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
  );
};

export default App;
