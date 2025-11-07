/**
 * Awareness Utilities
 * 
 * Helper functions for managing user awareness (cursors, selections, presence)
 * in collaborative editing sessions.
 */

'use client';

/**
 * Generate a random color for a user
 * Uses HSL color space for vibrant, distinguishable colors
 */
export function generateUserColor(): string {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 70 + Math.floor(Math.random() * 10); // 70-80%
  const lightness = 50 + Math.floor(Math.random() * 10);  // 50-60%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * User awareness state interface
 */
export interface UserAwareness {
  user: {
    id: string;
    name: string;
    color: string;
  };
  cursor?: {
    line: number;
    column: number;
  };
  selection?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

/**
 * Create initial awareness state for a user
 */
export function createUserAwareness(
  userId: string,
  userName: string,
  color?: string
): UserAwareness {
  return {
    user: {
      id: userId,
      name: userName,
      color: color || generateUserColor(),
    },
  };
}

/**
 * Convert Monaco editor position to Yjs-compatible position
 * Monaco uses 1-indexed lines, we normalize to 0-indexed
 */
export function monacoPositionToYjs(position: { lineNumber: number; column: number }) {
  return {
    line: position.lineNumber - 1, // Convert to 0-indexed
    column: position.column - 1,   // Convert to 0-indexed
  };
}

/**
 * Convert Yjs position to Monaco editor position
 */
export function yjsPositionToMonaco(position: { line: number; column: number }) {
  return {
    lineNumber: position.line + 1, // Convert to 1-indexed
    column: position.column + 1,   // Convert to 1-indexed
  };
}

/**
 * Get a contrasting text color (black or white) for a given background color
 * Used to ensure cursor labels are readable
 */
export function getContrastColor(hexColor: string): string {
  // Convert hex to RGB
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black for light colors, white for dark colors
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Debounce function for awareness updates
 * Prevents sending too many cursor position updates
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for awareness updates
 * Ensures updates are sent at most once per interval
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
