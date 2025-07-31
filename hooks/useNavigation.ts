import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  current: boolean;
  children?: NavItem[];
}

export default function useNavigation() {
  const router = useRouter();
  const [navigation, setNavigation] = useState<NavItem[]>([]);
  const [currentPath, setCurrentPath] = useState(router.pathname);

  useEffect(() => {
    setCurrentPath(router.pathname);

    const navItems: NavItem[] = [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: null, // Will be set in the component
        current: router.pathname === '/dashboard',
      },
      {
        name: 'Analytics',
        href: '/analytics',
        icon: null,
        current: router.pathname.startsWith('/analytics'),
      },
      {
        name: 'Emails',
        href: '/emails',
        icon: null,
        current: router.pathname.startsWith('/emails'),
      },
      {
        name: 'Calendar',
        href: '/calendar',
        icon: null,
        current: router.pathname.startsWith('/calendar'),
      },
      {
        name: 'Settings',
        href: '/settings',
        icon: null,
        current: router.pathname.startsWith('/settings'),
        children: [
          {
            name: 'Digest',
            href: '/settings/digest',
            icon: null,
            current: router.pathname === '/settings/digest',
          },
          {
            name: 'Account',
            href: '/settings/account',
            icon: null,
            current: router.pathname === '/settings/account',
          },
        ],
      },
    ];

    setNavigation(navItems);
  }, [router.pathname]);

  return {
    navigation,
    currentPath,
  };
}
