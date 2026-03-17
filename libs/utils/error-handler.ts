/**
 * API Error Handler Utility
 * Provides consistent error handling and user-friendly messages across the application
 */

export interface ApiErrorResponse {
  message: string;
  status_code: number;
  errors?: Record<string, string[]>;
}

export interface ErrorHandlerOptions {
  defaultMessage?: string;
  customMessages?: Record<number, string>;
}

/**
 * Extract and format error message from API response
 * @param error - The error object from axios or API response
 * @param options - Optional configuration for error messages
 * @returns User-friendly error message
 */
export function handleApiError(error: any, options: ErrorHandlerOptions = {}): string {
  const {
    defaultMessage = "Đã xảy ra lỗi. Vui lòng thử lại sau",
    customMessages = {},
  } = options;

  // If error is from axios response
  if (error.response) {
    const statusCode = error.response.data?.status_code || error.response.status;
    const message = error.response.data?.message;

    // Check custom messages first
    if (customMessages[statusCode]) {
      return customMessages[statusCode];
    }

    // Return API message if available
    if (message) {
      return message;
    }

    // Default messages based on status code
    switch (statusCode) {
      case 400:
        return "Thông tin không hợp lệ. Vui lòng kiểm tra lại";
      case 401:
        return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại";
      case 403:
        return "Bạn không có quyền thực hiện thao tác này";
      case 404:
        return "Không tìm thấy tài nguyên yêu cầu";
      case 409:
        return "Dữ liệu đã tồn tại";
      case 422:
        return "Dữ liệu không hợp lệ";
      case 429:
        return "Quá nhiều yêu cầu. Vui lòng thử lại sau";
      case 500:
      case 502:
      case 503:
      case 504:
        return "Lỗi server. Vui lòng thử lại sau";
      default:
        return defaultMessage;
    }
  }

  // If request was made but no response
  if (error.request) {
    return "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng";
  }

  // Something else happened
  return error.message || defaultMessage;
}

/**
 * Handle authentication errors specifically
 * @param error - The error object
 * @returns User-friendly error message for auth errors
 */
export function handleAuthError(error: any): string {
  if (error.response) {
    const statusCode = error.response.data?.status_code || error.response.status;
    const message = error.response.data?.message || '';
    const errors = error.response.data?.errors;

    // Handle validation errors with field-specific messages
    if (errors && typeof errors === 'object') {
      const errorMessages = Object.values(errors).flat();
      if (errorMessages.length > 0) {
        return errorMessages[0] as string;
      }
    }

    // Check for specific error messages (with null safety)
    const msgLower = message && typeof message === 'string' ? message.toLowerCase() : '';
    
    if (msgLower && (msgLower.includes('email/phone') || msgLower.includes('password'))) {
      return "Email hoặc mật khẩu không đúng";
    }
    

    if (msgLower && (msgLower.includes('not found') || msgLower.includes('không tìm thấy'))) {
      return "Không tìm thấy tài khoản";
    }

    // Return API message if available
    if (message) {
      return message;
    }

    // Status code based messages
    switch (statusCode) {
      case 400:
        return "Thông tin đăng nhập không hợp lệ";
      case 401:
        return "Email hoặc mật khẩu không đúng";
      case 403:
        return "Tài khoản của bạn đã bị khóa";
      case 404:
        return "Không tìm thấy tài khoản";
      case 409:
        return "Tài khoản đã tồn tại";
      default:
        return "Đã xảy ra lỗi trong quá trình xác thực";
    }
  }

  // Handle network errors
  if (error.request && !error.response) {
    return "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng";
  }

  // Handle other errors
  return error.message || "Đã xảy ra lỗi trong quá trình xác thực";
}

/**
 * Handle registration errors specifically
 * @param error - The error object
 * @returns User-friendly error message for registration errors
 */
export function handleRegistrationError(error: any): string {
  // Handle direct API response errors
  if (error.response) {
    const statusCode = error.response.data?.status_code || error.response.status;
    const message = error.response.data?.message || '';
    const errors = error.response.data?.errors;

    // Handle validation errors with field-specific messages
    if (errors && typeof errors === 'object') {
      const errorMessages = Object.values(errors).flat();
      if (errorMessages.length > 0) {
        return errorMessages[0] as string;
      }
    }

    // Check for specific duplicate errors
    if (message.toLowerCase().includes('phone') || message.toLowerCase().includes('số điện thoại')) {
      return "Số điện thoại này đã được đăng ký. Vui lòng sử dụng số điện thoại khác";
    }
    
    if (message.toLowerCase().includes('email')) {
      return "Email này đã được đăng ký. Vui lòng sử dụng email khác";
    }

    if (message.toLowerCase().includes('already exists') || message.toLowerCase().includes('đã tồn tại')) {
      return "Tài khoản đã tồn tại. Vui lòng sử dụng thông tin khác";
    }

    // Return specific API message if available
    if (message) {
      return message;
    }

    // Handle by status code
    switch (statusCode) {
      case 400:
        return "Thông tin đăng ký không hợp lệ. Vui lòng kiểm tra lại";
      case 409:
        return "Tài khoản đã tồn tại. Vui lòng sử dụng thông tin khác";
      case 422:
        return "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin";
      default:
        return "Đã xảy ra lỗi trong quá trình đăng ký. Vui lòng thử lại";
    }
  }

  // Handle network errors
  if (error.request && !error.response) {
    return "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng";
  }

  // Handle other errors
  return error.message || "Đã xảy ra lỗi trong quá trình đăng ký. Vui lòng thử lại";
}

/**
 * Check if error is a network error
 * @param error - The error object
 * @returns True if it's a network error
 */
export function isNetworkError(error: any): boolean {
  return error.request && !error.response;
}

/**
 * Check if error is a server error (5xx)
 * @param error - The error object
 * @returns True if it's a server error
 */
export function isServerError(error: any): boolean {
  const statusCode = error.response?.data?.status_code || error.response?.status;
  return statusCode >= 500 && statusCode < 600;
}

/**
 * Check if error is a validation error (400 or 422)
 * @param error - The error object
 * @returns True if it's a validation error
 */
export function isValidationError(error: any): boolean {
  const statusCode = error.response?.data?.status_code || error.response?.status;
  return statusCode === 400 || statusCode === 422;
}
