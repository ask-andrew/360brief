import { LucideProps } from 'lucide-react';
import dynamic from 'next/dynamic';

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
  'x': dynamic(() => import('lucide-react').then((mod) => mod.X), { ssr: false })
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

// Usage example:
// <Icon name="check" className="h-4 w-4" />
