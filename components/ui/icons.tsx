// This file provides a consistent interface for all icons in the application
// using @heroicons/react for reliable, pre-built SVG icons

import * as React from 'react';
import * as HeroIcons from '@heroicons/react/24/outline';

// Type for all HeroIcons
type HeroIcon = React.ForwardRefExoticComponent<
  Omit<React.SVGProps<SVGSVGElement>, 'ref'> & {
    title?: string;
    titleId?: string;
  } & React.RefAttributes<SVGSVGElement>
>;

// Create a type-safe icon component
function createIcon<IconType extends HeroIcon>(
  IconComponent: IconType
): React.ForwardRefExoticComponent<React.ComponentProps<IconType> & React.RefAttributes<SVGSVGElement>> {
  const Icon = React.forwardRef<SVGSVGElement, React.ComponentProps<IconType>>(
    (props, ref) => {
      // Create a new props object to avoid mutating the original
      const iconProps = { ...props };
      // Ensure the component is rendered as a valid React element
      return React.createElement(IconComponent, { ...iconProps, ref });
    }
  ) as unknown as React.ForwardRefExoticComponent<React.ComponentProps<IconType> & React.RefAttributes<SVGSVGElement>>;
  
  // Set display name for better debugging
  Icon.displayName = IconComponent.displayName || IconComponent.name || 'Icon';
  
  return Icon;
}

// Create and export individual icons
export const GoogleLoginIcon = createIcon(HeroIcons.EnvelopeIcon);
export const SlackIcon = createIcon(HeroIcons.ChatBubbleLeftRightIcon);
export const MicrosoftIcon = createIcon(HeroIcons.WindowIcon);
const ZapIcon = createIcon(HeroIcons.BoltIcon);
const EyeIcon = createIcon(HeroIcons.EyeIcon);
const ClockIcon = createIcon(HeroIcons.ClockIcon);
const QuoteIcon = createIcon(HeroIcons.ChatBubbleLeftRightIcon);
const RocketIcon = createIcon(HeroIcons.RocketLaunchIcon);
const BriefcaseIcon = createIcon(HeroIcons.BriefcaseIcon);
const ShieldAlertIcon = createIcon(HeroIcons.ShieldExclamationIcon);
const NewspaperIcon = createIcon(HeroIcons.NewspaperIcon);
const BarChart2Icon = createIcon(HeroIcons.ChartBarIcon);
const UsersIcon = createIcon(HeroIcons.UsersIcon);
const BrainCircuitIcon = createIcon(HeroIcons.CpuChipIcon);
const MailIcon = createIcon(HeroIcons.EnvelopeIcon);
const MessageSquareIcon = createIcon(HeroIcons.ChatBubbleLeftRightIcon);
const CpuIcon = createIcon(HeroIcons.CpuChipIcon);
const RadioIcon = createIcon(HeroIcons.SignalIcon);
const FileTextIcon = createIcon(HeroIcons.DocumentTextIcon);
const GmailIcon = createIcon(HeroIcons.EnvelopeIcon);
export const GoogleCalendarIcon = createIcon(HeroIcons.CalendarIcon);
const ShieldCheckIcon = createIcon(HeroIcons.ShieldCheckIcon);
const PlayIcon = createIcon(HeroIcons.PlayIcon);
const PauseIcon = createIcon(HeroIcons.PauseIcon);
const RewindIcon = createIcon(HeroIcons.BackwardIcon);
const FastForwardIcon = createIcon(HeroIcons.ForwardIcon);

// Create a type for all icon names
type IconName =
  | 'googleLogin' | 'slack' | 'microsoft' | 'zap' | 'eye' | 'clock' | 'quote' | 'rocket'
  | 'briefcase' | 'shieldAlert' | 'newspaper' | 'barChart2' | 'users' | 'brainCircuit'
  | 'mail' | 'messageSquare' | 'cpu' | 'radio' | 'fileText' | 'gmail' | 'googleCalendar' 
  | 'shieldCheck' | 'play' | 'pause' | 'rewind' | 'fastForward' | 'helpCircle';

// Define the type for our icons record
type IconsRecord = {
  [key: string]: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement> & { title?: string; titleId?: string }>;
};

// Create a mapping of icon names to components
const Icons: IconsRecord = {
  // Custom Icons
  googleLogin: GoogleLoginIcon,
  slack: SlackIcon,
  microsoft: MicrosoftIcon,
  zap: ZapIcon,
  eye: EyeIcon,
  clock: ClockIcon,
  quote: QuoteIcon,
  rocket: RocketIcon,
  briefcase: BriefcaseIcon,
  shieldAlert: ShieldAlertIcon,
  newspaper: NewspaperIcon,
  barChart2: BarChart2Icon,
  users: UsersIcon,
  brainCircuit: BrainCircuitIcon,
  mail: MailIcon,
  messageSquare: MessageSquareIcon,
  cpu: CpuIcon,
  radio: RadioIcon,
  fileText: FileTextIcon,
  gmail: GmailIcon,
  googleCalendar: GoogleCalendarIcon,
  shieldCheck: ShieldCheckIcon,
  play: PlayIcon,
  pause: PauseIcon,
  rewind: RewindIcon,
  fastForward: FastForwardIcon,
  helpCircle: createIcon(HeroIcons.QuestionMarkCircleIcon),
  
  // Re-export all HeroIcons
  ...Object.fromEntries(
    Object.entries(HeroIcons).map(([name, Icon]) => [
      name.replace(/Icon$/, '').replace(/([a-z])([A-Z])/g, '$1$2').toLowerCase(),
      createIcon(Icon as HeroIcon)
    ])
  )
} as const;

export type IconProps = {
  name?: keyof typeof Icons;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  [key: string]: any;
};

// Main Icon component that renders the appropriate icon based on the name prop
const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ name = 'helpCircle', size = 'md', className = '', ...props }, ref) => {
    // Define size classes
    const sizeClasses = {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
      xl: 'h-8 w-8',
    } as const;

    // Get the appropriate size class
    const sizeClass = sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.md;
    
    // Get the icon component or fallback to helpCircle
    const iconName = name as keyof typeof Icons;
    const IconComponent = Icons[iconName] || Icons.helpCircle;

    if (!IconComponent) {
      console.warn(`Icon '${name}' not found`);
      return null;
    }

    // Combine classes
    const combinedClassName = `${sizeClass} ${className || ''}`.trim();

    // Create and return the icon element
    return React.createElement(IconComponent, {
      ref,
      className: combinedClassName,
      ...props
    });
  }
);

// Set display name for better debugging
Icon.displayName = 'Icon';

export type { IconName };
export { Icon };
export default Icon;
