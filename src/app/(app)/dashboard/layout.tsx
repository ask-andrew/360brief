import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | 360Brief',
  description: 'Your personalized dashboard',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
