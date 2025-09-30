"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BarChart3, FileText, Database } from "lucide-react"

export function Navbar() {
  const pathname = usePathname()

  const links = [
    { href: "/", label: "仪表板", icon: BarChart3 },
    { href: "/content", label: "内容", icon: FileText },
    { href: "/data", label: "数据", icon: Database },
  ]

  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-semibold">
              TMatrix Lite
            </Link>

            <div className="flex gap-1">
              {links.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
