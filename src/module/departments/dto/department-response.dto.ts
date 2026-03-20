import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const DepartmentResponseSchema = z.object({
  id: z.uuidv7(),
  companyId: z.uuidv7(),
  code: z.string().min(2).max(50).nullable(),
  name: z.string().min(2).max(100),
  description: z.string().max(255).nullable(),
  managerId: z.uuidv7(),
  createdAt: z.date(),
});

export class DepartmentResponseDto extends createZodDto(
  DepartmentResponseSchema
) {}
