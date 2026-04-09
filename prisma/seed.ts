import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

async function main() {
  const companyCode = 'merpy';
  const username = 'danieltheo';

  const sampleUser = await prisma.$transaction(async (tx) => {
    const users = await tx.users.create({
      data: {
        company: {
          create: {
            name: 'Merpy Corporation',
            code: companyCode,
          },
        },
        fullName: 'Daniel Theo Santoso',
        username: username,
        email: 'danieltheo.73@gmail.com',
        password: await bcrypt.hash('password', 12),
        role: 'OWNER',
        isFlexible: true,
        joinedAt: new Date(),
        ownedCompanies: {
          connect: {
            code: companyCode,
          },
        },
      },
    });

    await tx.departments.create({
      data: {
        code: 'DEFAULT',
        name: 'Default Department',
        companyId: users.companyId,
        description: 'Default department for the company',
        managerId: users.id,
        users: {
          connect: {
            id: users.id,
          },
        },
      },
    });

    await tx.offices.create({
      data: {
        code: 'DEFAULT',
        name: 'Default Office',
        companyId: users.companyId,
        lat: 0,
        lng: 0,
        radius: 100,
        picId: users.id,
        users: {
          connect: {
            id: users.id,
          },
        },
      },
    });

    await tx.schedules.create({
      data: {
        name: 'Default Schedule',
        companyId: users.companyId,
        scheduleDays: {
          createMany: {
            data: [
              {
                dayOfWeek: 'MONDAY',
                clockIn: '1970-01-01T09:00:00Z',
                clockOut: '1970-01-01T17:00:00Z',
              },
              {
                dayOfWeek: 'TUESDAY',
                clockIn: '1970-01-01T09:00:00Z',
                clockOut: '1970-01-01T17:00:00Z',
              },
              {
                dayOfWeek: 'WEDNESDAY',
                clockIn: '1970-01-01T09:00:00Z',
                clockOut: '1970-01-01T17:00:00Z',
              },
              {
                dayOfWeek: 'THURSDAY',
                clockIn: '1970-01-01T09:00:00Z',
                clockOut: '1970-01-01T17:00:00Z',
              },
              {
                dayOfWeek: 'FRIDAY',
                clockIn: '1970-01-01T09:00:00Z',
                clockOut: '1970-01-01T17:00:00Z',
              },
            ],
          },
        },
        users: {
          connect: {
            id: users.id,
          },
        },
      },
    });
  });

  console.log({ sampleUser });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
