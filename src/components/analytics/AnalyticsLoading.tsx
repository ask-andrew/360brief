/**
 * Analytics Loading Component
 * Beautiful loading state for the analytics dashboard
 */

export function AnalyticsLoading() {
  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8">
      {/* Header Skeleton */}
      <div className="space-y-4">
        <div className="h-10 bg-gradient-to-r from-purple-200 to-pink-200 rounded-lg w-1/3 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
      </div>

      {/* Key Metrics Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-lg animate-pulse" />
        ))}
      </div>

      {/* Level 10 Insights Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-80 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-lg animate-pulse" />
        ))}
      </div>

      {/* Large Card Skeleton */}
      <div className="h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-lg animate-pulse" />

      {/* Loading Text */}
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          <p className="text-lg text-muted-foreground">Loading your analytics...</p>
        </div>
      </div>
    </div>
  );
}
