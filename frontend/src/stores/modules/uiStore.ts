// UI Store Module - Focused on application UI state management

import { StateCreator } from 'zustand';
import { storeLogger } from '../../utils/logger';
import type { ViewType } from '../../types';

export interface UIState {
  // Navigation
  currentView: ViewType;
  previousView: ViewType | null;
  
  // Loading states
  isLoading: boolean;
  loadingMessage: string | null;
  
  // Error states
  error: string | null;
  errorContext: string | null;
  
  // Modal states
  activeModal: string | null;
  modalData: Record<string, unknown> | null;
  
  // Sidebar state
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  
  // Toast notifications
  toasts: ToastNotification[];
  
  // Responsive state
  isMobile: boolean;
  screenSize: 'sm' | 'md' | 'lg' | 'xl';
  
  // Theme
  theme: 'light' | 'dark' | 'auto';
  
  // Search
  globalSearchOpen: boolean;
  globalSearchQuery: string;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>;
  createdAt: number;
}

export interface UIActions {
  // Navigation
  setCurrentView: (view: ViewType) => void;
  goBack: () => void;
  
  // Loading states
  setLoading: (loading: boolean, message?: string) => void;
  
  // Error handling
  setError: (error: string | null, context?: string) => void;
  clearError: () => void;
  
  // Modal management
  openModal: (modalId: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  
  // Sidebar management
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;
  
  // Toast notifications
  addToast: (toast: Omit<ToastNotification, 'id' | 'createdAt'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  
  // Responsive management
  setScreenSize: (size: UIState['screenSize']) => void;
  setIsMobile: (isMobile: boolean) => void;
  
  // Theme management
  setTheme: (theme: UIState['theme']) => void;
  
  // Search
  setGlobalSearchOpen: (open: boolean) => void;
  setGlobalSearchQuery: (query: string) => void;
  
  // Utilities
  getActiveToasts: () => ToastNotification[];
  isModalOpen: (modalId: string) => boolean;
}

export type UISlice = UIState & UIActions;

const DEFAULT_TOAST_DURATION = 5000;
const DEFAULT_SIDEBAR_WIDTH = 256;

export const createUISlice: StateCreator<
  UISlice,
  [],
  [],
  UISlice
> = (set, get) => ({
  // Initial state
  currentView: 'dashboard',
  previousView: null,
  isLoading: false,
  loadingMessage: null,
  error: null,
  errorContext: null,
  activeModal: null,
  modalData: null,
  sidebarCollapsed: false,
  sidebarWidth: DEFAULT_SIDEBAR_WIDTH,
  toasts: [],
  isMobile: false,
  screenSize: 'lg',
  theme: 'auto',
  globalSearchOpen: false,
  globalSearchQuery: '',

  // Actions
  setCurrentView: (view) => {
    const currentView = get().currentView;
    storeLogger.debug(`Navigating from ${currentView} to ${view}`);
    set({ 
      previousView: currentView,
      currentView: view,
      error: null // Clear errors on navigation
    });
  },

  goBack: () => {
    const { previousView } = get();
    if (previousView) {
      storeLogger.debug(`Going back to ${previousView}`);
      set((state) => ({
        currentView: previousView,
        previousView: state.currentView,
      }));
    }
  },

  setLoading: (loading, message) => {
    set({ 
      isLoading: loading, 
      loadingMessage: loading ? message || null : null 
    });
  },

  setError: (error, context) => {
    storeLogger.error('UI error set', { error, context });
    set({ 
      error, 
      errorContext: context || null,
      isLoading: false // Stop loading on error
    });
  },

  clearError: () => {
    set({ error: null, errorContext: null });
  },

  openModal: (modalId, data) => {
    storeLogger.debug(`Opening modal: ${modalId}`, data);
    set({ 
      activeModal: modalId, 
      modalData: data || null 
    });
  },

  closeModal: () => {
    const { activeModal } = get();
    if (activeModal) {
      storeLogger.debug(`Closing modal: ${activeModal}`);
    }
    set({ 
      activeModal: null, 
      modalData: null 
    });
  },

  toggleSidebar: () => {
    set((state) => ({ 
      sidebarCollapsed: !state.sidebarCollapsed 
    }));
  },

  setSidebarCollapsed: (collapsed) => {
    set({ sidebarCollapsed: collapsed });
  },

  setSidebarWidth: (width) => {
    set({ sidebarWidth: Math.max(200, Math.min(400, width)) });
  },

  addToast: (toast) => {
    const id = crypto.randomUUID();
    const newToast: ToastNotification = {
      ...toast,
      id,
      duration: toast.duration || DEFAULT_TOAST_DURATION,
      createdAt: Date.now(),
    };

    set((state) => ({
      toasts: [...state.toasts, newToast]
    }));

    // Auto-remove toast after duration
    if (newToast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, newToast.duration);
    }

    storeLogger.debug(`Toast added: ${toast.type} - ${toast.title}`);
    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter(toast => toast.id !== id)
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },

  setScreenSize: (size) => {
    set({ 
      screenSize: size,
      isMobile: size === 'sm'
    });
  },

  setIsMobile: (isMobile) => {
    set({ isMobile });
  },

  setTheme: (theme) => {
    storeLogger.debug(`Theme changed to: ${theme}`);
    set({ theme });
  },

  setGlobalSearchOpen: (open) => {
    set({ 
      globalSearchOpen: open,
      globalSearchQuery: open ? get().globalSearchQuery : ''
    });
  },

  setGlobalSearchQuery: (query) => {
    set({ globalSearchQuery: query });
  },

  getActiveToasts: () => {
    return get().toasts;
  },

  isModalOpen: (modalId) => {
    return get().activeModal === modalId;
  },
});