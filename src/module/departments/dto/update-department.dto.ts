import { createZodDto } from 'nestjs-zod';
import { CreateDepartmentSchema } from './create-department.dto';

export const UpdateDepartmentSchema = CreateDepartmentSchema.partial().strict();

export class UpdateDepartmentDto extends createZodDto(UpdateDepartmentSchema) {}
