import { useState, useRef } from 'react';
import { useCampaignStore } from '../stores/campaignStore';
import { exportCampaignData, exportAllData, importCampaignData } from '../utils/dataExport';
import { Modal } from './Modal';

interface DataManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataManagement = ({ isOpen, onClose }: DataManagementProps) => {
  const {
    currentCampaign,
    campaigns,
    characters,
    locations,
    items,
    notes,
    relationships,
    importCampaignData: importCampaign,
    importFullBackup,
  } = useCampaignStore();

  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportCampaign = () => {
    if (!currentCampaign) {
      alert('Please select a campaign to export');
      return;
    }

    try {
      exportCampaignData(
        currentCampaign,
        characters,
        locations,
        items,
        notes,
        relationships
      );
      setImportSuccess('Campaign exported successfully!');
      setTimeout(() => setImportSuccess(null), 3000);
    } catch {
      setImportError('Failed to export campaign');
      setTimeout(() => setImportError(null), 3000);
    }
  };

  const handleExportAll = () => {
    try {
      exportAllData();
      setImportSuccess('Full backup exported successfully!');
      setTimeout(() => setImportSuccess(null), 3000);
    } catch {
      setImportError('Failed to export data');
      setTimeout(() => setImportError(null), 3000);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);
    setImportSuccess(null);

    importCampaignData(
      file,
      (data) => {
        try {
          const dataObj = data as Record<string, unknown>;
          if (dataObj.type === 'full_backup') {
            importFullBackup(data);
            setImportSuccess('Full backup imported successfully!');
          } else {
            importCampaign(data);
            setImportSuccess('Campaign imported successfully!');
          }
        } catch {
          setImportError('Failed to import data');
        } finally {
          setIsImporting(false);
        }
      },
      (error) => {
        setImportError(error);
        setIsImporting(false);
      }
    );

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const stats = {
    campaigns: campaigns.length,
    characters: characters.length,
    locations: locations.length,
    items: items.length,
    notes: notes.length,
    relationships: relationships.length,
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Data Management">
      <div className="space-y-6">
        {/* Status Messages */}
        {importError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="text-red-800 text-sm">{importError}</div>
            </div>
          </div>
        )}

        {importSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="text-green-800 text-sm">{importSuccess}</div>
            </div>
          </div>
        )}

        {/* Data Overview */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Data Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(stats).map(([key, count]) => (
              <div key={key} className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600 capitalize">{key}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Export Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Export Data</h3>
          <div className="space-y-3">
            <button
              onClick={handleExportCampaign}
              disabled={!currentCampaign}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <span className="mr-2">📁</span>
              Export Current Campaign
              {!currentCampaign && <span className="ml-2 text-xs">(No campaign selected)</span>}
            </button>

            <button
              onClick={handleExportAll}
              className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <span className="mr-2">💾</span>
              Export Full Backup (All Data)
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Import Data</h3>
          <button
            onClick={handleImportClick}
            disabled={isImporting}
            className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <span className="mr-2">📤</span>
            {isImporting ? 'Importing...' : 'Import Campaign or Backup'}
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".json"
            className="hidden"
          />

          <div className="mt-3 text-sm text-gray-600">
            <p>• Import individual campaign exports</p>
            <p>• Import full backup files</p>
            <p>• Supported format: .json files only</p>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="text-yellow-800 text-sm">
              <p className="font-medium mb-1">⚠️ Important Notes:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Campaign imports will create new campaigns with "(Imported)" suffix</li>
                <li>Full backup imports will replace ALL existing data</li>
                <li>Always export your data before importing to avoid data loss</li>
                <li>Data is automatically saved to your browser's local storage</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};