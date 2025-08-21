'use client';

export default function AuthCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-4 rounded-lg bg-white p-8 text-center shadow-sm">
        <div className="flex justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900"></div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Just a moment</h2>
        <p className="text-gray-600">We're finalizing your sign in and will redirect you shortly.</p>
      </div>
    </div>
  );
}
