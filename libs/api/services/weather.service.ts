import axios from 'axios';
import type { WeatherData, WeatherForecast, DailyWeather } from '@/types/weather.types';

const OPENWEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

class WeatherService {
  async getCurrentWeather(city: string = 'Hanoi', country: string = 'VN'): Promise<WeatherData> {
    const response = await axios.get<WeatherData>(`${OPENWEATHER_BASE_URL}/weather`, {
      params: {
        q: `${city},${country}`,
        appid: OPENWEATHER_API_KEY,
        units: 'metric',
        lang: 'vi',
      },
    });
    return response.data;
  }

  async getWeatherByCoords(lat: number, lon: number): Promise<WeatherData> {
    const response = await axios.get<WeatherData>(`${OPENWEATHER_BASE_URL}/weather`, {
      params: {
        lat,
        lon,
        appid: OPENWEATHER_API_KEY,
        units: 'metric',
        lang: 'vi',
      },
    });
    return response.data;
  }

  async getForecast(city: string = 'Hanoi', country: string = 'VN'): Promise<WeatherForecast> {
    const response = await axios.get<WeatherForecast>(`${OPENWEATHER_BASE_URL}/forecast`, {
      params: {
        q: `${city},${country}`,
        appid: OPENWEATHER_API_KEY,
        units: 'metric',
        lang: 'vi',
      },
    });
    return response.data;
  }

  async getForecastByCoords(lat: number, lon: number): Promise<WeatherForecast> {
    const response = await axios.get<WeatherForecast>(`${OPENWEATHER_BASE_URL}/forecast`, {
      params: {
        lat,
        lon,
        appid: OPENWEATHER_API_KEY,
        units: 'metric',
        lang: 'vi',
      },
    });
    return response.data;
  }

  processForecastData(forecast: WeatherForecast): Map<string, DailyWeather> {
    const dailyMap = new Map<string, DailyWeather>();

    forecast.list.forEach((item) => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toISOString().split('T')[0];

      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          date: new Date(dateKey),
          temp: item.main.temp,
          tempMin: item.main.temp_min,
          tempMax: item.main.temp_max,
          description: item.weather[0].description,
          icon: item.weather[0].icon,
          humidity: item.main.humidity,
          windSpeed: item.wind.speed,
        });
      } else {
        const existing = dailyMap.get(dateKey)!;
        existing.tempMin = Math.min(existing.tempMin, item.main.temp_min);
        existing.tempMax = Math.max(existing.tempMax, item.main.temp_max);
      }
    });

    return dailyMap;
  }

  getWeatherIconUrl(iconCode: string): string {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }
}

export const weatherService = new WeatherService();
