import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

async function main() {
  const owner = await prisma.users.create({
    data: {
      company: {
        create: {
          name: 'Merpy Corporation',
          code: 'merpy',
        },
      },
      fullName: 'Daniel Theo Santoso',
      username: 'danieltheo',
      email: 'danieltheo.73@gmail.com',
      password: await bcrypt.hash('password', 12),
      role: 'OWNER',
      status: 'ACTIVE',
      isFlexible: true,
      ownedCompanies: {
        connect: {
          code: 'merpy',
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
