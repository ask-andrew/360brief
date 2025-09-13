import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between md:flex-row">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <p className="text-sm text-gray-500">
              &copy; {currentYear} 360Brief. All rights reserved.
            </p>
          </div>
          <div className="flex flex-wrap justify-center space-x-6">
            <Link 
              href="/privacy" 
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/terms" 
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Terms of Service
            </Link>
            <Link 
              href="/security" 
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Security
            </Link>
            <a 
              href="mailto:support@360brief.com" 
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
