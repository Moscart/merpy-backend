import type { AuthenticatedUser } from '../src/module/auth/types/jwt-payload.type';
import type { CreateUserDto } from '../src/module/users/dto/create-user.dto';
import type { UserQueryDto } from '../src/module/users/dto/pagination.dto';
import type { UpdateUserDto } from '../src/module/users/dto/update-user.dto';
import { UsersController } from '../src/module/users/users.controller';
import { UsersService } from '../src/module/users/users.service';

type CreateUserResult = Awaited<ReturnType<UsersService['create']>>;
type FindAllUsersResult = Awaited<ReturnType<UsersService['findAll']>>;
type FindOneUserResult = Awaited<ReturnType<UsersService['findOne']>>;
type UpdateUserResult = Awaited<ReturnType<UsersService['update']>>;
type RemoveUserResult = Awaited<ReturnType<UsersService['remove']>>;
type FindAllMeta = FindAllUsersResult['meta'];

describe('UsersController', () => {
  let controller: UsersController;

  const usersServiceMock: jest.Mocked<
    Pick<UsersService, 'create' | 'findAll' | 'findOne' | 'update' | 'remove'>
  > = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const currentUser: AuthenticatedUser = {
    id: '018f16f9-1234-7234-8123-1234567890ab',
    companyId: '018f16f9-1234-7234-8123-1234567890cd',
    username: 'owner',
    email: 'owner@example.com',
    deviceId: 'dev-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new UsersController(
      usersServiceMock as unknown as UsersService
    );
  });

  it('create should call usersService.create with companyId and dto', async () => {
    const dto: CreateUserDto = {
      fullName: 'John Doe',
      username: 'john.doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'STAFF',
      isFlexible: false,
      joinedAt: new Date('2026-01-01'),
    };
    const expected = {
      id: '018f16f9-1234-7234-8123-1234567890ef',
    } as CreateUserResult;
    usersServiceMock.create.mockResolvedValue(expected);

    const result = await controller.create(dto, currentUser);

    expect(usersServiceMock.create).toHaveBeenCalledWith(
      currentUser.companyId,
      dto
    );
    expect(result).toBe(expected);
  });

  it('findAll should call usersService.findAll with companyId and query', async () => {
    const query: UserQueryDto = {
      page: 1,
      perPage: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    const meta: FindAllMeta = {
      total: 0,
      page: 1,
      perPage: 10,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
      activeFilters: {},
      activeSort: {
        sortBy: 'createdAt',
        sortOrder: 'desc',
      },
    };
    const expected: FindAllUsersResult = { data: [], meta };
    usersServiceMock.findAll.mockResolvedValue(expected);

    const result = await controller.findAll(currentUser, query);

    expect(usersServiceMock.findAll).toHaveBeenCalledWith(
      currentUser.companyId,
      query
    );
    expect(result).toBe(expected);
  });

  it('findOne should call usersService.findOne with companyId and id', async () => {
    const id = '018f16f9-1234-7234-8123-1234567890ff';
    const expected = { id } as FindOneUserResult;
    usersServiceMock.findOne.mockResolvedValue(expected);

    const result = await controller.findOne(id, currentUser);

    expect(usersServiceMock.findOne).toHaveBeenCalledWith(
      currentUser.companyId,
      id
    );
    expect(result).toBe(expected);
  });

  it('update should call usersService.update with companyId, id, and dto', async () => {
    const id = '018f16f9-1234-7234-8123-123456789011';
    const dto: UpdateUserDto = { fullName: 'Updated Name' };
    const expected = { id, fullName: 'Updated Name' } as UpdateUserResult;
    usersServiceMock.update.mockResolvedValue(expected);

    const result = await controller.update(id, dto, currentUser);

    expect(usersServiceMock.update).toHaveBeenCalledWith(
      currentUser.companyId,
      id,
      dto
    );
    expect(result).toBe(expected);
  });

  it('remove should call usersService.remove with companyId and id', async () => {
    const id = '018f16f9-1234-7234-8123-123456789012';
    const expected = {
      message: 'Successfully deleted user',
    } as RemoveUserResult;
    usersServiceMock.remove.mockResolvedValue(expected);

    const result = await controller.remove(id, currentUser);

    expect(usersServiceMock.remove).toHaveBeenCalledWith(
      currentUser.companyId,
      id
    );
    expect(result).toBe(expected);
  });
});
