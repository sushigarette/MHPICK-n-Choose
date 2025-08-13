import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Cloud, Sun, CloudRain, CloudSnow, Wind, RefreshCw } from "lucide-react";
import axios from "axios";

interface WeatherData {
  date: string;
  temp: number;
  description: string;
  icon: string;
}

const WeatherWidget: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const getWeatherIcon = (iconCode: string) => {
    const code = parseInt(iconCode);
    
    // Codes Open-Meteo (WMO)
    if (code === 0) return <Sun className="h-3 w-3 text-yellow-500" />; // Ciel dégagé
    if (code === 1 || code === 2) return <Cloud className="h-3 w-3 text-gray-500" />; // Peu nuageux / Partiellement nuageux
    if (code === 3) return <Cloud className="h-3 w-3 text-gray-600" />; // Couvert
    if (code === 45 || code === 48) return <Cloud className="h-3 w-3 text-gray-400" />; // Brouillard
    if (code >= 51 && code <= 55) return <CloudRain className="h-3 w-3 text-blue-400" />; // Bruine
    if (code >= 61 && code <= 65) return <CloudRain className="h-3 w-3 text-blue-500" />; // Pluie
    if (code >= 71 && code <= 75) return <CloudSnow className="h-3 w-3 text-blue-300" />; // Neige
    if (code >= 95 && code <= 99) return <Wind className="h-3 w-3 text-purple-500" />; // Orage
    
    // Par défaut
    return <Cloud className="h-3 w-3 text-gray-500" />;
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Auj";
    if (date.toDateString() === tomorrow.toDateString()) return "Dem";
    
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[date.getDay()];
  };

  const fetchWeather = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude: 43.6047,
          longitude: 1.4442,
          current: 'temperature_2m,weathercode',
          hourly: 'temperature_2m,weathercode',
          daily: 'temperature_2m_max,temperature_2m_min,weathercode',
          timezone: 'Europe/Paris'
        },
        timeout: 5000 // Timeout de 5 secondes
      });
      
      const data = response.data;
      
      // Debug: Afficher les données reçues
      console.log('Données météo reçues:', data);
      console.log('Conditions actuelles:', data.current);
      console.log('Codes météo:', data.daily.weathercode);
      console.log('Températures max:', data.daily.temperature_2m_max);
      console.log('Températures min:', data.daily.temperature_2m_min);
      
      // Utiliser les conditions actuelles pour aujourd'hui
      const currentTemp = Math.round(data.current.temperature_2m);
      const currentWeatherCode = data.current.weathercode;
      
      const weather: WeatherData[] = data.daily.time.slice(0, 7).map((date: string, index: number) => {
        // Pour aujourd'hui, utiliser les conditions actuelles
        if (index === 0) {
          return {
            date,
            temp: currentTemp,
            description: getWeatherDescription(currentWeatherCode),
            icon: currentWeatherCode.toString()
          };
        }
        
        // Pour les autres jours, utiliser les prévisions
        return {
          date,
          temp: Math.round((data.daily.temperature_2m_max[index] + data.daily.temperature_2m_min[index]) / 2),
          description: getWeatherDescription(data.daily.weathercode[index]),
          icon: data.daily.weathercode[index].toString()
        };
      });

      console.log('Météo traitée:', weather);
      
      setWeatherData(weather);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Erreur météo:', err);
      setError('Impossible de charger la météo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Chargement initial
    fetchWeather();

    // Actualisation automatique toutes les 30 minutes
    const interval = setInterval(() => {
      fetchWeather();
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, [fetchWeather]);

  const getWeatherDescription = (code: number) => {
    const descriptions: { [key: number]: string } = {
      0: 'Ensoleillé',
      1: 'Peu nuageux',
      2: 'Partiellement nuageux',
      3: 'Couvert',
      45: 'Brouillard',
      48: 'Brouillard givrant',
      51: 'Bruine légère',
      53: 'Bruine modérée',
      55: 'Bruine dense',
      61: 'Pluie légère',
      63: 'Pluie modérée',
      65: 'Pluie forte',
      71: 'Neige légère',
      73: 'Neige modérée',
      75: 'Neige forte',
      95: 'Orage'
    };
    return descriptions[code] || 'Variable';
  };

  const handleRefresh = () => {
    fetchWeather();
  };

  if (loading && weatherData.length === 0) {
    return (
      <div className="flex items-center justify-center space-x-2 py-1">
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
        <span className="text-xs text-muted-foreground">Météo...</span>
      </div>
    );
  }

  if (error && weatherData.length === 0) {
    return (
      <div className="flex items-center justify-center space-x-2 py-1">
        <span className="text-xs text-red-500">Erreur météo</span>
        <button 
          onClick={handleRefresh}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-center space-x-1"
    >
      <div className="flex items-center space-x-1">
        <Cloud className="h-3 w-3 text-blue-500" />
        <button 
          onClick={handleRefresh}
          className={`p-1 hover:bg-gray-100 rounded transition-colors ${loading ? 'animate-spin' : ''}`}
          disabled={loading}
          title={`Dernière mise à jour: ${lastUpdate.toLocaleTimeString()}`}
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>
      <div className="flex items-center space-x-2">
        {weatherData
          .filter((day, index) => {
            const date = new Date(day.date);
            return date.getDay() !== 0 && date.getDay() !== 6; // Exclure dimanche (0) et samedi (6)
          })
          .map((day, index) => (
            <div key={index} className="flex flex-col items-center space-y-1">
              <span className="text-xs text-gray-600 dark:text-gray-400 text-center">{getDayName(day.date)}</span>
              {getWeatherIcon(day.icon)}
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 text-center">{day.temp}°</span>
            </div>
          ))}
      </div>
    </motion.div>
  );
};

export default WeatherWidget; 