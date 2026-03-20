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

  const owner = await prisma.users.create({
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

  console.log({ owner });
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
