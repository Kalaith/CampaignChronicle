import type { ReactNode } from 'react';

// Base component props that all components should extend
export interface BaseComponentProps {
  className?: string;
  'data-testid'?: string;
  children?: ReactNode;
}

// Common UI component props
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
}

export interface InputProps extends BaseComponentProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'search' | 'url';
  value?: string | number;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

export interface SelectProps extends BaseComponentProps {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
  options: SelectOption[];
  onChange?: (value: string) => void;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface TextareaProps extends BaseComponentProps {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
  rows?: number;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  onChange?: (value: string) => void;
}

export interface CheckboxProps extends BaseComponentProps {
  checked?: boolean;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  error?: string;
  onChange?: (checked: boolean) => void;
}

export interface RadioProps extends BaseComponentProps {
  name: string;
  value: string;
  checked?: boolean;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  onChange?: (value: string) => void;
}

export interface TabsProps extends BaseComponentProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabs: TabDefinition[];
}

export interface TabDefinition {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
  badge?: string | number;
}

export interface CardProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  footer?: ReactNode;
  variant?: 'default' | 'outlined' | 'elevated';
}

export interface BadgeProps extends BaseComponentProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

export interface ToastProps extends BaseComponentProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose?: () => void;
}

export interface DropdownProps extends BaseComponentProps {
  trigger: ReactNode;
  items: DropdownItem[];
  placement?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  onItemClick?: (item: DropdownItem) => void;
}

export interface DropdownItem {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  divider?: boolean;
  danger?: boolean;
}

// Campaign Chronicle specific component props
export interface CampaignSelectorProps extends BaseComponentProps {
  selectedCampaignId?: string;
  onCampaignSelect: (campaignId: string) => void;
  onCreateCampaign: () => void;
}

export interface CharacterFormProps extends BaseComponentProps {
  character?: Partial<Character>;
  campaignId: string;
  onSubmit: (character: Character) => void;
  onCancel: () => void;
  mode: 'create' | 'edit';
}

export interface LocationTreeProps extends BaseComponentProps {
  locations: Location[];
  selectedLocationId?: string;
  onLocationSelect: (locationId: string) => void;
  onLocationCreate: (parentId?: string) => void;
  onLocationEdit: (locationId: string) => void;
  onLocationDelete: (locationId: string) => void;
}

export interface DiceRollerProps extends BaseComponentProps {
  campaignId: string;
  compact?: boolean;
  showHistory?: boolean;
  context?: string;
  onRoll?: (roll: DiceRoll) => void;
  initialExpression?: string;
  allowPrivateRolls?: boolean;
  showTemplates?: boolean;
}

export interface InitiativeTrackerProps extends BaseComponentProps {
  campaignId: string;
  characters: Character[];
  onCharacterAdd?: (character: Character) => void;
  onInitiativeRoll?: (characterId: string, initiative: number) => void;
}

export interface NPCGeneratorProps extends BaseComponentProps {
  campaignId: string;
  onGenerate: (npc: Character) => void;
  onSave?: (npc: Character) => void;
  defaultRace?: string;
  defaultType?: Character['type'];
}

export interface WeatherCalendarProps extends BaseComponentProps {
  campaignId: string;
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
  onWeatherGenerate?: (date: Date) => void;
  showEvents?: boolean;
}

export interface MapViewerProps extends BaseComponentProps {
  map: CampaignMap;
  readonly?: boolean;
  onPinAdd?: (pin: Omit<MapPin, 'id'>) => void;
  onPinEdit?: (pinId: string, updates: Partial<MapPin>) => void;
  onPinDelete?: (pinId: string) => void;
  onRouteAdd?: (route: Omit<MapRoute, 'id'>) => void;
  onRouteEdit?: (routeId: string, updates: Partial<MapRoute>) => void;
  onRouteDelete?: (routeId: string) => void;
}

export interface QuestTrackerProps extends BaseComponentProps {
  campaignId: string;
  quests: Quest[];
  onQuestStatusChange: (questId: string, status: Quest['status']) => void;
  onObjectiveToggle: (questId: string, objectiveId: string) => void;
  onQuestEdit: (questId: string) => void;
  onQuestDelete: (questId: string) => void;
}

export interface TimelineViewProps extends BaseComponentProps {
  campaignId: string;
  events: TimelineEvent[];
  groupBy?: 'session' | 'date' | 'type';
  showFilters?: boolean;
  onEventAdd?: () => void;
  onEventEdit?: (eventId: string) => void;
  onEventDelete?: (eventId: string) => void;
}

export interface PlayerPortalProps extends BaseComponentProps {
  token: string;
  campaignData: PlayerPortalData;
  permissions: PlayerPermissions;
}

export interface PlayerPortalData {
  campaign: Campaign;
  characters: Character[];
  quests: Quest[];
  notes: Note[];
  resources: SharedResource[];
  maps?: CampaignMap[];
}

export interface MobileCompanionProps extends BaseComponentProps {
  campaignId: string;
  isOpen: boolean;
  onClose: () => void;
}

export interface GlobalSearchProps extends BaseComponentProps {
  campaigns?: Campaign[];
  characters: Character[];
  locations: Location[];
  items: Item[];
  notes: Note[];
  relationships: Relationship[];
  timelineEvents: TimelineEvent[];
  quests: Quest[];
  maps: CampaignMap[];
  onResultClick: (result: SearchResult) => void;
  onNavigateToView: (view: string) => void;
}

export interface SearchResult {
  type: 'campaign' | 'character' | 'location' | 'item' | 'note' | 'relationship' | 'timeline' | 'quest' | 'map';
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  relevance: number;
}

// Layout component props
export interface MainLayoutProps extends BaseComponentProps {
  campaign: Campaign;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onBackToCampaigns: () => void;
  characters: Character[];
  locations: Location[];
  items: Item[];
  notes: Note[];
  relationships: Relationship[];
  timelineEvents: TimelineEvent[];
  quests: Quest[];
  maps: CampaignMap[];
  onSearchResultClick: (result: SearchResult) => void;
  onNavigateToView: (view: string) => void;
}

export interface SidebarProps extends BaseComponentProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  campaignName?: string;
  notifications?: SidebarNotification[];
}

export interface SidebarNotification {
  id: string;
  type: 'info' | 'warning' | 'error';
  message: string;
  count?: number;
}

export interface HeaderProps extends BaseComponentProps {
  campaign: Campaign;
  onBackToCampaigns: () => void;
  characters: Character[];
  locations: Location[];
  items: Item[];
  notes: Note[];
  relationships: Relationship[];
  timelineEvents: TimelineEvent[];
  quests: Quest[];
  maps: CampaignMap[];
  onSearchResultClick: (result: SearchResult) => void;
  onNavigateToView: (view: string) => void;
}

// Form component props
export interface FormFieldProps extends BaseComponentProps {
  label?: string;
  error?: string;
  required?: boolean;
  helpText?: string;
}

export interface FormProps extends BaseComponentProps {
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel?: () => void;
  initialData?: Record<string, unknown>;
  validationSchema?: ValidationSchema;
  submitLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
}

export interface ValidationSchema {
  [field: string]: ValidationRule[];
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: string | number | RegExp;
  message: string;
  validator?: (value: unknown) => boolean;
}

// Import the existing types that these props reference
import type { 
  Campaign, 
  Character, 
  Location, 
  Item, 
  Note, 
  Relationship, 
  TimelineEvent, 
  Quest, 
  CampaignMap, 
  MapPin, 
  MapRoute, 
  DiceRoll,
  SharedResource,
  PlayerPermissions,
  ViewType
} from '../types';

// Additional standardized component props for consistency

// Data display components
export interface DataTableProps<T = any> extends BaseComponentProps {
  data: T[];
  columns: Array<{
    key: string;
    title: string;
    render?: (value: any, record: T) => ReactNode;
    sortable?: boolean;
    width?: string;
  }>;
  loading?: boolean;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  onRowClick?: (record: T) => void;
  rowKey?: string | ((record: T) => string);
  emptyMessage?: string;
}

export interface StatCardProps extends BaseComponentProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
}

export interface ProgressBarProps extends BaseComponentProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  size?: 'sm' | 'md' | 'lg';
}

export interface PaginationProps extends BaseComponentProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showSizeChanger?: boolean;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  totalItems?: number;
}

export interface SearchBarProps extends BaseComponentProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export interface EmptyStateProps extends BaseComponentProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface LoadingSpinnerProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  message?: string;
}

export interface ConfirmDialogProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

// Entity list component props
export interface CampaignListProps extends BaseComponentProps {
  campaigns: Campaign[];
  onSelect?: (campaign: Campaign) => void;
  onEdit?: (campaign: Campaign) => void;
  onDelete?: (campaignId: string) => void;
  loading?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export interface CharacterListProps extends BaseComponentProps {
  characters: Character[];
  onSelect?: (character: Character) => void;
  onEdit?: (character: Character) => void;
  onDelete?: (characterId: string) => void;
  loading?: boolean;
  filterType?: 'PC' | 'NPC' | 'Villain' | 'Ally' | 'all';
  onFilterChange?: (type: 'PC' | 'NPC' | 'Villain' | 'Ally' | 'all') => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export interface LocationListProps extends BaseComponentProps {
  locations: Location[];
  onSelect?: (location: Location) => void;
  onEdit?: (location: Location) => void;
  onDelete?: (locationId: string) => void;
  loading?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  filterType?: string;
  onFilterChange?: (type: string) => void;
}

export interface ItemListProps extends BaseComponentProps {
  items: Item[];
  onSelect?: (item: Item) => void;
  onEdit?: (item: Item) => void;
  onDelete?: (itemId: string) => void;
  loading?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  filterType?: string;
  onFilterChange?: (type: string) => void;
}

export interface NoteListProps extends BaseComponentProps {
  notes: Note[];
  onSelect?: (note: Note) => void;
  onEdit?: (note: Note) => void;
  onDelete?: (noteId: string) => void;
  loading?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export interface QuestListProps extends BaseComponentProps {
  quests: Quest[];
  onSelect?: (quest: Quest) => void;
  onEdit?: (quest: Quest) => void;
  onDelete?: (questId: string) => void;
  onStatusChange?: (questId: string, status: string) => void;
  loading?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  filterStatus?: string;
  onFilterChange?: (status: string) => void;
}

// Entity card component props  
export interface CampaignCardProps extends BaseComponentProps {
  campaign: Campaign;
  onClick?: (campaign: Campaign) => void;
  onEdit?: (campaign: Campaign) => void;
  onDelete?: (campaignId: string) => void;
  showActions?: boolean;
}

export interface CharacterCardProps extends BaseComponentProps {
  character: Character;
  onClick?: (character: Character) => void;
  onEdit?: (character: Character) => void;
  onDelete?: (characterId: string) => void;
  showStats?: boolean;
  compact?: boolean;
}

export interface LocationCardProps extends BaseComponentProps {
  location: Location;
  onClick?: (location: Location) => void;
  onEdit?: (location: Location) => void;
  onDelete?: (locationId: string) => void;
  showDescription?: boolean;
}

export interface ItemCardProps extends BaseComponentProps {
  item: Item;
  onClick?: (item: Item) => void;
  onEdit?: (item: Item) => void;
  onDelete?: (itemId: string) => void;
  showQuantity?: boolean;
  showValue?: boolean;
}

export interface NoteCardProps extends BaseComponentProps {
  note: Note;
  onClick?: (note: Note) => void;
  onEdit?: (note: Note) => void;
  onDelete?: (noteId: string) => void;
  showPreview?: boolean;
}

export interface QuestCardProps extends BaseComponentProps {
  quest: Quest;
  onClick?: (quest: Quest) => void;
  onEdit?: (quest: Quest) => void;
  onDelete?: (questId: string) => void;
  onStatusChange?: (status: string) => void;
  showDescription?: boolean;
}

// Dice-specific component props
export interface DiceHistoryProps extends BaseComponentProps {
  rolls: DiceRoll[];
  onDelete?: (rollId: string) => void;
  onClear?: () => void;
  loading?: boolean;
  maxVisible?: number;
  showPlayerNames?: boolean;
}

export interface DiceRollItemProps extends BaseComponentProps {
  roll: DiceRoll;
  onDelete?: (rollId: string) => void;
  showPlayer?: boolean;
  compact?: boolean;
}

export interface DiceTemplateListProps extends BaseComponentProps {
  templates: any[];
  onSelect?: (template: any) => void;
  onEdit?: (template: any) => void;
  onDelete?: (templateId: string) => void;
  onAdd?: () => void;
  loading?: boolean;
}

// Re-export commonly used component prop types
export type {
  Campaign,
  Character,
  Location,
  Item,
  Note,
  Relationship,
  TimelineEvent,
  Quest,
  CampaignMap,
  MapPin,
  MapRoute,
  DiceRoll,
  SharedResource,
  PlayerPermissions,
  ViewType
};