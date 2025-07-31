import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-[3px]',
  };

  return (
    <div className={cn('relative inline-block', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-solid border-gray-200 border-t-indigo-600',
          sizeClasses[size]
        )}
        style={{
          animation: 'spin 1s linear infinite',
        }}
      >
        <span className="sr-only">Loading...</span>
      </div>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
