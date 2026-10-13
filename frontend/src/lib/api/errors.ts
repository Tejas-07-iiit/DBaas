export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string[]>;

  constructor(status: number, message: string, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.name = 'ApiError';
  }

  static fromStatus(status: number, data?: any): ApiError {
    let message = data?.message || "Something went wrong on our side. Try again.";
    
    if (status === 0) {
      message = "Can't reach the server. Check NEXT_PUBLIC_API_BASE_URL in .env.local and that the backend is running.";
    } else if (status === 401) {
      message = "Incorrect email or password";
    } else if (status === 409) {
      message = "An account with this email already exists";
    } else if (status === 429) {
      message = "Too many attempts. Please wait a minute.";
    } else if (status >= 500) {
      message = "Something went wrong on our side. Try again.";
    }

    return new ApiError(status, message, data?.errors || data?.fieldErrors);
  }
}
