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
import { CreateOfficeDto } from './dto/create-office.dto';
import {
  OfficePaginationResponseSchema,
  OfficeQueryDto,
} from './dto/pagination.dto';
import { OfficeResponseDto } from './dto/office-response.dto';
import { UpdateOfficeDto } from './dto/update-office.dto';
import { OfficesService } from './offices.service';

@Controller('offices')
@UseGuards(RolesGuard)
export class OfficesController {
  constructor(private readonly officesService: OfficesService) {}

  @Post()
  @Roles('OWNER', 'HR')
  @ZodSerializerDto(OfficeResponseDto)
  create(
    @Body() createOfficeDto: CreateOfficeDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.officesService.create(user.companyId, createOfficeDto);
  }

  @Get()
  @Roles('OWNER', 'HR')
  @ZodSerializerDto(OfficePaginationResponseSchema)
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: OfficeQueryDto
  ) {
    return this.officesService.findAll(user.companyId, query);
  }

  @Get(':id')
  @Roles('OWNER', 'HR')
  @ZodSerializerDto(OfficeResponseDto)
  findOne(@Param() params: IdParamDto, @CurrentUser() user: AuthenticatedUser) {
    return this.officesService.findOne(user.companyId, params.id);
  }

  @Patch(':id')
  @Roles('OWNER', 'HR')
  @ZodSerializerDto(OfficeResponseDto)
  update(
    @Param() params: IdParamDto,
    @Body() updateOfficeDto: UpdateOfficeDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.officesService.update(
      user.companyId,
      params.id,
      updateOfficeDto
    );
  }

  @Delete(':id')
  @Roles('OWNER', 'HR')
  remove(@Param() params: IdParamDto, @CurrentUser() user: AuthenticatedUser) {
    return this.officesService.remove(user.companyId, params.id);
  }
}
