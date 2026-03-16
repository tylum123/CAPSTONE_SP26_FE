import { useState, useEffect } from 'react';
import { weatherService } from '@/libs/api/services/weather.service';
import type { WeatherData, DailyWeather } from '@/types/weather.types';

interface UseWeatherOptions {
  city?: string;
  country?: string;
  lat?: number;
  lon?: number;
  enableForecast?: boolean;
}

interface UseWeatherReturn {
  currentWeather: WeatherData | null;
  dailyForecast: Map<string, DailyWeather>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useWeather({
  city = 'Hanoi',
  country = 'VN',
  lat,
  lon,
  enableForecast = true,
}: UseWeatherOptions = {}): UseWeatherReturn {
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [dailyForecast, setDailyForecast] = useState<Map<string, DailyWeather>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError(null);

      if (lat !== undefined && lon !== undefined) {
        const [weather, forecast] = await Promise.all([
          weatherService.getWeatherByCoords(lat, lon),
          enableForecast ? weatherService.getForecastByCoords(lat, lon) : null,
        ]);
        setCurrentWeather(weather);
        if (forecast) {
          setDailyForecast(weatherService.processForecastData(forecast));
        }
      } else {
        const [weather, forecast] = await Promise.all([
          weatherService.getCurrentWeather(city, country),
          enableForecast ? weatherService.getForecast(city, country) : null,
        ]);
        setCurrentWeather(weather);
        if (forecast) {
          setDailyForecast(weatherService.processForecastData(forecast));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu thời tiết');
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [city, country, lat, lon, enableForecast]);

  return {
    currentWeather,
    dailyForecast,
    loading,
    error,
    refetch: fetchWeather,
  };
}
