import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Navbar } from "@/components/layout/navbar"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "TMatrix Lite - Twitter 内容管理",
  description: "Twitter 内容创作与数据分析工具",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans">
        <Suspense fallback={<div>Loading...</div>}>
          <Navbar />
          <main className="container mx-auto px-6 py-8 max-w-7xl">{children}</main>
          <Analytics />
        </Suspense>
      </body>
    </html>
  )
}
