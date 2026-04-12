import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/common/database/prisma.service';
import { ERRORS } from 'src/constants/errors';
import { CreateSpecialDateDto } from './dto/create-special-date.dto';
import { SpecialDateQueryDto } from './dto/pagination.dto';
import { UpdateSpecialDateDto } from './dto/update-special-date.dto';

type CreateSpecialDatePayload = {
  scheduleId?: string | null;
  date: Date;
  name: string;
  isOff: boolean;
  clockIn?: string | null;
  clockOut?: string | null;
};

type UpdateSpecialDatePayload = Partial<CreateSpecialDatePayload>;

type SpecialDateQueryPayload = {
  page: number;
  perPage: number;
  search?: string;
  sortBy: 'date' | 'name' | 'isOff';
  sortOrder: 'asc' | 'desc';
  isOff?: 'true' | 'false';
};

@Injectable()
export class SpecialDatesService {
  constructor(private readonly prismaService: PrismaService) {}

  private defaultSelect: Prisma.SpecialDatesSelect = {
    id: true,
    companyId: true,
    scheduleId: true,
    date: true,
    name: true,
    isOff: true,
    clockIn: true,
    clockOut: true,
  };

  private toTimeDateTime(time: string): string {
    const normalizedTime = time.length === 5 ? `${time}:00` : time;
    return `1970-01-01T${normalizedTime}Z`;
  }

  private normalizeDate(date: Date): Date {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
    );
  }

  private parseIsOffQuery(isOff?: 'true' | 'false'): boolean | undefined {
    if (isOff === undefined) {
      return undefined;
    }

    return isOff === 'true';
  }

  private validateTimeConfiguration(
    isOff: boolean,
    clockIn: Date | string | null | undefined,
    clockOut: Date | string | null | undefined
  ) {
    const hasClockIn = clockIn !== null && clockIn !== undefined;
    const hasClockOut = clockOut !== null && clockOut !== undefined;

    if (isOff && (hasClockIn || hasClockOut)) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: Object.keys(ERRORS).find(
          (key) =>
            ERRORS[key] === ERRORS.INVALID_SPECIAL_DATE_TIME_CONFIGURATION
        ),
        message: ERRORS.INVALID_SPECIAL_DATE_TIME_CONFIGURATION,
      });
    }

    if (!isOff && (!hasClockIn || !hasClockOut)) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: Object.keys(ERRORS).find(
          (key) =>
            ERRORS[key] === ERRORS.INVALID_SPECIAL_DATE_TIME_CONFIGURATION
        ),
        message: ERRORS.INVALID_SPECIAL_DATE_TIME_CONFIGURATION,
      });
    }
  }

  private async validateSchedule(companyId: string, scheduleId: string) {
    const schedule = await this.prismaService.schedules.findFirst({
      where: {
        id: scheduleId,
        companyId,
      },
    });

    if (!schedule) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: Object.keys(ERRORS).find(
          (key) => ERRORS[key] === ERRORS.SCHEDULE_NOT_FOUND
        ),
        message: ERRORS.SCHEDULE_NOT_FOUND,
      });
    }
  }

  private async validateDuplicate(
    companyId: string,
    scheduleId: string | null,
    date: Date,
    excludedId?: string
  ) {
    const specialDate = await this.prismaService.specialDates.findFirst({
      where: {
        companyId,
        scheduleId,
        date,
        ...(excludedId
          ? {
              NOT: {
                id: excludedId,
              },
            }
          : {}),
      },
    });

    if (specialDate) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: Object.keys(ERRORS).find(
          (key) => ERRORS[key] === ERRORS.SPECIAL_DATE_ALREADY_EXISTS
        ),
        message: ERRORS.SPECIAL_DATE_ALREADY_EXISTS,
      });
    }
  }

  async create(companyId: string, createSpecialDateDto: CreateSpecialDateDto) {
    const payload = createSpecialDateDto as CreateSpecialDatePayload;
    const normalizedDate = this.normalizeDate(payload.date);
    const scheduleId = payload.scheduleId ?? null;

    if (scheduleId) {
      await this.validateSchedule(companyId, scheduleId);
    }

    this.validateTimeConfiguration(
      payload.isOff,
      payload.clockIn,
      payload.clockOut
    );
    await this.validateDuplicate(companyId, scheduleId, normalizedDate);

    const specialDate = await this.prismaService.specialDates.create({
      data: {
        companyId,
        scheduleId,
        date: normalizedDate,
        name: payload.name,
        isOff: payload.isOff,
        clockIn:
          payload.isOff || payload.clockIn == null
            ? null
            : this.toTimeDateTime(payload.clockIn),
        clockOut:
          payload.isOff || payload.clockOut == null
            ? null
            : this.toTimeDateTime(payload.clockOut),
      },
      select: this.defaultSelect,
    });

    return specialDate;
  }

  async findAll(companyId: string, query: SpecialDateQueryDto) {
    const payload = query as SpecialDateQueryPayload;
    const { page, perPage, search, sortBy, sortOrder, isOff } = payload;
    const skip = (page - 1) * perPage;

    const where: Prisma.SpecialDatesWhereInput = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const parsedIsOff = this.parseIsOffQuery(isOff);
    if (typeof parsedIsOff === 'boolean') {
      where.isOff = parsedIsOff;
    }

    const activeFilters: {
      search?: string;
      isOff?: boolean;
    } = {};

    if (search) {
      activeFilters.search = search;
    }

    if (typeof parsedIsOff === 'boolean') {
      activeFilters.isOff = parsedIsOff;
    }

    const orderBy: Prisma.SpecialDatesOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [specialDates, total] = await this.prismaService.$transaction([
      this.prismaService.specialDates.findMany({
        where: {
          companyId,
          ...where,
        },
        select: this.defaultSelect,
        skip,
        take: perPage,
        orderBy,
      }),
      this.prismaService.specialDates.count({
        where: {
          companyId,
          ...where,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / perPage);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      data: specialDates,
      meta: {
        total,
        page,
        perPage,
        totalPages,
        hasNextPage,
        hasPrevPage,
        activeFilters,
        activeSort: {
          sortBy,
          sortOrder,
        },
      },
    };
  }

  async findOne(companyId: string, id: string) {
    const specialDate = await this.prismaService.specialDates.findFirst({
      where: { id, companyId },
      select: this.defaultSelect,
    });

    if (!specialDate) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: Object.keys(ERRORS).find(
          (key) => ERRORS[key] === ERRORS.SPECIAL_DATE_NOT_FOUND
        ),
        message: ERRORS.SPECIAL_DATE_NOT_FOUND,
      });
    }

    return specialDate;
  }

  async update(
    companyId: string,
    id: string,
    updateSpecialDateDto: UpdateSpecialDateDto
  ) {
    const payload = updateSpecialDateDto as UpdateSpecialDatePayload;

    const specialDate = await this.prismaService.specialDates.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!specialDate) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: Object.keys(ERRORS).find(
          (key) => ERRORS[key] === ERRORS.SPECIAL_DATE_NOT_FOUND
        ),
        message: ERRORS.SPECIAL_DATE_NOT_FOUND,
      });
    }

    if (payload.scheduleId !== undefined && payload.scheduleId !== null) {
      await this.validateSchedule(companyId, payload.scheduleId);
    }

    const targetScheduleId =
      payload.scheduleId !== undefined
        ? payload.scheduleId
        : specialDate.scheduleId;
    const targetDate =
      payload.date !== undefined
        ? this.normalizeDate(payload.date)
        : specialDate.date;
    const targetIsOff =
      payload.isOff !== undefined ? payload.isOff : specialDate.isOff;
    const targetClockIn =
      payload.clockIn !== undefined ? payload.clockIn : specialDate.clockIn;
    const targetClockOut =
      payload.clockOut !== undefined ? payload.clockOut : specialDate.clockOut;

    this.validateTimeConfiguration(targetIsOff, targetClockIn, targetClockOut);
    await this.validateDuplicate(companyId, targetScheduleId, targetDate, id);

    const data: Prisma.SpecialDatesUncheckedUpdateInput = {};

    if (payload.scheduleId !== undefined) {
      data.scheduleId = payload.scheduleId;
    }

    if (payload.date !== undefined) {
      data.date = targetDate;
    }

    if (payload.name !== undefined) {
      data.name = payload.name;
    }

    if (payload.isOff !== undefined) {
      data.isOff = payload.isOff;
    }

    if (payload.clockIn !== undefined) {
      data.clockIn =
        payload.clockIn === null ? null : this.toTimeDateTime(payload.clockIn);
    }

    if (payload.clockOut !== undefined) {
      data.clockOut =
        payload.clockOut === null
          ? null
          : this.toTimeDateTime(payload.clockOut);
    }

    if (payload.isOff === true) {
      data.clockIn = null;
      data.clockOut = null;
    }

    const updatedSpecialDate = await this.prismaService.specialDates.update({
      where: { id, companyId },
      data,
      select: this.defaultSelect,
    });

    return updatedSpecialDate;
  }

  async remove(companyId: string, id: string) {
    const specialDate = await this.prismaService.specialDates.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!specialDate) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: Object.keys(ERRORS).find(
          (key) => ERRORS[key] === ERRORS.SPECIAL_DATE_NOT_FOUND
        ),
        message: ERRORS.SPECIAL_DATE_NOT_FOUND,
      });
    }

    await this.prismaService.specialDates.delete({
      where: { id, companyId },
    });

    return {
      message: 'Successfully deleted special date',
    };
  }
}
