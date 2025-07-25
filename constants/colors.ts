// Default theme colors
export const colors = {
  primary: '#4E054C',      // rgb(78, 5, 76) - New primary purple
  primaryDark: '#2E0320',  // Darker shade
  primaryLight: '#6E0778', // Lighter shade
  secondary: '#E91E63',    // Pink accent
  secondaryDark: '#C2185B',
  secondaryLight: '#F48FB1',
  accent: '#FF4081',       // Bright pink accent
  background: '#FFFFFF',
  card: '#F3F4F6',
  text: '#1F2937',
  textSecondary: '#6B7280',
  textLight: '#FFFFFF',
  border: '#E5E7EB',
  neutral: '#9CA3AF',
} as const;

// Dark theme colors
export const darkColors = {
  primary: '#6E0778',      // Lighter purple for dark theme
  primaryDark: '#4E054C',  // Original purple
  primaryLight: '#8E0998', // Even lighter shade
  secondary: '#E91E63',
  secondaryDark: '#C2185B',
  secondaryLight: '#F48FB1',
  accent: '#FF4081',
  background: '#2E0320',   // Darkest purple
  card: '#4E054C',
  text: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textLight: '#FFFFFF',
  border: '#6E0778',
  neutral: '#9CA3AF',
} as const;

export type ColorScheme = typeof colors;