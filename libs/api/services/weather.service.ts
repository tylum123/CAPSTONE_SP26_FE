import { axiosInstance } from '@/libs/api/axios-instance';
import type { BeWeatherData, DailyWeather } from '@/libs/types/weather.types';

const WEATHER_BASE = '/weather';

class WeatherService {
  async getCurrentWeather(city: string = 'Hanoi'): Promise<BeWeatherData> {
    const response = await axiosInstance.get<{ data: BeWeatherData }>(`${WEATHER_BASE}/city`, {
      params: { city },
    });
    return response.data.data;
  }

  async getWeatherByCoords(lat: number, lon: number): Promise<BeWeatherData> {
    const response = await axiosInstance.get<{ data: BeWeatherData }>(`${WEATHER_BASE}/coordinates`, {
      params: { lat, lon },
    });
    return response.data.data;
  }

  async getWeatherByCurrentUserAddress(): Promise<BeWeatherData> {
    const response = await axiosInstance.get<{ data: BeWeatherData }>(`${WEATHER_BASE}/me`);
    return response.data.data;
  }

  getWeatherIconUrl(iconCode: string): string {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }

  buildDailyForecastFromCurrent(weather: BeWeatherData): Map<string, DailyWeather> {
    const dailyMap = new Map<string, DailyWeather>();
    const dateKey = new Date().toISOString().split('T')[0];
    dailyMap.set(dateKey, {
      date: new Date(dateKey),
      temp: weather.temperature,
      tempMin: weather.tempMin,
      tempMax: weather.tempMax,
      description: weather.description,
      icon: weather.icon,
      humidity: weather.humidity,
      windSpeed: weather.windSpeed,
    });
    return dailyMap;
  }
}

export const weatherService = new WeatherService();
