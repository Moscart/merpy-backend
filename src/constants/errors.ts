export const ERRORS = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid credentials',
  USER_NOT_FOUND: 'User not found',
  SESSION_NOT_FOUND: 'Session not found',
  INVALID_TOKEN: 'Token is invalid or expired',
  INVALID_TOKEN_TYPE: 'Invalid token type',
  INVALID_REFRESH_TOKEN: 'Refresh token is invalid or expired',
  REQUEST_USER_NOT_FOUND: 'User not found in request',
  REQUEST_PAYLOAD_NOT_FOUND: 'Payload not found in request',

  // Authorization
  UNAUTHENTICATED: 'User not authenticated',
  UNAUTHORIZED: 'You are not authorized to access this resource',

  // Register
  COMPANY_ALREADY_EXISTS: 'Company with this code already exists',
  USERNAME_ALREADY_EXISTS: 'User with this username already exists',
  EMAIL_ALREADY_EXISTS: 'User with this email already exists',
  EMPLOYEE_CODE_ALREADY_EXISTS: 'User with this employee code already exists',

  // Departments
  MANAGER_NOT_FOUND: 'Manager not found',
  DEPARTMENT_CODE_ALREADY_EXISTS: 'Department with this code already exists',
  DEPARTMENT_NOT_FOUND: 'Department not found',

  // Offices
  PIC_NOT_FOUND: 'Person in charge not found',
  OFFICE_CODE_ALREADY_EXISTS: 'Office with this code already exists',
  OFFICE_NOT_FOUND: 'Office not found',

  // Schedules
  SCHEDULE_NOT_FOUND: 'Schedule not found',
  SCHEDULE_IN_USE: 'Schedule is still in use and cannot be deleted',

  // Special Dates
  SPECIAL_DATE_NOT_FOUND: 'Special date not found',
  SPECIAL_DATE_ALREADY_EXISTS: 'Special date already exists',
  INVALID_SPECIAL_DATE_TIME_CONFIGURATION:
    'Invalid special date time configuration',
};
