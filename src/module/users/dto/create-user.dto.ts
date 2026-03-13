import { createZodDto } from 'nestjs-zod';
import { USER_ROLES } from 'src/module/users/constants';
import z from 'zod';

export const CreateUserSchema = z.object({
  officeId: z.uuidv7().optional(),
  departmentId: z.uuidv7().optional(),
  scheduleId: z.uuidv7().optional(),
  employeeCode: z.string().min(2).max(50).optional(),
  fullName: z.string().min(2).max(100),
  username: z.string().min(2).max(50),
  email: z.email(),
  password: z.string().min(8).max(100),
  role: z.enum(USER_ROLES).default('STAFF'),
  profileUrl: z.string().optional(),
  phone: z.string().min(10).max(15).optional(),
  jobTitle: z.string().min(2).max(100).optional(),
  isFlexible: z.boolean().default(false),
  joinedAt: z.coerce.date(),
});

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
