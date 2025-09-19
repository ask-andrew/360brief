'use client';

import { useState, useEffect } from 'react';
import RadarChart from '@/components/RadarChart';

interface RadarItem {
  id: string;
  summary: string;
  impactArea: string;
  urgencyScore: 'Low' | 'Medium' | 'High';
  severityScore: 'Minor' | 'Major' | 'Critical';
  suggestedAction: string;
  relatedEmails: string[];
}

export default function RadarPage() {
  const [data, setData] = useState<RadarItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/radar');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (!Array.isArray(result)) {
          console.error("Fetched data is not an array:", result);
          setData([]);
        } else {
          setData(result);
        }
      } catch (error) {
        console.error('Error fetching radar data:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="container mx-auto py-8">
      {loading ? (
        <p>Loading radar data...</p>
      ) : (
        <RadarChart data={data} />
      )}
    </div>
  );
}
