import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="w-full border-t border-gray-200 bg-white mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="text-center md:text-left">
            <p className="text-sm text-gray-500">
              &copy; {currentYear} 360Brief. All rights reserved.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            <Link 
              href="/privacy" 
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors whitespace-nowrap"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/terms" 
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors whitespace-nowrap"
            >
              Terms of Service
            </Link>
            <Link 
              href="/security" 
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors whitespace-nowrap"
            >
              Security
            </Link>
            <a 
              href="mailto:support@360brief.com" 
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors whitespace-nowrap"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
