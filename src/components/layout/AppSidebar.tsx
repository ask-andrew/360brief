'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Settings, 
  BookOpen, 
  Inbox, 
  User, 
  HelpCircle, 
  Link as LinkIcon,
  Sliders,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth/actions';

type NavigationItem = {
  name: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  current?: boolean;
  exact?: boolean;
  comingSoon?: boolean;
  children?: NavigationItem[];
};

export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});
  
  const navigation: NavigationItem[] = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: Home, 
      current: pathname === '/dashboard',
      exact: true
    },
    { 
      name: 'Analytics', 
      href: '/analytics', 
      icon: BarChart3, 
      current: pathname?.startsWith('/analytics')
    },
    { 
      name: 'Digests', 
      href: '/digest', 
      icon: BookOpen, 
      current: pathname?.startsWith('/digest'),
      comingSoon: true
    },
    { 
      name: 'Settings', 
      icon: Settings, 
      current: pathname?.startsWith('/preferences'),
      children: [
        { 
          name: 'Account', 
          href: '/preferences/account', 
          icon: User,
          current: pathname?.startsWith('/preferences/account')
        },
        { 
          name: 'Notifications', 
          href: '/preferences/notifications', 
          icon: Inbox,
          current: pathname?.startsWith('/preferences/notifications')
        },
        { 
          name: 'Connected Accounts', 
          href: '/preferences/connected-accounts', 
          icon: LinkIcon,
          current: pathname?.startsWith('/preferences/connected-accounts')
        },
        { 
          name: 'Content Preferences', 
          href: '/preferences/content', 
          icon: Sliders,
          current: pathname?.startsWith('/preferences/content')
        }
      ]
    },
    { 
      name: 'Help', 
      href: '/help', 
      icon: HelpCircle, 
      current: pathname?.startsWith('/help'),
      comingSoon: true
    }
  ];

  const toggleSubmenu = (name: string) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const renderNavItem = (item: NavigationItem) => {
    const isSubmenuOpen = openSubmenus[item.name] ?? false;
    const hasChildren = item.children && item.children.length > 0;
    
    return (
      <li key={item.name} className="relative">
        {item.href ? (
          <Link
            href={item.comingSoon ? '#' : item.href}
            className={cn(
              'flex items-center px-4 py-3 text-sm font-medium rounded-lg mx-2 transition-colors',
              item.current
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-gray-700 hover:bg-gray-100',
              item.comingSoon ? 'opacity-60 cursor-not-allowed' : ''
            )}
            onClick={(e) => {
              if (item.comingSoon) {
                e.preventDefault();
              }
            }}
          >
            <item.icon className={cn('h-5 w-5 flex-shrink-0', item.current ? 'text-primary' : 'text-gray-500')} />
            {!collapsed && (
              <>
                <span className="ml-3">{item.name}</span>
                {item.comingSoon && (
                  <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">
                    Soon
                  </span>
                )}
              </>
            )}
          </Link>
        ) : (
          <button
            type="button"
            className={cn(
              'flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg mx-2 transition-colors',
              item.current
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-gray-700 hover:bg-gray-100',
              'justify-between'
            )}
            onClick={() => hasChildren && toggleSubmenu(item.name)}
          >
            <div className="flex items-center">
              <item.icon className={cn('h-5 w-5 flex-shrink-0', item.current ? 'text-primary' : 'text-gray-500')} />
              {!collapsed && <span className="ml-3">{item.name}</span>}
            </div>
            {hasChildren && !collapsed && (
              <span className="ml-2">
                {isSubmenuOpen ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </span>
            )}
          </button>
        )}
        
        {hasChildren && !collapsed && isSubmenuOpen && (
          <ul className="mt-1 ml-8 space-y-1">
            {item.children?.map((child) => (
              <li key={child.name}>
                <Link
                  href={child.href || '#'}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm rounded-lg',
                    child.current
                      ? 'text-primary font-medium bg-primary/5'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <child.icon className="h-4 w-4 text-gray-400 mr-3" />
                  {child.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className={cn(
      'hidden md:flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold">
            360
          </div>
          {!collapsed && <span className="ml-3 text-lg font-bold text-gray-900">360Brief</span>}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navigation.map(renderNavItem)}
        </ul>
      </nav>
      
      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        <button
          onClick={() => signOut()}
          className={cn(
            'flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100',
            collapsed ? 'justify-center' : ''
          )}
        >
          <LogOut className="h-5 w-5 text-gray-500" />
          {!collapsed && <span className="ml-3">Sign out</span>}
        </button>
      </div>
    </div>
  );
}
