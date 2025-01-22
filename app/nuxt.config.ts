// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: 'RainHaven - Find Perfect Rainy Weather',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Discover cities with perfect rainy weather conditions for your next peaceful getaway. RainHaven helps you find locations with ideal rainfall for photography, relaxation, and cozy experiences.' },
        { name: 'theme-color', content: '#1e3a8a' },
        
        // Open Graph / Facebook
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'RainHaven - Find Perfect Rainy Weather' },
        { property: 'og:description', content: 'Discover cities with perfect rainy weather conditions for your next peaceful getaway.' },
        { property: 'og:image', content: 'http://localhost:3000/rainhaven_og_image.png' },
        { property: 'og:url', content: 'http://localhost:3000' },
        
        // Twitter
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'RainHaven - Find Perfect Rainy Weather' },
        { name: 'twitter:description', content: 'Discover cities with perfect rainy weather conditions for your next peaceful getaway.' },
        { name: 'twitter:image', content: 'http://localhost:3000/rainhaven_og_image.png' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon-96x96.png', sizes: '96x96' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'shortcut icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' }
      ]
    },
  },
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  modules: ['@nuxt/ui']
})