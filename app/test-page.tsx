// Simple test page to verify routing
// Access at: http://localhost:3000/test-page

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Test Page</h1>
        <p className="text-gray-600">If you can see this, routing is working!</p>
        <div className="mt-6 p-4 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-700">
            Current time: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}
