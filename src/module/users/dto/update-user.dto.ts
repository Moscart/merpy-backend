import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import { USER_ROLES } from '../constants';
import { CreateUserSchema } from './create-user.dto';

export const UpdateUserSchema = CreateUserSchema.extend({
  role: z.enum(USER_ROLES),
  isFlexible: z.boolean(),
})
  .partial()
  .strict();

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
