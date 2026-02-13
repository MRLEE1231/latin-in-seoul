import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const username = 'admin';
  const password = 'ehdsuz12#';
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.log('Admin user already exists.');
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { username, passwordHash, role: 'ADMIN' },
  });
  console.log('Admin user created: admin / ehdsuz12#');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
