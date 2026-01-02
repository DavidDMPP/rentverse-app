/**
 * Rentverse Global Theme System
 * Design System dengan Dark Mode sebagai default (sesuai rentverse web)
 */

export const Colors = {
  // Primary Colors (Indigo)
  primary: '#5048e5',
  primaryLight: '#6366F1',
  primaryDark: '#4338CA',
  
  // Secondary Colors (Green)
  secondary: '#22C55E',
  secondaryLight: '#4ADE80',
  secondaryDark: '#16A34A',
  
  // Accent (Amber)
  accent: '#F59E0B',
  accentLight: '#FBBF24',
  accentDark: '#D97706',
  
  // Status Colors
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',
  
  // Dark Mode (Default - sesuai rentverse web)
  dark: {
    background: '#0f172a',
    surface: '#1c1b32',
    surfaceLight: '#272546',
    card: '#1c1b32',
    text: '#FFFFFF',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    border: 'rgba(255, 255, 255, 0.05)',
    borderLight: 'rgba(255, 255, 255, 0.1)',
    divider: 'rgba(255, 255, 255, 0.05)',
    placeholder: '#64748B',
    skeleton: '#334155',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
  
  // Light Mode
  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceLight: '#F1F5F9',
    card: '#FFFFFF',
    text: '#0F172A',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    divider: '#F1F5F9',
    placeholder: '#94A3B8',
    skeleton: '#E2E8F0',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FontFamily = {
  heading: 'System',
  body: 'System',
  button: 'System',
};

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  xxxl: 32,
  display: 40,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  black: '900' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  primary: {
    shadowColor: '#5048e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
};

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  colors: typeof Colors.dark & {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    secondaryLight: string;
    secondaryDark: string;
    accent: string;
    accentLight: string;
    accentDark: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    white: string;
    black: string;
  };
  spacing: typeof Spacing;
  borderRadius: typeof BorderRadius;
  fontSize: typeof FontSize;
  fontWeight: typeof FontWeight;
  shadow: typeof Shadow;
}

export const createTheme = (mode: ThemeMode): Theme => ({
  mode,
  colors: {
    ...(mode === 'light' ? Colors.light : Colors.dark),
    primary: Colors.primary,
    primaryLight: Colors.primaryLight,
    primaryDark: Colors.primaryDark,
    secondary: Colors.secondary,
    secondaryLight: Colors.secondaryLight,
    secondaryDark: Colors.secondaryDark,
    accent: Colors.accent,
    accentLight: Colors.accentLight,
    accentDark: Colors.accentDark,
    success: Colors.success,
    warning: Colors.warning,
    error: Colors.error,
    info: Colors.info,
    white: Colors.white,
    black: Colors.black,
  },
  spacing: Spacing,
  borderRadius: BorderRadius,
  fontSize: FontSize,
  fontWeight: FontWeight,
  shadow: Shadow,
});

export const lightTheme = createTheme('light');
export const darkTheme = createTheme('dark');
