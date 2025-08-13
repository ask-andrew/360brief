'use client';

import React from 'react';
import { missionBriefData } from '@/mock/missionBriefData';
import MissionBrief from '@/components/briefs/MissionBrief';

export default function MockBriefPage() {
  return (
    <div style={{ 
      backgroundColor: '#f5f5f5', 
      minHeight: '100vh',
      padding: '40px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{ maxWidth: 1200, width: '100%' }}>
        <h1 style={{ 
          color: '#1a1a1a', 
          marginBottom: 32,
          textAlign: 'center',
          fontWeight: 600
        }}>
          Your 360° Brief
          <div style={{
            height: 4,
            width: 80,
            backgroundColor: '#1890ff',
            margin: '12px auto 0',
            borderRadius: 2
          }} />
        </h1>
        
        <div style={{
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          borderRadius: 12,
          overflow: 'hidden',
          margin: '0 auto',
          maxWidth: 800
        }}>
          <MissionBrief data={missionBriefData} />
        </div>
        
        <div style={{
          marginTop: 48,
          textAlign: 'center',
          color: '#666',
          fontSize: '0.9em'
        }}>
          <p>This is a preview of what your 360° Brief will look like.</p>
          <p>Your actual brief will include personalized insights from your connected accounts.</p>
        </div>
      </div>
    </div>
  );
}
