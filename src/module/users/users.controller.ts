import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.type';
import { CreateUserDto } from './dto/create-user.dto';
import {
  UserPaginationResponseSchema,
  UserQueryDto,
} from './dto/pagination.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('OWNER', 'HR')
  @ZodSerializerDto(UserResponseDto)
  create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.usersService.create(user.companyId, createUserDto);
  }

  @Get()
  @Roles('OWNER', 'HR')
  @ZodSerializerDto(UserPaginationResponseSchema)
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: UserQueryDto
  ) {
    return this.usersService.findAll(user.companyId, query);
  }

  @Get(':id')
  @Roles('OWNER', 'HR')
  @ZodSerializerDto(UserResponseDto)
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findOne(user.companyId, id);
  }

  @Patch(':id')
  @Roles('OWNER', 'HR')
  @ZodSerializerDto(UserResponseDto)
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.usersService.update(user.companyId, id, updateUserDto);
  }

  @Delete(':id')
  @Roles('OWNER', 'HR')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.remove(user.companyId, id);
  }
}
