import { useState, useEffect, createContext } from 'react';
import { useColorScheme } from 'react-native';
import { colors, darkColors, ColorScheme } from '@/constants/colors';

type ThemeContextType = {
  theme: 'light' | 'dark';
  colors: ColorScheme;
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  colors: colors,
  toggleTheme: () => {},
});

export function useTheme() {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<'light' | 'dark'>(systemColorScheme || 'light');
  const [themeColors, setThemeColors] = useState<ColorScheme>(theme === 'light' ? colors : darkColors);

  useEffect(() => {
    setThemeColors(theme === 'light' ? colors : darkColors);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(current => current === 'light' ? 'dark' : 'light');
  };

  return {
    theme,
    colors: themeColors,
    toggleTheme,
  };
}