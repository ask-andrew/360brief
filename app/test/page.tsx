'use client';

export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Page</h1>
      <p>If you can see this, Next.js is working correctly.</p>
      <div className="mt-4 p-4 bg-blue-100 rounded">
        <p>Server is running on port 3001</p>
        <p>Time: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
}
