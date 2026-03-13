import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../src/common/database/prisma.service';
import type { CreateUserDto } from '../src/module/users/dto/create-user.dto';
import type { UserQueryDto } from '../src/module/users/dto/pagination.dto';
import type { UpdateUserDto } from '../src/module/users/dto/update-user.dto';
import { UsersService } from '../src/module/users/users.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

type FindFirstResult = Awaited<ReturnType<UsersService['findOne']>>;
type CreateResult = Awaited<ReturnType<UsersService['create']>>;
type FindAllResult = Awaited<ReturnType<UsersService['findAll']>>;
type UpdateResult = Awaited<ReturnType<UsersService['update']>>;
type FindManyArgs = Parameters<PrismaService['users']['findMany']>[0];
type CreateArgs = Parameters<PrismaService['users']['create']>[0];
type UpdateArgs = Parameters<PrismaService['users']['update']>[0];

type PrismaUsersMock = {
  findFirst: jest.Mock<Promise<FindFirstResult>, [unknown]>;
  create: jest.Mock<Promise<CreateResult>, [unknown]>;
  findMany: jest.Mock<Promise<FindAllResult['data']>, [unknown]>;
  count: jest.Mock<Promise<number>, [unknown]>;
  update: jest.Mock<Promise<UpdateResult>, [unknown]>;
};

type PrismaMock = {
  users: PrismaUsersMock;
  $transaction: jest.Mock<Promise<unknown[]>, [Array<Promise<unknown>>]>;
};

describe('UsersService', () => {
  let service: UsersService;

  const prismaMock: PrismaMock = {
    users: {
      findFirst: jest.fn() as unknown as PrismaUsersMock['findFirst'],
      create: jest.fn() as unknown as PrismaUsersMock['create'],
      findMany: jest.fn() as unknown as PrismaUsersMock['findMany'],
      count: jest.fn() as unknown as PrismaUsersMock['count'],
      update: jest.fn() as unknown as PrismaUsersMock['update'],
    },
    $transaction: jest.fn() as unknown as PrismaMock['$transaction'],
  };

  const companyId = '018f16f9-1234-7234-8123-1234567890cd';
  const userId = '018f16f9-1234-7234-8123-1234567890ef';

  beforeEach(() => {
    jest.resetAllMocks();
    service = new UsersService(prismaMock as unknown as PrismaService);

    prismaMock.$transaction.mockImplementation(
      async (queries: Promise<unknown>[]) => Promise.all(queries)
    );
  });

  it('create should lowercase email/username, hash password, and create user', async () => {
    const dto: CreateUserDto = {
      fullName: 'John Doe',
      username: 'John.Doe',
      email: 'John@Example.com',
      password: 'password123',
      role: 'STAFF',
      isFlexible: false,
      joinedAt: new Date('2026-01-01'),
    };

    prismaMock.users.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

    const createdUser = {
      id: userId,
      companyId,
      email: 'john@example.com',
      username: 'john.doe',
    } as CreateResult;
    prismaMock.users.create.mockResolvedValue(createdUser);

    const result = await service.create(companyId, dto);

    expect(prismaMock.users.create).toHaveBeenCalledTimes(1);
    const createArg = prismaMock.users.create.mock.calls[0][0] as CreateArgs;
    expect(createArg?.data).toMatchObject({
      companyId,
      email: 'john@example.com',
      username: 'john.doe',
      password: 'hashed-password',
    });
    expect(result).toBe(createdUser);
  });

  it('create should throw BadRequestException when email already exists', async () => {
    const dto: CreateUserDto = {
      fullName: 'John Doe',
      username: 'john.doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'STAFF',
      isFlexible: false,
      joinedAt: new Date('2026-01-01'),
    };

    prismaMock.users.findFirst.mockResolvedValueOnce({
      id: userId,
    } as FindFirstResult);

    await expect(service.create(companyId, dto)).rejects.toBeInstanceOf(
      BadRequestException
    );
    expect(prismaMock.users.create).not.toHaveBeenCalled();
  });

  it('create should throw BadRequestException when username already exists', async () => {
    const dto: CreateUserDto = {
      fullName: 'John Doe',
      username: 'john.doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'STAFF',
      isFlexible: false,
      joinedAt: new Date('2026-01-01'),
    };

    prismaMock.users.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: userId } as FindFirstResult);

    await expect(service.create(companyId, dto)).rejects.toBeInstanceOf(
      BadRequestException
    );
    expect(prismaMock.users.create).not.toHaveBeenCalled();
  });

  it('create should throw BadRequestException when employeeCode already exists', async () => {
    const dto: CreateUserDto = {
      fullName: 'John Doe',
      username: 'john.doe',
      email: 'john@example.com',
      password: 'password123',
      employeeCode: 'EMP-001',
      role: 'STAFF',
      isFlexible: false,
      joinedAt: new Date('2026-01-01'),
    };

    prismaMock.users.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: userId } as FindFirstResult);

    await expect(service.create(companyId, dto)).rejects.toBeInstanceOf(
      BadRequestException
    );
    expect(prismaMock.users.create).not.toHaveBeenCalled();
  });

  it('findAll should return paginated data and metadata with active filters', async () => {
    const query: UserQueryDto = {
      page: 2,
      perPage: 2,
      search: 'john',
      sortBy: 'email',
      sortOrder: 'asc',
      role: 'STAFF',
    };
    const users = [
      { id: userId },
      { id: '018f16f9-1234-7234-8123-123456789099' },
    ] as FindAllResult['data'];

    prismaMock.users.findMany.mockResolvedValue(users);
    prismaMock.users.count.mockResolvedValue(5);

    const result = await service.findAll(companyId, query);

    expect(prismaMock.users.findMany).toHaveBeenCalledTimes(1);
    const findManyArg = prismaMock.users.findMany.mock
      .calls[0][0] as FindManyArgs;
    expect(findManyArg?.where).toMatchObject({
      companyId,
      deletedAt: null,
      role: 'STAFF',
    });
    expect(Array.isArray(findManyArg?.where?.OR)).toBe(true);
    expect(findManyArg?.skip).toBe(2);
    expect(findManyArg?.take).toBe(2);
    expect(findManyArg?.orderBy).toEqual({ email: 'asc' });

    expect(result).toEqual({
      data: users,
      meta: {
        total: 5,
        page: 2,
        perPage: 2,
        totalPages: 3,
        hasNextPage: true,
        hasPrevPage: true,
        activeFilters: {
          search: 'john',
          role: 'STAFF',
        },
        activeSort: {
          sortBy: 'email',
          sortOrder: 'asc',
        },
      },
    });
  });

  it('findOne should query by id, companyId, and deletedAt null', async () => {
    const expected = { id: userId } as FindFirstResult;
    prismaMock.users.findFirst.mockResolvedValue(expected);

    const result = await service.findOne(companyId, userId);

    expect(prismaMock.users.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: userId, companyId, deletedAt: null },
      })
    );
    expect(result).toBe(expected);
  });

  it('update should throw NotFoundException when user does not exist', async () => {
    prismaMock.users.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.update(companyId, userId, { fullName: 'New' } as UpdateUserDto)
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prismaMock.users.update).not.toHaveBeenCalled();
  });

  it('update should throw BadRequestException when email already exists', async () => {
    prismaMock.users.findFirst
      .mockResolvedValueOnce({ id: userId, companyId } as FindFirstResult)
      .mockResolvedValueOnce({ id: 'other-id' } as FindFirstResult);

    await expect(
      service.update(companyId, userId, {
        email: 'taken@example.com',
      } as UpdateUserDto)
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prismaMock.users.update).not.toHaveBeenCalled();
  });

  it('update should hash password when provided and update user', async () => {
    prismaMock.users.findFirst
      .mockResolvedValueOnce({ id: userId, companyId } as FindFirstResult)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');

    const updatedUser = { id: userId, fullName: 'Updated' } as UpdateResult;
    prismaMock.users.update.mockResolvedValue(updatedUser);

    const result = await service.update(companyId, userId, {
      email: 'john@example.com',
      username: 'john.doe',
      employeeCode: 'EMP-001',
      password: 'new-password',
      fullName: 'Updated',
    } as UpdateUserDto);

    expect(prismaMock.users.update).toHaveBeenCalledTimes(1);
    const updateArg = prismaMock.users.update.mock.calls[0][0] as UpdateArgs;
    expect(updateArg?.where).toEqual({ id: userId });
    expect(updateArg?.data).toMatchObject({
      password: 'new-hashed-password',
      fullName: 'Updated',
    });
    expect(result).toBe(updatedUser);
  });

  it('remove should throw NotFoundException when user does not exist', async () => {
    prismaMock.users.findFirst.mockResolvedValueOnce(null);

    await expect(service.remove(companyId, userId)).rejects.toBeInstanceOf(
      NotFoundException
    );
    expect(prismaMock.users.update).not.toHaveBeenCalled();
  });

  it('remove should soft delete user and return success message', async () => {
    prismaMock.users.findFirst.mockResolvedValueOnce({
      id: userId,
      companyId,
    } as FindFirstResult);
    prismaMock.users.update.mockResolvedValue({ id: userId } as UpdateResult);

    const result = await service.remove(companyId, userId);

    expect(prismaMock.users.update).toHaveBeenCalledTimes(1);
    const removeUpdateArg = prismaMock.users.update.mock
      .calls[0][0] as UpdateArgs;
    expect(removeUpdateArg?.where).toEqual({ id: userId, companyId });
    expect(removeUpdateArg?.data).toBeDefined();
    expect(removeUpdateArg?.data).toHaveProperty('deletedAt');
    expect(removeUpdateArg?.data?.deletedAt).toBeInstanceOf(Date);
    expect(result).toEqual({ message: 'Successfully deleted user' });
  });
});
