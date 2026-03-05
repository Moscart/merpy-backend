import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

async function main() {
  const company = await prisma.companies.upsert({
    where: { code: 'merpy' },
    update: {},
    create: {
      name: 'Merpy Corporation',
      code: 'merpy',
    },
  });

  const owner = await prisma.users.upsert({
    where: {
      companyId_username: { companyId: company.id, username: 'danieltheo' },
    },
    update: {},
    create: {
      email: 'danieltheo.73@gmail.com',
      fullName: 'Daniel Theo Santoso',
      password: await bcrypt.hash('password', 12),
      username: 'danieltheo',
      companyId: company.id,
    },
  });

  console.log({ company, owner });
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
