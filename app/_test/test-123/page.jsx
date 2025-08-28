// Simple test page in a new directory with .jsx extension
'use client';

export default function Test123() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#1a1a1a',
      color: '#fff',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#4ade80'
        }}>
          Test 123
        </h1>
        <p style={{ fontSize: '1.25rem' }}>
          If you see this, routing is working!
        </p>
        <p style={{
          marginTop: '2rem',
          fontFamily: 'monospace',
          color: '#94a3b8',
          fontSize: '0.875rem'
        }}>
          Loaded at: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
