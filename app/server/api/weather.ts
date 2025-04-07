// server/api/weather.ts
import { defineEventHandler } from 'h3'

// You could move this to a separate file
const TOP_US_CITIES = [
    { name: 'New York', state: 'NY', coords: { lat: 40.7128, lon: -74.0060 } },
    { name: 'Los Angeles', state: 'CA', coords: { lat: 34.0522, lon: -118.2437 } },
    { name: 'Chicago', state: 'IL', coords: { lat: 41.8781, lon: -87.6298 } },
    { name: 'Houston', state: 'TX', coords: { lat: 29.7604, lon: -95.3698 } },
    { name: 'Phoenix', state: 'AZ', coords: { lat: 33.4484, lon: -112.0740 } },
    { name: 'Philadelphia', state: 'PA', coords: { lat: 39.9526, lon: -75.1652 } },
    { name: 'San Antonio', state: 'TX', coords: { lat: 29.4241, lon: -98.4936 } },
    { name: 'San Diego', state: 'CA', coords: { lat: 32.7157, lon: -117.1611 } },
    { name: 'Dallas', state: 'TX', coords: { lat: 32.7767, lon: -96.7970 } },
    { name: 'San Jose', state: 'CA', coords: { lat: 37.3382, lon: -121.8863 } },
    { name: 'Austin', state: 'TX', coords: { lat: 30.2672, lon: -97.7431 } },
    { name: 'Jacksonville', state: 'FL', coords: { lat: 30.3322, lon: -81.6557 } },
    { name: 'San Francisco', state: 'CA', coords: { lat: 37.7749, lon: -122.4194 } },
    { name: 'Columbus', state: 'OH', coords: { lat: 39.9612, lon: -82.9988 } },
    { name: 'Denver', state: 'CO', coords: { lat: 39.7392, lon: -104.9903 } },
    { name: 'Seattle', state: 'WA', coords: { lat: 47.6062, lon: -122.3321 } },
    { name: 'Miami', state: 'FL', coords: { lat: 25.7617, lon: -80.1918 } },
    { name: 'Atlanta', state: 'GA', coords: { lat: 33.7490, lon: -84.3880 } },
    { name: 'Boston', state: 'MA', coords: { lat: 42.3601, lon: -71.0589 } },
    { name: 'Las Vegas', state: 'NV', coords: { lat: 36.1699, lon: -115.1398 } },
    { name: 'Portland', state: 'OR', coords: { lat: 45.5155, lon: -122.6789 } },
    { name: 'Honolulu', state: 'HI', coords: { lat: 21.3069, lon: -157.8583 } },
    { name: 'New Orleans', state: 'LA', coords: { lat: 29.9511, lon: -90.0715 } },
    { name: 'Mobile', state: 'AL', coords: { lat: 30.6954, lon: -88.0399 } },
    { name: 'Pensacola', state: 'FL', coords: { lat: 30.4213, lon: -87.2169 } },
    { name: 'Olympia', state: 'WA', coords: { lat: 47.0379, lon: -122.9007 } }
]

const calculateRQI = (dailyData: any) => {
    // Rain Quality Index calculation
    // Higher score for gentle rain (1-5mm per day is ideal)
    // Lower score for heavy rain (>20mm suggests storms)
    // Temperature comfort factor (15-22°C is ideal range)
    return dailyData.map((day: any) => {
        let rainScore = 0;
        if (day.rainfall > 0) {
            if (day.rainfall <= 5) {
                rainScore = 10; // Ideal gentle rain
            } else if (day.rainfall <= 10) {
                rainScore = 8;
            } else if (day.rainfall <= 20) {
                rainScore = 5;
            } else {
                rainScore = 2; // Heavy rain/storms
            }
        }

        // Temperature comfort score (max 10 points)
        const avgTemp = (day.maxTemp + day.minTemp) / 2;
        let tempScore = 10 - Math.abs(avgTemp - 18) * 0.5; // 18°C is ideal
        tempScore = Math.max(0, Math.min(10, tempScore));

        // Combined score out of 100
        return {
            date: day.date,
            rqi: (rainScore + tempScore) * 5,
            rainfall: day.rainfall,
            avgTemp: avgTemp
        };
    });
};

const fetchWeatherData = async (city: string, state: string, lat: number, lon: number) => {
    try {
        // Format date as YYYY-MM-DD
        const formatDate = (date: Date) => {
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        }
        
        // Calculate tomorrow and 7 days from tomorrow
        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(today.getDate() + 1) // Start from tomorrow
        
        const sevenDaysLater = new Date(tomorrow)
        sevenDaysLater.setDate(tomorrow.getDate() + 6) // 7 days total including tomorrow
        
        const url = new URL('https://api.open-meteo.com/v1/forecast')
        url.searchParams.set('latitude', lat.toString())
        url.searchParams.set('longitude', lon.toString())
        url.searchParams.set('hourly', 'temperature_2m,relative_humidity_2m,precipitation,windspeed_10m,weathercode')
        url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,weathercode')
        url.searchParams.set('timezone', 'auto')
        url.searchParams.set('start_date', formatDate(tomorrow))
        url.searchParams.set('end_date', formatDate(sevenDaysLater))
        
        // Remove forecast_days as we're using explicit date range
        // url.searchParams.set('forecast_days', '7')

        const response = await fetch(url)
        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.reason || 'Failed to fetch weather data')
        }

        // Calculate total precipitation for the next 7 days
        const totalRainfall = data.daily.precipitation_sum.reduce((sum: number, val: number) => sum + val, 0)

        // Count days with precipitation
        const rainyDays = data.daily.precipitation_sum.filter((rain: number) => rain > 0).length

        const rqiData = calculateRQI(data.daily.precipitation_sum.map((rain: number, index: number) => ({
            date: data.daily.time[index],
            maxTemp: data.daily.temperature_2m_max[index],
            minTemp: data.daily.temperature_2m_min[index],
            rainfall: rain
        })));

        // Enhanced daily data structure
        const daily = data.daily.precipitation_sum.map((rain: number, index: number) => ({
            date: data.daily.time[index],
            rainfall: rain,
            maxTemp: data.daily.temperature_2m_max[index],
            minTemp: data.daily.temperature_2m_min[index],
            windSpeed: data.daily.windspeed_10m_max[index],
            weatherCode: data.daily.weathercode[index],
            intensity: rain === 0 ? 'none' :
                      rain <= 2 ? 'light' :
                      rain <= 5 ? 'moderate' :
                      rain <= 15 ? 'heavy' :
                      'severe'
        }));

        // Get current conditions
        const currentHour = new Date().getHours();
        const currentConditions = {
            temp: data.hourly.temperature_2m[currentHour],
            humidity: data.hourly.relative_humidity_2m[currentHour],
            windSpeed: data.hourly.windspeed_10m[currentHour],
            weatherCode: data.hourly.weathercode[currentHour],
            precipitation: data.hourly.precipitation[currentHour]
        };

        return {
            city,
            state,
            coordinates: { lat, lon },
            currentTemp: currentConditions.temp,
            currentHumidity: currentConditions.humidity,
            currentConditions,
            nextSevenDays: {
                totalRainfall,
                rainyDays,
                averageRQI: rqiData.reduce((sum: number, day: any) => sum + day.rqi, 0) / 7,
                daily
            },
            units: {
                temperature: '°C',
                precipitation: 'mm',
                humidity: '%',
                windSpeed: 'km/h',
                rqi: '/100'
            }
        }
    } catch (error) {
        console.error(`Error fetching data for ${city}, ${state}:`, error)
        return null
    }
}

export default defineEventHandler(async (event) => {
    try {
        // Process all cities in parallel since Open-Meteo has generous rate limits
        const results = await Promise.all(
            TOP_US_CITIES.map(city => 
                fetchWeatherData(city.name, city.state, city.coords.lat, city.coords.lon)
            )
        )

        // Filter out any failed requests and sort by average RQI
        const validResults = results.filter(Boolean) as NonNullable<typeof results[0]>[]
        validResults.sort((a, b) => 
            b.nextSevenDays.averageRQI - a.nextSevenDays.averageRQI
        )

        return {
            timestamp: new Date().toISOString(),
            totalCities: validResults.length,
            cities: validResults
        }
    } catch (error) {
        console.error('Weather analysis failed:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to fetch weather data'
        })
    }
})