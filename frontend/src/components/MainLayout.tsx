import type { Campaign, ViewType } from '../types';

interface HeaderProps {
  campaign: Campaign;
  onBackToCampaigns: () => void;
}

const Header = ({ campaign, onBackToCampaigns }: HeaderProps) => (
  <header className="bg-white shadow-sm border-b border-gray-200">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBackToCampaigns}
            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            ← Campaigns
          </button>
          <h1 className="text-xl font-semibold text-gray-900">
            {campaign.name}
          </h1>
        </div>
      </div>
    </div>
  </header>
);

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const Sidebar = ({ currentView, onViewChange }: SidebarProps) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'characters', label: 'Characters', icon: '👥' },
    { id: 'locations', label: 'Locations', icon: '🏰' },
    { id: 'items', label: 'Items', icon: '⚔️' },
    { id: 'relationships', label: 'Relationships', icon: '🔗' },
    { id: 'notes', label: 'Notes', icon: '📝' },
  ] as const;

  return (
    <nav className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <div className="p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors ${
                  currentView === item.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

interface MainLayoutProps {
  campaign: Campaign;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onBackToCampaigns: () => void;
  children: React.ReactNode;
}

export const MainLayout = ({ 
  campaign, 
  currentView, 
  onViewChange, 
  onBackToCampaigns, 
  children 
}: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header campaign={campaign} onBackToCampaigns={onBackToCampaigns} />
      <div className="flex">
        <Sidebar currentView={currentView} onViewChange={onViewChange} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
