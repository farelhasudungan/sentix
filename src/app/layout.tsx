import { Inter, Press_Start_2P } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from '@/context/Providers'
import '@/styles/globals.css'

const inter = Inter({ subsets: ['latin'] })
const pressStart2P = Press_Start_2P({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel'
})

export const metadata = {
  title: 'Optixel - Fun Options Trading Game',
  description: 'Make options trading fun and easy! Learn by playing, compete in tournaments, and win prizes.',
  keywords: 'crypto options, DeFi, trading, game, tournaments, Thetanuts',
  openGraph: {
    title: 'Optixel - Fun Options Trading Game',
    description: 'Make options trading fun and easy! Learn by playing, compete in tournaments.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={pressStart2P.variable}>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}