import './global.css'
import {Poppins, Roboto} from 'next/font/google'
import Providers from './providers'

import Header from '@/shared/widgets/header'
export const metadata = {
  title: 'Welcome to Eshop',
  description: 'Its Eshop',
}

const roboto = Roboto({
  weight: ['100','300', '400','500','600', '700','900'],
  subsets: ['latin'],
  variable: '--font-roboto',
})

const poppins = Poppins({
  weight: ['100','200','300', '400','500','600', '700','800','900'],
  subsets: ['latin'],
  variable: '--font-poppins',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${roboto.variable} ${poppins.variable}`}>
        <Providers>
          <Header/>
          {children}
        </Providers>
        
        </body>
    </html>
  )
}
