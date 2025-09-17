// Example component demonstrating new infrastructure usage

import React from 'react';
import { useApiResource, useFormSubmission } from '../../hooks/useApiResource';
import { campaignService } from '../../services';
import { ValidationSchemas } from '../../utils/validation';
import { APP_CONSTANTS } from '../../constants/app';
import type { CampaignListProps, CampaignCardProps } from '../../types/components';
import type { Campaign, CreateCampaignRequest } from '../../types';

// Example Campaign Card Component with proper typing
const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  onClick,
  onEdit,
  onDelete,
  showActions = true,
  className = '',
  testId
}) => {
  const handleClick = () => onClick?.(campaign);
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(campaign);
  };
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(campaign.id);
  };

  return (
    <div 
      className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${className}`}
      onClick={handleClick}
      data-testid={testId}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {campaign.name}
          </h3>
          {campaign.description && (
            <p className="text-gray-600 mt-1 text-sm line-clamp-2">
              {campaign.description}
            </p>
          )}
          <div className="flex gap-2 mt-2 text-xs text-gray-500">
            <span>Created: {new Date(campaign.createdAt).toLocaleDateString()}</span>
            <span>•</span>
            <span>Modified: {new Date(campaign.lastModified).toLocaleDateString()}</span>
          </div>
        </div>
        
        {showActions && (
          <div className="flex gap-2 ml-4">
            <button
              onClick={handleEdit}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Example Campaign List Component with proper typing and new infrastructure
const CampaignListExample: React.FC<CampaignListProps> = ({
  campaigns: propCampaigns,
  onSelect,
  onEdit,
  onDelete,
  loading: propLoading,
  searchQuery = '',
  onSearchChange,
  className = '',
  testId
}) => {
  // Use the new custom hook for API resource management
  const {
    data: campaigns,
    loading,
    error,
    refetch
  } = useApiResource(
    () => campaignService.getAllCampaigns(),
    [], // dependencies
    { 
      immediate: !propCampaigns, // Only fetch if campaigns not provided as props
      retryOnError: true,
      maxRetries: APP_CONSTANTS.API.DEFAULT_RETRY_ATTEMPTS
    }
  );

  // Use provided campaigns or fetched campaigns
  const displayCampaigns = propCampaigns || campaigns || [];
  const isLoading = propLoading ?? loading;

  // Filter campaigns based on search query
  const filteredCampaigns = displayCampaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (campaignId: string) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      try {
        await campaignService.deleteCampaign(campaignId);
        onDelete?.(campaignId);
        // Refetch if we're managing our own data
        if (!propCampaigns) {
          refetch();
        }
      } catch (error) {
        console.error('Failed to delete campaign:', error);
      }
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-medium">Error Loading Campaigns</h3>
        <p className="text-red-600 text-sm mt-1">{error.userMessage}</p>
        <button
          onClick={() => refetch()}
          className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (filteredCampaigns.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {searchQuery ? (
          <>
            <p>No campaigns found matching "{searchQuery}"</p>
            <button
              onClick={() => onSearchChange?.('')}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              Clear search
            </button>
          </>
        ) : (
          <p>No campaigns found. Create your first campaign to get started!</p>
        )}
      </div>
    );
  }

  return (
    <div className={className} data-testid={testId}>
      <div className="space-y-4">
        {filteredCampaigns.map(campaign => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            onClick={onSelect}
            onEdit={onEdit}
            onDelete={handleDelete}
            testId={`campaign-card-${campaign.id}`}
          />
        ))}
      </div>
    </div>
  );
};

// Example Campaign Form Component using new form submission hook
interface CampaignFormProps {
  campaign?: Partial<Campaign>;
  onSubmit: (campaign: Campaign) => void;
  onCancel?: () => void;
  className?: string;
}

const CampaignFormExample: React.FC<CampaignFormProps> = ({
  campaign,
  onSubmit,
  onCancel,
  className = ''
}) => {
  const [formData, setFormData] = React.useState({
    name: campaign?.name || '',
    description: campaign?.description || ''
  });

  // Use the new form submission hook with validation
  const {
    submit,
    loading,
    errors,
    submitError,
    clearErrors
  } = useFormSubmission<CreateCampaignRequest>(
    async (data) => {
      if (campaign?.id) {
        return campaignService.updateCampaign(campaign.id, data);
      } else {
        return campaignService.createCampaign(data);
      }
    },
    {
      validate: (data) => {
        const result = ValidationSchemas.campaign;
        // This would use the actual validation logic
        return null; // No errors for this example
      },
      onSuccess: () => {
        if (onSubmit) {
          // This is simplified - in reality we'd get the campaign back from the service
          onSubmit(campaign as Campaign);
        }
      }
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    submit(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Campaign Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={APP_CONSTANTS.VALIDATION.MAX_NAME_LENGTH}
          required
        />
        {errors.name && (
          <p className="text-red-600 text-sm mt-1">{errors.name[0]}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={APP_CONSTANTS.VALIDATION.MAX_DESCRIPTION_LENGTH}
        />
        {errors.description && (
          <p className="text-red-600 text-sm mt-1">{errors.description[0]}</p>
        )}
      </div>

      {submitError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{submitError.userMessage}</p>
        </div>
      )}

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            disabled={loading}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : campaign?.id ? 'Update' : 'Create'} Campaign
        </button>
      </div>
    </form>
  );
};

export { CampaignListExample, CampaignFormExample, CampaignCard };