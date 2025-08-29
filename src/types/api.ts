// API Response types
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Error types
export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
}