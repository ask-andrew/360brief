
import React from 'react';

export const EXECUTIVE_EMAIL = 'exec@company.com';
export const INTERNAL_DOMAIN = 'company.com';

export const EmailIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

export const SlackIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.528-2.528V6.75a2.528 2.528 0 0 1 2.528-2.528h5.887a2.528 2.528 0 0 1 2.528 2.528v1.58a.948.948 0 0 1-1.896 0V6.75a.632.632 0 0 0-.632-.632H5.042a.632.632 0 0 0-.632.632v5.887a.632.632 0 0 0 .632.632h1.58a.948.948 0 0 1 0 1.896H5.042zM8.835 5.042a2.528 2.528 0 0 1 2.528-2.528h5.887a2.528 2.528 0 0 1 2.528 2.528v5.887a2.528 2.528 0 0 1-2.528 2.528h-1.58a.948.948 0 0 1 0-1.896h1.58a.632.632 0 0 0 .632-.632V5.042a.632.632 0 0 0-.632-.632h-5.887a.632.632 0 0 0-.632.632v1.58a.948.948 0 0 1-1.896 0V5.042zM18.958 8.835a2.528 2.528 0 0 1 2.528 2.528v5.887a2.528 2.528 0 0 1-2.528 2.528h-5.887a2.528 2.528 0 0 1-2.528-2.528v-1.58a.948.948 0 0 1 1.896 0v1.58a.632.632 0 0 0 .632.632h5.887a.632.632 0 0 0 .632-.632v-5.887a.632.632 0 0 0-.632-.632h-1.58a.948.948 0 0 1 0-1.896h1.58zM15.165 18.958a2.528 2.528 0 0 1-2.528 2.528H6.75a2.528 2.528 0 0 1-2.528-2.528v-5.887a2.528 2.528 0 0 1 2.528-2.528h1.58a.948.948 0 0 1 0 1.896H6.75a.632.632 0 0 0-.632.632v5.887a.632.632 0 0 0 .632.632h5.887a.632.632 0 0 0 .632-.632v-1.58a.948.948 0 0 1 1.896 0v1.58z" />
  </svg>
);

export const MeetingIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export const TrendUpIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
);

export const TrendDownIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 17l5-5m0 0l-5-5m5 5H6" />
    </svg>
);

export const ClockIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const UsersIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm6-11a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

export const DownloadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);