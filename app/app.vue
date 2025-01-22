<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 text-white">
    <!-- Hero Section -->
    <div class="container mx-auto px-4 py-16 relative overflow-hidden">
      <!-- Rain Animation Container -->
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
      <div class="text-center relative z-10">
        <h1 class="text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
          RainHaven
        </h1>
        <p class="text-xl text-blue-200 mb-8">
          Discover your perfect rainy paradise
        </p>
        
        <!-- Placeholder Search -->
        <div class="max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-lg p-4 mb-8">
          <div class="flex gap-2">
            <UInput 
              placeholder="Enter a city..."
              class="flex-1"
              @focus="showComingSoon = true"
            />
            <UButton 
              color="blue" 
              variant="solid"
              class="px-6"
            >
              Search
            </UButton>
          </div>
        </div>

        <!-- Coming Soon Message -->
        <UCard
          v-if="showComingSoon" 
          class="max-w-md mx-auto bg-blue-500/20 backdrop-blur-sm"
        >
          <p class="text-lg">
            🌧️ Coming Soon! We're currently gathering the coziest rainy locations.
          </p>
        </UCard>

        <!-- Placeholder Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <UCard
            v-for="stat in stats" 
            :key="stat.label"
            class="bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors"
          >
            <div class="text-3xl font-bold text-blue-400">{{ stat.value }}</div>
            <div class="text-blue-200">{{ stat.label }}</div>
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const showComingSoon = ref(false)

const stats = [
  { label: 'Cities Tracked', value: '50+' },
  { label: 'Rain Quality Index', value: 'RQI™' },
  { label: 'Weather Updates', value: '3hr' },
]
</script>

<style>
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
