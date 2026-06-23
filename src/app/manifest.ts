import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Clínica Agendamento',
    short_name: 'Clínica',
    description: 'Aplicativo para agendamento de salas da clínica',
    start_url: '/',
    display: 'standalone',
    background_color: '#F5F6FA',
    theme_color: '#4F46E5',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
