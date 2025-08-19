'use client';

import { useEffect, useState } from 'react';

export default function EmailPreviewPage() {
  const [conciseHtml, setConciseHtml] = useState('');
  const [detailedHtml, setDetailedHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEmailPreviews = async () => {
      try {
        setLoading(true);
        
        // Fetch concise version
        const conciseRes = await fetch('/api/email-preview/mission-brief?style=concise');
        if (!conciseRes.ok) throw new Error('Failed to load concise version');
        const conciseHtml = await conciseRes.text();
        
        // Fetch detailed version
        const detailedRes = await fetch('/api/email-preview/mission-brief?style=detailed');
        if (!detailedRes.ok) throw new Error('Failed to load detailed version');
        const detailedHtml = await detailedRes.text();
        
        setConciseHtml(conciseHtml);
        setDetailedHtml(detailedHtml);
      } catch (err) {
        console.error('Error loading email previews:', err);
        setError(err instanceof Error ? err.message : 'Failed to load email previews');
      } finally {
        setLoading(false);
      }
    };

    fetchEmailPreviews();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Loading email previews...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p>{error}</p>
            <p className="mt-2 text-sm">Please check the browser console for more details.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Email Template Previews</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gray-800 text-white px-4 py-3">
              <h2 className="font-semibold">Mission Brief - Concise</h2>
            </div>
            <div className="p-4">
              <div 
                className="border border-gray-200 p-4 bg-white"
                dangerouslySetInnerHTML={{ __html: conciseHtml }}
              />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gray-800 text-white px-4 py-3">
              <h2 className="font-semibold">Mission Brief - Detailed</h2>
            </div>
            <div className="p-4">
              <div 
                className="border border-gray-200 p-4 bg-white"
                dangerouslySetInnerHTML={{ __html: detailedHtml }}
              />
            </div>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-white rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Debug Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-medium mb-2">Concise Version</h3>
              <pre className="bg-gray-50 p-3 rounded overflow-auto max-h-40">
                {JSON.stringify(conciseHtml.substring(0, 500) + '...', null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-medium mb-2">Detailed Version</h3>
              <pre className="bg-gray-50 p-3 rounded overflow-auto max-h-40">
                {JSON.stringify(detailedHtml.substring(0, 500) + '...', null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
