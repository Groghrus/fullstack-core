import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Fullstack Core',
    short_name: 'Fullstack',
    description: 'Личный тренажёр и учебник по backend, system design и языкам',
    lang: 'ru',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#1e293b',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}