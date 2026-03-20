import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const LoginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, 'Username must be at least 2 characters long')
    .max(50, 'Username must be at most 50 characters long'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(100, 'Password must be at most 100 characters long'),
});

export class LoginDto extends createZodDto(LoginSchema) {}

export type LoginInput = z.infer<typeof LoginSchema>;
