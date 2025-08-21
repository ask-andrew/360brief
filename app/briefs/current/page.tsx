"use client";

import { useState } from 'react';
import BriefingDigest from '@/components/briefing/BriefingDigest';

export default function CurrentBriefPage() {
  const [isDetailed, setIsDetailed] = useState(false);

  const handleToggleDetail = () => setIsDetailed((prev) => !prev);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Current Brief</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <BriefingDigest isDetailed={isDetailed} onToggleDetail={handleToggleDetail} />
      </div>
    </div>
  );
}
