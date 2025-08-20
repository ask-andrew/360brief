'use client';

import { useState, useEffect } from 'react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});
  
  // Close mobile menu when path changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);
  
  const navigation: NavigationItem[] = [
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      current: pathname === '/analytics',
      exact: true
    },
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
      name: 'Briefs', 
      icon: BookOpen, 
      current: pathname?.startsWith('/briefs'),
      children: [
        { 
          name: 'Current Brief', 
          href: '/briefs/current', 
          icon: BookOpen,
          current: pathname?.startsWith('/briefs/current')
        },
        { 
          name: 'Past Briefs', 
          href: '/briefs/past', 
          icon: BookOpen,
          current: pathname?.startsWith('/briefs/past'),
          comingSoon: true
        },
        { 
          name: 'Settings', 
          href: '/briefs/settings', 
          icon: Settings,
          current: pathname?.startsWith('/briefs/settings')
        }
      ]
    },
    { 
      name: 'Account Settings', 
      icon: Settings, 
      current: pathname?.startsWith('/preferences') && !pathname?.startsWith('/briefs'),
      children: [
        { 
          name: 'Profile', 
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
          name: 'Connections', 
          href: '/preferences/connections', 
          icon: LinkIcon,
          current: pathname?.startsWith('/preferences/connections')
        }
      ]
    },
    { 
      name: 'Help & Support', 
      href: '/help', 
      icon: HelpCircle, 
      current: pathname?.startsWith('/help')
    }
  ];

  const toggleSubmenu = (name: string) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const renderNavItem = (item: NavigationItem, index: number) => {
    const Icon = item.icon;
    const isActive = item.current;
    const hasChildren = item.children && item.children.length > 0;
    const isSubmenuOpen = openSubmenus[item.name] || isActive;

    if (hasChildren) {
      return (
        <div key={item.name} className="space-y-1">
          <button
            onClick={() => toggleSubmenu(item.name)}
            className={cn(
              'flex items-center w-full px-4 py-2 text-sm font-medium rounded-md transition-colors',
              'text-gray-700 hover:bg-gray-100',
              isActive && 'bg-gray-100 text-gray-900',
              collapsed ? 'justify-center' : 'justify-between'
            )}
          >
            <div className="flex items-center">
              <Icon className={cn('h-5 w-5', isActive ? 'text-primary' : 'text-gray-500')} />
              {!collapsed && <span className="ml-3">{item.name}</span>}
            </div>
            {!collapsed && (
              <span className="ml-2">
                {isSubmenuOpen ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </span>
            )}
          </button>
          
          {isSubmenuOpen && !collapsed && (
            <div className="ml-8 space-y-1">
              {item.children?.map((child, childIndex) => (
                <Link
                  key={`${item.name}-${childIndex}`}
                  href={child.href || '#'}
                  className={cn(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md',
                    'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                    child.current && 'bg-gray-100 text-gray-900',
                    child.comingSoon && 'opacity-50 cursor-not-allowed'
                  )}
                  onClick={(e) => {
                    if (child.comingSoon) {
                      e.preventDefault();
                    }
                  }}
                >
                  {child.comingSoon && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mr-2">
                      Soon
                    </span>
                  )}
                  {child.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.name}
        href={item.href || '#'}
        className={cn(
          'flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors',
          'text-gray-700 hover:bg-gray-100',
          isActive && 'bg-gray-100 text-gray-900',
          collapsed ? 'justify-center' : 'justify-start'
        )}
      >
        <Icon className={cn('h-5 w-5', isActive ? 'text-primary' : 'text-gray-500')} />
        {!collapsed && <span className="ml-3">{item.name}</span>}
        {item.comingSoon && !collapsed && (
          <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Soon
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-20">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="bg-white"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
      
      {/* Sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-10 flex flex-col bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out',
        'w-64',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
        'md:translate-x-0 md:relative',
        collapsed && 'md:w-20',
        'overflow-y-auto'
      )}>
        {/* Logo and collapse button */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {!collapsed ? (
            <Link href="/dashboard" className="flex items-center">
              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold">
                360
              </div>
              <span className="ml-3 text-lg font-bold text-gray-900">360Brief</span>
            </Link>
          ) : (
            <Link href="/dashboard" className="flex items-center justify-center w-full">
              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold">
                360
              </div>
            </Link>
          )}
          
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700',
              'hidden md:block',
              collapsed ? 'mx-auto' : ''
            )}
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
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item, index) => renderNavItem(item, index))}
        </nav>

        {/* User menu */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => signOut()}
            className={cn(
              'flex items-center w-full px-4 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50',
              collapsed ? 'justify-center' : 'justify-start'
            )}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="ml-3">Sign out</span>}
          </button>
        </div>
      </div>
      
      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-0 bg-black bg-opacity-50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
