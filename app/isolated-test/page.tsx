// Isolated test page with no dependencies
'use client';

export default function IsolatedTest() {
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
      backgroundColor: '#f0f9ff',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '16px',
      lineHeight: '1.5'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        maxWidth: '600px',
        width: '100%',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#0369a1'
        }}>
          🚀 Test Successful!
        </h1>
        <p style={{ marginBottom: '1.5rem', color: '#334155' }}>
          If you can see this message, Next.js routing is working correctly!
        </p>
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '1rem',
          borderRadius: '0.375rem',
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          color: '#0f172a',
          marginTop: '1.5rem',
          textAlign: 'left'
        }}>
          <div>Route: /isolated-test</div>
          <div>Time: {new Date().toLocaleTimeString()}</div>
        </div>
      </div>
    </div>
  );
}
