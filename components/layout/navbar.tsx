"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ModeToggle } from "@/components/mode-toggle"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/writing", label: "Writing" },
]

export default function Navbar() {
  const pathname = usePathname()

  useEffect(() => {
    // No-op; kept for parity if animations depend on route change
  }, [pathname])

  return (
    <header
      className={cn(
        // Non-fixed header: scrolls with the page
        "w-full transition-all duration-300",
        // Consistent style; no scroll-based opacity change
        "bg-transparent py-6",
      )}
    >
      <div className="container mx-auto px-4">
        {/* Unified Navigation - Centered for all breakpoints */}
        <nav className="flex items-center justify-center space-x-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors relative group",
                pathname === link.href ? "text-primary" : "text-foreground/70 hover:text-foreground",
              )}
            >
              {link.label}
              {pathname === link.href && (
                <motion.span
                  layoutId="navbar-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full mx-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </Link>
          ))}
          {/* <div className="ml-2">
            <ModeToggle />
          </div> */}
        </nav>
      </div>
    </header>
  )
}
