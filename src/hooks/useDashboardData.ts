'use client';

import { useState, useEffect } from 'react';

interface DashboardData {
  emailStats: {
    total: number;
    unread: number;
    important: number;
    responseTime: string;
  };
  meetingStats: {
    upcoming: number;
    completed: number;
    timeInMeetings: string;
  };
  productivity: {
    focusTime: string;
    tasksCompleted: number;
    priorityItems: number;
  };
}

export const useDashboardData = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API endpoint
        // const response = await fetch('/api/dashboard');
        // if (!response.ok) throw new Error('Failed to fetch dashboard data');
        // const result = await response.json();
        
        // Mock data - replace with actual API call
        setTimeout(() => {
          setData({
            emailStats: {
              total: 247,
              unread: 12,
              important: 8,
              responseTime: '2.4h',
            },
            meetingStats: {
              upcoming: 5,
              completed: 18,
              timeInMeetings: '12.5h',
            },
            productivity: {
              focusTime: '6.2h',
              tasksCompleted: 42,
              priorityItems: 7,
            },
          });
          setLoading(false);
        }, 1000);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};
