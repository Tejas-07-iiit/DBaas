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
    let message = "";
    if (typeof data?.message === "string") {
      message = data.message;
    } else if (Array.isArray(data?.message)) {
      message = data.message.join(", ");
    } else if (data?.error && typeof data.error === "string") {
      message = data.error;
    }

    if (!message) {
      if (status === 0) {
        message = "Can't reach the server. Check NEXT_PUBLIC_API_BASE_URL in .env.local and that the backend is running.";
      } else if (status === 401) {
        message = "Unauthorized. Please log in again.";
      } else if (status === 403) {
        message = "Forbidden. You do not have permission for this action.";
      } else if (status === 404) {
        message = "Resource not found.";
      } else if (status === 409) {
        message = "A conflict occurred with an existing resource.";
      } else if (status === 429) {
        message = "Too many attempts. Please wait a minute.";
      } else if (status >= 500) {
        message = "Something went wrong on our side. Try again.";
      } else {
        message = "An unexpected error occurred.";
      }
    }

    return new ApiError(status, message, data?.errors || data?.fieldErrors);
  }
}
