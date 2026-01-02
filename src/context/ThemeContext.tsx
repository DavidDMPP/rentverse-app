/**
 * Theme Context - Dark Mode Global Support
 * Menyimpan preferensi theme ke local storage
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useColorScheme, Platform, View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, ThemeMode, lightTheme, darkTheme, Colors } from '../theme';

const THEME_STORAGE_KEY = 'rentverse_theme_mode';

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Loading Screen Component
 */
const LoadingScreen: React.FC = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={Colors.primary} />
  </View>
);

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  // Default ke dark mode sesuai design rentverse
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        let savedTheme: string | null = null;
        
        if (Platform.OS === 'web') {
          if (typeof localStorage !== 'undefined') {
            savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
          }
        } else {
          savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        }
        
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setThemeModeState(savedTheme);
        } else if (systemColorScheme) {
          setThemeModeState(systemColorScheme);
        }
      } catch (error) {
        console.log('Error loading theme:', error);
        // Use default light theme
      } finally {
        setIsInitialized(true);
      }
    };
    
    loadTheme();
  }, [systemColorScheme]);

  // Save theme preference
  const saveTheme = useCallback(async (mode: ThemeMode) => {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(THEME_STORAGE_KEY, mode);
        }
      } else {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      }
    } catch (error) {
      console.log('Error saving theme:', error);
      // Silently fail
    }
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    saveTheme(mode);
  }, [saveTheme]);

  const toggleTheme = useCallback(() => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
  }, [themeMode, setThemeMode]);

  const theme = themeMode === 'dark' ? darkTheme : lightTheme;

  const value: ThemeContextValue = {
    theme,
    isDark: themeMode === 'dark',
    toggleTheme,
    setThemeMode,
  };

  // Show loading screen while theme is being loaded
  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
});

export { ThemeContext };
