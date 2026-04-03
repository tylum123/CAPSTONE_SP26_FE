import { axiosInstance } from '@/libs/api/axios-instance';
import type { BeWeatherData, DailyWeather } from '@/libs/types/weather.types';

const WEATHER_BASE = '/weather';

class WeatherService {
  async getCurrentWeather(city: string = 'Ho Chi Minh City'): Promise<BeWeatherData> {
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
    try {
      const response = await axiosInstance.get<{ data: BeWeatherData }>(`${WEATHER_BASE}/me`);
      return response.data.data;
    } catch (error: any) {
      // Fallback to default city if user has no address/profile
      if (error?.response?.status === 400) {
        console.warn("Failed to get weather by user address, falling back to default city.");
        return this.getCurrentWeather();
      }
      // Re-throw other errors
      throw error;
    }
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
