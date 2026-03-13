import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/common/database/prisma.service';
import { ERRORS } from '../../constants/errors';
import { CreateUserDto } from './dto/create-user.dto';
import { UserQueryDto } from './dto/pagination.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prismaService: PrismaService) {}

  private defaultSelect: Prisma.UsersSelect = {
    id: true,
    companyId: true,
    officeId: true,
    departmentId: true,
    scheduleId: true,
    email: true,
    employeeCode: true,
    username: true,
    fullName: true,
    phone: true,
    role: true,
    profileUrl: true,
    jobTitle: true,
    isFlexible: true,
    joinedAt: true,
    createdAt: true,
  };

  async create(companyId: string, createUserDto: CreateUserDto) {
    const { password, employeeCode } = createUserDto;
    const email = createUserDto.email.toLowerCase();
    const username = createUserDto.username.toLowerCase();

    const isUserEmailExist = await this.prismaService.users.findFirst({
      where: {
        companyId: companyId,
        email: email,
        deletedAt: null,
      },
    });

    if (isUserEmailExist) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: Object.keys(ERRORS).find(
          (key) => ERRORS[key] === ERRORS.EMAIL_ALREADY_EXISTS
        ),
        message: ERRORS.EMAIL_ALREADY_EXISTS,
      });
    }

    const isUserUsernameExist = await this.prismaService.users.findFirst({
      where: {
        companyId: companyId,
        username: username,
        deletedAt: null,
      },
    });

    if (isUserUsernameExist) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: Object.keys(ERRORS).find(
          (key) => ERRORS[key] === ERRORS.USERNAME_ALREADY_EXISTS
        ),
        message: ERRORS.USERNAME_ALREADY_EXISTS,
      });
    }

    if (employeeCode) {
      const isUserEmployeeCodeExist = await this.prismaService.users.findFirst({
        where: {
          companyId: companyId,
          employeeCode: employeeCode,
          deletedAt: null,
        },
      });

      if (isUserEmployeeCodeExist) {
        throw new BadRequestException({
          statusCode: HttpStatus.BAD_REQUEST,
          errorCode: Object.keys(ERRORS).find(
            (key) => ERRORS[key] === ERRORS.EMPLOYEE_CODE_ALREADY_EXISTS
          ),
          message: ERRORS.EMPLOYEE_CODE_ALREADY_EXISTS,
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await this.prismaService.users.create({
      data: {
        ...createUserDto,
        companyId: companyId,
        email: email,
        password: hashedPassword,
        username: username,
      },
      select: this.defaultSelect,
    });
    return user;
  }

  async findAll(companyId: string, query: UserQueryDto) {
    const { page, perPage, search, sortBy, sortOrder, role } = query;
    const skip = (page - 1) * perPage;

    const where: Prisma.UsersWhereInput = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    const activeFilters: {
      search?: string;
      role?: typeof role;
    } = {};

    if (search) {
      activeFilters.search = search;
    }

    if (role) {
      activeFilters.role = role;
    }

    const orderBy: Prisma.UsersOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [users, total] = await this.prismaService.$transaction([
      this.prismaService.users.findMany({
        where: {
          companyId: companyId,
          deletedAt: null,
          ...where,
        },
        select: this.defaultSelect,
        skip: skip,
        take: perPage,
        orderBy: orderBy,
      }),
      this.prismaService.users.count({
        where: {
          companyId: companyId,
          deletedAt: null,
          ...where,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / perPage);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      data: users,
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
    const user = await this.prismaService.users.findFirst({
      where: { id, companyId, deletedAt: null },
      select: this.defaultSelect,
    });
    return user;
  }

  async update(companyId: string, id: string, updateUserDto: UpdateUserDto) {
    const getUser = await this.prismaService.users.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
    });

    if (!getUser) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: Object.keys(ERRORS).find(
          (key) => ERRORS[key] === ERRORS.USER_NOT_FOUND
        ),
        message: ERRORS.USER_NOT_FOUND,
      });
    }

    if (updateUserDto.email) {
      const email = updateUserDto.email.toLowerCase();
      const isUserEmailExist = await this.prismaService.users.findFirst({
        where: {
          companyId: getUser.companyId,
          email: email,
          deletedAt: null,
          NOT: {
            id: id,
          },
        },
      });

      if (isUserEmailExist) {
        throw new BadRequestException({
          statusCode: HttpStatus.BAD_REQUEST,
          errorCode: Object.keys(ERRORS).find(
            (key) => ERRORS[key] === ERRORS.EMAIL_ALREADY_EXISTS
          ),
          message: ERRORS.EMAIL_ALREADY_EXISTS,
        });
      }
    }

    if (updateUserDto.username) {
      const username = updateUserDto.username.toLowerCase();
      const isUserUsernameExist = await this.prismaService.users.findFirst({
        where: {
          companyId: getUser.companyId,
          username: username,
          deletedAt: null,
          NOT: {
            id: id,
          },
        },
      });

      if (isUserUsernameExist) {
        throw new BadRequestException({
          statusCode: HttpStatus.BAD_REQUEST,
          errorCode: Object.keys(ERRORS).find(
            (key) => ERRORS[key] === ERRORS.USERNAME_ALREADY_EXISTS
          ),
          message: ERRORS.USERNAME_ALREADY_EXISTS,
        });
      }
    }

    if (updateUserDto.employeeCode) {
      const isUserEmployeeCodeExist = await this.prismaService.users.findFirst({
        where: {
          companyId: getUser.companyId,
          employeeCode: updateUserDto.employeeCode,
          deletedAt: null,
          NOT: {
            id: id,
          },
        },
      });

      if (isUserEmployeeCodeExist) {
        throw new BadRequestException({
          statusCode: HttpStatus.BAD_REQUEST,
          errorCode: Object.keys(ERRORS).find(
            (key) => ERRORS[key] === ERRORS.EMPLOYEE_CODE_ALREADY_EXISTS
          ),
          message: ERRORS.EMPLOYEE_CODE_ALREADY_EXISTS,
        });
      }
    }

    const updateData = { ...updateUserDto };

    // Hash password if the user wants to update it
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    const updatedUser = await this.prismaService.users.update({
      where: { id },
      data: updateData,
      select: this.defaultSelect,
    });
    return updatedUser;
  }

  async remove(companyId: string, id: string) {
    const getUser = await this.prismaService.users.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
    });

    if (!getUser) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: Object.keys(ERRORS).find(
          (key) => ERRORS[key] === ERRORS.USER_NOT_FOUND
        ),
        message: ERRORS.USER_NOT_FOUND,
      });
    }

    await this.prismaService.users.update({
      where: { id, companyId },
      data: {
        deletedAt: new Date(),
      },
    });
    return {
      message: 'Successfully deleted user',
    };
  }
}
