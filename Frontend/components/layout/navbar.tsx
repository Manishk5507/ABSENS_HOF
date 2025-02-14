"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { Menu, AlertTriangle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

const routes = [
  {
    href: "/",
    label: "Home",
  },
  {
    href: "/report",
    label: "Report Missing",
  },
  {
    href: "/search",
    label: "Find Missing",
  },
  {
    href: "/alerts",
    label: "Alerts",
  },
  {
    href: "/dashboard",
    label: "Dashboard",
  }
];

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // For example, assume the token is stored in localStorage under the key "token"
    const token = localStorage.getItem("token")
    if (token) {
      setIsLoggedIn(true)
    }
  }, [])

  // Reset loading state when the route changes
  useEffect(() => {
    setLoading(false)
  }, [pathname])

  // Base routes always visible
  const routes = [
    { href: "/", label: "Home" },
    { href: "/report", label: "Report Missing" },
    { href: "/search", label: "Search" },
    { href: "/alerts", label: "Alerts" },
  ]

  // Conditionally add the dashboard link if the user is logged in
  if (isLoggedIn) {
    routes.push({ href: "/dashboard", label: "Dashboard" })
  }

  // Function to set loading true when a link is clicked
  const handleLinkClick = () => {
    setLoading(true)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-[#004d40] px-8">
      <div className="container flex h-16 items-center relative">
        {/* Desktop Navigation */}
        <div className="mr-4 hidden md:flex flex-1">
          <Link href="/" onClick={handleLinkClick} className="mr-6 flex items-center space-x-2">
            <AlertTriangle className="h-6 w-6 text-white" />
            <span className="text-xl font-bold text-white">ABSENS</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                onClick={handleLinkClick}
                className={cn(
                  "transition-colors hover:text-white/80",
                  pathname === route.href ? "text-white" : "text-white/60"
                )}
              >
                {route.label}
              </Link>
            ))}
          </nav>
        </div>
        
        {/* Mobile Navigation using a Sheet */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="mr-2 text-white">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-[#004d40] text-white border-r-0">
            <Link href="/" onClick={() => { setOpen(false); handleLinkClick() }} className="flex items-center space-x-2 mb-8">
              <AlertTriangle className="h-6 w-6" />
              <span className="text-xl font-bold">ABSENS</span>
            </Link>
            <nav className="flex flex-col gap-4">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  onClick={() => { setOpen(false); handleLinkClick() }}
                  className={cn(
                    "text-lg font-medium transition-colors hover:text-white/80",
                    pathname === route.href ? "text-white" : "text-white/60"
                  )}
                >
                  {route.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Right Side: Register button or additional controls */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none"></div>
          {!isLoggedIn && (
            <Button variant="outline" className="mr-2 bg-[#004d40] text-white" asChild>
              <Link href="/signup" onClick={handleLinkClick}>Register</Link>
            </Button>
          )}
          <ModeToggle />
        </div>

        {/* Loader overlay */}
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30">
            <Loader size="lg" overlay={true} />
          </div>
        )}
      </div>
    </header>
  )
}
