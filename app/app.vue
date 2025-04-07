<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 text-white">
    <!-- Rain Animation (existing code) -->
    <div class="absolute inset-0 pointer-events-none opacity-50">
      <div v-for="i in 20" :key="i" 
           class="rain-drop"
           :style="{
             left: `${Math.random() * 100}%`,
             animationDelay: `${Math.random() * 2}s`,
             animationDuration: `${0.75 + Math.random()}s`
           }">
      </div>
    </div>

    <!-- Content -->
    <div class="container mx-auto px-4 py-8 relative z-10">
      <!-- Header with Last Updated Info -->
      <div class="flex flex-col md:flex-row justify-between items-center mb-12">
        <div>
          <h1 class="text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
            RainHaven
          </h1>
          <p class="text-lg text-blue-200">
            Discover your perfect rainy paradise
          </p>
        </div>
        <div class="mt-4 md:mt-0 text-right text-blue-200">
          <div class="flex items-center gap-4 mb-2 justify-end">
            <UButton
              size="xs"
              :color="useMetric ? 'gray' : 'blue'"
              :variant="useMetric ? 'ghost' : 'solid'"
              @click="useMetric = false"
            >
              Imperial
            </UButton>
            <UButton
              size="xs"
              :color="useMetric ? 'blue' : 'gray'"
              :variant="useMetric ? 'solid' : 'ghost'"
              @click="useMetric = true"
            >
              Metric
            </UButton>
          </div>
          <div class="flex items-center gap-2">
            <i class="fas fa-clock w-5 h-5"></i>
            <span>Updated {{ data ? new Date(data.timestamp).toLocaleTimeString() : '-' }}</span>
          </div>
        </div>
      </div>

      <!-- Add this right after the Header section and before the Loading State -->
      <div class="mb-8 flex flex-wrap items-center gap-4">
        <span class="text-sm text-blue-200">RQI Legend:</span>
        <div class="flex flex-wrap gap-3">
          <div v-for="item in rqiLegend" :key="item.score" class="flex items-center gap-2">
            <UBadge :color="item.color" variant="solid" class="w-16">{{ item.score }}</UBadge>
            <span class="text-sm text-blue-200">{{ item.label }}</span>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="pending" class="flex justify-center">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin text-blue-400" size="lg" />
      </div>

      <!-- Error State -->
      <UAlert
        v-if="error"
        color="red"
        variant="soft"
        :icon="false"
        title="Error"
        :description="error.message"
      >
        <template #icon>
          <i class="fas fa-triangle-exclamation"></i>
        </template>
      </UAlert>

      <!-- Weather Data -->
      <template v-if="data">
        <!-- Rain Forecast Overview -->
        <div class="mb-12">
          <h2 class="text-2xl font-semibold mb-6 text-blue-200">Top Rainy Destinations</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <UCard
              v-for="(city, index) in data.cities.slice(0, 4)"
              :key="`${city.city}-${city.state}`"
              class="bg-white/10 backdrop-blur-lg border border-white/10"
              :class="index === 0 ? 'md:col-span-2 lg:col-span-2' : ''"
            >
              <div class="flex items-start justify-between">
                <div>
                  <UBadge
                    :color="getRQIColor(city.nextSevenDays.averageRQI)"
                    variant="solid"
                    class="mb-3"
                  >
                    <div class="flex flex-col">
                      <span class="font-bold">RQI {{ Math.round(city.nextSevenDays.averageRQI) }}</span>
                      <span class="text-xs opacity-90">
                        {{ 
                          city.nextSevenDays.averageRQI >= 90 ? 'Perfect' :
                          city.nextSevenDays.averageRQI >= 75 ? 'Excellent' :
                          city.nextSevenDays.averageRQI >= 60 ? 'Good' :
                          city.nextSevenDays.averageRQI >= 45 ? 'Moderate' :
                          city.nextSevenDays.averageRQI >= 30 ? 'Fair' : 'Poor'
                        }}
                      </span>
                    </div>
                  </UBadge>
                  <h3 class="text-xl font-bold mb-2">{{ city.city }}, {{ city.state }}</h3>
                  <div class="flex flex-wrap gap-4 text-blue-200">
                    <div class="flex items-center gap-2">
                      <i class="fas fa-cloud-rain"></i>
                      <span>{{ city.nextSevenDays.rainyDays }} rainy days</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <i class="fas fa-flask"></i>
                      <span>{{ formatRainfall(city.nextSevenDays.totalRainfall) }}</span>
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-3xl font-bold">{{ formatTemp(city.currentTemp) }}</div>
                  <div class="text-blue-200">{{ city.currentHumidity }}{{ city.units.humidity }}</div>
                </div>
              </div>

              <!-- Enhanced 7-day forecast visualization -->
              <div class="mt-4 pt-4 border-t border-white/10">
                <div class="space-y-3">
                  <div class="flex justify-between text-sm text-blue-200">
                    <span>7-Day Rain Forecast</span>
                    <!-- Add next rain indicator -->
                    <span v-if="getNextRainDay(city.nextSevenDays.daily)" class="text-blue-400">
                      Rain starts {{ getNextRainDay(city.nextSevenDays.daily) }}
                    </span>
                    <span v-else class="text-gray-400">
                      No rain forecasted
                    </span>
                  </div>
                  <!-- Enhanced daily forecast bars -->
                  <div class="flex gap-1">
                    <div
                      v-for="(day, dayIndex) in city.nextSevenDays.daily"
                      :key="day.date"
                      class="flex-1 group relative"
                    >
                      <div class="h-12 flex items-end">
                        <div
                          class="w-full bg-blue-500/80 rounded-t-md transition-all duration-300"
                          :style="{
                            height: `${(day.rainfall / getMaxRainfall(city.nextSevenDays.daily)) * 100}%`
                          }"
                        />
                      </div>
                      <!-- Tooltip with detailed info -->
                      <div class="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-slate-800 text-white text-xs rounded p-2 whitespace-nowrap z-20">
                        {{ formatDate(day.date) }}<br>
                        {{ formatRainfall(day.rainfall) }}
                      </div>
                      <!-- Day indicator -->
                      <div class="text-xs text-blue-200 mt-1 text-center">
                        {{ formatDayShort(day.date) }}
                      </div>
                    </div>
                  </div>
                  
                  <!-- Rain streak indicator -->
                  <div v-if="getLongestRainStreak(city.nextSevenDays.daily)" class="text-sm text-blue-300">
                    <i class="fas fa-fire w-4 h-4 mr-1"></i>
                    {{ getLongestRainStreak(city.nextSevenDays.daily) }} consecutive rainy days
                  </div>
                </div>
              </div>
            </UCard>
          </div>
        </div>

        <!-- All Cities List -->
        <div v-if="data.cities.length > 4">
          <h2 class="text-2xl font-semibold mb-6 text-blue-200">All Locations</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <UCard
              v-for="city in data.cities.slice(4)"
              :key="`${city.city}-${city.state}`"
              class="bg-white/10 backdrop-blur-lg hover:bg-white/15 transition-all duration-300 border border-white/10"
            >
              <!-- City Header -->
              <div class="flex justify-between items-start mb-6">
                <div>
                  <h3 class="text-2xl font-bold mb-1">{{ city.city }}, {{ city.state }}</h3>
                  <div class="flex items-center gap-2 text-blue-200">
                    <i class="fas fa-temperature-half w-5 h-5"></i>
                    <span>{{ formatTemp(city.currentTemp) }}</span>
                    <span class="text-white/30">|</span>
                    <i class="fas fa-cloud w-5 h-5"></i>
                    <span>{{ city.currentHumidity }}{{ city.units.humidity }}</span>
                  </div>
                </div>
                <UBadge
                  :color="getRQIColor(city.nextSevenDays.averageRQI)"
                  variant="solid"
                  class="text-lg px-3 py-1"
                >
                  <div class="flex flex-col">
                    <span class="font-bold">RQI {{ Math.round(city.nextSevenDays.averageRQI) }}</span>
                    <span class="text-xs opacity-90">
                      {{ 
                        city.nextSevenDays.averageRQI >= 90 ? 'Perfect' :
                        city.nextSevenDays.averageRQI >= 75 ? 'Excellent' :
                        city.nextSevenDays.averageRQI >= 60 ? 'Good' :
                        city.nextSevenDays.averageRQI >= 45 ? 'Moderate' :
                        city.nextSevenDays.averageRQI >= 30 ? 'Fair' : 'Poor'
                      }}
                    </span>
                  </div>
                </UBadge>
              </div>

              <!-- Weekly Forecast -->
              <div class="space-y-3">
                <div class="flex items-center gap-3">
                  <div class="text-sm text-blue-200">Next 7 Days:</div>
                  <div class="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden flex">
                    <div
                      v-for="day in city.nextSevenDays.daily"
                      :key="day.date"
                      class="h-full w-[14.28%] transition-all duration-300"
                      :class="{
                        'bg-gray-700': day.intensity === 'none',
                        'bg-blue-400': day.intensity === 'light',
                        'bg-blue-500': day.intensity === 'moderate',
                        'bg-blue-600': day.intensity === 'heavy',
                        'bg-blue-700': day.intensity === 'severe'
                      }"
                    />
                  </div>
                </div>
                
                <div class="flex justify-between items-center">
                  <div class="flex items-center gap-2">
                    <i class="fas fa-cloud-rain w-5 h-5 text-blue-400"></i>
                    <span class="text-sm text-blue-200">{{ city.nextSevenDays.rainyDays }} rainy days</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <i class="fas fa-flask w-5 h-5 text-blue-400"></i>
                    <span class="text-sm text-blue-200">{{ formatRainfall(city.nextSevenDays.totalRainfall) }}</span>
                  </div>
                </div>
              </div>
            </UCard>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
useSeoMeta({
  title: 'RainHaven - Find Perfect Rainy Weather',
  description: 'Discover cities with perfect rainy weather conditions for your next peaceful getaway. RainHaven helps you find locations with ideal rainfall for photography, relaxation, and cozy experiences.',
  ogTitle: 'RainHaven - Find Perfect Rainy Weather',
  ogDescription: 'Discover cities with perfect rainy weather conditions for your next peaceful getaway.',
  ogImage: 'http://localhost:3001/rainhaven_og_image.png',
  ogUrl: 'http://localhost:3001',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'RainHaven - Find Perfect Rainy Weather',
  twitterDescription: 'Discover cities with perfect rainy weather conditions for your next peaceful getaway.',
  twitterImage: 'http://localhost:3001/rainhaven_og_image.png',
})

useHead({
  htmlAttrs: {
    lang: 'en'
  },
  link: [
    { rel: 'icon', type: 'image/png', href: '/favicon-96x96.png', sizes: '96x96' },
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'shortcut icon', href: '/favicon.ico' },
    { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
    { rel: 'manifest', href: '/site.webmanifest' },
    {
      rel: 'stylesheet',
      href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
    }
  ],
  meta: [
    { name: 'theme-color', content: '#1e3a8a' }
  ]
})

const { data, pending, error } = await useFetch('/api/weather')
const useMetric = ref(false)

// Conversion helpers
function convertTemp(celsius) {
  return useMetric.value ? celsius : (celsius * 9/5) + 32
}

function convertRainfall(mm) {
  return useMetric.value ? mm : mm * 0.0393701
}

// Formatting helpers with units
function formatTemp(celsius) {
  const value = Math.round(convertTemp(celsius))
  return `${value}${useMetric.value ? '°C' : '°F'}`
}

function formatRainfall(mm) {
  const value = useMetric.value ? 
    Math.round(mm) : 
    Math.round(convertRainfall(mm) * 100) / 100
  return `${value}${useMetric.value ? 'mm' : 'in'}`
}

// Computed stats from the data
const stats = computed(() => [
  { 
    label: 'Cities Analyzed', 
    value: data.value?.totalCities || 0 
  },
  { 
    label: 'Data Updated', 
    value: data.value ? new Date(data.value.timestamp).toLocaleTimeString() : '-' 
  },
  { 
    label: 'Top RQI Score', 
    value: data.value ? 
      Math.round(data.value.cities[0]?.nextSevenDays.averageRQI) + '/100' : 
      '-' 
  },
])

// Helper functions
function getRQIColor(rqi) {
  if (rqi >= 90) return 'green'     // Instead of emerald
  if (rqi >= 75) return 'sky'       // Instead of teal
  if (rqi >= 60) return 'blue'      // Instead of cyan
  if (rqi >= 45) return 'indigo'    // Keep indigo
  if (rqi >= 30) return 'purple'    // Instead of indigo
  return 'gray'                     // Instead of slate
}

function getNextRainDay(daily) {
  const today = new Date().setHours(0, 0, 0, 0)
  const nextRain = daily.find(day => 
    new Date(day.date) >= today && day.intensity !== 'none'
  )
  if (!nextRain) return null
  
  const dayDiff = Math.ceil((new Date(nextRain.date) - today) / (1000 * 60 * 60 * 24))
  return dayDiff === 0 ? 'today' : 
         dayDiff === 1 ? 'tomorrow' : 
         `in ${dayDiff} days`
}

function getLongestRainStreak(daily) {
  let maxStreak = 0
  let currentStreak = 0
  
  daily.forEach(day => {
    if (day.intensity !== 'none') {
      currentStreak++
      maxStreak = Math.max(maxStreak, currentStreak)
    } else {
      currentStreak = 0
    }
  })
  
  return maxStreak >= 2 ? maxStreak : null
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  })
}

function formatDayShort(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short' })
}

function getMaxRainfall(daily) {
  return Math.max(...daily.map(day => day.rainfall), 0.1) // Avoid division by zero
}

// Add RQI legend data
const rqiLegend = [
  { score: '90+', label: 'Perfect Rain', color: 'green' },
  { score: '75-89', label: 'Excellent', color: 'sky' },
  { score: '60-74', label: 'Good', color: 'blue' },
  { score: '45-59', label: 'Moderate', color: 'indigo' },
  { score: '30-44', label: 'Fair', color: 'purple' },
  { score: '0-29', label: 'Poor', color: 'gray' },
]
</script>

<style>
/* Existing rain animation styles */
.rain-drop {
  position: absolute;
  width: 2px;
  height: 100px;
  background: linear-gradient(transparent, #60A5FA);
  animation: rain linear infinite;
}

@keyframes rain {
  0% {
    transform: translateY(-100px);
  }
  100% {
    transform: translateY(100vh);
  }
}
</style>
