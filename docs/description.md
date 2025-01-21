# RainHaven Technical Documentation

## Overview
RainHaven is a web application that helps users discover locations with ideal rainy conditions. The app introduces a Rain Quality Index (RQI) to score and rank locations based on their current and forecasted rain conditions.

## Tech Stack
- **Frontend**: Nuxt.js with TypeScript
- **Styling**: TailwindCSS
- **Backend**: Supabase
- **Deployment**: Vercel
- **Weather Data**: OpenWeatherMap API (or similar)

## Architecture

### Database Schema (Supabase)

```sql
-- Locations table storing weather and RQI data
create table locations (
  id uuid default uuid_generate_v4() primary key,
  city text not null,
  state text not null,
  rqi integer not null,
  forecast text not null,
  temperature decimal not null,
  wind_speed decimal not null,
  rain_intensity text not null,
  next_sunny_day timestamp with time zone,
  weather_data jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create index for RQI queries
create index locations_rqi_idx on locations(rqi desc);

-- Function to update timestamp
create function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Trigger for updated_at
create trigger locations_updated_at
    before update on locations
    for each row
    execute procedure update_updated_at_column();
```

### Project Structure

```
rainhaven/
├── components/
│   ├── LocationCard.vue        # Individual location display
│   ├── RainAnimation.vue       # Reusable rain effect
│   └── WeatherIcon.vue         # Dynamic weather icons
├── composables/
│   ├── useWeather.ts          # Weather data hooks
│   └── useSupabase.ts         # Supabase client setup
├── server/
│   └── api/
│       ├── locations.get.ts    # Get top locations
│       └── cron/
│           └── update-weather.ts  # Weather update endpoint
├── types/
│   └── index.ts               # TypeScript definitions
├── utils/
│   ├── weather.ts             # Weather calculations
│   └── rqi.ts                 # RQI calculation logic
├── .env
├── nuxt.config.ts
└── vercel.json
```

### Type Definitions

```typescript
interface Location {
  id: string;
  city: string;
  state: string;
  rqi: number;
  forecast: string;
  temperature: number;
  windSpeed: number;
  rainIntensity: 'light' | 'medium' | 'heavy';
  nextSunnyDay: Date;
  weatherData: WeatherData;
  createdAt: Date;
  updatedAt: Date;
}

interface WeatherData {
  hourly: {
    temp: number;
    wind_speed: number;
    precipitation: number;
    // Additional weather API fields
  }[];
  // Additional weather API data
}
```

## Core Features

### Rain Quality Index (RQI) Calculation

The RQI is calculated using a weighted algorithm:

```typescript
function calculateRQI(weatherData: WeatherData): number {
  const weights = {
    rainDuration: 0.4,
    rainIntensity: 0.3,
    temperature: 0.2,
    windConditions: 0.1
  };

  return Math.round(
    rainDuration * weights.rainDuration +
    rainIntensity * weights.rainIntensity +
    tempComfort * weights.temperature +
    windConditions * weights.windConditions
  );
}
```

### Data Flow

1. **Weather Data Collection** (Every 3 hours):
   - Fetch weather data for top 50 US cities
   - Calculate RQI for each location
   - Update Supabase database

2. **Frontend Data Fetching**:
   ```typescript
   // composables/useWeather.ts
   export const useWeather = () => {
     const { data: locations } = useSWR('/api/locations', fetcher);
     return {
       locations,
       isLoading: !locations,
       error: null
     };
   };
   ```

### API Routes

```typescript
// server/api/locations.get.ts
export default defineEventHandler(async (event) => {
  const supabase = useSupabaseClient();
  
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .order('rqi', { ascending: false })
    .limit(20);

  if (error) throw createError({
    statusCode: 500,
    message: 'Failed to fetch locations'
  });

  return data;
});
```

### Cron Job Implementation

```typescript
// server/api/cron/update-weather.ts
export default defineEventHandler(async (event) => {
  // Verify Vercel cron
  if (!isValidCronRequest(event)) {
    throw createError({ statusCode: 401 });
  }

  const supabase = useSupabaseClient();
  const cities = await fetchTopCities();
  
  for (const city of cities) {
    const weatherData = await fetchWeatherData(city);
    const rqi = calculateRQI(weatherData);
    
    await supabase
      .from('locations')
      .upsert({
        city: city.name,
        state: city.state,
        rqi,
        // ... other fields
      });
  }

  return { status: 'success' };
});
```

## UI Components

### LocationCard

```vue
<!-- components/LocationCard.vue -->
<template>
  <div class="relative overflow-hidden rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
    <!-- Card content -->
    <div class="p-6">
      <!-- Location header -->
      <div class="flex justify-between items-start">
        <h3 class="text-xl font-semibold">{{ location.city }}, {{ location.state }}</h3>
        <RQIBadge :score="location.rqi" />
      </div>
      
      <!-- Weather details -->
      <WeatherDetails :location="location" />
    </div>
    
    <!-- Rain animation overlay -->
    <RainAnimation :intensity="location.rainIntensity" />
  </div>
</template>
```

## Deployment

### Environment Variables
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
WEATHER_API_KEY=your_weather_api_key
CRON_SECRET=your_cron_secret
```

### Vercel Configuration
```json
{
  "crons": [{
    "path": "/api/cron/update-weather",
    "schedule": "0 */3 * * *"
  }]
}
```

## Development Setup

1. Clone repository:
   ```bash
   git clone https://github.com/your-org/rainhaven.git
   cd rainhaven
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

## Performance Considerations

1. **Database Optimization**:
   - Indexed RQI column for faster queries
   - Cached weather data in jsonb column
   - Regular cleanup of old records

2. **Frontend Performance**:
   - Lazy-loaded components
   - Optimized rain animation
   - Efficient state management
   - Progressive image loading

## Future Enhancements

1. User authentication and favorites
2. Personalized RQI thresholds
3. Rain pattern analytics
4. Mobile app version
5. Social sharing features

## Monitoring

- Vercel Analytics for frontend performance
- Supabase Dashboard for database monitoring
- Custom logging for weather API integration
- Error tracking via Sentry (future implementation)

This documentation provides a comprehensive guide for implementing RainHaven. Development teams should refer to individual sections for specific implementation details while maintaining flexibility for technical decisions within their expertise.