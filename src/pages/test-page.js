// src/pages/test-page.js
export default function TestPage() {
    return (
      <div style={{
        padding: '2rem',
        fontFamily: 'system-ui, sans-serif',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h1>Pages Router Test</h1>
        <p>If you can see this, the Pages Router is working!</p>
        <p>Current time: {new Date().toLocaleTimeString()}</p>
      </div>
    );
  }