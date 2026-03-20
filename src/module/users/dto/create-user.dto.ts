import { createZodDto } from 'nestjs-zod';
import { USER_ROLES } from 'src/module/users/constants';
import z from 'zod';

const USERNAME_CODE_REGEX = /^[a-z0-9]+(?:[-_.][a-z0-9]+)*$/;

export const CreateUserSchema = z.object({
  officeId: z.uuidv7().optional(),
  departmentId: z.uuidv7(),
  scheduleId: z.uuidv7().optional(),
  employeeCode: z.string().trim().min(2).max(50).nullable().optional(),
  fullName: z.string().trim().min(2).max(100),
  username: z.string().trim().min(2).max(50).regex(USERNAME_CODE_REGEX, {
    message:
      'Username must be lowercase, can include numbers, and may contain hyphens, underscores, or dots (but not consecutively or at the start/end).',
  }),
  email: z.email(),
  password: z.string().min(8).max(100),
  role: z.enum(USER_ROLES).default('STAFF'),
  profileUrl: z.string().nullable().optional(),
  phone: z.string().min(10).max(15).nullable().optional(),
  jobTitle: z.string().min(2).max(100).nullable().optional(),
  isFlexible: z.boolean().default(false),
  joinedAt: z.coerce.date(),
});

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
