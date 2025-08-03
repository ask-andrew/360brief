import * as React from 'react';

// Define the base icon props
export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  children?: React.ReactNode;
}

// Create a type for our icon component
type IconComponent = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<IconProps> & React.RefAttributes<SVGSVGElement>
>;

// Helper function to create consistent icons
export const createIcon = (displayName: string, content: React.ReactNode): IconComponent => {
  const Icon = React.forwardRef<SVGSVGElement, IconProps>(
    ({ className = '', size = 24, ...props }, ref) => (
      <svg
        ref={ref}
        className={className}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        role="img"
        {...props as any}
      >
        {content}
      </svg>
    )
  );
  
  Icon.displayName = displayName;
  return Icon;
};

// Example icon components
export const CheckIcon = createIcon('CheckIcon', (
  <path d="M20 6L9 17l-5-5" />
));

export const ChevronDownIcon = createIcon('ChevronDownIcon', (
  <path d="M6 9l6 6 6-6" />
));

export const ArrowRightIcon = createIcon('ArrowRightIcon', (
  <path d="M5 12h14M12 5l7 7-7 7" />
));

export const CheckCircleIcon = createIcon('CheckCircleIcon', (
  <>
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <path d="M22 4L12 14.01l-3-3" />
  </>
));

export const AlertTriangleIcon = createIcon('AlertTriangleIcon', (
  <>
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </>
));

export const XIcon = createIcon('XIcon', (
  <path d="M18 6L6 18M6 6l12 12" />
));

export const MenuIcon = createIcon('MenuIcon', (
  <line x1="3" y1="12" x2="21" y2="12" />
  <line x1="3" y1="6" x2="21" y2="6" />
  <line x1="3" y1="18" x2="21" y2="18" />
));

export const UserIcon = createIcon('UserIcon', (
  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
  <circle cx="12" cy="7" r="4" />
));

export const LogOutIcon = createIcon('LogOutIcon', (
  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
));

export const Loader2Icon = createIcon('Loader2Icon', (
  <path d="M21 12a9 9 0 11-6.219-8.56" />
));

// Export all icons as a single object for easier imports
export const Icons = {
  check: CheckIcon,
  chevronDown: ChevronDownIcon,
  arrowRight: ArrowRightIcon,
  checkCircle: CheckCircleIcon,
  alertTriangle: AlertTriangleIcon,
  x: XIcon,
  menu: MenuIcon,
  user: UserIcon,
  logOut: LogOutIcon,
  loader2: Loader2Icon,
};

export default Icons;
