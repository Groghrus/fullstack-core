import type { Metadata } from 'next'
import { getBlocks, getAllThemes } from '@core/content'
import { AppShell } from '../components/app-shell'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fullstack Core',
  description: 'Личный тренажёр и учебник по backend, system design и языкам',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const blocks = getBlocks()
  const themes = getAllThemes()

  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('fullstack-core:theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <AppShell blocks={blocks} themes={themes}>
          {children}
        </AppShell>
      </body>
    </html>
  )
}
