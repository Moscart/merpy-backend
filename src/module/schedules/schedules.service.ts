import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/common/database/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { ScheduleQueryDto } from './dto/pagination.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

type ScheduleDayPayload = {
  dayOfWeek:
    | 'SUNDAY'
    | 'MONDAY'
    | 'TUESDAY'
    | 'WEDNESDAY'
    | 'THURSDAY'
    | 'FRIDAY'
    | 'SATURDAY';
  clockIn: string;
  clockOut: string;
};

type CreateSchedulePayload = {
  name: string;
  scheduleDays: ScheduleDayPayload[];
};

type UpdateSchedulePayload = Partial<CreateSchedulePayload>;

const SCHEDULE_NOT_FOUND_MESSAGE = 'Schedule not found';
const SCHEDULE_IN_USE_MESSAGE =
  'Schedule is still in use and cannot be deleted';

@Injectable()
export class SchedulesService {
  constructor(private readonly prismaService: PrismaService) {}

  private defaultSelect: Prisma.SchedulesSelect = {
    id: true,
    companyId: true,
    name: true,
    scheduleDays: {
      select: {
        id: true,
        scheduleId: true,
        dayOfWeek: true,
        clockIn: true,
        clockOut: true,
      },
      orderBy: {
        dayOfWeek: 'asc',
      },
    },
  };

  private toTimeDateTime(time: string): string {
    const normalizedTime = time.length === 5 ? `${time}:00` : time;
    return `1970-01-01T${normalizedTime}Z`;
  }

  private mapScheduleDaysCreateInput(scheduleDays: ScheduleDayPayload[]) {
    return scheduleDays.map((scheduleDay) => ({
      dayOfWeek: scheduleDay.dayOfWeek,
      clockIn: this.toTimeDateTime(scheduleDay.clockIn),
      clockOut: this.toTimeDateTime(scheduleDay.clockOut),
    }));
  }

  async create(companyId: string, createScheduleDto: CreateScheduleDto) {
    const { name, scheduleDays } = createScheduleDto as CreateSchedulePayload;

    const schedule = await this.prismaService.schedules.create({
      data: {
        companyId,
        name,
        scheduleDays: {
          create: this.mapScheduleDaysCreateInput(scheduleDays),
        },
      },
      select: this.defaultSelect,
    });

    return schedule;
  }

  async findAll(companyId: string, query: ScheduleQueryDto) {
    const { page, perPage, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * perPage;

    const where: Prisma.SchedulesWhereInput = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const activeFilters: {
      search?: string;
    } = {};

    if (search) {
      activeFilters.search = search;
    }

    const orderBy: Prisma.SchedulesOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [schedules, total] = await this.prismaService.$transaction([
      this.prismaService.schedules.findMany({
        where: {
          companyId,
          ...where,
        },
        select: this.defaultSelect,
        skip,
        take: perPage,
        orderBy,
      }),
      this.prismaService.schedules.count({
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
      data: schedules,
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
    const schedule = await this.prismaService.schedules.findFirst({
      where: { id, companyId },
      select: this.defaultSelect,
    });

    if (!schedule) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: 'SCHEDULE_NOT_FOUND',
        message: SCHEDULE_NOT_FOUND_MESSAGE,
      });
    }

    return schedule;
  }

  async update(
    companyId: string,
    id: string,
    updateScheduleDto: UpdateScheduleDto
  ) {
    const normalizedUpdateScheduleDto =
      updateScheduleDto as UpdateSchedulePayload;

    const schedule = await this.prismaService.schedules.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!schedule) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: 'SCHEDULE_NOT_FOUND',
        message: SCHEDULE_NOT_FOUND_MESSAGE,
      });
    }

    const data: Prisma.SchedulesUpdateInput = {};

    if (normalizedUpdateScheduleDto.name !== undefined) {
      data.name = normalizedUpdateScheduleDto.name;
    }

    if (normalizedUpdateScheduleDto.scheduleDays !== undefined) {
      data.scheduleDays = {
        deleteMany: {},
        create: this.mapScheduleDaysCreateInput(
          normalizedUpdateScheduleDto.scheduleDays
        ),
      };
    }

    const updatedSchedule = await this.prismaService.schedules.update({
      where: { id },
      data,
      select: this.defaultSelect,
    });

    return updatedSchedule;
  }

  async remove(companyId: string, id: string) {
    const schedule = await this.prismaService.schedules.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!schedule) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: 'SCHEDULE_NOT_FOUND',
        message: SCHEDULE_NOT_FOUND_MESSAGE,
      });
    }

    const [usersCount, specialDatesCount] =
      await this.prismaService.$transaction([
        this.prismaService.users.count({
          where: {
            companyId,
            scheduleId: id,
            deletedAt: null,
          },
        }),
        this.prismaService.specialDates.count({
          where: {
            companyId,
            scheduleId: id,
          },
        }),
      ]);

    if (usersCount > 0 || specialDatesCount > 0) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: 'SCHEDULE_IN_USE',
        message: SCHEDULE_IN_USE_MESSAGE,
      });
    }

    await this.prismaService.$transaction(async (tx) => {
      await tx.scheduleDays.deleteMany({
        where: {
          scheduleId: id,
        },
      });

      await tx.schedules.delete({
        where: {
          id,
        },
      });
    });

    return {
      message: 'Successfully deleted schedule',
    };
  }
}
