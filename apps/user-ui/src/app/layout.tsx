import Header from "@/shared/widgets/header"

export const metadata = {
  title: 'Welcome to Eshop',
  description: 'Its Eshop',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Header/>
        {children}
        </body>
    </html>
  )
}
