export const USER_ROLES = ['OWNER', 'HR', 'MANAGER', 'STAFF'] as const;

export const USER_STATUS = ['PENDING', 'ACTIVE', 'INACTIVE'] as const;

export const USER_SORT_BY = [
  'fullName',
  'username',
  'email',
  'employeeCode',
  'createdAt',
] as const;
