import AllOverlays from '@/app/components/AllOverlays'
import type { Metadata } from 'next'
import UserProvider from './context/user'
import './globals.css'
import ReactQueryProvider from './providers/ReactQueryProvider'

export const metadata: Metadata = {
  title: 'TikTok Clone',
  description: 'TikTok Clone',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <UserProvider>
        <ReactQueryProvider>
          <body>
            <AllOverlays />
            {children}
          </body>
        </ReactQueryProvider>
      </UserProvider>
    </html>
  )
}
