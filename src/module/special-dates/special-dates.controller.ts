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
import { SpecialDatesService } from 'src/module/special-dates/special-dates.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.type';
import { CreateSpecialDateDto } from './dto/create-special-date.dto';
import {
  SpecialDatePaginationResponseSchema,
  SpecialDateQueryDto,
} from './dto/pagination.dto';
import { SpecialDateResponseDto } from './dto/special-date-response.dto';
import { UpdateSpecialDateDto } from './dto/update-special-date.dto';

@Controller('special-dates')
@UseGuards(RolesGuard)
export class SpecialDatesController {
  constructor(private readonly specialDatesService: SpecialDatesService) {}

  @Post()
  @Roles('OWNER', 'HR')
  @ZodSerializerDto(SpecialDateResponseDto)
  create(
    @Body() createSpecialDateDto: CreateSpecialDateDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.specialDatesService.create(
      user.companyId,
      createSpecialDateDto
    );
  }

  @Get()
  @Roles('OWNER', 'HR')
  @ZodSerializerDto(SpecialDatePaginationResponseSchema)
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SpecialDateQueryDto
  ) {
    return this.specialDatesService.findAll(user.companyId, query);
  }

  @Get(':id')
  @Roles('OWNER', 'HR')
  @ZodSerializerDto(SpecialDateResponseDto)
  findOne(@Param() params: IdParamDto, @CurrentUser() user: AuthenticatedUser) {
    return this.specialDatesService.findOne(user.companyId, params.id);
  }

  @Patch(':id')
  @Roles('OWNER', 'HR')
  @ZodSerializerDto(SpecialDateResponseDto)
  update(
    @Param() params: IdParamDto,
    @Body() updateSpecialDateDto: UpdateSpecialDateDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.specialDatesService.update(
      user.companyId,
      params.id,
      updateSpecialDateDto
    );
  }

  @Delete(':id')
  @Roles('OWNER', 'HR')
  remove(@Param() params: IdParamDto, @CurrentUser() user: AuthenticatedUser) {
    return this.specialDatesService.remove(user.companyId, params.id);
  }
}
