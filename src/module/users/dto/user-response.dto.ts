import { createZodDto } from 'nestjs-zod';
import { USER_ROLES } from 'src/module/users/constants';
import z from 'zod';

export const UserResponseSchema = z.object({
  id: z.uuidv7(),
  companyId: z.uuidv7(),
  officeId: z.uuidv7().nullable(),
  departmentId: z.uuidv7().nullable(),
  scheduleId: z.uuidv7().nullable(),
  employeeCode: z.string().min(2).max(50).nullable(),
  fullName: z.string().min(2).max(100),
  username: z.string().min(2).max(50),
  email: z.email(),
  role: z.enum(USER_ROLES),
  profileUrl: z.string().nullable(),
  phone: z.string().min(10).max(15).nullable(),
  jobTitle: z.string().min(2).max(100).nullable(),
  isFlexible: z.boolean(),
  joinedAt: z.date(),
  createdAt: z.date(),
});

export class UserResponseDto extends createZodDto(UserResponseSchema) {}
