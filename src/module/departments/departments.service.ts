import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/common/database/prisma.service';
import { ERRORS } from 'src/constants/errors';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { DepartmentQueryDto } from './dto/pagination.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prismaService: PrismaService) {}

  private defaultSelect: Prisma.DepartmentsSelect = {
    id: true,
    companyId: true,
    name: true,
    code: true,
    description: true,
    managerId: true,
    createdAt: true,
  };

  async create(companyId: string, createDepartmentDto: CreateDepartmentDto) {
    const { code, managerId } = createDepartmentDto;

    if (code) {
      const isDepartmentCodeExist =
        await this.prismaService.departments.findFirst({
          where: {
            companyId,
            code,
            deletedAt: null,
          },
        });

      if (isDepartmentCodeExist) {
        throw new BadRequestException({
          statusCode: HttpStatus.BAD_REQUEST,
          errorCode: Object.keys(ERRORS).find(
            (key) => ERRORS[key] === ERRORS.DEPARTMENT_CODE_ALREADY_EXISTS
          ),
          message: ERRORS.DEPARTMENT_CODE_ALREADY_EXISTS,
        });
      }
    }

    const manager = await this.prismaService.users.findFirst({
      where: {
        id: managerId,
        companyId,
        deletedAt: null,
      },
    });

    if (!manager) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: Object.keys(ERRORS).find(
          (key) => ERRORS[key] === ERRORS.MANAGER_NOT_FOUND
        ),
        message: ERRORS.MANAGER_NOT_FOUND,
      });
    }

    const department = await this.prismaService.departments.create({
      data: {
        ...createDepartmentDto,
        companyId,
      },
      select: this.defaultSelect,
    });
    return department;
  }

  async findAll(companyId: string, query: DepartmentQueryDto) {
    const { page, perPage, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * perPage;

    const where: Prisma.DepartmentsWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const activeFilters: {
      search?: string;
    } = {};

    if (search) {
      activeFilters.search = search;
    }

    const orderBy: Prisma.DepartmentsOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [departments, total] = await this.prismaService.$transaction([
      this.prismaService.departments.findMany({
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
      this.prismaService.departments.count({
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
      data: departments,
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
    const department = await this.prismaService.departments.findFirst({
      where: { id, companyId, deletedAt: null },
      select: this.defaultSelect,
    });

    if (!department)
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: Object.keys(ERRORS).find(
          (key) => ERRORS[key] === ERRORS.DEPARTMENT_NOT_FOUND
        ),
        message: ERRORS.DEPARTMENT_NOT_FOUND,
      });

    return department;
  }

  async update(
    companyId: string,
    id: string,
    updateDepartmentDto: UpdateDepartmentDto
  ) {
    const { code, managerId } = updateDepartmentDto;

    const department = await this.prismaService.departments.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
    });

    if (!department) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: Object.keys(ERRORS).find(
          (key) => ERRORS[key] === ERRORS.DEPARTMENT_NOT_FOUND
        ),
        message: ERRORS.DEPARTMENT_NOT_FOUND,
      });
    }

    if (code) {
      const isDepartmentCodeExist =
        await this.prismaService.departments.findFirst({
          where: {
            companyId: department.companyId,
            code,
            deletedAt: null,
            NOT: {
              id,
            },
          },
        });

      if (isDepartmentCodeExist) {
        throw new BadRequestException({
          statusCode: HttpStatus.BAD_REQUEST,
          errorCode: Object.keys(ERRORS).find(
            (key) => ERRORS[key] === ERRORS.DEPARTMENT_CODE_ALREADY_EXISTS
          ),
          message: ERRORS.DEPARTMENT_CODE_ALREADY_EXISTS,
        });
      }
    }

    if (managerId) {
      const manager = await this.prismaService.users.findFirst({
        where: {
          id: managerId,
          companyId: department.companyId,
          deletedAt: null,
        },
      });

      if (!manager) {
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          errorCode: Object.keys(ERRORS).find(
            (key) => ERRORS[key] === ERRORS.MANAGER_NOT_FOUND
          ),
          message: ERRORS.MANAGER_NOT_FOUND,
        });
      }
    }

    const updatedDepartment = await this.prismaService.departments.update({
      where: { id, companyId },
      data: updateDepartmentDto,
      select: this.defaultSelect,
    });

    return updatedDepartment;
  }

  async remove(companyId: string, id: string) {
    const department = await this.prismaService.departments.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
    });

    if (!department) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: Object.keys(ERRORS).find(
          (key) => ERRORS[key] === ERRORS.DEPARTMENT_NOT_FOUND
        ),
        message: ERRORS.DEPARTMENT_NOT_FOUND,
      });
    }

    await this.prismaService.departments.update({
      where: { id, companyId },
      data: {
        deletedAt: new Date(),
      },
    });

    return {
      message: 'Successfully deleted department',
    };
  }
}
