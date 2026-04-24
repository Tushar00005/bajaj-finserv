import './globals.css'

export const metadata = {
  title: 'SRM Graph Analysis Tool',
  description: 'Full Stack Engineering Challenge for SRM',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
