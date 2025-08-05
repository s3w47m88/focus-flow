import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Project Manager",
  description: "A task management tool similar to Todoist",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Apply user settings immediately to prevent flash
              (function() {
                const userColor = localStorage.getItem('userProfileColor');
                const animationsEnabled = localStorage.getItem('animationsEnabled');
                
                if (userColor) {
                  document.documentElement.style.setProperty('--user-profile-color', userColor);
                  
                  // Convert hex to RGB
                  const hex = userColor.replace('#', '');
                  const r = parseInt(hex.substr(0, 2), 16);
                  const g = parseInt(hex.substr(2, 2), 16);
                  const b = parseInt(hex.substr(4, 2), 16);
                  document.documentElement.style.setProperty('--user-profile-color-rgb', r + ', ' + g + ', ' + b);
                }
                
                if (animationsEnabled === 'false') {
                  document.documentElement.classList.add('no-animations');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}