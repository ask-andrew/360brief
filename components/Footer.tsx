
import React from 'react';
import Logo from './Logo';

const Footer: React.FC = () => {
  return (
    <footer className="py-8 border-t border-slate-800">
      <div className="container mx-auto px-6 md:px-12 text-center text-slate-500">
        <div className="flex items-center justify-center gap-2 text-lg font-bold text-slate-400 mb-4">
            <Logo className="h-6 w-6" />
            360Brief
        </div>
        <p>&copy; {new Date().getFullYear()} 360Brief. All rights reserved.</p>
        <p className="mt-2 text-sm">This is a conceptual web application created for demonstration purposes.</p>
      </div>
    </footer>
  );
};

export default Footer;