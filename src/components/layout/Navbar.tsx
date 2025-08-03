'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Menu, X, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = [
  { name: 'Features', href: '#features' },
  { name: 'How It Works', href: '#how-it-works' },
  { name: 'Pricing', href: '#pricing' },
  { name: 'About', href: '#about' },
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
            <Icons.logo className="h-7 w-7 text-primary transition-transform group-hover:rotate-12" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              360°Brief
            </span>
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
              href="/login"
              className={cn(
                'text-sm font-medium text-muted-foreground transition-colors hover:text-foreground/90',
                'px-3 py-2 rounded-md hover:bg-muted/50'
              )}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ size: 'default' }),
                'group px-5 py-2.5 text-sm font-medium transition-all hover:shadow-md'
              )}
            >
              Get Started
              <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
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
              href="/login"
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'w-full'
              )}
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className={cn(
                buttonVariants(),
                'w-full'
              )}
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
