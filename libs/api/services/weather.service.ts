import { axiosInstance } from '@/libs/api/axios-instance';
import type { BeWeatherData, DailyWeather } from '@/libs/types/weather.types';

const WEATHER_BASE = '/weather';

class WeatherService {
  private unwrapWeatherResponse(response: any): BeWeatherData {
    return (response?.data?.data ?? response?.data) as BeWeatherData;
  }

  private toLocalDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async getCurrentWeather(city: string = 'Ho Chi Minh City'): Promise<BeWeatherData> {
    const response = await axiosInstance.get<{ data: BeWeatherData }>(`${WEATHER_BASE}/city`, {
      params: { city },
    });
    return this.unwrapWeatherResponse(response);
  }

  async getWeatherByCoords(lat: number, lon: number): Promise<BeWeatherData> {
    const response = await axiosInstance.get<{ data: BeWeatherData }>(`${WEATHER_BASE}/coordinates`, {
      params: { lat, lon },
    });
    return this.unwrapWeatherResponse(response);
  }

  async getWeatherByCurrentUserAddress(): Promise<BeWeatherData> {
    try {
      const response = await axiosInstance.get<{ data: BeWeatherData }>(`${WEATHER_BASE}/me`);
      return this.unwrapWeatherResponse(response);
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

    const hourlyForecast = Array.isArray(weather.hourlyForecast)
      ? weather.hourlyForecast
      : [];

    for (const hourly of hourlyForecast) {
      const forecastTime = new Date(hourly.forecastTime);
      if (Number.isNaN(forecastTime.getTime())) continue;

      const dateKey = this.toLocalDateKey(forecastTime);
      const existing = dailyMap.get(dateKey);

      if (!existing) {
        dailyMap.set(dateKey, {
          date: new Date(
            forecastTime.getFullYear(),
            forecastTime.getMonth(),
            forecastTime.getDate()
          ),
          temp: hourly.temperature,
          tempMin: hourly.tempMin,
          tempMax: hourly.tempMax,
          description: hourly.description,
          icon: hourly.icon,
          iconUrl: hourly.iconUrl || this.getWeatherIconUrl(hourly.icon),
          humidity: hourly.humidity,
          windSpeed: hourly.windSpeed,
        });
        continue;
      }

      existing.tempMin = Math.min(existing.tempMin, hourly.tempMin);
      existing.tempMax = Math.max(existing.tempMax, hourly.tempMax);
    }

    const today = new Date();
    const todayKey = this.toLocalDateKey(today);
    const todayWeather = dailyMap.get(todayKey);

    if (todayWeather) {
      todayWeather.temp = weather.temperature;
      todayWeather.tempMin = Math.min(todayWeather.tempMin, weather.tempMin);
      todayWeather.tempMax = Math.max(todayWeather.tempMax, weather.tempMax);
      todayWeather.description = weather.description;
      todayWeather.icon = weather.icon;
      todayWeather.iconUrl = weather.iconUrl;
      todayWeather.humidity = weather.humidity;
      todayWeather.windSpeed = weather.windSpeed;
      return dailyMap;
    }

    dailyMap.set(todayKey, {
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      temp: weather.temperature,
      tempMin: weather.tempMin,
      tempMax: weather.tempMax,
      description: weather.description,
      icon: weather.icon,
      iconUrl: weather.iconUrl,
      humidity: weather.humidity,
      windSpeed: weather.windSpeed,
    });

    return dailyMap;
  }
}

export const weatherService = new WeatherService();
