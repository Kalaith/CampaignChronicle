import type { Campaign } from '../types';

interface CampaignSelectionProps {
  campaigns: Campaign[];
  onSelectCampaign: (campaign: Campaign) => void;
  onCreateCampaign: () => void;
  onDeleteCampaign: (campaignId: string) => void;
}

export const CampaignSelection = ({ 
  campaigns, 
  onSelectCampaign, 
  onCreateCampaign,
  onDeleteCampaign 
}: CampaignSelectionProps) => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            D&D Campaign Companion
          </h1>
          <p className="text-lg text-gray-600">
            Manage your campaigns, characters, and adventures
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* New Campaign Card */}
          <div 
            onClick={onCreateCampaign}
            className="bg-white rounded-lg shadow-md border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors cursor-pointer p-8 text-center"
          >
            <div className="text-4xl text-gray-400 mb-4">+</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">New Campaign</h3>
            <p className="text-gray-500">Start a new adventure</p>
          </div>

          {/* Existing Campaigns */}
          {campaigns.map((campaign) => (
            <div 
              key={campaign.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
            >
              <div 
                onClick={() => onSelectCampaign(campaign)}
                className="p-6 cursor-pointer"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {campaign.name}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {campaign.description || 'No description'}
                </p>
                <div className="text-sm text-gray-500">
                  Created: {new Date(campaign.createdAt).toLocaleDateString()}
                </div>
              </div>
              
              <div className="px-6 pb-4 flex justify-between items-center">
                <button
                  onClick={() => onSelectCampaign(campaign)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  Open Campaign
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete campaign "${campaign.name}"? This action cannot be undone.`)) {
                      onDeleteCampaign(campaign.id);
                    }
                  }}
                  className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-md transition-colors text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
