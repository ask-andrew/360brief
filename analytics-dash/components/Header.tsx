
import React from 'react';
import { DownloadIcon } from '../constants';

// Let TypeScript know html2canvas is available on the window object
declare const html2canvas: any;

export const Header: React.FC = () => {

  const handleDownload = () => {
    const dashboardElement = document.getElementById('root');
    if (dashboardElement) {
      html2canvas(dashboardElement, {
        // Options to improve quality
        scale: 2,
        useCORS: true,
        backgroundColor: '#111827', // Match dark mode bg
        logging: false,
      }).then((canvas: HTMLCanvasElement) => {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = '360Brief_Dashboard.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }
  };


  return (
    <header className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          360Brief
        </h1>
        <p className="text-slate-600 dark:text-slate-400">Executive Overview</p>
      </div>
      <button
        onClick={handleDownload}
        className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900"
      >
        <DownloadIcon />
        Download as Image
      </button>
    </header>
  );
};