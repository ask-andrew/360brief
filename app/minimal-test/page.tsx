// Minimal test page to verify routing
// Access at: http://localhost:3000/minimal-test

export default function MinimalTest() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f3f4f6',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '600px',
        width: '100%'
      }}>
        <h1 style={{ 
          fontSize: '24px', 
          marginBottom: '20px',
          color: '#111827'
        }}>
          🎉 Minimal Test Page
        </h1>
        <p style={{ 
          color: '#4b5563',
          marginBottom: '30px',
          lineHeight: '1.6'
        }}>
          If you can see this message, your Next.js routing is working correctly!
        </p>
        <div style={{
          backgroundColor: '#f0fdf4',
          padding: '12px',
          borderRadius: '6px',
          borderLeft: '4px solid #10b981',
          textAlign: 'left'
        }}>
          <p style={{ 
            margin: '0',
            fontSize: '14px',
            color: '#065f46',
            fontFamily: 'monospace'
          }}>
            Current time: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}
