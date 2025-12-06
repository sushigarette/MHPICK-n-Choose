import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNoelSettings } from './NoelSettingsContext';

type Theme = 'light' | 'dark' | 'noel';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings, isLoading } = useNoelSettings();
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as Theme) || 'light';
  });

  useEffect(() => {
    if (isLoading) return;
    
    // Si le thème de Noël est activé globalement, forcer l'application de la classe noel
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'noel');
    
    if (settings.noel_theme_enabled) {
      // Si le thème de Noël est activé, appliquer la classe noel en plus du thème actuel
      root.classList.add(theme === 'noel' ? 'noel' : theme, 'noel');
    } else {
      // Si désactivé et qu'on est en mode noel, passer à light
      if (theme === 'noel') {
        setTheme('light');
        root.classList.add('light');
      } else {
        root.classList.add(theme);
      }
    }
    
    // Ajouter des attributs data-* pour contrôler les styles CSS
    root.setAttribute('data-noel-theme', settings.noel_theme_enabled ? 'true' : 'false');
    root.setAttribute('data-noel-colors', settings.noel_colors ? 'true' : 'false');
    root.setAttribute('data-noel-primary', settings.noel_primary_color ? 'true' : 'false');
    root.setAttribute('data-noel-secondary', settings.noel_secondary_color ? 'true' : 'false');
    root.setAttribute('data-noel-background', settings.noel_background ? 'true' : 'false');
    root.setAttribute('data-noel-borders', settings.noel_borders ? 'true' : 'false');
    
    localStorage.setItem('theme', theme);
  }, [theme, settings, isLoading]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 