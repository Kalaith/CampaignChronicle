// Browser Utility Module - Browser-specific functionality

import { uiLogger } from './logger';

// Device detection utilities
export const deviceDetection = {
  isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  isTablet(): boolean {
    return /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
  },

  isDesktop(): boolean {
    return !this.isMobile() && !this.isTablet();
  },

  getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (this.isMobile()) return 'mobile';
    if (this.isTablet()) return 'tablet';
    return 'desktop';
  },

  supportsTouch(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },
};

// Screen size utilities
export const screenUtils = {
  getScreenSize(): { width: number; height: number } {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  },

  getBreakpoint(): 'sm' | 'md' | 'lg' | 'xl' | '2xl' {
    const width = window.innerWidth;
    if (width < 640) return 'sm';
    if (width < 768) return 'md';
    if (width < 1024) return 'lg';
    if (width < 1280) return 'xl';
    return '2xl';
  },

  isBreakpoint(breakpoint: 'sm' | 'md' | 'lg' | 'xl' | '2xl'): boolean {
    return this.getBreakpoint() === breakpoint;
  },

  onResize(callback: (size: { width: number; height: number }) => void): () => void {
    const handler = () => callback(this.getScreenSize());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  },
};

// Clipboard utilities
export const clipboard = {
  async copy(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        return success;
      }
    } catch (error) {
      uiLogger.error('Failed to copy to clipboard', error);
      return false;
    }
  },

  async read(): Promise<string | null> {
    try {
      if (navigator.clipboard) {
        return await navigator.clipboard.readText();
      }
      return null;
    } catch (error) {
      uiLogger.error('Failed to read from clipboard', error);
      return null;
    }
  },

  isSupported(): boolean {
    return Boolean(navigator.clipboard) || document.queryCommandSupported('copy');
  },
};

// File handling utilities
export const fileUtils = {
  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  downloadText(text: string, filename: string): void {
    const blob = new Blob([text], { type: 'text/plain' });
    this.downloadBlob(blob, filename);
  },

  downloadJson(data: unknown, filename: string): void {
    const text = JSON.stringify(data, null, 2);
    const blob = new Blob([text], { type: 'application/json' });
    this.downloadBlob(blob, filename);
  },

  readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  },

  readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  },

  validateFileSize(file: File, maxSizeBytes: number): boolean {
    return file.size <= maxSizeBytes;
  },

  validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type);
  },

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
};

// URL utilities
export const urlUtils = {
  getQueryParams(): Record<string, string> {
    const params = new URLSearchParams(window.location.search);
    const result: Record<string, string> = {};
    for (const [key, value] of params) {
      result[key] = value;
    }
    return result;
  },

  setQueryParams(params: Record<string, string | null>): void {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, value);
      }
    });
    window.history.replaceState({}, '', url.toString());
  },

  openInNewTab(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  },

  shareUrl(url: string, title?: string): Promise<boolean> {
    if (navigator.share) {
      return navigator.share({
        title,
        url,
      }).then(() => true).catch(() => false);
    }
    // Fallback to copying to clipboard
    return clipboard.copy(url);
  },
};

// Focus management utilities
export const focusUtils = {
  trapFocus(element: HTMLElement): () => void {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);

    // Focus the first element
    firstElement?.focus();

    // Return cleanup function
    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  },

  restoreFocus(previousElement: Element | null): void {
    if (previousElement && 'focus' in previousElement) {
      (previousElement as HTMLElement).focus();
    }
  },

  getCurrentFocusedElement(): Element | null {
    return document.activeElement;
  },
};

// Performance utilities
export const performance = {
  measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    return fn().finally(() => {
      const duration = Date.now() - startTime;
      uiLogger.debug(`Performance: ${name} took ${duration}ms`);
    });
  },

  debounce<T extends (...args: unknown[]) => void>(
    fn: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: number | undefined;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => fn(...args), delay);
    };
  },

  throttle<T extends (...args: unknown[]) => void>(
    fn: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        fn(...args);
      }
    };
  },
};