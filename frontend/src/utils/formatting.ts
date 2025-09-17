// Formatting Utility Module - Text and data formatting functions

import { APP_CONSTANTS } from '../constants/app';

// Text formatting utilities
export const textUtils = {
  capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },

  capitalizeWords(text: string): string {
    return text.split(' ').map(word => this.capitalize(word)).join(' ');
  },

  truncate(text: string, maxLength: number, suffix = '...'): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - suffix.length) + suffix;
  },

  pluralize(word: string, count: number, pluralForm?: string): string {
    if (count === 1) return word;
    return pluralForm || `${word}s`;
  },

  kebabCase(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  },

  camelCase(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+(.)/g, (_, char) => char.toUpperCase());
  },

  snakeCase(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  },

  removeHtmlTags(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  },

  escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  unescapeHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  },

  highlightSearch(text: string, searchTerm: string): string {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  },
};

// Number formatting utilities
export const numberUtils = {
  formatThousands(num: number, separator = ','): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  },

  formatCurrency(amount: number, currency = 'USD', locale = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  },

  formatPercentage(value: number, decimals = 0): string {
    return `${(value * 100).toFixed(decimals)}%`;
  },

  formatDecimal(num: number, decimals = 2): string {
    return num.toFixed(decimals);
  },

  formatOrdinal(num: number): string {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const value = num % 100;
    return num + (suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0]);
  },

  formatRange(min: number, max: number): string {
    return `${min}-${max}`;
  },

  formatRatio(numerator: number, denominator: number): string {
    if (denominator === 0) return 'N/A';
    return `${numerator}:${denominator}`;
  },

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
};

// Date formatting utilities
export const dateUtils = {
  formatRelative(date: Date | string): string {
    const now = new Date();
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  },

  formatDate(date: Date | string, format = 'MMM DD, YYYY'): string {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const fullMonths = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return format
      .replace('YYYY', targetDate.getFullYear().toString())
      .replace('YY', targetDate.getFullYear().toString().slice(-2))
      .replace('MMMM', fullMonths[targetDate.getMonth()])
      .replace('MMM', months[targetDate.getMonth()])
      .replace('MM', (targetDate.getMonth() + 1).toString().padStart(2, '0'))
      .replace('DD', targetDate.getDate().toString().padStart(2, '0'))
      .replace('D', targetDate.getDate().toString());
  },

  formatTime(date: Date | string, includeSeconds = false): string {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const hours = targetDate.getHours().toString().padStart(2, '0');
    const minutes = targetDate.getMinutes().toString().padStart(2, '0');
    
    if (includeSeconds) {
      const seconds = targetDate.getSeconds().toString().padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    }
    
    return `${hours}:${minutes}`;
  },

  formatDateTime(date: Date | string): string {
    return `${this.formatDate(date)} ${this.formatTime(date)}`;
  },

  formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  },

  isToday(date: Date | string): boolean {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    return targetDate.toDateString() === today.toDateString();
  },

  isYesterday(date: Date | string): boolean {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return targetDate.toDateString() === yesterday.toDateString();
  },

  addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },
};

// Campaign-specific formatting utilities
export const campaignUtils = {
  formatCharacterLevel(level: number | null): string {
    if (!level) return 'Unknown';
    return `Level ${level}`;
  },

  formatCharacterHP(hp: number, maxHp?: number): string {
    if (maxHp) {
      return `${hp}/${maxHp} HP`;
    }
    return `${hp} HP`;
  },

  formatArmorClass(ac: number | null): string {
    if (!ac) return 'Unknown AC';
    return `AC ${ac}`;
  },

  formatDiceExpression(expression: string): string {
    return expression.toUpperCase().replace(/\s/g, '');
  },

  formatDiceResult(result: number, expression: string, rolls?: number[]): string {
    let formatted = `${expression} = ${result}`;
    if (rolls && rolls.length > 1) {
      formatted += ` [${rolls.join(', ')}]`;
    }
    return formatted;
  },

  formatExperiencePoints(xp: number): string {
    return `${numberUtils.formatThousands(xp)} XP`;
  },

  formatGoldPieces(gold: number): string {
    if (gold >= 1000000) {
      return `${(gold / 1000000).toFixed(1)}M gp`;
    }
    if (gold >= 1000) {
      return `${(gold / 1000).toFixed(1)}K gp`;
    }
    return `${gold} gp`;
  },

  formatDistance(feet: number): string {
    if (feet >= 5280) {
      return `${(feet / 5280).toFixed(1)} miles`;
    }
    return `${feet} ft`;
  },

  formatWeight(pounds: number): string {
    if (pounds >= 2000) {
      return `${(pounds / 2000).toFixed(1)} tons`;
    }
    return `${pounds} lbs`;
  },

  formatSpellLevel(level: number): string {
    if (level === 0) return 'Cantrip';
    return `${numberUtils.formatOrdinal(level)} Level`;
  },

  formatRarity(rarity: string): string {
    return textUtils.capitalize(rarity);
  },

  formatChallengeRating(cr: number | string): string {
    return `CR ${cr}`;
  },
};