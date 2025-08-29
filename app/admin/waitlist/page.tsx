'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export default function WaitlistAdmin() {
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchWaitlist = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('waitlist')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setWaitlist(data || []);
      } catch (err: any) {
        console.error('Error fetching waitlist:', err);
        setError(err.message || 'Failed to load waitlist');
      } finally {
        setLoading(false);
      }
    };

    fetchWaitlist();
  }, []);

  const exportToCSV = () => {
    const headers = [
      'Email',
      'Name',
      'Role',
      'Company Size',
      'Tools',
      'Pain Point',
      'Must Haves',
      'Delivery Pref',
      'Style Pref',
      'Willing to Call',
      'Source',
      'Signed Up'
    ];

    const csvContent = [
      headers.join(','),
      ...waitlist.map(entry => [
        `"${entry.email}"`,
        `"${entry.name || ''}"`,
        `"${entry.role || ''}"`,
        `"${entry.company_size || ''}"`,
        `"${entry.tools?.join(', ') || ''}"`,
        `"${entry.pain_point?.replace(/"/g, '""') || ''}"`,
        `"${entry.must_haves?.join(', ') || ''}"`,
        `"${entry.delivery_pref || ''}"`,
        `"${entry.style_pref || ''}"`,
        `"${entry.willing_call ? 'Yes' : 'No'}"`,
        `"${entry.source || ''}"`,
        `"${new Date(entry.created_at).toLocaleString()}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `waitlist-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Waitlist Admin</h1>
          <div className="animate-pulse">Loading waitlist entries...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Waitlist Admin</h1>
          <div className="text-red-600">Error: {error}</div>
          <p className="mt-2 text-gray-600">Please make sure you're logged in with an admin account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Waitlist Admin</h1>
            <p className="text-gray-600 mt-1">{waitlist.length} total signups</p>
          </div>
          <button
            onClick={exportToCSV}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Export to CSV
          </button>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company Size
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Signed Up
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {waitlist.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {entry.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.role || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.company_size || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add server-side protection for this route
export const dynamic = 'force-dynamic';
