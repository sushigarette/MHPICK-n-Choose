import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Cloud, Sun, CloudRain, CloudSnow, Wind } from "lucide-react";
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

  const getWeatherIcon = (iconCode: string) => {
    if (iconCode.includes('01')) return <Sun className="h-3 w-3 text-yellow-500" />;
    if (iconCode.includes('02') || iconCode.includes('03') || iconCode.includes('04')) return <Cloud className="h-3 w-3 text-gray-500" />;
    if (iconCode.includes('09') || iconCode.includes('10')) return <CloudRain className="h-3 w-3 text-blue-500" />;
    if (iconCode.includes('11')) return <Wind className="h-3 w-3 text-purple-500" />;
    if (iconCode.includes('13')) return <CloudSnow className="h-3 w-3 text-blue-300" />;
    return <Sun className="h-3 w-3 text-yellow-500" />;
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

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
          params: {
            latitude: 43.6047,
            longitude: 1.4442,
            daily: 'temperature_2m_max,temperature_2m_min,weathercode',
            timezone: 'Europe/Paris'
          },
          timeout: 5000 // Timeout de 5 secondes
        });
        
        const data = response.data;
        
        const weather: WeatherData[] = data.daily.time.slice(0, 7).map((date: string, index: number) => ({
          date,
          temp: Math.round((data.daily.temperature_2m_max[index] + data.daily.temperature_2m_min[index]) / 2),
          description: getWeatherDescription(data.daily.weathercode[index]),
          icon: data.daily.weathercode[index].toString()
        }));

        setWeatherData(weather);
        setLoading(false);
      } catch (err) {
        console.error('Erreur météo:', err);
        setError('Impossible de charger la météo');
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center space-x-2 py-1">
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
        <span className="text-xs text-muted-foreground">Météo...</span>
      </div>
    );
  }

  if (error) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-center space-x-1"
    >
      <Cloud className="h-3 w-3 text-blue-500" />
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