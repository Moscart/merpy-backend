import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/common/database/prisma.service';
import { ERRORS } from 'src/constants/errors';
import { CreateOfficeDto } from './dto/create-office.dto';
import { OfficeQueryDto } from './dto/pagination.dto';
import { UpdateOfficeDto } from './dto/update-office.dto';

@Injectable()
export class OfficesService {
  constructor(private readonly prismaService: PrismaService) {}

  private defaultSelect: Prisma.OfficesSelect = {
    id: true,
    companyId: true,
    picId: true,
    name: true,
    code: true,
    address: true,
    contactNumber: true,
    lat: true,
    lng: true,
    radius: true,
    timezone: true,
    isActive: true,
    createdAt: true,
  };

  private toOfficeResponse<
    T extends { lat: Prisma.Decimal; lng: Prisma.Decimal },
  >(office: T): Omit<T, 'lat' | 'lng'> & { lat: string; lng: string } {
    return {
      ...office,
      lat: office.lat.toString(),
      lng: office.lng.toString(),
    };
  }

  async create(companyId: string, createOfficeDto: CreateOfficeDto) {
    const { code, picId } = createOfficeDto;

    if (code) {
      const isOfficeCodeExist = await this.prismaService.offices.findFirst({
        where: {
          companyId,
          code,
          deletedAt: null,
        },
      });

      if (isOfficeCodeExist) {
        throw new BadRequestException({
          statusCode: HttpStatus.BAD_REQUEST,
          errorCode: Object.keys(ERRORS).find(
            (key) => ERRORS[key] === ERRORS.OFFICE_CODE_ALREADY_EXISTS
          ),
          message: ERRORS.OFFICE_CODE_ALREADY_EXISTS,
        });
      }
    }

    if (picId) {
      const pic = await this.prismaService.users.findFirst({
        where: {
          id: picId,
          companyId,
          deletedAt: null,
        },
      });

      if (!pic) {
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          errorCode: Object.keys(ERRORS).find(
            (key) => ERRORS[key] === ERRORS.PIC_NOT_FOUND
          ),
          message: ERRORS.PIC_NOT_FOUND,
        });
      }
    }

    const office = await this.prismaService.offices.create({
      data: {
        ...createOfficeDto,
        companyId,
      },
      select: this.defaultSelect,
    });

    return this.toOfficeResponse(office);
  }

  async findAll(companyId: string, query: OfficeQueryDto) {
    const { page, perPage, search, sortBy, sortOrder, isActive } = query;
    const skip = (page - 1) * perPage;

    const where: Prisma.OfficesWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { contactNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive) {
      where.isActive = isActive === 'true';
    }

    const activeFilters: {
      search?: string;
      isActive?: boolean;
    } = {};

    if (search) {
      activeFilters.search = search;
    }

    if (isActive) {
      activeFilters.isActive = isActive === 'true';
    }

    const orderBy: Prisma.OfficesOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [offices, total] = await this.prismaService.$transaction([
      this.prismaService.offices.findMany({
        where: {
          companyId,
          deletedAt: null,
          ...where,
        },
        select: this.defaultSelect,
        skip,
        take: perPage,
        orderBy,
      }),
      this.prismaService.offices.count({
        where: {
          companyId,
          deletedAt: null,
          ...where,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / perPage);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      data: offices.map((office) => this.toOfficeResponse(office)),
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
    const office = await this.prismaService.offices.findFirst({
      where: { id, companyId, deletedAt: null },
      select: this.defaultSelect,
    });

    if (!office) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: Object.keys(ERRORS).find(
          (key) => ERRORS[key] === ERRORS.OFFICE_NOT_FOUND
        ),
        message: ERRORS.OFFICE_NOT_FOUND,
      });
    }

    return this.toOfficeResponse(office);
  }

  async update(
    companyId: string,
    id: string,
    updateOfficeDto: UpdateOfficeDto
  ) {
    const { code, picId } = updateOfficeDto;

    const office = await this.prismaService.offices.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
    });

    if (!office) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: Object.keys(ERRORS).find(
          (key) => ERRORS[key] === ERRORS.OFFICE_NOT_FOUND
        ),
        message: ERRORS.OFFICE_NOT_FOUND,
      });
    }

    if (code) {
      const isOfficeCodeExist = await this.prismaService.offices.findFirst({
        where: {
          companyId: office.companyId,
          code,
          deletedAt: null,
          NOT: {
            id,
          },
        },
      });

      if (isOfficeCodeExist) {
        throw new BadRequestException({
          statusCode: HttpStatus.BAD_REQUEST,
          errorCode: Object.keys(ERRORS).find(
            (key) => ERRORS[key] === ERRORS.OFFICE_CODE_ALREADY_EXISTS
          ),
          message: ERRORS.OFFICE_CODE_ALREADY_EXISTS,
        });
      }
    }

    if (picId) {
      const pic = await this.prismaService.users.findFirst({
        where: {
          id: picId,
          companyId: office.companyId,
          deletedAt: null,
        },
      });

      if (!pic) {
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          errorCode: Object.keys(ERRORS).find(
            (key) => ERRORS[key] === ERRORS.PIC_NOT_FOUND
          ),
          message: ERRORS.PIC_NOT_FOUND,
        });
      }
    }

    const updatedOffice = await this.prismaService.offices.update({
      where: { id, companyId },
      data: updateOfficeDto,
      select: this.defaultSelect,
    });

    return this.toOfficeResponse(updatedOffice);
  }

  async remove(companyId: string, id: string) {
    const office = await this.prismaService.offices.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
    });

    if (!office) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: Object.keys(ERRORS).find(
          (key) => ERRORS[key] === ERRORS.OFFICE_NOT_FOUND
        ),
        message: ERRORS.OFFICE_NOT_FOUND,
      });
    }

    await this.prismaService.offices.update({
      where: { id, companyId },
      data: {
        deletedAt: new Date(),
      },
    });

    return {
      message: 'Successfully deleted office',
    };
  }
}
