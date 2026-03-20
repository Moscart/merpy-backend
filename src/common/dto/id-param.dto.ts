import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const IdParamSchema = z.object({
  id: z.uuidv7(),
});

export class IdParamDto extends createZodDto(IdParamSchema) {}
