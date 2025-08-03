'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Menu, X, BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = [
  { name: 'Features', href: '#features' },
  { name: 'How It Works', href: '#how-it-works' },
  { name: 'Pricing', href: '#pricing' },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Close mobile menu when route changes
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header 
      className={cn(
        'sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg transition-all duration-300',
        isScrolled ? 'border-border/50 shadow-sm' : 'border-transparent'
      )}
    >
      <div className="container flex h-20 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link 
            href="/" 
            className="flex items-center space-x-2 group"
            aria-label="360°Brief Home"
          >
            <img 
              src="/images/360logo.svg" 
              alt="360°Brief" 
              className="h-16 w-auto transition-transform group-hover:rotate-12 md:h-24" 
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center space-x-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm font-medium text-muted-foreground transition-colors hover:text-foreground/90',
                pathname === item.href ? 'text-foreground font-semibold' : 'hover:text-foreground/80',
                'group relative py-2'
              )}
            >
              {item.name}
              <span className={cn(
                'absolute bottom-0 left-0 h-0.5 w-0 bg-primary transition-all duration-300 group-hover:w-full',
                pathname === item.href ? 'w-full' : 'w-0'
              )} />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {/* Desktop CTA */}
          <div className="hidden items-center space-x-3 md:flex">
            <Link
              href="/signin"
              className={cn(
                'text-sm font-medium text-muted-foreground transition-colors hover:text-foreground/90',
                'px-3 py-2 rounded-md hover:bg-muted/50'
              )}
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className={cn(
                'inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground',
                'transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'group px-5 py-2.5 hover:shadow-md'
              )}
            >
              Get Started
              <svg 
                className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              className="text-foreground/80 hover:bg-transparent hover:text-primary p-2 rounded-md"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
              <span className="sr-only">
                {mobileMenuOpen ? 'Close menu' : 'Open menu'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-200 md:hidden',
          mobileMenuOpen ? 'max-h-screen' : 'max-h-0'
        )}
      >
        <div className="container flex flex-col space-y-4 pb-4 pt-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-base font-medium text-foreground/80 hover:bg-accent"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}
          <div className="flex flex-col space-y-2 pt-4">
            <Link
              href="/signin"
              className={cn(
                'text-sm font-medium text-foreground/80 transition-colors hover:text-primary'
              )}
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className={cn(
                'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
                'bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2',
                'transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5'
              )}
            >
              Get Started
              <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
