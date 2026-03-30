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

const NETWORK_STATUS_CODE = 0;

const DEFAULT_ERROR_MESSAGES: Record<number, string> = {
  [NETWORK_STATUS_CODE]: "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng",
  400: "Thông tin không hợp lệ. Vui lòng kiểm tra lại",
  401: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại",
  403: "Bạn không có quyền thực hiện thao tác này",
  404: "Không tìm thấy tài nguyên yêu cầu",
  409: "Dữ liệu đã tồn tại",
  422: "Dữ liệu không hợp lệ",
  429: "Quá nhiều yêu cầu. Vui lòng thử lại sau",
  500: "Lỗi server. Vui lòng thử lại sau",
  502: "Lỗi server. Vui lòng thử lại sau",
  503: "Lỗi server. Vui lòng thử lại sau",
  504: "Lỗi server. Vui lòng thử lại sau",
};

const AUTH_ERROR_MESSAGES: Record<number, string> = {
  [NETWORK_STATUS_CODE]: "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng",
  400: "Thông tin đăng nhập không hợp lệ",
  401: "Email hoặc mật khẩu không đúng",
  403: "Tài khoản của bạn đã bị khóa",
  404: "Không tìm thấy tài khoản",
  409: "Tài khoản đã tồn tại",
};

const REGISTRATION_ERROR_MESSAGES: Record<number, string> = {
  [NETWORK_STATUS_CODE]: "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng",
  400: "Thông tin đăng ký không hợp lệ. Vui lòng kiểm tra lại",
  409: "Tài khoản đã tồn tại. Vui lòng sử dụng thông tin khác",
  422: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin",
};

function getStatusCode(error: any): number | undefined {
  if (!error) {
    return undefined;
  }

  if (error.response) {
    return error.response.data?.status_code || error.response.status;
  }

  if (error.request) {
    return NETWORK_STATUS_CODE;
  }

  return undefined;
}

function getMessageByStatusCode(
  statusCode: number | undefined,
  messages: Record<number, string>,
  fallbackMessage: string
): string {
  if (typeof statusCode === "number" && messages[statusCode]) {
    return messages[statusCode];
  }

  return fallbackMessage;
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
  const statusCode = getStatusCode(error);

  if (typeof statusCode === "number" && customMessages[statusCode]) {
    return customMessages[statusCode];
  }

  return getMessageByStatusCode(statusCode, DEFAULT_ERROR_MESSAGES, defaultMessage);
}

/**
 * Handle authentication errors specifically
 * @param error - The error object
 * @returns User-friendly error message for auth errors
 */
export function handleAuthError(error: any): string {
  const statusCode = getStatusCode(error);
  return getMessageByStatusCode(statusCode, AUTH_ERROR_MESSAGES, "Đã xảy ra lỗi trong quá trình xác thực");
}

/**
 * Handle registration errors specifically
 * @param error - The error object
 * @returns User-friendly error message for registration errors
 */
export function handleRegistrationError(error: any): string {
  const statusCode = getStatusCode(error);
  return getMessageByStatusCode(
    statusCode,
    REGISTRATION_ERROR_MESSAGES,
    "Đã xảy ra lỗi trong quá trình đăng ký. Vui lòng thử lại"
  );
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
  const statusCode = getStatusCode(error);
  return typeof statusCode === "number" && statusCode >= 500 && statusCode < 600;
}

/**
 * Check if error is a validation error (400 or 422)
 * @param error - The error object
 * @returns True if it's a validation error
 */
export function isValidationError(error: any): boolean {
  const statusCode = getStatusCode(error);
  return statusCode === 400 || statusCode === 422;
}
