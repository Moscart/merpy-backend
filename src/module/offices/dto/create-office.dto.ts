import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const CreateOfficeSchema = z.object({
  picId: z.uuidv7().nullable().optional(),
  name: z.string().trim().min(2).max(100),
  code: z.string().trim().min(2).max(50),
  address: z.string().trim().max(255).nullable().optional(),
  contactNumber: z.string().trim().min(10).max(15).nullable().optional(),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().int().min(1).max(100000),
  timezone: z.string().trim().min(1).max(100).default('Asia/Jakarta'),
  isActive: z.boolean().default(true),
});

export class CreateOfficeDto extends createZodDto(CreateOfficeSchema) {}
