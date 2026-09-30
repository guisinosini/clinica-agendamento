import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Instituto NeuroVida',
    short_name: 'NeuroVida',
    description: 'Sistema de agendamento de salas de atendimento para profissionais de saúde.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F5F6FA',
    theme_color: '#4F46E5',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      }
    ],
  }
}
