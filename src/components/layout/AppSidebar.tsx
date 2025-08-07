'use client';

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
  Sliders
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
  
  const navigation: NavigationItem[] = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: Home, 
      current: pathname === '/dashboard',
      exact: true
    },
    { 
      name: 'Digests', 
      href: '/digest', 
      icon: BookOpen, 
      current: pathname?.startsWith('/digest')
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

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
        <div className="flex flex-col flex-1 h-0">
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-white">
            <Link href="/app" className="flex items-center">
              <span className="text-xl font-bold text-primary">360Brief</span>
            </Link>
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => (
                <div key={item.name}>
                  <Link
                    href={item.comingSoon || !item.href ? '#' : item.href}
                    className={cn(
                      (item.current || (item.children?.some(child => child.current)))
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      'group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md',
                      item.comingSoon ? 'opacity-50 cursor-not-allowed' : ''
                    )}
                    onClick={(e) => {
                      if (item.comingSoon || !item.href) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <div className="flex items-center">
                      <item.icon
                        className={cn(
                          (item.current || (item.children?.some(child => child.current))) ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                          'mr-3 flex-shrink-0 h-5 w-5'
                        )}
                        aria-hidden="true"
                      />
                      <span className="flex-1">{item.name}</span>
                    </div>
                    {item.comingSoon && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Soon
                      </span>
                    )}
                  </Link>
                  
                  {item.children && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          href={child.href || '#'}
                          className={cn(
                            child.current
                              ? 'bg-gray-50 text-gray-900'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                            'group flex items-center px-3 py-2 text-sm font-medium rounded-md',
                            child.comingSoon ? 'opacity-50 cursor-not-allowed' : ''
                          )}
                        >
                          <child.icon
                            className={cn(
                              child.current ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                              'mr-3 flex-shrink-0 h-4 w-4'
                            )}
                            aria-hidden="true"
                          />
                          <span className="flex-1">{child.name}</span>
                          {child.comingSoon && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Soon
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
          <div className="p-4 border-t border-gray-200">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => signOut()}
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
