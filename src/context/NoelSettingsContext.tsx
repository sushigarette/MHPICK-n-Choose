import React, { createContext, useContext, useEffect, useState } from 'react';
import supabase from '@/supabase';

interface NoelSettings {
  noel_theme_enabled: boolean;
  noel_colors: boolean;
  noel_primary_color: boolean;
  noel_secondary_color: boolean;
  noel_background: boolean;
  noel_borders: boolean;
  noel_snow: boolean;
}

interface NoelSettingsContextType {
  settings: NoelSettings;
  isLoading: boolean;
  updateSetting: (key: keyof NoelSettings, value: boolean) => Promise<void>;
}

const defaultSettings: NoelSettings = {
  noel_theme_enabled: true,
  noel_colors: true,
  noel_primary_color: true,
  noel_secondary_color: true,
  noel_background: true,
  noel_borders: true,
  noel_snow: true,
};

const NoelSettingsContext = createContext<NoelSettingsContextType | undefined>(undefined);

export function NoelSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<NoelSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
    
    // Écouter les changements en temps réel
    const channel = supabase
      .channel('noel-settings-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'site_settings', filter: 'key=like.noel_%' },
        () => {
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .like('key', 'noel_%');

      if (error) throw error;

      const newSettings = { ...defaultSettings };
      
      if (data) {
        data.forEach((item) => {
          const key = item.key as keyof NoelSettings;
          if (key in newSettings) {
            newSettings[key] = item.value === 'true';
          }
        });
      }

      setSettings(newSettings);
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres de Noël:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: keyof NoelSettings, value: boolean) => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({ value: value.toString() })
        .eq('key', key);

      if (error) throw error;

      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error('Erreur lors de la mise à jour du paramètre:', error);
      throw error;
    }
  };

  return (
    <NoelSettingsContext.Provider value={{ settings, isLoading, updateSetting }}>
      {children}
    </NoelSettingsContext.Provider>
  );
}

export function useNoelSettings() {
  const context = useContext(NoelSettingsContext);
  if (context === undefined) {
    throw new Error('useNoelSettings must be used within a NoelSettingsProvider');
  }
  return context;
}

