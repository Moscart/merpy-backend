import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const RegisterSchema = z.object({
  companyName: z.string().min(2).max(100),
  companyCode: z.string().min(2).max(50),
  fullName: z.string().min(2).max(100),
  username: z.string().min(2).max(50),
  email: z.email(),
  password: z.string().min(8).max(100),
});

export class RegisterDto extends createZodDto(RegisterSchema) {}

export type RegisterInput = z.infer<typeof RegisterSchema>;
