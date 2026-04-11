import { createZodDto } from 'nestjs-zod';
import { CreateOfficeSchema } from './create-office.dto';

export const UpdateOfficeSchema = CreateOfficeSchema.partial().strict();

export class UpdateOfficeDto extends createZodDto(UpdateOfficeSchema) {}
