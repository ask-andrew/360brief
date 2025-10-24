import { LucideProps } from 'lucide-react';
import dynamic from 'next/dynamic';

import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Github,
  Loader2,
  LogIn,
  Mail,
  Menu,
  Moon,
  Plus,
  Settings,
  Sun,
  User,
  X,
  type LucideIcon
} from 'lucide-react';

// Re-export all icons from lucide-react
export {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Github,
  Loader2,
  LogIn,
  Mail,
  Menu,
  Moon,
  Plus,
  Settings,
  Sun,
  User,
  X,
  type LucideIcon
} from 'lucide-react';

// Alias for backward compatibility
export const spinner = Loader2;

// Simple Google icon component
export function google(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

// Create a dynamic import for the logo component
export const Logo = dynamic(
  () => import('lucide-react').then((mod) => mod.BookOpen),
  { ssr: false }
) as React.ComponentType<LucideProps>;

// Create a type for icon names
export type IconName = 
  | 'arrow-right'
  | 'check'
  | 'chevron-down'
  | 'chevron-right'
  | 'external-link'
  | 'github'
  | 'loader-2'
  | 'log-in'
  | 'mail'
  | 'menu'
  | 'moon'
  | 'plus'
  | 'settings'
  | 'sun'
  | 'user'
  | 'x';

// Create a mapping of icon names to components
const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  'arrow-right': dynamic(() => import('lucide-react').then((mod) => mod.ArrowRight), { ssr: false }),
  'check': dynamic(() => import('lucide-react').then((mod) => mod.Check), { ssr: false }),
  'chevron-down': dynamic(() => import('lucide-react').then((mod) => mod.ChevronDown), { ssr: false }),
  'chevron-right': dynamic(() => import('lucide-react').then((mod) => mod.ChevronRight), { ssr: false }),
  'external-link': dynamic(() => import('lucide-react').then((mod) => mod.ExternalLink), { ssr: false }),
  'github': dynamic(() => import('lucide-react').then((mod) => mod.Github), { ssr: false }),
  'loader-2': dynamic(() => import('lucide-react').then((mod) => mod.Loader2), { ssr: false }),
  'log-in': dynamic(() => import('lucide-react').then((mod) => mod.LogIn), { ssr: false }),
  'mail': dynamic(() => import('lucide-react').then((mod) => mod.Mail), { ssr: false }),
  'menu': dynamic(() => import('lucide-react').then((mod) => mod.Menu), { ssr: false }),
  'moon': dynamic(() => import('lucide-react').then((mod) => mod.Moon), { ssr: false }),
  'plus': dynamic(() => import('lucide-react').then((mod) => mod.Plus), { ssr: false }),
  'settings': dynamic(() => import('lucide-react').then((mod) => mod.Settings), { ssr: false }),
  'sun': dynamic(() => import('lucide-react').then((mod) => mod.Sun), { ssr: false }),
  'user': dynamic(() => import('lucide-react').then((mod) => mod.User), { ssr: false }),
  'x': dynamic(() => import('lucide-react').then((mod) => mod.X), { ssr: false }),
  'spinner': dynamic(() => import('lucide-react').then((mod) => mod.Loader2), { ssr: false }),
  'google': dynamic(() => Promise.resolve(google), { ssr: false })
};

// Icon component with type safety
interface IconProps extends LucideProps {
  name: IconName;
}

export function Icon({ name, ...props }: IconProps) {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }
  
  return <IconComponent {...props} />;
}

// Create a default export with all icons as properties for backward compatibility
const Icons = {
  spinner,
  google,
  // Include all other exported icons - these are already available in scope from the imports above
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Github,
  Loader2,
  LogIn,
  Mail,
  Menu,
  Moon,
  Plus,
  Settings,
  Sun,
  User,
  X,
  Logo
};

export default Icons;
