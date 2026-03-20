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
import { IdParamDto } from 'src/common/dto/id-param.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.type';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { DepartmentResponseDto } from './dto/department-response.dto';
import {
  DepartmentPaginationResponseSchema,
  DepartmentQueryDto,
} from './dto/pagination.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Controller('departments')
@UseGuards(RolesGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @Roles('OWNER', 'HR')
  @ZodSerializerDto(DepartmentResponseDto)
  create(
    @Body() createDepartmentDto: CreateDepartmentDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.departmentsService.create(user.companyId, createDepartmentDto);
  }

  @Get()
  @Roles('OWNER', 'HR')
  @ZodSerializerDto(DepartmentPaginationResponseSchema)
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: DepartmentQueryDto
  ) {
    return this.departmentsService.findAll(user.companyId, query);
  }

  @Get(':id')
  @Roles('OWNER', 'HR')
  @ZodSerializerDto(DepartmentResponseDto)
  findOne(@Param() params: IdParamDto, @CurrentUser() user: AuthenticatedUser) {
    return this.departmentsService.findOne(user.companyId, params.id);
  }

  @Patch(':id')
  @Roles('OWNER', 'HR')
  @ZodSerializerDto(DepartmentResponseDto)
  update(
    @Param() params: IdParamDto,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.departmentsService.update(
      user.companyId,
      params.id,
      updateDepartmentDto
    );
  }

  @Delete(':id')
  @Roles('OWNER', 'HR')
  remove(@Param() params: IdParamDto, @CurrentUser() user: AuthenticatedUser) {
    return this.departmentsService.remove(user.companyId, params.id);
  }
}
