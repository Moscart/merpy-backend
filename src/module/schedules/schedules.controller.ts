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
import { CreateScheduleDto } from './dto/create-schedule.dto';
import {
  SchedulePaginationResponseSchema,
  ScheduleQueryDto,
} from './dto/pagination.dto';
import { ScheduleResponseDto } from './dto/schedule-response.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { SchedulesService } from './schedules.service';

@Controller('schedules')
@UseGuards(RolesGuard)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  @Roles('OWNER', 'HR')
  @ZodSerializerDto(ScheduleResponseDto)
  create(
    @Body() createScheduleDto: CreateScheduleDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.schedulesService.create(user.companyId, createScheduleDto);
  }

  @Get()
  @Roles('OWNER', 'HR')
  @ZodSerializerDto(SchedulePaginationResponseSchema)
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ScheduleQueryDto
  ) {
    return this.schedulesService.findAll(user.companyId, query);
  }

  @Get(':id')
  @Roles('OWNER', 'HR')
  @ZodSerializerDto(ScheduleResponseDto)
  findOne(@Param() params: IdParamDto, @CurrentUser() user: AuthenticatedUser) {
    return this.schedulesService.findOne(user.companyId, params.id);
  }

  @Patch(':id')
  @Roles('OWNER', 'HR')
  @ZodSerializerDto(ScheduleResponseDto)
  update(
    @Param() params: IdParamDto,
    @Body() updateScheduleDto: UpdateScheduleDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.schedulesService.update(
      user.companyId,
      params.id,
      updateScheduleDto
    );
  }

  @Delete(':id')
  @Roles('OWNER', 'HR')
  remove(@Param() params: IdParamDto, @CurrentUser() user: AuthenticatedUser) {
    return this.schedulesService.remove(user.companyId, params.id);
  }
}
