import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AVN Track',
  description: 'Daily pain and exercise tracker for avascular necrosis patients',
  manifest: '/manifest.json',
  themeColor: '#0d1228',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-surface text-on-surface font-body min-h-screen">
        {children}
      </body>
    </html>
  )
}
