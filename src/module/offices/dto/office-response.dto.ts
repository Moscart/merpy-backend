import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const OfficeResponseSchema = z.object({
  id: z.uuidv7(),
  companyId: z.uuidv7(),
  picId: z.uuidv7().nullable(),
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(50),
  address: z.string().max(255).nullable(),
  contactNumber: z.string().min(10).max(15).nullable(),
  lat: z.string(),
  lng: z.string(),
  radius: z.number().int().min(1),
  timezone: z.string().min(1).max(100),
  isActive: z.boolean(),
  createdAt: z.date(),
});

export class OfficeResponseDto extends createZodDto(OfficeResponseSchema) {}
