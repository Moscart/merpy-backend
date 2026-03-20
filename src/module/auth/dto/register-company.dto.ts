import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const COMPANY_CODE_REGEX = /^[a-z0-9]+(?:[-_.][a-z0-9]+)*$/;

export const RegisterSchema = z.object({
  companyName: z.string().trim().min(2).max(100),
  companyCode: z.string().trim().min(2).max(50).regex(COMPANY_CODE_REGEX, {
    message:
      'Company code must be lowercase, can include numbers, and may contain hyphens, underscores, or dots (but not consecutively or at the start/end).',
  }),
  fullName: z.string().trim().min(2).max(100),
  username: z.string().trim().min(2).max(50),
  email: z.email(),
  password: z.string().min(8).max(100),
});

export class RegisterDto extends createZodDto(RegisterSchema) {}

export type RegisterInput = z.infer<typeof RegisterSchema>;
