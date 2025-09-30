"use client"

import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        className="transition-all duration-300 hover:scale-105"
      >
        ☀️
      </Button>
    )
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
      className="transition-all duration-300 hover:scale-105"
    >
      {theme === "light" ? "🌙" : "☀️"}
    </Button>
  )
}
