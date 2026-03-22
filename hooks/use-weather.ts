import { useState, useEffect } from 'react';
import { weatherService } from '@/libs/api/services/weather.service';
import type { BeWeatherData, DailyWeather } from '@/types/weather.types';

interface UseWeatherOptions {
  city?: string;
  lat?: number;
  lon?: number;
}

interface UseWeatherReturn {
  currentWeather: BeWeatherData | null;
  dailyForecast: Map<string, DailyWeather>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useWeather({
  city = 'Hanoi',
  lat,
  lon,
}: UseWeatherOptions = {}): UseWeatherReturn {
  const [currentWeather, setCurrentWeather] = useState<BeWeatherData | null>(null);
  const [dailyForecast, setDailyForecast] = useState<Map<string, DailyWeather>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError(null);

      const weather =
        lat !== undefined && lon !== undefined
          ? await weatherService.getWeatherByCoords(lat, lon)
          : await weatherService.getCurrentWeather(city);

      setCurrentWeather(weather);
      setDailyForecast(weatherService.buildDailyForecastFromCurrent(weather));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu thời tiết');
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [city, lat, lon]);

  return {
    currentWeather,
    dailyForecast,
    loading,
    error,
    refetch: fetchWeather,
  };
}
